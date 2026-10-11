// Spreadsheet service for ClassCheck
// Uses the xlsx library to import and export rosters and attendance reports in Excel (.xlsx) and CSV formats

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
 * Exports an Attendance Session Report to Excel (.xlsx)
 * Includes metadata header, summary statistics, complete class roster with attendance statuses,
 * and an unmatched participants sheet if attendees were not in the roster.
 */
export function exportAttendanceToExcel(session, classInfo, records = [], summary = {}, unmatchedParticipants = []) {
  const className = classInfo?.name || session.className || 'Class';
  const section = classInfo?.section || session.section || 'Section';
  const subject = classInfo?.subject || session.subject || 'Subject';
  const sessionTitle = session.title || 'Attendance Session';
  const meetingDate = session.date || new Date().toISOString().split('T')[0];
  const isFinalized = session.status === 'finalized';

  // Calculate totals
  const totalEnrolled = records.length;
  const presentCount = records.filter(r => r.status === 'present').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const excusedCount = records.filter(r => r.status === 'excused').length;
  const unreviewedCount = records.filter(r => r.status === 'unreviewed').length;
  const attendanceRate = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

  // Build sheet rows manually for professional report styling
  const reportRows = [
    ['ClassCheck — Official Attendance Report'],
    [''],
    ['Course / Class:', className],
    ['Section:', section],
    ['Subject Code:', subject],
    ['Session Title:', sessionTitle],
    ['Meeting Date:', meetingDate],
    ['Status:', isFinalized ? 'FINALIZED' : 'IN REVIEW (DRAFT)'],
    ['Exported On:', new Date().toLocaleString()],
    [''],
    ['ATTENDANCE SUMMARY'],
    ['Total Enrolled Students:', totalEnrolled],
    ['Present Students:', `${presentCount} (${attendanceRate}%)`],
    ['Absent Students:', absentCount],
    ['Excused Students:', excusedCount],
    ['Unreviewed Students:', unreviewedCount],
    ['Unmatched Attendees from Meet:', unmatchedParticipants.length],
    [''],
    ['#', 'Student ID', 'Student Full Name', 'Attendance Status', 'Match Details / Notes', 'Excuse Reason']
  ];

  // Append all students in roster
  records.forEach((r, idx) => {
    const statusLabel =
      r.status === 'present' ? 'PRESENT' :
      r.status === 'absent' ? 'ABSENT' :
      r.status === 'excused' ? 'EXCUSED' : 'UNREVIEWED';

    const excuse = r.status === 'excused' ? (r.excuseReason || '') : '';

    reportRows.push([
      idx + 1,
      r.studentId || '',
      r.studentName || '',
      statusLabel,
      r.notes || (r.matchedParticipantName ? `Matched: ${r.matchedParticipantName}` : ''),
      excuse
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(reportRows);

  worksheet['!cols'] = [
    { wch: 6 },   // #
    { wch: 18 },  // Student ID
    { wch: 34 },  // Full Name
    { wch: 20 },  // Status
    { wch: 38 },  // Notes
    { wch: 32 },  // Excuse Reason
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');

  // If there are unmatched participants from the Meet import, add a dedicated sheet
  if (unmatchedParticipants && unmatchedParticipants.length > 0) {
    const unmatchedRows = [
      ['Unmatched Google Meet Attendees (Not Enrolled in Class Roster)'],
      [''],
      ['#', 'Attendee Name from File', 'Email / Account', 'Duration / Join Info', 'Occurrences in Call Log']
    ];

    unmatchedParticipants.forEach((p, idx) => {
      unmatchedRows.push([
        idx + 1,
        p.originalName || '',
        p.email || 'N/A',
        p.duration || 'N/A',
        p.count || 1
      ]);
    });

    const unmatchedSheet = XLSX.utils.aoa_to_sheet(unmatchedRows);
    unmatchedSheet['!cols'] = [
      { wch: 6 },
      { wch: 32 },
      { wch: 28 },
      { wch: 20 },
      { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(workbook, unmatchedSheet, 'Unmatched Attendees');
  }

  const filename = `${sanitizeFilename(subject)}_${sanitizeFilename(section)}_${sanitizeFilename(meetingDate)}_Attendance.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Exports an Attendance Session Report to CSV
 */
export function exportAttendanceToCSV(session, classInfo, records = []) {
  const className = classInfo?.name || session.className || 'Class';
  const section = classInfo?.section || session.section || 'Section';
  const subject = classInfo?.subject || session.subject || 'Subject';
  const sessionTitle = session.title || 'Attendance Session';
  const meetingDate = session.date || new Date().toISOString().split('T')[0];

  const totalEnrolled = records.length;
  const presentCount = records.filter(r => r.status === 'present').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const excusedCount = records.filter(r => r.status === 'excused').length;
  const unreviewedCount = records.filter(r => r.status === 'unreviewed').length;

  const csvRows = [
    ['ClassCheck — Attendance Report'],
    [`Class: ${className}`, `Section: ${section}`, `Subject: ${subject}`],
    [`Session: ${sessionTitle}`, `Date: ${meetingDate}`, `Status: ${session.status}`],
    [`Summary: Total=${totalEnrolled}`, `Present=${presentCount}`, `Absent=${absentCount}`, `Excused=${excusedCount}`, `Unreviewed=${unreviewedCount}`],
    [''],
    ['#', 'Student ID', 'Full Name', 'Attendance Status', 'Notes', 'Excuse Reason']
  ];

  records.forEach((r, idx) => {
    const statusLabel = r.status ? r.status.toUpperCase() : 'UNREVIEWED';
    const excuse = r.status === 'excused' ? (r.excuseReason || '') : '';
    csvRows.push([
      idx + 1,
      r.studentId || '',
      r.studentName || '',
      statusLabel,
      r.notes || '',
      excuse
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(csvRows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizeFilename(subject)}_${sanitizeFilename(section)}_${sanitizeFilename(meetingDate)}_Attendance.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses an uploaded Excel (.xlsx, .xls) or CSV file for student rosters
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
 * Parses an uploaded Google Meet Tracker export file (.xlsx, .xls, .csv).
 * Inspects all columns, detects the most probable participant-name column,
 * extracts preview rows, and lets user select or override the participant column if needed.
 */
export async function parseMeetAttendanceFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error('The spreadsheet workbook is empty or has no readable sheets.'));
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length === 0) {
          reject(new Error('The uploaded file contains no data rows.'));
          return;
        }

        // Filter out completely blank rows
        const nonEmptyRows = rawRows.filter(row => Array.isArray(row) && row.some(cell => String(cell).trim() !== ''));

        if (nonEmptyRows.length === 0) {
          reject(new Error('All rows in the spreadsheet are blank or empty.'));
          return;
        }

        // Find best header row (scan first 10 rows)
        let headerRowIndex = 0;
        let bestHeaderScore = -1;

        const headerKeywords = [
          'name', 'participant', 'attendee', 'student', 'full name', 
          'display name', 'email', 'duration', 'time', 'first name', 'last name'
        ];

        for (let i = 0; i < Math.min(10, nonEmptyRows.length); i++) {
          const row = nonEmptyRows[i];
          let score = 0;
          row.forEach(cell => {
            const str = String(cell).trim().toLowerCase();
            headerKeywords.forEach(kw => {
              if (str.includes(kw)) score += 2;
            });
          });
          if (score > bestHeaderScore) {
            bestHeaderScore = score;
            headerRowIndex = i;
          }
        }

        // Extract column headers
        const headerRow = nonEmptyRows[headerRowIndex] || [];
        const maxCols = Math.max(...nonEmptyRows.map(r => r.length));
        const columns = [];

        for (let c = 0; c < maxCols; c++) {
          const headerName = String(headerRow[c] || '').trim();
          columns.push({
            index: c,
            label: headerName || `Column ${c + 1}`,
            isAutoName: !headerName,
          });
        }

        // Detect candidate columns
        let candidateNameCol = -1;
        let candidateEmailCol = -1;
        let candidateDurationCol = -1;

        // Pass 1: exact keywords
        columns.forEach(col => {
          const lower = col.label.toLowerCase();
          if (candidateNameCol === -1) {
            if (lower === 'name' || lower === 'full name' || lower === 'participant' || lower === 'attendee' || lower === 'student name' || lower === 'participant name') {
              candidateNameCol = col.index;
            }
          }
          if (candidateEmailCol === -1) {
            if (lower.includes('email') || lower.includes('mail')) {
              candidateEmailCol = col.index;
            }
          }
          if (candidateDurationCol === -1) {
            if (lower.includes('duration') || lower.includes('time in call') || lower.includes('time') || lower.includes('attendance')) {
              candidateDurationCol = col.index;
            }
          }
        });

        // Pass 2: fallback contains 'name'
        if (candidateNameCol === -1) {
          const nameCol = columns.find(col => col.label.toLowerCase().includes('name') && !col.label.toLowerCase().includes('file'));
          if (nameCol) candidateNameCol = nameCol.index;
        }

        // Pass 3: default to first column with non-empty text
        if (candidateNameCol === -1 && columns.length > 0) {
          candidateNameCol = 0;
        }

        // Data rows start after header row
        const dataRows = nonEmptyRows.slice(headerRowIndex + 1);

        resolve({
          filename: file.name,
          totalRows: nonEmptyRows.length,
          headerRowIndex,
          columns,
          detectedNameColIndex: candidateNameCol,
          detectedEmailColIndex: candidateEmailCol,
          detectedDurationColIndex: candidateDurationCol,
          dataRows,
          previewRows: dataRows.slice(0, 5),
        });
      } catch (err) {
        reject(new Error(`Failed to parse file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Could not read the uploaded file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extracts participant objects from parsed rows using chosen column indices
 */
export function extractParticipantsFromRows(dataRows = [], nameColIndex = 0, emailColIndex = -1, durationColIndex = -1) {
  const participants = [];

  dataRows.forEach((row, idx) => {
    if (!Array.isArray(row)) return;

    const rawName = nameColIndex >= 0 && nameColIndex < row.length ? String(row[nameColIndex] || '').trim() : '';
    if (!rawName) return;

    const email = emailColIndex >= 0 && emailColIndex < row.length ? String(row[emailColIndex] || '').trim() : '';
    const duration = durationColIndex >= 0 && durationColIndex < row.length ? String(row[durationColIndex] || '').trim() : '';

    participants.push({
      id: `part-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: rawName,
      email,
      duration,
      rowNumber: idx + 1,
      rawRow: row,
    });
  });

  return participants;
}

/**
 * Parses raw pasted multiline text for student rosters
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
      if (looksLikeId(parts[0])) {
        return { studentId: parts[0], fullName: parts.slice(1).join(' ') };
      } else if (looksLikeId(parts[parts.length - 1])) {
        return { studentId: parts[parts.length - 1], fullName: parts.slice(0, -1).join(' ') };
      }
      return { studentId: parts[0], fullName: parts[1] };
    }
  }

  // Try comma separation
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      if (looksLikeId(parts[0])) {
        return { studentId: parts[0], fullName: parts.slice(1).join(', ') };
      }
      if (!looksLikeId(parts[0]) && !looksLikeId(parts[1])) {
        return { studentId: '', fullName: trimmed };
      }
    }
  }

  // Try hyphen / en-dash separation: "2024-001 - John Doe"
  const dashMatch = trimmed.match(/^([A-Za-z0-9_-]+)\s*[-–—]\s*(.+)$/);
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

function looksLikeId(str) {
  if (!str) return false;
  const digitCount = (str.match(/\d/g) || []).length;
  return digitCount >= 2 && str.length <= 25 && !str.includes(' ');
}

function sanitizeFilename(str) {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
}
