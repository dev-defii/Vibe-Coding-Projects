import React, { useState, useEffect } from 'react';
import { X, CalendarCheck2, AlertCircle } from 'lucide-react';

export default function SessionModal({
  isOpen,
  onClose,
  onSave,
  classes = [],
  initialClassId = null,
  editingSession = null,
  existingSessions = [],
}) {
  const [classId, setClassId] = useState(
    editingSession?.classId || initialClassId || (classes[0] ? classes[0].id : '')
  );
  const [subject, setSubject] = useState(editingSession?.subject || '');
  const [date, setDate] = useState(
    editingSession?.date || new Date().toISOString().split('T')[0]
  );
  const [title, setTitle] = useState(editingSession?.title || '');
  const [errors, setErrors] = useState({});

  // Auto-fill subject when classId changes
  useEffect(() => {
    if (classId) {
      const selected = classes.find((c) => c.id === classId);
      if (selected && !editingSession) {
        setSubject(selected.subject || '');
      }
    }
  }, [classId, classes, editingSession]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!classId) {
      errs.classId = 'Please select a class for this attendance session';
    }
    if (!date) {
      errs.date = 'Meeting date is required';
    }
    if (!subject.trim()) {
      errs.subject = 'Subject code is required';
    }

    // Check for duplicate session: same class, same date, and identical title
    const normalizedTitle = (title || '').trim().toLowerCase();
    const isDuplicate = existingSessions.some((s) => {
      if (editingSession && s.id === editingSession.id) return false;
      const sTitle = (s.title || '').trim().toLowerCase();
      return s.classId === classId && s.date === date && sTitle === normalizedTitle;
    });

    if (isDuplicate) {
      errs.duplicate = `A session for this class on ${date} with the title "${title || '(Untitled)'}" already exists.`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedClass = classes.find((c) => c.id === classId);

    onSave({
      id: editingSession ? editingSession.id : `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      classId,
      className: selectedClass ? selectedClass.name : '',
      section: selectedClass ? selectedClass.section : '',
      subject: subject.trim().toUpperCase(),
      date,
      title: title.trim(),
      status: editingSession ? editingSession.status : 'in_review',
      createdAt: editingSession?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      records: editingSession?.records || [],
      unmatchedParticipants: editingSession?.unmatchedParticipants || [],
      importMetadata: editingSession?.importMetadata || null,
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="session-modal-title">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--blue-600)' }}>
              <CalendarCheck2 size={24} />
            </span>
            <div>
              <h2 id="session-modal-title" className="modal-title">
                {editingSession ? 'Edit Attendance Session' : 'New Attendance Session'}
              </h2>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {errors.duplicate && (
              <div 
                className="info-box" 
                style={{ 
                  backgroundColor: 'var(--danger-50)', 
                  borderColor: 'var(--danger-border)', 
                  color: 'var(--danger-700)',
                  marginBottom: '16px' 
                }}
              >
                <AlertCircle size={18} className="info-box-icon" style={{ color: 'var(--danger-600)' }} />
                <div>{errors.duplicate}</div>
              </div>
            )}

            {/* Select Class */}
            <div className="form-group">
              <label htmlFor="session-class-select" className="form-label">
                Class / Course <span className="required">*</span>
              </label>
              <select
                id="session-class-select"
                className={`form-select ${errors.classId ? 'has-error' : ''}`}
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  if (errors.classId) setErrors((prev) => ({ ...prev, classId: null, duplicate: null }));
                }}
                disabled={!!editingSession}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} &bull; {c.subject} ({c.section})
                  </option>
                ))}
              </select>
              {errors.classId && <div className="form-error">{errors.classId}</div>}
              <div className="form-helper">The course section whose roster will be tracked.</div>
            </div>

            {/* Meeting Date & Subject Code */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="session-date-input" className="form-label">
                  Meeting Date <span className="required">*</span>
                </label>
                <input
                  id="session-date-input"
                  type="date"
                  className={`form-input ${errors.date ? 'has-error' : ''}`}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (errors.date) setErrors((prev) => ({ ...prev, date: null, duplicate: null }));
                  }}
                />
                {errors.date && <div className="form-error">{errors.date}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="session-subject-input" className="form-label">
                  Subject Code <span className="required">*</span>
                </label>
                <input
                  id="session-subject-input"
                  type="text"
                  className={`form-input ${errors.subject ? 'has-error' : ''}`}
                  placeholder="e.g. CS 201"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (errors.subject) setErrors((prev) => ({ ...prev, subject: null }));
                  }}
                />
                {errors.subject && <div className="form-error">{errors.subject}</div>}
              </div>
            </div>

            {/* Session Title (Optional) */}
            <div className="form-group">
              <label htmlFor="session-title-input" className="form-label">
                Session Title / Topic <span style={{ color: 'var(--slate-400)', fontWeight: 'normal' }}>(Optional)</span>
              </label>
              <input
                id="session-title-input"
                type="text"
                className="form-input"
                placeholder="e.g. Lecture 4: Binary Search Trees or Lab Exercise 2"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.duplicate) setErrors((prev) => ({ ...prev, duplicate: null }));
                }}
              />
              <div className="form-helper">Briefly describe the lecture or topic discussed.</div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingSession ? 'Save Changes' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
