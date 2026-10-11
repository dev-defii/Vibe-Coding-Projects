import React from 'react';
import { Users, Edit3, Trash2, ArrowRight } from 'lucide-react';

export default function ClassCard({
  classItem,
  studentCount = 0,
  onManageRoster,
  onEdit,
  onDelete,
}) {
  return (
    <div className="class-card">
      <div>
        <div className="class-card-top">
          <div className="class-badge-group">
            <span className="badge badge-navy">
              {classItem.subject || 'SUBJ'}
            </span>
            <span className="badge badge-neutral">
              Sec: {classItem.section || 'N/A'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className="btn btn-icon-only btn-secondary"
              onClick={() => onEdit(classItem)}
              title="Edit class information"
              aria-label={`Edit ${classItem.name}`}
            >
              <Edit3 size={15} />
            </button>
            <button
              type="button"
              className="btn btn-icon-only btn-secondary"
              onClick={() => onDelete(classItem)}
              title="Delete class"
              aria-label={`Delete ${classItem.name}`}
              style={{ color: 'var(--danger-600)' }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <h3 className="class-title">{classItem.name}</h3>

        <div className="class-card-stats">
          <span className="student-count-text">
            <Users size={16} color="var(--blue-600)" />
            <span>{studentCount} Enrolled {studentCount === 1 ? 'Student' : 'Students'}</span>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>
            Active Class
          </span>
        </div>
      </div>

      <div className="class-card-actions">
        <button
          type="button"
          className="btn btn-primary btn-roster"
          onClick={() => onManageRoster(classItem.id)}
        >
          <span>Open Roster</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
