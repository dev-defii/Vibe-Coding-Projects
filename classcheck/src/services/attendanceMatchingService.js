// Attendance matching service for ClassCheck
// Compares Google Meet participant names against college class rosters
// Enforces strict rules: exact/inverted matches are automated; fuzzy matches are suggestions ONLY; duplicates are deduplicated.

import { normalizeStudentName } from './storageService.js';

/**
 * Parses a name into parts (handling "Lastname, Firstname Midname" or "Firstname Lastname")
 */
export function parseNameParts(rawName) {
  if (!rawName || typeof rawName !== 'string') {
    return { original: '', normalized: '', surname: '', given: '', inverted: '' };
  }

  const trimmed = rawName.trim();
  const normalized = normalizeStudentName(trimmed);

  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
    const surname = parts[0] || '';
    const given = parts.slice(1).join(' ') || '';
    const inverted = normalizeStudentName(`${given} ${surname}`);
    return {
      original: trimmed,
      normalized,
      surname: normalizeStudentName(surname),
      given: normalizeStudentName(given),
      inverted,
    };
  } else {
    const tokens = trimmed.split(/\s+/);
    if (tokens.length >= 2) {
      const surname = tokens[tokens.length - 1];
      const given = tokens.slice(0, -1).join(' ');
      const inverted = normalizeStudentName(`${surname}, ${given}`);
      return {
        original: trimmed,
        normalized,
        surname: normalizeStudentName(surname),
        given: normalizeStudentName(given),
        inverted,
      };
    }
    return {
      original: trimmed,
      normalized,
      surname: normalized,
      given: '',
      inverted: normalized,
    };
  }
}

/**
 * Calculates string similarity using Levenshtein distance (0 to 1 score)
 */
export function calculateSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const a = s1.toLowerCase();
  const b = s2.toLowerCase();

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[b.length][a.length];
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : Math.max(0, 1 - distance / maxLen);
}

/**
 * Matches an imported list of Meet participant names against the class roster.
 *
 * @param {Array} classStudents - Array of student objects from class roster: [{ id, studentId, fullName }]
 * @param {Array} rawParticipants - Array of participant objects: [{ name, email, duration, rawRow }]
 * @returns {Object} {
 *   matchedStudentIds: Set,
 *   recordsMap: Object (studentId -> record),
 *   unmatchedParticipants: Array,
 *   duplicateParticipantStats: Object,
 *   summary: Object
 * }
 */
export function matchParticipantsToRoster(classStudents = [], rawParticipants = []) {
  // 1. Prepare and deduplicate imported participants
  const participantGroups = new Map(); // normalizedName -> { originalName, count, details, instances }

  rawParticipants.forEach(p => {
    const rawName = (p.name || p.fullName || p.participant || '').trim();
    if (!rawName) return;

    const norm = normalizeStudentName(rawName);
    if (!norm) return;

    if (!participantGroups.has(norm)) {
      participantGroups.set(norm, {
        originalName: rawName,
        normalizedName: norm,
        count: 1,
        email: p.email || '',
        duration: p.duration || '',
        instances: [p],
      });
    } else {
      const existing = participantGroups.get(norm);
      existing.count += 1;
      existing.instances.push(p);
      if (!existing.duration && p.duration) existing.duration = p.duration;
      if (!existing.email && p.email) existing.email = p.email;
    }
  });

  const uniqueParticipants = Array.from(participantGroups.values());
  const duplicatesMerged = rawParticipants.length - uniqueParticipants.length;

  // 2. Prepare class roster maps
  // Each student in the roster
  const studentMap = new Map(); // studentId -> student
  const studentParsedMap = new Map(); // studentId -> parsed name parts

  classStudents.forEach(s => {
    studentMap.set(s.studentId, s);
    studentParsedMap.set(s.studentId, {
      student: s,
      parts: parseNameParts(s.fullName),
    });
  });

  // Track matched student IDs to prevent double assignment
  const matchedStudentIds = new Set();
  const matchedRecords = {}; // studentId -> record
  const assignedParticipantKeys = new Set();

  // Initialize records for all students as 'unreviewed'
  classStudents.forEach(s => {
    matchedRecords[s.studentId] = {
      studentId: s.studentId,
      studentInternalId: s.id,
      studentName: s.fullName,
      status: 'unreviewed', // default rule: unreviewed, not absent!
      matchType: 'none',
      matchedParticipantName: '',
      matchConfidence: 0,
      notes: 'Not found in Meet import',
      reviewWarning: null,
      meetingDetails: null,
    };
  });

  // 3. Stage 1: Exact Normalized Match
  // e.g. "Alonzo, Sofia Marie" === "Alonzo, Sofia Marie" or "Sofia Marie Alonzo" === "Sofia Marie Alonzo"
  uniqueParticipants.forEach(p => {
    for (const [studentId, info] of studentParsedMap.entries()) {
      if (matchedStudentIds.has(studentId)) continue;

      if (info.parts.normalized === p.normalizedName) {
        matchedStudentIds.add(studentId);
        assignedParticipantKeys.add(p.normalizedName);

        matchedRecords[studentId] = {
          ...matchedRecords[studentId],
          status: 'present',
          matchType: 'exact',
          matchedParticipantName: p.originalName,
          matchConfidence: 1.0,
          notes: p.count > 1 
            ? `Matched from Meet (appeared ${p.count}x in call log)` 
            : `Matched from Meet: "${p.originalName}"`,
          meetingDetails: {
            duration: p.duration,
            email: p.email,
            repeatCount: p.count,
          },
        };
        break;
      }
    }
  });

  // 4. Stage 2: Inverted Match (Lastname, Firstname <--> Firstname Lastname)
  // e.g. Roster: "Alonzo, Sofia Marie" -> Inverted: "Sofia Marie Alonzo" matches Meet: "Sofia Marie Alonzo"
  uniqueParticipants.forEach(p => {
    if (assignedParticipantKeys.has(p.normalizedName)) return;

    for (const [studentId, info] of studentParsedMap.entries()) {
      if (matchedStudentIds.has(studentId)) continue;

      // Check if student's inverted matches participant normalized
      // Or if participant has a comma, check participant's inverted with student's normalized
      const participantParts = parseNameParts(p.originalName);

      const isMatch =
        info.parts.inverted === p.normalizedName ||
        info.parts.normalized === participantParts.inverted ||
        (info.parts.surname && participantParts.surname && 
         info.parts.surname === participantParts.surname && 
         info.parts.given === participantParts.given);

      if (isMatch) {
        matchedStudentIds.add(studentId);
        assignedParticipantKeys.add(p.normalizedName);

        matchedRecords[studentId] = {
          ...matchedRecords[studentId],
          status: 'present',
          matchType: 'inverted_exact',
          matchedParticipantName: p.originalName,
          matchConfidence: 0.98,
          notes: p.count > 1
            ? `Matched (name inversion, appeared ${p.count}x in Meet)`
            : `Matched: "${p.originalName}" (Name format aligned)`,
          meetingDetails: {
            duration: p.duration,
            email: p.email,
            repeatCount: p.count,
          },
        };
        break;
      }
    }
  });

  // 5. Stage 3: Unmatched Participants & Cautious Fuzzy Match Suggestions
  // Strict rule: Fuzzy matches are NEVER automatically marked present. They are generated as suggestions for review.
  const unmatchedParticipants = [];

  uniqueParticipants.forEach(p => {
    if (assignedParticipantKeys.has(p.normalizedName)) return;

    // Find candidate suggestions among UNMATCHED roster students
    const candidateSuggestions = [];

    for (const [studentId, info] of studentParsedMap.entries()) {
      if (matchedStudentIds.has(studentId)) continue;

      const pParts = parseNameParts(p.originalName);

      // Similarity 1: direct normalized string similarity
      const simDirect = calculateSimilarity(info.parts.normalized, p.normalizedName);
      // Similarity 2: inverted string similarity
      const simInverted = calculateSimilarity(info.parts.inverted, p.normalizedName);
      // Similarity 3: participant inverted vs student normalized
      const simPInverted = calculateSimilarity(info.parts.normalized, pParts.inverted);

      const bestSim = Math.max(simDirect, simInverted, simPInverted);

      // Check for partial name match (e.g. matching surname and starting given name)
      const sameSurname = info.parts.surname && pParts.surname && info.parts.surname === pParts.surname;
      const effectiveSim = sameSurname ? Math.max(bestSim, 0.82) : bestSim;

      // Only consider if score >= 0.72
      if (effectiveSim >= 0.72) {
        candidateSuggestions.push({
          studentId: info.student.studentId,
          studentName: info.student.fullName,
          confidence: Math.round(effectiveSim * 100),
        });
      }
    }

    // Sort candidates by highest confidence
    candidateSuggestions.sort((a, b) => b.confidence - a.confidence);

    unmatchedParticipants.push({
      originalName: p.originalName,
      normalizedName: p.normalizedName,
      count: p.count,
      duration: p.duration,
      email: p.email,
      suggestions: candidateSuggestions.slice(0, 3), // top 3 candidates
      isAmbiguous: candidateSuggestions.length > 1 && (candidateSuggestions[0].confidence - candidateSuggestions[1].confidence < 8),
    });
  });

  return {
    matchedStudentIds,
    records: Object.values(matchedRecords),
    unmatchedParticipants,
    duplicatesMerged,
    summary: {
      totalEnrolled: classStudents.length,
      presentCount: matchedStudentIds.size,
      unreviewedCount: classStudents.length - matchedStudentIds.size,
      absentCount: 0,
      unmatchedAttendeesCount: unmatchedParticipants.length,
      totalParticipantsInFile: rawParticipants.length,
      uniqueParticipantsCount: uniqueParticipants.length,
      duplicatesMergedCount: duplicatesMerged,
    },
  };
}
