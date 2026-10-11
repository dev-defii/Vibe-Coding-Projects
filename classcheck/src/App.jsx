import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import DashboardView from './components/dashboard/DashboardView.jsx';
import ClassList from './components/classes/ClassList.jsx';
import ClassModal from './components/classes/ClassModal.jsx';
import StudentRoster from './components/students/StudentRoster.jsx';
import StudentModal from './components/students/StudentModal.jsx';
import BulkStudentModal from './components/students/BulkStudentModal.jsx';
import SettingsView from './components/settings/SettingsView.jsx';
import ConfirmModal from './components/common/ConfirmModal.jsx';
import Toast from './components/common/Toast.jsx';
import { storageService, normalizeStudentName } from './services/storageService.js';

export default function App() {
  // Core state from localStorage
  const [classes, setClasses] = useState(() => storageService.getClasses());
  const [students, setStudents] = useState(() => storageService.getStudents());
  const [sessions, setSessions] = useState(() => storageService.getSessions());

  // Navigation view: 'dashboard' | 'classes' | 'students' | 'settings'
  const [currentView, setCurrentView] = useState('dashboard');

  // Currently focused class for Student Roster view
  const [selectedClassId, setSelectedClassId] = useState(() => {
    const existing = storageService.getClasses();
    return existing.length > 0 ? existing[0].id : null;
  });

  // Modal states
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentTargetClassId, setStudentTargetClassId] = useState(null);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkTargetClassId, setBulkTargetClassId] = useState(null);

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
    const count = enrolledStudents.length;

    setConfirmConfig({
      isOpen: true,
      title: `Delete Class: ${classItem.name}?`,
      message:
        count > 0
          ? `Are you sure you want to delete this class? This will also remove ${count} enrolled student${
              count === 1 ? '' : 's'
            } from this class roster. This action cannot be undone.`
          : `Are you sure you want to delete "${classItem.name}"? This action cannot be undone.`,
      confirmText: 'Delete Class',
      confirmVariant: 'danger',
      requireTypedText: '',
      onConfirm: () => {
        setClasses((prev) => prev.filter((c) => c.id !== classItem.id));
        setStudents((prev) => prev.filter((s) => s.classId !== classItem.id));
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

  // ---------------- DEMO & RESET DATA ---------------- //
  const handleLoadSampleData = () => {
    const sample = storageService.loadSampleData();
    setClasses(sample.classes);
    setStudents(sample.students);
    setSessions(sample.sessions);
    setSelectedClassId(sample.classes[0].id);
    showToast('Loaded 3 sample classes and 17 students.', 'success');
  };

  const handleRequestResetData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Erase All Application Data?',
      message: `Resetting will permanently delete all ${classes.length} saved course(s), ${students.length} enrolled student record(s), and attendance sessions from this computer. This action cannot be reversed.`,
      confirmText: 'Permanently Erase All Data',
      confirmVariant: 'danger',
      requireTypedText: 'RESET',
      onConfirm: () => {
        const cleared = storageService.clearAllData();
        setClasses(cleared.classes);
        setStudents(cleared.students);
        setSessions(cleared.sessions);
        setSelectedClassId(null);
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
