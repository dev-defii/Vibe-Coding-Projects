import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import DashboardView from './components/dashboard/DashboardView.jsx';
import ClassList from './components/classes/ClassList.jsx';
import ClassModal from './components/classes/ClassModal.jsx';
import StudentRoster from './components/students/StudentRoster.jsx';
import StudentModal from './components/students/StudentModal.jsx';
import BulkStudentModal from './components/students/BulkStudentModal.jsx';
import ConfirmModal from './components/common/ConfirmModal.jsx';
import Toast from './components/common/Toast.jsx';
import { storageService } from './services/storageService.js';

export default function App() {
  // Core state from localStorage
  const [classes, setClasses] = useState(() => storageService.getClasses());
  const [students, setStudents] = useState(() => storageService.getStudents());
  const [sessions, setSessions] = useState(() => storageService.getSessions());

  // Navigation view: 'dashboard' | 'classes' | 'students'
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
    if (editingStudent) {
      setStudents((prev) =>
        prev.map((s) => (s.id === savedStudent.id ? savedStudent : c => c))
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

  const handleClearAllData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reset All Data?',
      message:
        'This will erase all classes and student rosters saved on this device. Use this if you want to start fresh with real college records.',
      confirmText: 'Reset Everything',
      confirmVariant: 'danger',
      onConfirm: () => {
        const cleared = storageService.clearAllData();
        setClasses(cleared.classes);
        setStudents(cleared.students);
        setSessions(cleared.sessions);
        setSelectedClassId(null);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        showToast('All local data cleared.', 'warning');
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
        onClearAllData={handleClearAllData}
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

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        confirmVariant={confirmConfig.confirmVariant}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <Footer classesCount={classes.length} studentsCount={students.length} />
    </div>
  );
}
