import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  X, 
  Sparkles
} from 'lucide-react';
import ClassCard from './ClassCard.jsx';
import EmptyState from '../common/EmptyState.jsx';

export default function ClassList({
  classes,
  students,
  onOpenCreateClass,
  onEditClass,
  onDeleteClass,
  onManageRoster,
  onLoadSampleData,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate enrolled students per class
  const classStudentCounts = useMemo(() => {
    const counts = {};
    students.forEach((s) => {
      counts[s.classId] = (counts[s.classId] || 0) + 1;
    });
    return counts;
  }, [students]);

  // Filter classes by query
  const filteredClasses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return classes;
    return classes.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.subject && c.subject.toLowerCase().includes(q)) ||
        (c.section && c.section.toLowerCase().includes(q))
    );
  }, [classes, searchQuery]);

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Class Management</h1>
          <p className="page-description">
            Organize your courses, subjects, and student cohorts in one place.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenCreateClass}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Create New Class</span>
          </button>
        </div>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No Classes Added Yet"
          description="Create your first class cohort to start tracking rosters and college attendance sessions."
          actionButton={
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={onOpenCreateClass}
            >
              <Plus size={20} />
              <span>Create Your First Class</span>
            </button>
          }
          secondaryAction={
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={onLoadSampleData}
            >
              <Sparkles size={18} color="var(--blue-600)" />
              <span>Load Sample College Data</span>
            </button>
          }
        />
      ) : (
        <>
          {/* Toolbar: Search */}
          <div className="filter-toolbar">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="form-input"
                placeholder="Search classes by name, subject, or section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search classes"
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

            <div style={{ color: 'var(--slate-500)', fontSize: '0.92rem', fontWeight: 600 }}>
              Showing {filteredClasses.length} of {classes.length} {classes.length === 1 ? 'class' : 'classes'}
            </div>
          </div>

          {filteredClasses.length === 0 ? (
            <div className="card">
              <div className="card-body">
                <EmptyState
                  icon={Search}
                  title="No Matching Classes Found"
                  description={`No classes found matching "${searchQuery}". Check your spelling or clear the search filter.`}
                  actionButton={
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search Filter
                    </button>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="classes-grid">
              {filteredClasses.map((cls) => (
                <ClassCard
                  key={cls.id}
                  classItem={cls}
                  studentCount={classStudentCounts[cls.id] || 0}
                  onManageRoster={onManageRoster}
                  onEdit={onEditClass}
                  onDelete={onDeleteClass}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
