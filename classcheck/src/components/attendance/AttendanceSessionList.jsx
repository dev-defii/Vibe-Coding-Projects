import React, { useState, useMemo } from 'react';
import { 
  CalendarCheck2, 
  Plus, 
  Search, 
  X, 
  Trash2, 
  ArrowRight, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  Users, 
  AlertCircle 
} from 'lucide-react';
import EmptyState from '../common/EmptyState.jsx';

export default function AttendanceSessionList({
  sessions = [],
  classes = [],
  students = [],
  onOpenCreateSession,
  onOpenSessionDetail,
  onDeleteSession,
  onOpenCreateClass,
  onLoadSampleData,
}) {
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'in_review' | 'finalized'
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Class filter
      if (selectedClassFilter !== 'all' && s.classId !== selectedClassFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && s.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = s.title && s.title.toLowerCase().includes(q);
        const matchesSubject = s.subject && s.subject.toLowerCase().includes(q);
        const matchesDate = s.date && s.date.includes(q);
        const matchesClass = s.className && s.className.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject && !matchesDate && !matchesClass) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [sessions, selectedClassFilter, statusFilter, searchQuery]);

  // If no classes exist yet
  if (classes.length === 0) {
    return (
      <div className="container">
        <div className="page-header">
          <div className="page-title-group">
            <h1>Attendance Sessions</h1>
            <p className="page-description">
              Record, review, and finalize attendance logs for your classes.
            </p>
          </div>
        </div>

        <EmptyState
          icon={CalendarCheck2}
          title="No Classes Available"
          description="Before you can track attendance sessions, you need to create at least one course section."
          actionButton={
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={onOpenCreateClass}
            >
              <Plus size={20} />
              <span>Create a Class First</span>
            </button>
          }
          secondaryAction={
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={onLoadSampleData}
            >
              <span>Load Sample College Data</span>
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Attendance Sessions</h1>
          <p className="page-description">
            Track meeting dates, import Google Meet attendance logs, review participant matches, and export official reports.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenCreateSession}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>New Attendance Session</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-toolbar">
        <div className="search-input-wrapper" style={{ maxWidth: '340px' }}>
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by topic, date, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search attendance sessions"
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

        <div className="toolbar-actions">
          {/* Class Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="filter-class" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-600)' }}>
              Class:
            </label>
            <select
              id="filter-class"
              className="form-select"
              style={{ minHeight: '38px', padding: '6px 12px', fontSize: '0.88rem' }}
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
            >
              <option value="all">All Classes ({classes.length})</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.section})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="filter-status" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-600)' }}>
              Status:
            </label>
            <select
              id="filter-status"
              className="form-select"
              style={{ minHeight: '38px', padding: '6px 12px', fontSize: '0.88rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="in_review">In Review (Draft)</option>
              <option value="finalized">Finalized</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      {sessions.length === 0 ? (
        <EmptyState
          icon={CalendarCheck2}
          title="No Attendance Sessions Yet"
          description="Create your first session to record attendance or import a Google Meet participant spreadsheet."
          actionButton={
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={onOpenCreateSession}
            >
              <Plus size={20} />
              <span>Create First Session</span>
            </button>
          }
        />
      ) : filteredSessions.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon={Search}
              title="No Matching Attendance Sessions"
              description="No attendance sessions match your active filters or search terms."
              actionButton={
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedClassFilter('all');
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                >
                  Clear All Filters
                </button>
              }
            />
          </div>
        </div>
      ) : (
        <div className="classes-grid">
          {filteredSessions.map((s) => {
            const classObj = classes.find((c) => c.id === s.classId);
            const totalEnrolled = (s.records && s.records.length > 0)
              ? s.records.length
              : students.filter((stu) => stu.classId === s.classId).length;

            const presentCount = (s.records || []).filter((r) => r.status === 'present').length;
            const absentCount = (s.records || []).filter((r) => r.status === 'absent').length;
            const excusedCount = (s.records || []).filter((r) => r.status === 'excused').length;
            const unreviewedCount = (s.records || []).filter((r) => r.status === 'unreviewed').length;
            const isFinalized = s.status === 'finalized';

            return (
              <div key={s.id} className="class-card">
                <div>
                  <div className="class-card-top">
                    <div className="class-badge-group">
                      <span className="badge badge-navy">
                        {s.subject || classObj?.subject || 'SUBJ'}
                      </span>
                      <span className="badge badge-neutral">
                        Sec: {classObj?.section || s.section || 'N/A'}
                      </span>
                      {isFinalized ? (
                        <span className="badge badge-green">
                          <CheckCircle2 size={12} />
                          <span>Finalized</span>
                        </span>
                      ) : (
                        <span 
                          className="badge" 
                          style={{ 
                            backgroundColor: '#fef3c7', 
                            color: '#92400e', 
                            border: '1px solid #fde68a' 
                          }}
                        >
                          <Clock size={12} />
                          <span>In Review</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-icon-only btn-secondary"
                      onClick={() => onDeleteSession(s)}
                      title="Delete session"
                      aria-label={`Delete session ${s.title || s.date}`}
                      style={{ color: 'var(--danger-600)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <h3 className="class-title" style={{ fontSize: '1.2rem', marginBottom: '6px' }}>
                    {s.title || 'General Attendance Session'}
                  </h3>

                  <div style={{ fontSize: '0.9rem', color: 'var(--slate-600)', marginBottom: '14px' }}>
                    <strong>{classObj?.name || s.className || 'Class'}</strong>
                    <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                      Date: <strong>{s.date}</strong>
                    </div>
                  </div>

                  {/* Attendance Stat Summary Pill */}
                  <div className="class-card-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>PRESENT</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--success-700)' }}>{presentCount}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>ABSENT</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--danger-700)' }}>{absentCount}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>EXCUSED</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#6d28d9' }}>{excusedCount}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>UNREVIEWED</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b45309' }}>{unreviewedCount}</div>
                    </div>
                  </div>
                </div>

                <div className="class-card-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-roster"
                    onClick={() => onOpenSessionDetail(s.id)}
                  >
                    <span>Open Attendance</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
