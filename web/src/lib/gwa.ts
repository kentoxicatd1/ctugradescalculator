export interface GradeEntry {
  subjectCode: string;
  subjectName: string;
  units: number;
  rawGrade: string;
  gradePoint: number;
}

export function isPassed(entry: GradeEntry): boolean {
  return entry.gradePoint >= 1.0 && entry.gradePoint <= 3.0;
}

export function isIncomplete(entry: GradeEntry): boolean {
  return entry.gradePoint === 0.0;
}

export function isNonAcademic(entry: GradeEntry): boolean {
  const code = entry.subjectCode.toUpperCase();
  const name = entry.subjectName.toUpperCase();
  
  return code.startsWith('NSTP') || 
         code.startsWith('PE') || 
         code.startsWith('PATHFIT') ||
         name.includes('NATIONAL SERVICE TRAINING PROGRAM') ||
         name.includes('PHYSICAL EDUCATION') || 
         name.includes('PATHFIT');
}

export function getQualityPoints(entry: GradeEntry): number {
  if (!isIncomplete(entry) && !isNonAcademic(entry)) {
    return entry.units * entry.gradePoint;
  }
  return 0.0;
}

export function calculateGpa(entries: GradeEntry[]): number {
  const countable = entries.filter(e => !isIncomplete(e) && !isNonAcademic(e));
  if (countable.length === 0) return 0.0;
  
  const totalQP = countable.reduce((sum, e) => sum + getQualityPoints(e), 0);
  const totalUnits = countable.reduce((sum, e) => sum + e.units, 0);
  
  return totalUnits > 0 ? totalQP / totalUnits : 0.0;
}

export function getHonorsStatus(gpa: number, entries: GradeEntry[]): string {
  if (gpa <= 0.0) return '';
  
  const hasDisqualifyingGrade = entries.some(e => !isIncomplete(e) && e.gradePoint > 2.50);

  if (gpa <= 1.750 && hasDisqualifyingGrade) return '';
  if (gpa <= 1.200) return 'Summa Cum Laude';
  if (gpa <= 1.450) return 'Magna Cum Laude';
  if (gpa <= 1.750) return 'Cum Laude';
  if (gpa <= 3.00) return 'Good Standing';
  return 'Academic Deficiency';
}

/**
 * Extracts plain text from a PDF file using pdfjs-dist.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  // Polyfill Promise.withResolvers for older iOS Safari (< 17.4) where pdfjs-dist crashes without it
  if (typeof (Promise as any).withResolvers === 'undefined') {
    (Promise as any).withResolvers = function () {
      let resolve, reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }

  let pdfjsLib;
  try {
    pdfjsLib = await import('pdfjs-dist');
  } catch (err: any) {
    throw new Error(`Failed to import pdfjs-dist: ${err.message}`);
  }

  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.v1.js`;
  } catch (err: any) {
    throw new Error(`Failed to set workerSrc: ${err.message}`);
  }

  let arrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch (err: any) {
    throw new Error(`Failed to get file arrayBuffer: ${err.message}`);
  }
  
  let pdf;
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    pdf = await loadingTask.promise;
  } catch (err: any) {
    throw new Error(`Failed during getDocument: ${err.message}`);
  }
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    let page;
    try {
      page = await pdf.getPage(i);
    } catch (err: any) {
      throw new Error(`Failed to getPage(${i}): ${err.message}`);
    }

    let textContent;
    try {
      textContent = await page.getTextContent();
    } catch (err: any) {
      throw new Error(`Failed to getTextContent for page ${i}: ${err.message}`);
    }
    
    let items;
    try {
      items = textContent.items.map(item => item as any);
    } catch (err: any) {
      throw new Error(`Failed to map textContent items: ${err.message}`);
    }

    try {
      items.sort((a, b) => {
        const yA = a.transform[5];
        const yB = b.transform[5];
        if (Math.abs(yA - yB) > 5) {
          return yB - yA;
        }
        return a.transform[4] - b.transform[4];
      });
    } catch (err: any) {
      throw new Error(`Failed to sort page items: ${err.message}`);
    }

    let pageText = '';
    try {
      let lastY = -1;
      for (const item of items) {
        const currentY = item.transform[5];
        if (lastY !== -1 && Math.abs(currentY - lastY) > 5) {
          pageText += '\n';
        } else if (lastY !== -1) {
          pageText += ' ';
        }
        pageText += item.str;
        lastY = currentY;
      }
    } catch (err: any) {
      throw new Error(`Failed during items loop on page ${i}: ${err.message}`);
    }
    
    fullText += pageText + '\f';
  }
  
  return fullText;
}

// Regex patterns mirroring the Android implementation
const timePattern = /\d{1,2}:\d{2}[AP]M-\d{1,2}:\d{2}[AP]M/;
const unitBeforeTime = /(\d+\.\d{2})\s+\d{1,2}:\d{2}[AP]M/;
const gradeAtEnd = /(\d+\.\d{1,2})\s*$/;

/**
 * Parses the raw text extracted from the PDF into GradeEntry objects.
 */
export function parseText(text: String): GradeEntry[] {
  const results: GradeEntry[] = [];
  
  // Split on newlines AND form-feed (\f) characters.
  const lines = text.split(/[\n\r\f]+/);
  
  for (let i = 0; i < lines.length; i++) {
    if (results.length >= 100) break;
    
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    
    // Only process subject rows — they contain a time slot
    if (!timePattern.test(trimmed)) continue;
    
    // Extract GRADE: last decimal number on the line
    let gradeMatch = gradeAtEnd.exec(trimmed);
    if (!gradeMatch && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      // Only accept next line as grade if it doesn't itself contain a time slot
      if (!timePattern.test(nextLine)) {
        gradeMatch = gradeAtEnd.exec(nextLine);
      }
    }
    
    const gradeStr = gradeMatch ? gradeMatch[1] : null;
    if (!gradeStr) continue;
    
    const gradePoint = parseFloat(gradeStr);
    if (isNaN(gradePoint) || gradePoint < 1.0 || gradePoint > 5.0) continue;
    
    // Extract UNIT: decimal number (X.XX) right before the time slot
    const unitMatch = unitBeforeTime.exec(trimmed);
    if (!unitMatch) continue;
    
    const units = parseFloat(unitMatch[1]);
    if (isNaN(units) || units <= 0.0 || units > 9.0) continue;
    
    // Everything before the unit value contains the subject code + name
    const beforeUnit = trimmed.substring(0, unitMatch.index).trim();
    
    // Split on 2+ spaces
    const parts = beforeUnit.split(/\s{2,}/).map(s => s.trim()).filter(s => s.length > 0);
    const code = parts[0] || "";
    
    let description = parts.slice(1).join(" ").trim();
    if (!description) {
      description = beforeUnit.substring(code.length).trim();
    }
    
    if (code.length < 2) continue;
    
    const subjectName = description.length > 0 ? `${code} — ${description}` : code;
    
    results.push({
      subjectCode: code,
      subjectName,
      units,
      rawGrade: gradeStr,
      gradePoint
    });
  }
  
  return results;
}
