import React, { useState, useEffect } from 'react';
import { X, GraduationCap, AlertCircle } from 'lucide-react';

export default function ClassModal({
  isOpen,
  onClose,
  onSave,
  editingClass = null,
}) {
  const [name, setName] = useState(editingClass?.name || '');
  const [section, setSection] = useState(editingClass?.section || '');
  const [subject, setSubject] = useState(editingClass?.subject || '');
  const [errors, setErrors] = useState({});

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
    if (!name.trim()) {
      errs.name = 'Class name is required (e.g., Data Structures and Algorithms)';
    }
    if (!section.trim()) {
      errs.section = 'Section is required (e.g., BSCS 2-A or Section 101)';
    }
    if (!subject.trim()) {
      errs.subject = 'Subject code or description is required (e.g., CS 201)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: editingClass ? editingClass.id : `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      section: section.trim(),
      subject: subject.trim().toUpperCase(),
      createdAt: editingClass?.createdAt || new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="class-modal-title">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--blue-600)' }}>
              <GraduationCap size={22} />
            </span>
            <h2 id="class-modal-title" className="modal-title">
              {editingClass ? 'Edit Class Details' : 'Create New Class'}
            </h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="class-name-input" className="form-label">
                Class / Course Name <span className="required">*</span>
              </label>
              <input
                id="class-name-input"
                type="text"
                className={`form-input ${errors.name ? 'has-error' : ''}`}
                placeholder="e.g. Data Structures and Algorithms"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
                autoFocus
              />
              {errors.name && (
                <div className="form-error">
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                  {errors.name}
                </div>
              )}
              <div className="form-helper">The full descriptive title of the class.</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="class-subject-input" className="form-label">
                  Subject Code <span className="required">*</span>
                </label>
                <input
                  id="class-subject-input"
                  type="text"
                  className={`form-input ${errors.subject ? 'has-error' : ''}`}
                  placeholder="e.g. CS 201"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (errors.subject) setErrors((prev) => ({ ...prev, subject: null }));
                  }}
                />
                {errors.subject && (
                  <div className="form-error">
                    <AlertCircle size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                    {errors.subject}
                  </div>
                )}
                <div className="form-helper">Official catalog code.</div>
              </div>

              <div className="form-group">
                <label htmlFor="class-section-input" className="form-label">
                  Section <span className="required">*</span>
                </label>
                <input
                  id="class-section-input"
                  type="text"
                  className={`form-input ${errors.section ? 'has-error' : ''}`}
                  placeholder="e.g. BSCS 2-A"
                  value={section}
                  onChange={(e) => {
                    setSection(e.target.value);
                    if (errors.section) setErrors((prev) => ({ ...prev, section: null }));
                  }}
                />
                {errors.section && (
                  <div className="form-error">
                    <AlertCircle size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                    {errors.section}
                  </div>
                )}
                <div className="form-helper">Cohort or section group.</div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingClass ? 'Save Changes' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
