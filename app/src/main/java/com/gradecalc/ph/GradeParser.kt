package com.gradecalc.ph

import android.content.Context
import android.net.Uri
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper

/**
 * Parses grade entries from a CTU-style PDF grade report.
 *
 * STRATEGY:
 * 1. Extract full plain text from all pages using PDFBox with sortByPosition=true.
 * 2. Split on newlines AND form-feed characters (\f) to correctly handle page breaks
 *    — PDFBox inserts \f between pages which Kotlin's .lines() does not split on.
 * 3. Only process lines that contain a TIME column entry (e.g. 08:00AM-11:00AM).
 *    This uniquely identifies subject rows and skips headers/totals/section labels.
 * 4. From each matched line:
 *    - GRADE  = last decimal number on the line (or the next line if missing)
 *    - UNIT   = decimal number immediately before the time pattern
 *    - CODE   = first whitespace-separated token
 *    - NAME   = text between CODE and UNIT
 *
 * GRADE POINT SCALE (Philippine Standard):
 *   1.0–1.9  = various levels of Excellent/Good
 *   2.0–3.0  = Satisfactory / Passing
 *   5.0      = Failed
 *   INC/DRP  = Incomplete / Dropped (excluded from GPA)
 */
object GradeParser {

    // Matches a time slot like 08:00AM-11:00AM or 1:00PM-04:00PM
    private val timePattern = Regex("""\d{1,2}:\d{2}[AP]M-\d{1,2}:\d{2}[AP]M""")

    // Matches a unit value (X.XX) immediately before the time slot
    private val unitBeforeTime = Regex("""(\d+\.\d{2})\s+\d{1,2}:\d{2}[AP]M""")

    // Matches the last decimal number on a line (the grade)
    private val gradeAtEnd = Regex("""(\d+\.\d{1,2})\s*$""")

    // ──────────────────────────────────────────────
    // Public API
    // ──────────────────────────────────────────────

    fun parsePdf(context: Context, uri: Uri): List<GradeEntry> {
        PDFBoxResourceLoader.init(context)
        val stream = context.contentResolver.openInputStream(uri)
            ?: throw IllegalStateException("Cannot open input stream for URI: $uri")

        val rawText = stream.use { s ->
            PDDocument.load(s).use { doc ->
                PDFTextStripper().apply {
                    startPage      = 1
                    endPage        = doc.numberOfPages
                    sortByPosition = true   // ensures correct reading order for web-printed PDFs
                }.getText(doc)
            }
        }

        return parseText(rawText)
    }

    fun calculateGpa(entries: List<GradeEntry>): Double {
        val countable = entries.filter { !it.isIncomplete && !it.isNonAcademic }
        if (countable.isEmpty()) return 0.0
        val totalQP    = countable.sumOf { it.qualityPoints }
        val totalUnits = countable.sumOf { it.units }
        return if (totalUnits > 0.0) totalQP / totalUnits else 0.0
    }

    fun getHonorsStatus(gpa: Double, entries: List<GradeEntry>): String {
        if (gpa <= 0.0) return ""
        
        val hasDisqualifyingGrade = entries.any { !it.isIncomplete && it.gradePoint > 2.50 }

        return when {
            gpa <= 1.750 && hasDisqualifyingGrade -> ""
            gpa <= 1.200 -> "Summa Cum Laude"
            gpa <= 1.450 -> "Magna Cum Laude"
            gpa <= 1.750 -> "Cum Laude"
            gpa <= 3.00  -> "Good Standing"
            else         -> "Academic Deficiency"
        }
    }

    // ──────────────────────────────────────────────
    // Internal parsing
    // ──────────────────────────────────────────────

    private fun parseText(text: String): List<GradeEntry> {
        val results = mutableListOf<GradeEntry>()

        // Split on newlines AND form-feed (\f) characters.
        // PDFBox inserts \f at page boundaries; Kotlin's .lines() only splits on \n/\r.
        val lines = text.split(Regex("[\\n\\r\\f]+"))

        for ((index, line) in lines.withIndex()) {
            if (results.size >= 100) break

            val trimmed = line.trim()
            if (trimmed.isBlank()) continue

            // Only process subject rows — they contain a time slot
            if (!timePattern.containsMatchIn(trimmed)) continue

            // Extract GRADE: last decimal number on the line.
            // If absent (grade may appear on its own next line), peek at the next line.
            var gradeMatch = gradeAtEnd.find(trimmed)
            if (gradeMatch == null && index + 1 < lines.size) {
                val nextLine = lines[index + 1].trim()
                // Only accept next line as grade if it doesn't itself contain a time slot
                if (!timePattern.containsMatchIn(nextLine)) {
                    gradeMatch = gradeAtEnd.find(nextLine)
                }
            }
            val gradeStr   = gradeMatch?.groupValues?.get(1) ?: continue
            val gradePoint = gradeStr.toDoubleOrNull() ?: continue
            if (gradePoint < 1.0 || gradePoint > 5.0) continue

            // Extract UNIT: decimal number (X.XX) right before the time slot
            val unitMatch = unitBeforeTime.find(trimmed) ?: continue
            val units     = unitMatch.groupValues[1].toDoubleOrNull() ?: continue
            if (units <= 0.0 || units > 9.0) continue

            // Everything before the unit value contains the subject code + name
            val beforeUnit = trimmed.substring(0, unitMatch.range.first).trim()

            // Split on 2+ spaces — first chunk is CODE, rest is SUBJECT/DESCRIPTION
            val parts       = beforeUnit.split(Regex("\\s{2,}")).map { it.trim() }.filter { it.isNotEmpty() }
            val code        = parts.firstOrNull() ?: ""
            val description = parts.drop(1).joinToString(" ").trim()
                .ifBlank { beforeUnit.substringAfter(code).trim() }

            if (code.length < 2) continue

            val subjectName = if (description.isNotEmpty()) "$code — $description" else code

            results.add(
                GradeEntry(
                    subjectCode = code,
                    subjectName = subjectName,
                    units       = units,
                    rawGrade    = gradeStr,
                    gradePoint  = gradePoint
                )
            )
        }

        return results
    }
}
