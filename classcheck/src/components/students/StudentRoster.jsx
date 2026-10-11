import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Download, 
  Search, 
  X, 
  Edit3, 
  Trash2, 
  ArrowUpDown, 
  GraduationCap, 
  Plus,
  FileText,
  ChevronDown
} from 'lucide-react';
import EmptyState from '../common/EmptyState.jsx';
import { exportRosterToExcel, exportRosterToCSV } from '../../services/spreadsheetService.js';

export default function StudentRoster({
  classes,
  students,
  selectedClassId,
  onSelectClassId,
  onOpenAddStudent,
  onOpenBulkAdd,
  onEditStudent,
  onDeleteStudent,
  onOpenCreateClass,
  onShowToast,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('name-asc'); // 'name-asc' | 'name-desc' | 'id-asc' | 'id-desc'
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Active selected class object
  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || classes[0] || null;
  }, [classes, selectedClassId]);

  // Students belonging to the current selected class
  const classStudents = useMemo(() => {
    if (!currentClass) return [];
    return students.filter((s) => s.classId === currentClass.id);
  }, [students, currentClass]);

  // Filtered & sorted student list
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let list = classStudents;

    if (q) {
      list = list.filter(
        (s) =>
          (s.fullName && s.fullName.toLowerCase().includes(q)) ||
          (s.studentId && s.studentId.toLowerCase().includes(q))
      );
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortOption === 'name-asc') {
        return (a.fullName || '').localeCompare(b.fullName || '');
      }
      if (sortOption === 'name-desc') {
        return (b.fullName || '').localeCompare(a.fullName || '');
      }
      if (sortOption === 'id-asc') {
        return (a.studentId || '').localeCompare(b.studentId || '', undefined, { numeric: true });
      }
      if (sortOption === 'id-desc') {
        return (b.studentId || '').localeCompare(a.studentId || '', undefined, { numeric: true });
      }
      return 0;
    });
  }, [classStudents, searchQuery, sortOption]);

  // Helper to extract initials
  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.replace(/,/g, '').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Export handlers
  const handleExportExcel = () => {
    if (!currentClass || classStudents.length === 0) return;
    try {
      exportRosterToExcel(currentClass, classStudents);
      onShowToast?.(`Exported ${classStudents.length} students to Excel (.xlsx)`, 'success');
      setExportDropdownOpen(false);
    } catch (err) {
      onShowToast?.(`Export failed: ${err.message}`, 'danger');
    }
  };

  const handleExportCSV = () => {
    if (!currentClass || classStudents.length === 0) return;
    try {
      exportRosterToCSV(currentClass, classStudents);
      onShowToast?.(`Exported ${classStudents.length} students to CSV`, 'success');
      setExportDropdownOpen(false);
    } catch (err) {
      onShowToast?.(`Export failed: ${err.message}`, 'danger');
    }
  };

  // If no classes exist at all
  if (classes.length === 0) {
    return (
      <div className="container">
        <div className="page-header">
          <div className="page-title-group">
            <h1>Student Roster</h1>
            <p className="page-description">
              Manage student names and IDs for each of your college courses.
            </p>
          </div>
        </div>

        <EmptyState
          icon={GraduationCap}
          title="No Classes Available"
          description="Before you can manage student rosters, you need to create at least one class or course section."
          actionButton={
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={onOpenCreateClass}
            >
              <Plus size={20} />
              <span>Create a Class First</span>
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Student Roster</h1>
          <p className="page-description">
            Enroll students, review IDs, paste bulk names, and export official spreadsheets.
          </p>
        </div>
        <div className="page-actions">
          {currentClass && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onOpenBulkAdd(currentClass.id)}
              >
                <FileSpreadsheet size={18} color="var(--blue-600)" />
                <span>Bulk Add / Import</span>
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onOpenAddStudent(currentClass.id)}
              >
                <UserPlus size={18} />
                <span>Add Student</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Class Selector Bar */}
      <div className="class-selector-bar">
        <div className="selector-left">
          <label htmlFor="active-class-select" className="selector-label">
            Active Class:
          </label>
          <select
            id="active-class-select"
            className="class-dropdown-select"
            value={currentClass?.id || ''}
            onChange={(e) => onSelectClassId(e.target.value)}
          >
            {classes.map((cls) => {
              const count = students.filter((s) => s.classId === cls.id).length;
              return (
                <option key={cls.id} value={cls.id}>
                  {cls.name} &bull; {cls.subject} ({cls.section}) &mdash; {count} {count === 1 ? 'student' : 'students'}
                </option>
              );
            })}
          </select>
        </div>

        {currentClass && (
          <div className="selector-right">
            <span className="badge badge-navy">
              {currentClass.subject}
            </span>
            <span className="badge badge-neutral">
              Sec: {currentClass.section}
            </span>
            <span className="badge badge-blue">
              <Users size={14} />
              <span>{classStudents.length} {classStudents.length === 1 ? 'Student' : 'Students'}</span>
            </span>

            {/* Export Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={classStudents.length === 0}
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                title="Export roster spreadsheet"
              >
                <Download size={15} />
                <span>Export</span>
                <ChevronDown size={14} />
              </button>

              {exportDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '6px',
                    backgroundColor: 'var(--white)',
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: '180px',
                    zIndex: 50,
                    padding: '6px',
                  }}
                >
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--slate-800)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--slate-100)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={handleExportExcel}
                  >
                    <FileSpreadsheet size={16} color="#16a34a" />
                    <span>Export as Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--slate-800)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--slate-100)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={handleExportCSV}
                  >
                    <FileText size={16} color="#2563eb" />
                    <span>Export as CSV</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {classStudents.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon={Users}
              title={`No Students Enrolled in ${currentClass?.name || 'this class'}`}
              description="Build your class list by adding students individually, pasting multiple names in bulk, or importing from an Excel/CSV file."
              actionButton={
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onOpenBulkAdd(currentClass.id)}
                >
                  <FileSpreadsheet size={18} />
                  <span>Bulk Paste / Import Students</span>
                </button>
              }
              secondaryAction={
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onOpenAddStudent(currentClass.id)}
                >
                  <UserPlus size={18} />
                  <span>Add Single Student</span>
                </button>
              }
            />
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
            {/* Search Input */}
            <div className="search-input-wrapper" style={{ maxWidth: '360px' }}>
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by student name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search student roster"
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

            {/* Sort & Count */}
            <div className="toolbar-actions">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowUpDown size={15} color="var(--slate-500)" />
                <label htmlFor="roster-sort" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                  Sort:
                </label>
                <select
                  id="roster-sort"
                  className="form-select"
                  style={{ minHeight: '38px', padding: '6px 12px', fontSize: '0.88rem' }}
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="name-asc">Full Name (A to Z)</option>
                  <option value="name-desc">Full Name (Z to A)</option>
                  <option value="id-asc">Student ID (Ascending)</option>
                  <option value="id-desc">Student ID (Descending)</option>
                </select>
              </div>

              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--slate-500)', marginLeft: '8px' }}>
                {filteredStudents.length} of {classStudents.length} students
              </div>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {filteredStudents.length === 0 ? (
              <div style={{ padding: '40px 20px' }}>
                <EmptyState
                  icon={Search}
                  title="No Matching Students Found"
                  description={`No student found matching "${searchQuery}". Please check the student name or ID.`}
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
            ) : (
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table" aria-label="Student Roster">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th style={{ width: '170px' }}>Student ID</th>
                      <th>Student Full Name</th>
                      <th>Class & Section</th>
                      <th style={{ textAlign: 'right', width: '130px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr key={student.id}>
                        <td style={{ color: 'var(--slate-400)', fontWeight: 600 }}>
                          {index + 1}
                        </td>
                        <td>
                          <span className="student-id-badge">
                            {student.studentId}
                          </span>
                        </td>
                        <td>
                          <div className="student-info-cell">
                            <div className="student-avatar" aria-hidden="true">
                              {getInitials(student.fullName)}
                            </div>
                            <span className="student-name-text">
                              {student.fullName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.88rem', color: 'var(--slate-600)' }}>
                            {currentClass.name} ({currentClass.section})
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-icon-only btn-secondary"
                              onClick={() => onEditStudent(student)}
                              title="Edit student"
                              aria-label={`Edit ${student.fullName}`}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-icon-only btn-secondary"
                              onClick={() => onDeleteStudent(student)}
                              title="Remove student from roster"
                              aria-label={`Delete ${student.fullName}`}
                              style={{ color: 'var(--danger-600)' }}
                            >
                              <Trash2 size={15} />
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
      )}
    </div>
  );
}
