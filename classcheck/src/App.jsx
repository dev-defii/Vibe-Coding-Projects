import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import DashboardView from './components/dashboard/DashboardView.jsx';
import ClassList from './components/classes/ClassList.jsx';
import ClassModal from './components/classes/ClassModal.jsx';
import StudentRoster from './components/students/StudentRoster.jsx';
import StudentModal from './components/students/StudentModal.jsx';
import BulkStudentModal from './components/students/BulkStudentModal.jsx';
import AttendanceSessionList from './components/attendance/AttendanceSessionList.jsx';
import AttendanceSessionDetail from './components/attendance/AttendanceSessionDetail.jsx';
import SessionModal from './components/attendance/SessionModal.jsx';
import SettingsView from './components/settings/SettingsView.jsx';
import ConfirmModal from './components/common/ConfirmModal.jsx';
import Toast from './components/common/Toast.jsx';
import { storageService, normalizeStudentName } from './services/storageService.js';

export default function App() {
  // Core state from localStorage
  const [classes, setClasses] = useState(() => storageService.getClasses());
  const [students, setStudents] = useState(() => storageService.getStudents());
  const [sessions, setSessions] = useState(() => storageService.getSessions());

  // Navigation view: 'dashboard' | 'classes' | 'students' | 'attendance' | 'session-detail' | 'settings'
  const [currentView, setCurrentView] = useState('dashboard');

  // Currently focused class for Student Roster view
  const [selectedClassId, setSelectedClassId] = useState(() => {
    const existing = storageService.getClasses();
    return existing.length > 0 ? existing[0].id : null;
  });

  // Active attendance session ID for 'session-detail' view
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Modal states
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentTargetClassId, setStudentTargetClassId] = useState(null);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkTargetClassId, setBulkTargetClassId] = useState(null);

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sessionTargetClassId, setSessionTargetClassId] = useState(null);

  // Confirmation modal state
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    confirmVariant: 'danger',
    requireTypedText: '',
    onConfirm: () => {},
  });

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync to localStorage
  useEffect(() => {
    storageService.saveClasses(classes);
  }, [classes]);

  useEffect(() => {
    storageService.saveStudents(students);
  }, [students]);

  useEffect(() => {
    storageService.saveSessions(sessions);
  }, [sessions]);

  // Derived valid selected class ID
  const activeSelectedClassId =
    selectedClassId && classes.some((c) => c.id === selectedClassId)
      ? selectedClassId
      : classes[0]?.id || null;

  // Active session object
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // ---------------- CLASS HANDLERS ---------------- //
  const handleOpenCreateClass = () => {
    setEditingClass(null);
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (classItem) => {
    setEditingClass(classItem);
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (savedClass) => {
    if (editingClass) {
      setClasses((prev) =>
        prev.map((c) => (c.id === savedClass.id ? savedClass : c))
      );
      showToast(`Class "${savedClass.name}" updated successfully.`, 'success');
    } else {
      setClasses((prev) => [savedClass, ...prev]);
      setSelectedClassId(savedClass.id);
      showToast(`Class "${savedClass.name}" created successfully.`, 'success');
    }
  };

  const handleDeleteClass = (classItem) => {
    const enrolledStudents = students.filter((s) => s.classId === classItem.id);
    const relatedSessions = sessions.filter((s) => s.classId === classItem.id);
    const count = enrolledStudents.length;

    let confirmMsg = `Are you sure you want to delete "${classItem.name}"?`;
    if (count > 0 || relatedSessions.length > 0) {
      confirmMsg = `Are you sure you want to delete this class? This will also remove ${count} enrolled student${
        count === 1 ? '' : 's'
      } and ${relatedSessions.length} attendance session${
        relatedSessions.length === 1 ? '' : 's'
      }. This action cannot be undone.`;
    }

    setConfirmConfig({
      isOpen: true,
      title: `Delete Class: ${classItem.name}?`,
      message: confirmMsg,
      confirmText: 'Delete Class',
      confirmVariant: 'danger',
      requireTypedText: '',
      onConfirm: () => {
        setClasses((prev) => prev.filter((c) => c.id !== classItem.id));
        setStudents((prev) => prev.filter((s) => s.classId !== classItem.id));
        setSessions((prev) => prev.filter((s) => s.classId !== classItem.id));
        if (activeSession && activeSession.classId === classItem.id) {
          setActiveSessionId(null);
          setCurrentView('classes');
        }
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        showToast(`Class "${classItem.name}" deleted.`, 'danger');
      },
    });
  };

  // ---------------- STUDENT HANDLERS ---------------- //
  const handleOpenAddStudent = (classId) => {
    const targetId = classId || activeSelectedClassId || (classes[0] ? classes[0].id : null);
    if (!targetId) {
      handleOpenCreateClass();
      showToast('Please create a class first.', 'warning');
      return;
    }
    setStudentTargetClassId(targetId);
    setEditingStudent(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student) => {
    setStudentTargetClassId(student.classId);
    setEditingStudent(student);
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (savedStudent) => {
    // Validate duplicate ID within the same class
    const duplicateId = students.some(
      (s) =>
        s.classId === savedStudent.classId &&
        s.studentId.trim().toLowerCase() === savedStudent.studentId.trim().toLowerCase() &&
        s.id !== savedStudent.id
    );
    if (duplicateId) {
      showToast(`Student ID "${savedStudent.studentId}" is already used in this class roster.`, 'danger');
      return;
    }

    // Validate duplicate Name within the same class (normalized)
    const normName = normalizeStudentName(savedStudent.fullName);
    const duplicateName = students.some(
      (s) =>
        s.classId === savedStudent.classId &&
        normalizeStudentName(s.fullName) === normName &&
        s.id !== savedStudent.id
    );
    if (duplicateName) {
      showToast(`A student named "${savedStudent.fullName}" is already enrolled in this class.`, 'danger');
      return;
    }

    if (editingStudent) {
      setStudents((prev) =>
        prev.map((s) => (s.id === savedStudent.id ? savedStudent : s))
      );
      showToast(`Student "${savedStudent.fullName}" updated.`, 'success');
    } else {
      setStudents((prev) => [...prev, savedStudent]);
      showToast(`Student "${savedStudent.fullName}" enrolled.`, 'success');
    }
  };

  const handleDeleteStudent = (student) => {
    const studentClass = classes.find((c) => c.id === student.classId);
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Student from Roster?',
      message: `Are you sure you want to remove ${student.fullName} (ID: ${student.studentId}) from ${
        studentClass ? studentClass.name : 'this class'
      }?`,
      confirmText: 'Remove Student',
      confirmVariant: 'danger',
      requireTypedText: '',
      onConfirm: () => {
        setStudents((prev) => prev.filter((s) => s.id !== student.id));
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        showToast(`Student "${student.fullName}" removed from roster.`, 'danger');
      },
    });
  };

  // ---------------- BULK STUDENT ENTRY ---------------- //
  const handleOpenBulkAdd = (classId) => {
    const targetId = classId || activeSelectedClassId || (classes[0] ? classes[0].id : null);
    if (!targetId) {
      handleOpenCreateClass();
      showToast('Please create a class before adding students.', 'warning');
      return;
    }
    setBulkTargetClassId(targetId);
    setIsBulkModalOpen(true);
  };

  const handleSaveBulkStudents = (newStudents) => {
    if (!newStudents || newStudents.length === 0) return;
    const targetClassId = newStudents[0].classId;

    // Consistency check on data layer: ensure no duplicates against class or within new batch
    const existingClassStudents = students.filter((s) => s.classId === targetClassId);
    const existingIds = new Set(existingClassStudents.map((s) => s.studentId.trim().toLowerCase()));
    const existingNames = new Set(existingClassStudents.map((s) => normalizeStudentName(s.fullName)));

    const batchIds = new Set();
    const batchNames = new Set();

    for (const student of newStudents) {
      const normId = student.studentId.trim().toLowerCase();
      const normName = normalizeStudentName(student.fullName);

      if (existingIds.has(normId) || batchIds.has(normId)) {
        showToast(`Duplicate student ID detected: "${student.studentId}". Import stopped.`, 'danger');
        return;
      }
      if (existingNames.has(normName) || batchNames.has(normName)) {
        showToast(`Duplicate student name detected: "${student.fullName}". Import stopped.`, 'danger');
        return;
      }

      batchIds.add(normId);
      batchNames.add(normName);
    }

    setStudents((prev) => [...prev, ...newStudents]);
    showToast(`Successfully added ${newStudents.length} students to the roster!`, 'success');
  };

  // ---------------- ATTENDANCE SESSION HANDLERS ---------------- //
  const handleOpenCreateSession = (classId = null) => {
    if (classes.length === 0) {
      handleOpenCreateClass();
      showToast('Please create a class first.', 'warning');
      return;
    }
    setSessionTargetClassId(classId || activeSelectedClassId || classes[0].id);
    setEditingSession(null);
    setIsSessionModalOpen(true);
  };

  const handleSaveSession = (sessionData) => {
    if (editingSession) {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionData.id ? sessionData : s))
      );
      showToast('Attendance session updated.', 'success');
    } else {
      // Initialize records for all students currently in that class
      const classEnrollment = students.filter((stu) => stu.classId === sessionData.classId);
      const initialRecords = classEnrollment.map((stu) => ({
        studentId: stu.studentId,
        studentInternalId: stu.id,
        studentName: stu.fullName,
        status: 'unreviewed',
        matchType: 'none',
        matchedParticipantName: '',
        matchConfidence: 0,
        notes: 'Not found in Meet import',
        reviewWarning: null,
        meetingDetails: null,
      }));

      const newSessionWithRecords = {
        ...sessionData,
        records: initialRecords,
      };

      setSessions((prev) => [newSessionWithRecords, ...prev]);
      setActiveSessionId(newSessionWithRecords.id);
      setCurrentView('session-detail');
      showToast('Attendance session created.', 'success');
    }
  };

  const handleOpenSessionDetail = (sessionId) => {
    setActiveSessionId(sessionId);
    setCurrentView('session-detail');
  };

  const handleUpdateSession = (updatedSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );
  };

  const handleDeleteSession = (sessionItem) => {
    setConfirmConfig({
      isOpen: true,
      title: `Delete Session: ${sessionItem.title || sessionItem.date}?`,
      message: `Are you sure you want to delete this session? All attendance marks and matched participant logs for this date will be permanently deleted. This action cannot be undone.`,
      confirmText: 'Delete Session',
      confirmVariant: 'danger',
      requireTypedText: '',
      onConfirm: () => {
        setSessions((prev) => prev.filter((s) => s.id !== sessionItem.id));
        if (activeSessionId === sessionItem.id) {
          setActiveSessionId(null);
          setCurrentView('attendance');
        }
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        showToast('Attendance session deleted.', 'danger');
      },
    });
  };

  // ---------------- DEMO & RESET DATA ---------------- //
  const handleLoadSampleData = () => {
    const sample = storageService.loadSampleData();
    setClasses(sample.classes);
    setStudents(sample.students);
    setSessions(sample.sessions);
    setSelectedClassId(sample.classes[0].id);
    showToast('Loaded 3 sample classes, 17 students, and a demo attendance session.', 'success');
  };

  const handleRequestResetData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Erase All Application Data?',
      message: `Resetting will permanently delete all ${classes.length} saved course(s), ${students.length} enrolled student record(s), and ${sessions.length} attendance session(s) from this computer. This action cannot be reversed.`,
      confirmText: 'Permanently Erase All Data',
      confirmVariant: 'danger',
      requireTypedText: 'RESET',
      onConfirm: () => {
        const cleared = storageService.clearAllData();
        setClasses(cleared.classes);
        setStudents(cleared.students);
        setSessions(cleared.sessions);
        setSelectedClassId(null);
        setActiveSessionId(null);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        showToast('All local data has been permanently cleared.', 'warning');
      },
    });
  };

  // Helper to jump directly from class card to roster
  const handleManageRoster = (classId) => {
    setSelectedClassId(classId);
    setCurrentView('students');
  };

  const activeClassForStudentModal = classes.find((c) => c.id === studentTargetClassId) || null;
  const activeClassForBulkModal = classes.find((c) => c.id === bulkTargetClassId) || null;

  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        classesCount={classes.length}
        studentsCount={students.length}
        sessionsCount={sessions.length}
        onOpenCreateClass={handleOpenCreateClass}
        onLoadSampleData={handleLoadSampleData}
        hasData={classes.length > 0}
      />

      {/* Main View Area */}
      <main className="main-content">
        {currentView === 'dashboard' && (
          <DashboardView
            classes={classes}
            students={students}
            sessions={sessions}
            onNavigate={setCurrentView}
            onSelectClass={setSelectedClassId}
            onOpenCreateClass={handleOpenCreateClass}
            onOpenAddStudent={handleOpenAddStudent}
            onOpenBulkAdd={handleOpenBulkAdd}
            onLoadSampleData={handleLoadSampleData}
          />
        )}

        {currentView === 'classes' && (
          <ClassList
            classes={classes}
            students={students}
            onOpenCreateClass={handleOpenCreateClass}
            onEditClass={handleOpenEditClass}
            onDeleteClass={handleDeleteClass}
            onManageRoster={handleManageRoster}
            onLoadSampleData={handleLoadSampleData}
          />
        )}

        {currentView === 'students' && (
          <StudentRoster
            classes={classes}
            students={students}
            selectedClassId={activeSelectedClassId}
            onSelectClassId={setSelectedClassId}
            onOpenAddStudent={handleOpenAddStudent}
            onOpenBulkAdd={handleOpenBulkAdd}
            onEditStudent={handleOpenEditStudent}
            onDeleteStudent={handleDeleteStudent}
            onOpenCreateClass={handleOpenCreateClass}
            onShowToast={showToast}
          />
        )}

        {currentView === 'attendance' && (
          <AttendanceSessionList
            sessions={sessions}
            classes={classes}
            students={students}
            onOpenCreateSession={handleOpenCreateSession}
            onOpenSessionDetail={handleOpenSessionDetail}
            onDeleteSession={handleDeleteSession}
            onOpenCreateClass={handleOpenCreateClass}
            onLoadSampleData={handleLoadSampleData}
          />
        )}

        {currentView === 'session-detail' && activeSession && (
          <AttendanceSessionDetail
            session={activeSession}
            classObj={classes.find((c) => c.id === activeSession.classId)}
            students={students}
            onUpdateSession={handleUpdateSession}
            onBack={() => setCurrentView('attendance')}
            onShowToast={showToast}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            classesCount={classes.length}
            studentsCount={students.length}
            sessionsCount={sessions.length}
            onLoadSampleData={handleLoadSampleData}
            onRequestResetData={handleRequestResetData}
          />
        )}
      </main>

      {/* Modals */}
      {isClassModalOpen && (
        <ClassModal
          key={editingClass ? editingClass.id : 'new-class'}
          isOpen={isClassModalOpen}
          onClose={() => setIsClassModalOpen(false)}
          onSave={handleSaveClass}
          editingClass={editingClass}
        />
      )}

      {isStudentModalOpen && activeClassForStudentModal && (
        <StudentModal
          key={editingStudent ? editingStudent.id : 'new-student'}
          isOpen={isStudentModalOpen}
          onClose={() => setIsStudentModalOpen(false)}
          onSave={handleSaveStudent}
          currentClass={activeClassForStudentModal}
          editingStudent={editingStudent}
          existingStudents={students}
        />
      )}

      {isBulkModalOpen && activeClassForBulkModal && (
        <BulkStudentModal
          key={bulkTargetClassId || 'bulk-modal'}
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          onSaveBulk={handleSaveBulkStudents}
          currentClass={activeClassForBulkModal}
          existingStudents={students}
        />
      )}

      {isSessionModalOpen && (
        <SessionModal
          key={editingSession ? editingSession.id : 'new-session'}
          isOpen={isSessionModalOpen}
          onClose={() => setIsSessionModalOpen(false)}
          onSave={handleSaveSession}
          classes={classes}
          initialClassId={sessionTargetClassId}
          editingSession={editingSession}
          existingSessions={sessions}
        />
      )}

      {confirmConfig.isOpen && (
        <ConfirmModal
          key={confirmConfig.title}
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          confirmVariant={confirmConfig.confirmVariant}
          requireTypedText={confirmConfig.requireTypedText || ''}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        />
      )}

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <Footer classesCount={classes.length} studentsCount={students.length} />
    </div>
  );
}
