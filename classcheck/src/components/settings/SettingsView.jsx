import React from 'react';
import { 
  Database, 
  Sparkles, 
  AlertTriangle, 
  GraduationCap, 
  Users, 
  CalendarCheck2, 
  ShieldCheck, 
  Trash2 
} from 'lucide-react';

export default function SettingsView({
  classesCount = 0,
  studentsCount = 0,
  sessionsCount = 0,
  onLoadSampleData,
  onRequestResetData,
}) {
  return (
    <div className="container" style={{ maxWidth: '880px' }}>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Settings & Data Management</h1>
          <p className="page-description">
            Manage your offline browser storage, demo records, and local application data.
          </p>
        </div>
      </div>

      {/* Card 1: Storage Overview */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2 className="card-title">
            <Database size={20} color="var(--blue-600)" />
            <span>Browser Local Storage</span>
          </h2>
          <span className="badge badge-green">
            <ShieldCheck size={14} />
            <span>100% Offline & Private</span>
          </span>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', marginBottom: '18px', lineHeight: '1.5' }}>
            ClassCheck stores all course information, rosters, and attendance records directly inside your computer's web browser using <code>localStorage</code>. No data is sent to external servers or third-party cloud services.
          </p>

          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              padding: '16px',
              backgroundColor: 'var(--slate-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-200)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--blue-50)', color: 'var(--blue-600)', borderRadius: 'var(--radius-md)' }}>
                <GraduationCap size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>Saved Classes</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--slate-900)' }}>{classesCount}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: '#ede9fe', color: '#6366f1', borderRadius: 'var(--radius-md)' }}>
                <Users size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>Enrolled Students</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--slate-900)' }}>{studentsCount}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--success-50)', color: 'var(--success-600)', borderRadius: 'var(--radius-md)' }}>
                <CalendarCheck2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>Attendance Sessions</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--slate-900)' }}>{sessionsCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Sample College Data */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2 className="card-title">
            <Sparkles size={20} color="var(--blue-600)" />
            <span>Sample College Data</span>
          </h2>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', marginBottom: '16px', lineHeight: '1.5' }}>
            Need test records to explore features? You can populate 3 realistic college courses (Computer Science, Mathematics, IT) and 17 sample student records anytime.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onLoadSampleData}
          >
            <Sparkles size={16} color="var(--blue-600)" />
            <span>Load Sample College Data</span>
          </button>
        </div>
      </div>

      {/* Card 3: Danger Zone (Reset Data) */}
      <div 
        className="card" 
        style={{ 
          borderColor: 'var(--danger-border)',
          boxShadow: '0 1px 3px rgba(220, 38, 38, 0.08)'
        }}
      >
        <div 
          className="card-header" 
          style={{ 
            backgroundColor: 'var(--danger-50)', 
            borderBottomColor: 'var(--danger-border)' 
          }}
        >
          <h2 className="card-title" style={{ color: 'var(--danger-700)' }}>
            <AlertTriangle size={20} color="var(--danger-600)" />
            <span>Danger Zone: Reset All Application Data</span>
          </h2>
          <span 
            className="badge" 
            style={{ 
              backgroundColor: '#fee2e2', 
              color: 'var(--danger-700)', 
              border: '1px solid var(--danger-border)' 
            }}
          >
            Irreversible
          </span>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--slate-700)', fontSize: '0.95rem', marginBottom: '14px', lineHeight: '1.5' }}>
            Resetting permanently deletes all locally saved courses, student rosters, and session records from this browser. This operation cannot be undone.
          </p>
          <div 
            style={{ 
              backgroundColor: 'var(--slate-50)', 
              padding: '12px 16px', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '0.88rem', 
              color: 'var(--slate-600)',
              marginBottom: '20px',
              border: '1px solid var(--slate-200)'
            }}
          >
            <strong>Note:</strong> To prevent accidental data loss, you will be required to type <code>RESET</code> in a confirmation dialog before anything is erased.
          </div>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onRequestResetData}
            disabled={classesCount === 0 && studentsCount === 0}
          >
            <Trash2 size={16} />
            <span>Reset All Application Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
