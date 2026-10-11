import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  CalendarCheck2, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users, 
  Search, 
  X, 
  ChevronDown, 
  FileSpreadsheet, 
  FileText, 
  Sparkles, 
  UserCheck, 
  UserX, 
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';
import ImportMeetModal from './ImportMeetModal.jsx';
import { matchParticipantsToRoster } from '../../services/attendanceMatchingService.js';
import { exportAttendanceToExcel, exportAttendanceToCSV } from '../../services/spreadsheetService.js';

export default function AttendanceSessionDetail({
  session,
  classObj,
  students = [],
  onUpdateSession,
  onBack,
  onShowToast,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'present' | 'absent' | 'unreviewed'
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Class students enrolled in this session's class
  const classStudents = useMemo(() => {
    if (!classObj) return [];
    return students.filter((s) => s.classId === classObj.id);
  }, [students, classObj]);

  // Ensure every student in the roster has a record in the session
  const currentRecords = useMemo(() => {
    const existingRecords = session.records || [];
    const recordMap = new Map();
    existingRecords.forEach((r) => recordMap.set(r.studentId, r));

    // Ensure all enrolled students exist in records
    return classStudents.map((s) => {
      if (recordMap.has(s.studentId)) {
        return recordMap.get(s.studentId);
      }
      return {
        studentId: s.studentId,
        studentInternalId: s.id,
        studentName: s.fullName,
        status: 'unreviewed',
        matchType: 'none',
        matchedParticipantName: '',
        matchConfidence: 0,
        notes: 'Not found in Meet import',
        reviewWarning: null,
        meetingDetails: null,
      };
    });
  }, [session.records, classStudents]);

  // Summary counts
  const summary = useMemo(() => {
    const totalEnrolled = currentRecords.length;
    const presentCount = currentRecords.filter((r) => r.status === 'present').length;
    const absentCount = currentRecords.filter((r) => r.status === 'absent').length;
    const unreviewedCount = currentRecords.filter((r) => r.status === 'unreviewed').length;
    const attendanceRate = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;
    const unmatchedCount = (session.unmatchedParticipants || []).length;

    return {
      totalEnrolled,
      presentCount,
      absentCount,
      unreviewedCount,
      attendanceRate,
      unmatchedCount,
    };
  }, [currentRecords, session.unmatchedParticipants]);

  // Filtered student records for display
  const filteredRecords = useMemo(() => {
    return currentRecords.filter((r) => {
      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = r.studentName && r.studentName.toLowerCase().includes(q);
        const matchesId = r.studentId && r.studentId.toLowerCase().includes(q);
        const matchesNotes = r.notes && r.notes.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [currentRecords, statusFilter, searchQuery]);

  // Handle single student status toggle
  const handleSetStudentStatus = (studentId, newStatus) => {
    const updatedRecords = currentRecords.map((r) => {
      if (r.studentId === studentId) {
        return {
          ...r,
          status: newStatus,
          notes: newStatus === r.status ? r.notes : `Manually set to ${newStatus}`,
        };
      }
      return r;
    });

    onUpdateSession({
      ...session,
      records: updatedRecords,
      updatedAt: new Date().toISOString(),
    });
  };

  // Batch actions
  const handleMarkAllUnreviewedAbsent = () => {
    const updatedRecords = currentRecords.map((r) => {
      if (r.status === 'unreviewed') {
        return {
          ...r,
          status: 'absent',
          notes: 'Marked absent during review',
        };
      }
      return r;
    });

    onUpdateSession({
      ...session,
      records: updatedRecords,
      updatedAt: new Date().toISOString(),
    });

    onShowToast?.(`Marked ${summary.unreviewedCount} unreviewed students as Absent.`, 'success');
  };

  const handleMarkAllPresent = () => {
    const updatedRecords = currentRecords.map((r) => ({
      ...r,
      status: 'present',
      notes: 'Manually marked present in batch',
    }));

    onUpdateSession({
      ...session,
      records: updatedRecords,
      updatedAt: new Date().toISOString(),
    });

    onShowToast?.('Marked all students as Present.', 'success');
  };

  const handleResetToUnreviewed = () => {
    const updatedRecords = currentRecords.map((r) => ({
      ...r,
      status: 'unreviewed',
      notes: 'Reset to unreviewed',
    }));

    onUpdateSession({
      ...session,
      records: updatedRecords,
      updatedAt: new Date().toISOString(),
    });

    onShowToast?.('Reset all records to Unreviewed.', 'warning');
  };

  // Finalize session
  const handleFinalizeSession = (markRemainingAbsent = false) => {
    let recordsToSave = currentRecords;
    if (markRemainingAbsent) {
      recordsToSave = currentRecords.map((r) => {
        if (r.status === 'unreviewed') {
          return {
            ...r,
            status: 'absent',
            notes: 'Marked absent upon session finalization',
          };
        }
        return r;
      });
    }

    onUpdateSession({
      ...session,
      records: recordsToSave,
      status: 'finalized',
      updatedAt: new Date().toISOString(),
      finalizedAt: new Date().toISOString(),
    });

    onShowToast?.('Attendance session finalized successfully.', 'success');
  };

  const handleReopenSession = () => {
    onUpdateSession({
      ...session,
      status: 'in_review',
      updatedAt: new Date().toISOString(),
    });

    onShowToast?.('Session reopened for review.', 'info');
  };

  // Handle Meet File Import
  const handleProcessImport = ({ participants, importMetadata }) => {
    // Run intelligent matching service
    const matchResult = matchParticipantsToRoster(classStudents, participants);

    // Merge new match records with existing (preserve manual overrides if applicable)
    onUpdateSession({
      ...session,
      records: matchResult.records,
      unmatchedParticipants: matchResult.unmatchedParticipants,
      importMetadata: {
        ...importMetadata,
        duplicatesMerged: matchResult.duplicatesMerged,
        totalMatched: matchResult.summary.presentCount,
      },
      updatedAt: new Date().toISOString(),
    });

    const msg = matchResult.duplicatesMerged > 0
      ? `Imported & matched ${matchResult.summary.presentCount} attendees (${matchResult.duplicatesMerged} duplicate entries merged).`
      : `Imported & matched ${matchResult.summary.presentCount} attendees from Meet.`;

    onShowToast?.(msg, 'success');
  };

  // Confirm a suggested fuzzy match
  const handleConfirmSuggestedMatch = (participant, suggestion) => {
    const updatedRecords = currentRecords.map((r) => {
      if (r.studentId === suggestion.studentId) {
        return {
          ...r,
          status: 'present',
          matchType: 'fuzzy_confirmed',
          matchedParticipantName: participant.originalName,
          matchConfidence: suggestion.confidence / 100,
          notes: `Confirmed match: "${participant.originalName}" (${suggestion.confidence}% confidence)`,
        };
      }
      return r;
    });

    // Remove this attendee from unmatched list
    const updatedUnmatched = (session.unmatchedParticipants || []).filter(
      (p) => p.originalName !== participant.originalName
    );

    onUpdateSession({
      ...session,
      records: updatedRecords,
      unmatchedParticipants: updatedUnmatched,
      updatedAt: new Date().toISOString(),
    });

    onShowToast?.(`Matched "${participant.originalName}" to ${suggestion.studentName}.`, 'success');
  };

  // Manually link an unmatched participant to any roster student
  const handleManualLinkParticipant = (participant, studentId) => {
    if (!studentId) return;
    const targetStudent = classStudents.find((s) => s.studentId === studentId);
    if (!targetStudent) return;

    const updatedRecords = currentRecords.map((r) => {
      if (r.studentId === studentId) {
        return {
          ...r,
          status: 'present',
          matchType: 'manual',
          matchedParticipantName: participant.originalName,
          notes: `Manually linked attendee: "${participant.originalName}"`,
        };
      }
      return r;
    });

    const updatedUnmatched = (session.unmatchedParticipants || []).filter(
      (p) => p.originalName !== participant.originalName
    );

    onUpdateSession({
      ...session,
      records: updatedRecords,
      unmatchedParticipants: updatedUnmatched,
      updatedAt: new Date().toISOString(),
    });

    onShowToast?.(`Linked "${participant.originalName}" to ${targetStudent.fullName}.`, 'success');
  };

  // Export handlers
  const handleExportExcel = () => {
    try {
      exportAttendanceToExcel(
        session,
        classObj,
        currentRecords,
        summary,
        session.unmatchedParticipants || []
      );
      onShowToast?.('Downloaded Attendance Report (.xlsx)', 'success');
      setExportDropdownOpen(false);
    } catch (err) {
      onShowToast?.(`Export failed: ${err.message}`, 'danger');
    }
  };

  const handleExportCSV = () => {
    try {
      exportAttendanceToCSV(session, classObj, currentRecords);
      onShowToast?.('Downloaded Attendance Report (.csv)', 'success');
      setExportDropdownOpen(false);
    } catch (err) {
      onShowToast?.(`Export failed: ${err.message}`, 'danger');
    }
  };

  const isFinalized = session.status === 'finalized';

  return (
    <div className="container">
      {/* Top Navigation Bar with Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={onBack}
          style={{ gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Attendance Sessions</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isFinalized ? (
            <span className="badge badge-green" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
              <CheckCircle2 size={15} />
              <span>Session Finalized</span>
            </span>
          ) : (
            <span 
              className="badge" 
              style={{ 
                backgroundColor: '#fef3c7', 
                color: '#92400e', 
                border: '1px solid #fde68a',
                fontSize: '0.85rem',
                padding: '6px 12px'
              }}
            >
              <Clock size={15} />
              <span>In Review (Draft)</span>
            </span>
          )}
        </div>
      </div>

      {/* Session Title & Metadata Header Card */}
      <div 
        className="card" 
        style={{ 
          marginBottom: '24px', 
          borderLeft: '5px solid var(--blue-600)',
          padding: '24px 28px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span className="badge badge-navy">
                {session.subject || classObj?.subject}
              </span>
              <span className="badge badge-neutral">
                Sec: {classObj?.section || session.section}
              </span>
              <span style={{ fontSize: '0.88rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                Meeting Date: <strong>{session.date}</strong>
              </span>
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)', margin: '4px 0' }}>
              {session.title || 'General Attendance Session'}
            </h1>

            <div style={{ fontSize: '0.95rem', color: 'var(--slate-600)' }}>
              Course: <strong>{classObj?.name || session.className}</strong>
              {session.importMetadata && (
                <span style={{ marginLeft: '12px', fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                  &bull; Imported from: <code>{session.importMetadata.filename}</code>
                </span>
              )}
            </div>
          </div>

          {/* Main Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Import Google Meet File */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsImportModalOpen(true)}
              title="Import Google Meet attendance tracker file"
            >
              <Upload size={17} color="var(--blue-600)" />
              <span>Import Meet File</span>
            </button>

            {/* Export Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                title="Export official attendance report"
              >
                <Download size={16} />
                <span>Export Report</span>
                <ChevronDown size={14} />
              </button>

              {exportDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '6px',
                    backgroundColor: 'var(--white)',
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: '200px',
                    zIndex: 50,
                    padding: '6px',
                  }}
                >
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 12px',
                      border: 'none',
                      background: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--slate-800)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--slate-100)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={handleExportExcel}
                  >
                    <FileSpreadsheet size={16} color="#16a34a" />
                    <span>Export as Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 12px',
                      border: 'none',
                      background: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--slate-800)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--slate-100)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={handleExportCSV}
                  >
                    <FileText size={16} color="#2563eb" />
                    <span>Export as CSV</span>
                  </button>
                </div>
              )}
            </div>

            {/* Finalize / Reopen Controls */}
            {!isFinalized ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleFinalizeSession(false)}
                title="Confirm attendance review and finalize session"
              >
                <CheckCircle2 size={17} />
                <span>Finalize Session</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReopenSession}
                title="Reopen session to make adjustments"
                style={{ color: 'var(--slate-700)' }}
              >
                <RotateCcw size={15} />
                <span>Reopen for Editing</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Summary Stat Cards */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}
      >
        {/* Total Enrolled */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 700, textTransform: 'uppercase' }}>
            ENROLLED ROSTER
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '2px' }}>
            {summary.totalEnrolled}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Students in class</div>
        </div>

        {/* Present */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--success-600)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--success-700)', fontWeight: 700, textTransform: 'uppercase' }}>
            PRESENT
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success-700)', marginTop: '2px' }}>
            {summary.presentCount}{' '}
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--success-600)' }}>
              ({summary.attendanceRate}%)
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Confirmed attendees</div>
        </div>

        {/* Absent */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--danger-600)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--danger-700)', fontWeight: 700, textTransform: 'uppercase' }}>
            ABSENT
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger-700)', marginTop: '2px' }}>
            {summary.absentCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Marked absent</div>
        </div>

        {/* Unreviewed */}
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>
            UNREVIEWED
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>
            {summary.unreviewedCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Needs officer review</div>
        </div>

        {/* Unmatched Attendees */}
        {summary.unmatchedCount > 0 && (
          <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: '0.8rem', color: '#6d28d9', fontWeight: 700, textTransform: 'uppercase' }}>
              UNMATCHED MEET
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6d28d9', marginTop: '2px' }}>
              {summary.unmatchedCount}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Attendees outside roster</div>
          </div>
        )}
      </div>

      {/* Review Guidance & Fast Action Banner */}
      {summary.unreviewedCount > 0 && !isFinalized && (
        <div 
          className="info-box" 
          style={{ 
            backgroundColor: '#fffbeb', 
            borderColor: '#fde68a', 
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} color="#d97706" />
            <div>
              <strong>Review Required:</strong> You have <strong>{summary.unreviewedCount}</strong> student{summary.unreviewedCount === 1 ? '' : 's'} still marked as Unreviewed.
              Students not detected in Meet remain Unreviewed until you decide.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={handleMarkAllUnreviewedAbsent}
              style={{ backgroundColor: 'var(--white)', color: 'var(--danger-700)', borderColor: 'var(--danger-border)' }}
            >
              <UserX size={15} />
              <span>Mark Remaining as Absent</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => handleFinalizeSession(true)}
            >
              <CheckCircle2 size={15} />
              <span>Mark Absent & Finalize</span>
            </button>
          </div>
        </div>
      )}

      {/* Section: Unmatched Meet Attendees & Cautious Suggested Matches */}
      {session.unmatchedParticipants && session.unmatchedParticipants.length > 0 && (
        <div className="card" style={{ marginBottom: '28px', border: '1.5px solid #ddd6fe' }}>
          <div className="card-header" style={{ backgroundColor: '#f5f3ff', borderBottomColor: '#ddd6fe' }}>
            <div>
              <h2 className="card-title" style={{ color: '#5b21b6' }}>
                <HelpCircle size={20} color="#7c3aed" />
                <span>Unmatched Google Meet Attendees ({session.unmatchedParticipants.length})</span>
              </h2>
              <p className="card-subtitle">
                Attendees detected in the Meet tracker export that did not match any enrolled student in this class.
              </p>
            </div>
          </div>

          <div className="card-body" style={{ padding: '16px' }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table" style={{ fontSize: '0.88rem' }}>
                <thead>
                  <tr>
                    <th>Attendee Name from File</th>
                    <th>Join Info / Duration</th>
                    <th>Cautious Suggestions / Roster Assignment</th>
                  </tr>
                </thead>
                <tbody>
                  {session.unmatchedParticipants.map((p, idx) => {
                    const hasSuggestions = p.suggestions && p.suggestions.length > 0;
                    return (
                      <tr key={idx} style={{ backgroundColor: hasSuggestions ? '#fdf4ff' : 'transparent' }}>
                        <td>
                          <strong style={{ color: 'var(--navy-900)' }}>{p.originalName}</strong>
                          {p.count > 1 && (
                            <span className="badge badge-neutral" style={{ marginLeft: '8px', fontSize: '0.72rem' }}>
                              Joined {p.count}x
                            </span>
                          )}
                          {p.email && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                              {p.email}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ color: 'var(--slate-600)' }}>{p.duration || 'N/A'}</span>
                        </td>
                        <td>
                          {hasSuggestions ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ fontSize: '0.8rem', color: '#6d28d9', fontWeight: 600 }}>
                                Possible match suggestion:
                              </div>
                              {p.suggestions.map((sug) => (
                                <div key={sug.studentId} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span className="badge badge-navy" style={{ fontSize: '0.75rem' }}>
                                    {sug.studentName} ({sug.confidence}% match)
                                  </span>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    style={{ padding: '3px 10px', minHeight: '28px', fontSize: '0.78rem' }}
                                    onClick={() => handleConfirmSuggestedMatch(p, sug)}
                                  >
                                    <Check size={13} />
                                    <span>Confirm as Present</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                                No confident suggestion.
                              </span>
                              <select
                                className="form-select"
                                style={{ minHeight: '32px', padding: '4px 8px', fontSize: '0.82rem', maxWidth: '240px' }}
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleManualLinkParticipant(p, e.target.value);
                                  }
                                }}
                              >
                                <option value="">-- Assign to Student --</option>
                                {classStudents.map((s) => (
                                  <option key={s.studentId} value={s.studentId}>
                                    {s.fullName} ({s.studentId})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Main Roster Attendance Review Table Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          {/* Search Student */}
          <div className="search-input-wrapper" style={{ maxWidth: '340px' }}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="Search student by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search student attendance records"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filters & Bulk Mark Actions */}
          <div className="toolbar-actions">
            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="roster-status-filter" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                Filter:
              </label>
              <select
                id="roster-status-filter"
                className="form-select"
                style={{ minHeight: '38px', padding: '6px 12px', fontSize: '0.88rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Students ({currentRecords.length})</option>
                <option value="present">Present ({summary.presentCount})</option>
                <option value="absent">Absent ({summary.absentCount})</option>
                <option value="unreviewed">Unreviewed ({summary.unreviewedCount})</option>
              </select>
            </div>

            {/* Quick Bulk Marking Controls */}
            {!isFinalized && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={handleMarkAllPresent}
                  title="Mark all students as present"
                >
                  <UserCheck size={14} color="var(--success-600)" />
                  <span>All Present</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={handleMarkAllUnreviewedAbsent}
                  title="Mark all unreviewed students as absent"
                >
                  <UserX size={14} color="var(--danger-600)" />
                  <span>Unreviewed Absent</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {filteredRecords.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ color: 'var(--slate-400)', marginBottom: '8px' }}>
                <Users size={36} />
              </div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--slate-800)' }}>
                No students match your filter
              </h3>
              <p style={{ color: 'var(--slate-500)', fontSize: '0.88rem' }}>
                Try selecting "All Students" or clearing your search query.
              </p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table" aria-label="Attendance Roster Table">
                <thead>
                  <tr>
                    <th style={{ width: '45px' }}>#</th>
                    <th style={{ width: '150px' }}>Student ID</th>
                    <th>Student Full Name</th>
                    <th style={{ width: '280px' }}>Attendance Status</th>
                    <th>Match Source & Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => {
                    const isPresent = record.status === 'present';
                    const isAbsent = record.status === 'absent';
                    const isUnreviewed = record.status === 'unreviewed';

                    // Avatar initials
                    const initials = record.studentName
                      ? record.studentName.replace(/,/g, '').trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase()
                      : 'ST';

                    return (
                      <tr 
                        key={record.studentId}
                        style={{
                          backgroundColor: isPresent 
                            ? 'rgba(240, 253, 244, 0.4)' 
                            : isAbsent 
                            ? 'rgba(254, 242, 242, 0.4)' 
                            : 'transparent'
                        }}
                      >
                        <td style={{ color: 'var(--slate-400)', fontWeight: 600 }}>
                          {index + 1}
                        </td>
                        <td>
                          <span className="student-id-badge">
                            {record.studentId}
                          </span>
                        </td>
                        <td>
                          <div className="student-info-cell">
                            <div className="student-avatar" aria-hidden="true">
                              {initials}
                            </div>
                            <span className="student-name-text">
                              {record.studentName}
                            </span>
                          </div>
                        </td>
                        <td>
                          {/* Segmented Status Toggle Buttons */}
                          <div 
                            style={{ 
                              display: 'inline-flex', 
                              backgroundColor: 'var(--slate-100)', 
                              borderRadius: 'var(--radius-md)', 
                              padding: '3px',
                              border: '1px solid var(--slate-200)'
                            }}
                            role="group"
                            aria-label={`Attendance status for ${record.studentName}`}
                          >
                            <button
                              type="button"
                              style={{
                                padding: '5px 12px',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                backgroundColor: isPresent ? 'var(--success-600)' : 'transparent',
                                color: isPresent ? 'var(--white)' : 'var(--slate-600)',
                              }}
                              onClick={() => handleSetStudentStatus(record.studentId, 'present')}
                            >
                              Present
                            </button>

                            <button
                              type="button"
                              style={{
                                padding: '5px 12px',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                backgroundColor: isAbsent ? 'var(--danger-600)' : 'transparent',
                                color: isAbsent ? 'var(--white)' : 'var(--slate-600)',
                              }}
                              onClick={() => handleSetStudentStatus(record.studentId, 'absent')}
                            >
                              Absent
                            </button>

                            <button
                              type="button"
                              style={{
                                padding: '5px 12px',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                backgroundColor: isUnreviewed ? '#d97706' : 'transparent',
                                color: isUnreviewed ? 'var(--white)' : 'var(--slate-600)',
                              }}
                              onClick={() => handleSetStudentStatus(record.studentId, 'unreviewed')}
                            >
                              Unreviewed
                            </button>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>
                            {isPresent && (
                              <span style={{ color: 'var(--success-700)', fontWeight: 600 }}>
                                {record.notes || 'Confirmed present'}
                              </span>
                            )}
                            {isAbsent && (
                              <span style={{ color: 'var(--danger-700)', fontWeight: 600 }}>
                                {record.notes || 'Marked absent'}
                              </span>
                            )}
                            {isUnreviewed && (
                              <span style={{ color: '#b45309', fontWeight: 500 }}>
                                {record.notes || 'Awaiting review'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Import Meet Attendance Modal */}
      {isImportModalOpen && (
        <ImportMeetModal
          key={session.id}
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          session={session}
          onProcessImport={handleProcessImport}
        />
      )}
    </div>
  );
}
