package com.gradecalc.ph

data class GradeEntry(
    val subjectCode: String,
    val subjectName: String,
    val units: Double,
    val rawGrade: String,
    val gradePoint: Double
) {
    val isPassed: Boolean get() = gradePoint in 1.0..3.0
    val isIncomplete: Boolean get() = gradePoint == 0.0
    val isNonAcademic: Boolean get() {
        val code = subjectCode.uppercase()
        val name = subjectName.uppercase()
        return code.startsWith("NSTP") || code.startsWith("PE") || code.startsWith("PATHFIT") ||
               name.contains("NATIONAL SERVICE TRAINING PROGRAM") ||
               name.contains("PHYSICAL EDUCATION") || name.contains("PATHFIT")
    }
    val qualityPoints: Double get() = if (!isIncomplete && !isNonAcademic) units * gradePoint else 0.0
}
