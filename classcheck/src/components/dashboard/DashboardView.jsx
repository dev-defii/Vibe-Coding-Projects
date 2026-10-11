import React from 'react';
import { 
  Users, 
  GraduationCap, 
  CalendarCheck2, 
  Plus, 
  FileSpreadsheet, 
  Sparkles, 
  ArrowRight,
  BookOpen,
  UserPlus
} from 'lucide-react';
import StatCard from './StatCard.jsx';
import EmptyState from '../common/EmptyState.jsx';

export default function DashboardView({
  classes,
  students,
  sessions,
  onNavigate,
  onSelectClass,
  onOpenCreateClass,
  onOpenAddStudent,
  onOpenBulkAdd,
  onLoadSampleData,
}) {
  const totalClasses = classes.length;
  const totalStudents = students.length;
  const totalSessions = sessions ? sessions.length : 0;

  // Compute student count per class
  const classStudentCounts = classes.map((cls) => {
    const enrolled = students.filter((s) => s.classId === cls.id);
    return {
      ...cls,
      studentCount: enrolled.length,
    };
  });

  return (
    <div className="container">
      {/* Page Title & Intro */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>College Attendance Dashboard</h1>
          <p className="page-description">
            Welcome to ClassCheck. Track your classes, maintain updated rosters, and prepare for attendance recording.
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

      {/* Metrics Section: Students, Classes, Sessions */}
      <div className="grid-stats">
        <StatCard
          label="Total Classes"
          value={totalClasses}
          helper={totalClasses === 1 ? '1 active course' : `${totalClasses} active courses`}
          icon={GraduationCap}
          variant="blue"
          onClick={() => onNavigate('classes')}
        />

        <StatCard
          label="Total Students"
          value={totalStudents}
          helper={totalStudents === 1 ? '1 enrolled student' : `${totalStudents} enrolled across classes`}
          icon={Users}
          variant="navy"
          onClick={() => onNavigate('students')}
        />

        <StatCard
          label="Attendance Sessions"
          value={totalSessions}
          helper={totalSessions === 1 ? '1 session recorded' : `${totalSessions} sessions recorded`}
          icon={CalendarCheck2}
          variant="green"
          onClick={() => onNavigate('attendance')}
        />
      </div>

      {/* Quick Action Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-800) 100%)',
          color: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <h2 style={{ color: 'var(--white)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px' }}>
            Attendance & Roster Tracking Suite
          </h2>
          <p style={{ color: 'var(--blue-100)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Record meeting dates, import Google Meet attendance tracker exports (.xlsx, .csv), and review student attendance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {totalClasses > 0 && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ backgroundColor: 'var(--white)', color: 'var(--navy-900)' }}
                onClick={() => onNavigate('attendance')}
              >
                <CalendarCheck2 size={18} color="var(--success-600)" />
                <span>Attendance Sessions</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'var(--white)', borderColor: 'rgba(255,255,255,0.25)' }}
                onClick={() => onOpenBulkAdd(classes[0].id)}
              >
                <FileSpreadsheet size={18} color="var(--blue-100)" />
                <span>Bulk Roster Import</span>
              </button>
            </>
          )}
          {totalClasses === 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ backgroundColor: 'var(--white)', color: 'var(--navy-900)' }}
              onClick={onLoadSampleData}
            >
              <Sparkles size={18} color="var(--blue-600)" />
              <span>Load College Demo Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Classes Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <BookOpen size={20} color="var(--blue-600)" />
              <span>Active Classes & Rosters</span>
            </h2>
            <p className="card-subtitle">
              Overview of all courses, sections, and enrolled students
            </p>
          </div>
          {totalClasses > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => onNavigate('classes')}
            >
              <span>View All Classes</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>

        <div className="card-body" style={{ padding: totalClasses === 0 ? '0' : '20px' }}>
          {totalClasses === 0 ? (
            <div style={{ padding: '32px 20px' }}>
              <EmptyState
                icon={GraduationCap}
                title="No Classes Created Yet"
                description="Get started by creating your first course and section, or populate sample college records with one click."
                actionButton={
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onOpenCreateClass}
                  >
                    <Plus size={18} />
                    <span>Create First Class</span>
                  </button>
                }
                secondaryAction={
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onLoadSampleData}
                  >
                    <Sparkles size={18} color="var(--blue-600)" />
                    <span>Load Sample Data</span>
                  </button>
                }
              />
            </div>
          ) : (
            <div className="table-container">
              <table className="table" aria-label="Classes summary">
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Subject Code</th>
                    <th>Section</th>
                    <th>Enrolled Students</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudentCounts.map((cls) => (
                    <tr key={cls.id}>
                      <td>
                        <strong style={{ color: 'var(--navy-900)', fontSize: '1rem' }}>
                          {cls.name}
                        </strong>
                      </td>
                      <td>
                        <span className="badge badge-navy">
                          {cls.subject}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-neutral">
                          {cls.section}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-blue">
                          <Users size={13} />
                          <span>{cls.studentCount} {cls.studentCount === 1 ? 'Student' : 'Students'}</span>
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                              onSelectClass(cls.id);
                              onNavigate('students');
                            }}
                            title="Manage Roster"
                          >
                            <Users size={14} />
                            <span>Roster ({cls.studentCount})</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => onOpenAddStudent(cls.id)}
                            title="Add Student to this class"
                          >
                            <UserPlus size={14} />
                            <span>Add Student</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
