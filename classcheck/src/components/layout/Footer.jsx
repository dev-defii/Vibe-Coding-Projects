import React from 'react';
import { Database, ShieldCheck } from 'lucide-react';

export default function Footer({ classesCount = 0, studentsCount = 0 }) {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div>
          <strong>ClassCheck</strong> &mdash; Attendance & Roster Management for College Classes ({classesCount} {classesCount === 1 ? 'class' : 'classes'}, {studentsCount} {studentsCount === 1 ? 'student' : 'students'})
        </div>
        <div className="footer-links">
          <span className="footer-badge">
            <Database size={13} color="var(--blue-600)" />
            <span>Saved locally in browser</span>
          </span>
          <span className="footer-badge">
            <ShieldCheck size={13} color="var(--success-600)" />
            <span>No paid APIs &bull; Private &bull; Offline-ready</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
