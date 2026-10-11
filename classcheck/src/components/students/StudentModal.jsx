import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';

export default function StudentModal({
  isOpen,
  onClose,
  onSave,
  currentClass,
  editingStudent = null,
  existingStudents = [],
}) {
  const [studentId, setStudentId] = useState(editingStudent?.studentId || '');
  const [fullName, setFullName] = useState(editingStudent?.fullName || '');
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
    const trimmedId = studentId.trim();
    const trimmedName = fullName.trim();

    if (!trimmedId) {
      errs.studentId = 'Student ID is required (e.g., 2024-00123)';
    } else {
      // Check for duplicate ID in the same class (unless we are editing the same student)
      const isDuplicate = existingStudents.some(
        (s) =>
          s.classId === currentClass?.id &&
          s.studentId.toLowerCase() === trimmedId.toLowerCase() &&
          (!editingStudent || s.id !== editingStudent.id)
      );
      if (isDuplicate) {
        errs.studentId = `Student ID "${trimmedId}" is already used in this class roster.`;
      }
    }

    if (!trimmedName) {
      errs.fullName = 'Student full name is required (e.g., Dela Cruz, Juan)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: editingStudent ? editingStudent.id : `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      classId: currentClass.id,
      studentId: studentId.trim(),
      fullName: fullName.trim(),
      createdAt: editingStudent?.createdAt || new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="student-modal-title">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--blue-600)' }}>
              <UserPlus size={22} />
            </span>
            <div>
              <h2 id="student-modal-title" className="modal-title">
                {editingStudent ? 'Edit Student Details' : 'Add Student to Roster'}
              </h2>
              {currentClass && (
                <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                  Enrolling into: <strong>{currentClass.name}</strong> ({currentClass.section})
                </div>
              )}
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="student-id-input" className="form-label">
                Student ID / Roll No. <span className="required">*</span>
              </label>
              <input
                id="student-id-input"
                type="text"
                className={`form-input ${errors.studentId ? 'has-error' : ''}`}
                placeholder="e.g. 2024-00101"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  if (errors.studentId) setErrors((prev) => ({ ...prev, studentId: null }));
                }}
                autoFocus
              />
              {errors.studentId && (
                <div className="form-error">
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                  {errors.studentId}
                </div>
              )}
              <div className="form-helper">Official student identification number.</div>
            </div>

            <div className="form-group">
              <label htmlFor="student-name-input" className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="student-name-input"
                type="text"
                className={`form-input ${errors.fullName ? 'has-error' : ''}`}
                placeholder="e.g. Santos, Maria Clara"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
                }}
              />
              {errors.fullName && (
                <div className="form-error">
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                  {errors.fullName}
                </div>
              )}
              <div className="form-helper">Recommended format: Lastname, Firstname or Firstname Lastname.</div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingStudent ? 'Save Changes' : 'Add to Roster'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
