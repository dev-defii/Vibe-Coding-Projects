// Storage service for ClassCheck
// Manages local persistence for classes, students, and attendance sessions in localStorage

const STORAGE_KEYS = {
  CLASSES: 'classcheck_classes_v1',
  STUDENTS: 'classcheck_students_v1',
  SESSIONS: 'classcheck_sessions_v1',
  HAS_VISITED: 'classcheck_has_visited_v1',
};

// Default sample data for college demonstration
export const SAMPLE_CLASSES = [
  {
    id: 'cls-sample-1',
    name: 'Data Structures and Algorithms',
    section: 'BSCS 2-A',
    subject: 'CS 201',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'cls-sample-2',
    name: 'Discrete Mathematics',
    section: 'BSCS 2-B',
    subject: 'MATH 105',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'cls-sample-3',
    name: 'Web Systems and Technologies',
    section: 'BSIT 3-A',
    subject: 'IT 302',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export const SAMPLE_STUDENTS = [
  // Class 1
  { id: 'stu-s1-1', classId: 'cls-sample-1', studentId: '2024-00101', fullName: 'Alonzo, Sofia Marie', createdAt: new Date().toISOString() },
  { id: 'stu-s1-2', classId: 'cls-sample-1', studentId: '2024-00102', fullName: 'Bernardo, Gabriel Luis', createdAt: new Date().toISOString() },
  { id: 'stu-s1-3', classId: 'cls-sample-1', studentId: '2024-00103', fullName: 'Castillo, Andrea Camille', createdAt: new Date().toISOString() },
  { id: 'stu-s1-4', classId: 'cls-sample-1', studentId: '2024-00104', fullName: 'Dela Cruz, Marcus John', createdAt: new Date().toISOString() },
  { id: 'stu-s1-5', classId: 'cls-sample-1', studentId: '2024-00105', fullName: 'Espiritu, Hannah Beatriz', createdAt: new Date().toISOString() },
  { id: 'stu-s1-6', classId: 'cls-sample-1', studentId: '2024-00106', fullName: 'Flores, Rafael Antonio', createdAt: new Date().toISOString() },
  { id: 'stu-s1-7', classId: 'cls-sample-1', studentId: '2024-00107', fullName: 'Garcia, Patricia Mae', createdAt: new Date().toISOString() },
  { id: 'stu-s1-8', classId: 'cls-sample-1', studentId: '2024-00108', fullName: 'Hernandez, Christian Kyle', createdAt: new Date().toISOString() },

  // Class 2
  { id: 'stu-s2-1', classId: 'cls-sample-2', studentId: '2024-00201', fullName: 'Aquino, Jeremiah Vance', createdAt: new Date().toISOString() },
  { id: 'stu-s2-2', classId: 'cls-sample-2', studentId: '2024-00202', fullName: 'Bautista, Clarisse Anne', createdAt: new Date().toISOString() },
  { id: 'stu-s2-3', classId: 'cls-sample-2', studentId: '2024-00203', fullName: 'Cruz, Kenneth Joshua', createdAt: new Date().toISOString() },
  { id: 'stu-s2-4', classId: 'cls-sample-2', studentId: '2024-00204', fullName: 'Domingo, Leila Marie', createdAt: new Date().toISOString() },
  { id: 'stu-s2-5', classId: 'cls-sample-2', studentId: '2024-00205', fullName: 'Evangelista, Paul Ryan', createdAt: new Date().toISOString() },

  // Class 3
  { id: 'stu-s3-1', classId: 'cls-sample-3', studentId: '2023-01045', fullName: 'Alvarez, Ethan Dave', createdAt: new Date().toISOString() },
  { id: 'stu-s3-2', classId: 'cls-sample-3', studentId: '2023-01046', fullName: 'Buenaventura, Alyssa Joy', createdAt: new Date().toISOString() },
  { id: 'stu-s3-3', classId: 'cls-sample-3', studentId: '2023-01047', fullName: 'Cabrera, Vincent Patrick', createdAt: new Date().toISOString() },
  { id: 'stu-s3-4', classId: 'cls-sample-3', studentId: '2023-01048', fullName: 'Diaz, Samantha Nicole', createdAt: new Date().toISOString() },
];
/**
 * Normalizes a student full name for comparison:
 * Trims leading/trailing whitespace, collapses internal whitespace, and converts to lowercase.
 * Example: "  Juan   Dela   Cruz  " -> "juan dela cruz"
 */
export function normalizeStudentName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export const storageService = {
  // Check if first-time user
  hasVisitedBefore() {
    return localStorage.getItem(STORAGE_KEYS.HAS_VISITED) === 'true';
  },

  markVisited() {
    localStorage.setItem(STORAGE_KEYS.HAS_VISITED, 'true');
  },

  // Classes
  getClasses() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (!data) return [];
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to parse classes from localStorage:', err);
      return [];
    }
  },

  saveClasses(classes) {
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
      this.markVisited();
    } catch (err) {
      console.error('Failed to save classes to localStorage:', err);
    }
  },

  // Students
  getStudents() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to parse students from localStorage:', err);
      return [];
    }
  },

  saveStudents(students) {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (err) {
      console.error('Failed to save students to localStorage:', err);
    }
  },

  // Attendance sessions (stubbed for milestone 1 & ready for milestone 2)
  getSessions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to parse sessions from localStorage:', err);
      return [];
    }
  },

  saveSessions(sessions) {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (err) {
      console.error('Failed to save sessions to localStorage:', err);
    }
  },

  // Load sample demo data
  loadSampleData() {
    this.saveClasses(SAMPLE_CLASSES);
    this.saveStudents(SAMPLE_STUDENTS);
    this.saveSessions([]);
    this.markVisited();
    return {
      classes: SAMPLE_CLASSES,
      students: SAMPLE_STUDENTS,
      sessions: [],
    };
  },

  // Clear all data
  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.CLASSES);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    this.markVisited();
    return {
      classes: [],
      students: [],
      sessions: [],
    };
  },
};
