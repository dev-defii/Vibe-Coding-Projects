import React from 'react';
import { 
  ClipboardCheck, 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  Settings,
  Plus, 
  Sparkles 
} from 'lucide-react';

export default function Navbar({
  currentView,
  setCurrentView,
  classesCount = 0,
  studentsCount = 0,
  onOpenCreateClass,
  onLoadSampleData,
  hasData = false,
}) {
  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <div 
          className="navbar-brand" 
          onClick={() => setCurrentView('dashboard')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setCurrentView('dashboard')}
          title="Go to Dashboard"
        >
          <div className="brand-icon-box">
            <ClipboardCheck size={26} strokeWidth={2.3} />
          </div>
          <div className="brand-text-group">
            <span className="brand-title">ClassCheck</span>
            <span className="brand-badge">College Attendance Tool</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-links" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-tab-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${currentView === 'classes' ? 'active' : ''}`}
            onClick={() => setCurrentView('classes')}
          >
            <GraduationCap size={18} />
            <span>Classes</span>
            {classesCount > 0 && (
              <span 
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  backgroundColor: currentView === 'classes' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
                  fontWeight: '700'
                }}
              >
                {classesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${currentView === 'students' ? 'active' : ''}`}
            onClick={() => setCurrentView('students')}
          >
            <Users size={18} />
            <span>Students</span>
            {studentsCount > 0 && (
              <span 
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  backgroundColor: currentView === 'students' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
                  fontWeight: '700'
                }}
              >
                {studentsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentView('settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Quick Actions */}
        <div className="nav-actions">
          {!hasData && (
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={onLoadSampleData}
              title="Load sample college classes & students"
              style={{ color: 'var(--navy-900)', fontWeight: 600 }}
            >
              <Sparkles size={16} color="var(--blue-600)" />
              <span>Load Sample Data</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={onOpenCreateClass}
            title="Create a new class"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Class</span>
          </button>
        </div>
      </div>
    </header>
  );
}
