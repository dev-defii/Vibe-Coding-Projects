// Spreadsheet service for ClassCheck
// Uses the xlsx library to import and export rosters in Excel (.xlsx) and CSV formats

import * as XLSX from 'xlsx';

/**
 * Exports a student roster to an Excel (.xlsx) spreadsheet
 */
export function exportRosterToExcel(classInfo, students) {
  const className = classInfo?.name || 'Class';
  const section = classInfo?.section || 'Section';
  const subject = classInfo?.subject || 'Subject';

  // Format student rows
  const dataRows = students.map((s, index) => ({
    '#': index + 1,
    'Student ID': s.studentId || '',
    'Full Name': s.fullName || '',
    'Class': className,
    'Section': section,
    'Subject': subject,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Set column widths for comfortable reading
  worksheet['!cols'] = [
    { wch: 6 },   // #
    { wch: 18 },  // Student ID
    { wch: 32 },  // Full Name
    { wch: 28 },  // Class
    { wch: 14 },  // Section
    { wch: 14 },  // Subject
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Roster');

  const filename = `${sanitizeFilename(className)}_${sanitizeFilename(section)}_Roster.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Exports a student roster to a CSV file
 */
export function exportRosterToCSV(classInfo, students) {
  const className = classInfo?.name || 'Class';
  const section = classInfo?.section || 'Section';

  const dataRows = students.map((s, index) => ({
    '#': index + 1,
    'Student ID': s.studentId || '',
    'Full Name': s.fullName || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizeFilename(className)}_${sanitizeFilename(section)}_Roster.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses an uploaded Excel (.xlsx, .xls) or CSV file
 * Returns an array of parsed student objects { studentId, fullName }
 */
export async function parseSpreadsheetFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve([]);
          return;
        }

        // Detect header row or start directly
        const parsedStudents = [];
        let headerRowIndex = -1;
        let idColIndex = -1;
        let nameColIndex = -1;

        // Scan first 5 rows for column headers
        for (let r = 0; r < Math.min(5, rawJson.length); r++) {
          const row = rawJson[r];
          row.forEach((cell, cIdx) => {
            const cellText = String(cell).trim().toLowerCase();
            if (cellText.includes('id') || cellText.includes('student no') || cellText.includes('student_id') || cellText === 'sn') {
              idColIndex = cIdx;
              headerRowIndex = r;
            }
            if (cellText.includes('name') || cellText.includes('student name') || cellText.includes('full name')) {
              nameColIndex = cIdx;
              headerRowIndex = r;
            }
          });

          if (idColIndex !== -1 && nameColIndex !== -1) {
            break;
          }
        }

        // If no headers matched, assume Col 0 is ID and Col 1 is Name (or Col 0 is Name if 1 col)
        const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;
        if (idColIndex === -1 && nameColIndex === -1) {
          idColIndex = 0;
          nameColIndex = 1;
        } else if (nameColIndex === -1 && idColIndex !== -1) {
          nameColIndex = idColIndex === 0 ? 1 : 0;
        } else if (idColIndex === -1 && nameColIndex !== -1) {
          idColIndex = nameColIndex === 0 ? 1 : 0;
        }

        for (let r = startRow; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          let idVal = idColIndex < row.length ? String(row[idColIndex] || '').trim() : '';
          let nameVal = nameColIndex < row.length ? String(row[nameColIndex] || '').trim() : '';

          // If there's only 1 column populated, check if it contains "ID, Name" or just Name
          if (!nameVal && idVal) {
            const parsed = parseSingleLine(idVal);
            if (parsed.fullName) {
              idVal = parsed.studentId;
              nameVal = parsed.fullName;
            }
          }

          if (nameVal || idVal) {
            parsedStudents.push({
              studentId: idVal,
              fullName: nameVal || idVal,
            });
          }
        }

        resolve(parsedStudents);
      } catch (err) {
        reject(new Error('Failed to parse spreadsheet file: ' + err.message));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses raw pasted multiline text
 * Handles:
 * 1) "Jane Doe" (one name per line)
 * 2) "2024-001, Jane Doe" (ID and Name separated by comma, tab, or dash)
 * 3) "2024-001\tJane Doe" (tab from Excel copy)
 */
export function parseBulkText(text, nextSequenceStart = 1) {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split(/\r?\n/);
  const result = [];
  let seqCounter = nextSequenceStart;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const parsed = parseSingleLine(rawLine);
    let finalId = parsed.studentId;
    const finalName = parsed.fullName;

    // If no student ID was detected in the line, generate a clean sequential ID
    if (!finalId) {
      finalId = `STU-${String(seqCounter).padStart(3, '0')}`;
      seqCounter++;
    }

    if (finalName) {
      result.push({
        studentId: finalId,
        fullName: finalName,
        originalLine: rawLine,
      });
    }
  }

  return result;
}

/**
 * Parses a single text line into studentId and fullName
 */
function parseSingleLine(line) {
  const trimmed = line.trim();

  // Try tab separation (Excel copy-paste: Col1 <tab> Col2)
  if (trimmed.includes('\t')) {
    const parts = trimmed.split('\t').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      // Determine which part looks more like an ID
      if (looksLikeId(parts[0])) {
        return { studentId: parts[0], fullName: parts.slice(1).join(' ') };
      } else if (looksLikeId(parts[parts.length - 1])) {
        return { studentId: parts[parts.length - 1], fullName: parts.slice(0, -1).join(' ') };
      }
      return { studentId: parts[0], fullName: parts[1] };
    }
  }

  // Try comma separation: "2024-001, John Doe" or "Doe, John" (watch out for Lastname, Firstname!)
  // If format is "2024-001, John Doe" (first part looks like ID)
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      if (looksLikeId(parts[0])) {
        return { studentId: parts[0], fullName: parts.slice(1).join(', ') };
      }
      // If it's "Dela Cruz, Juan" without an ID
      if (!looksLikeId(parts[0]) && !looksLikeId(parts[1])) {
        return { studentId: '', fullName: trimmed };
      }
    }
  }

  // Try hyphen / en-dash separation: "2024-001 - John Doe"
  const dashMatch = trimmed.match(/^([A-Za-z0-9\-_/]+)\s*[-–—]\s*(.+)$/);
  if (dashMatch && looksLikeId(dashMatch[1])) {
    return {
      studentId: dashMatch[1].trim(),
      fullName: dashMatch[2].trim(),
    };
  }

  // Try semicolon separation: "2024-001; John Doe"
  if (trimmed.includes(';')) {
    const parts = trimmed.split(';').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return { studentId: parts[0], fullName: parts[1] };
    }
  }

  // Default: assume the entire line is the student's name
  return {
    studentId: '',
    fullName: trimmed,
  };
}

/**
 * Checks if a string looks like a student ID (contains numbers, dashes, standard ID pattern)
 */
function looksLikeId(str) {
  if (!str) return false;
  // If it contains at least 2 digits and is shorter than 20 chars
  const digitCount = (str.match(/\d/g) || []).length;
  return digitCount >= 2 && str.length <= 25 && !str.includes(' ');
}

function sanitizeFilename(str) {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
}
