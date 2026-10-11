import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  ClipboardPaste, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Info
} from 'lucide-react';
import { parseBulkText, parseSpreadsheetFile } from '../../services/spreadsheetService.js';
import { normalizeStudentName } from '../../services/storageService.js';

export default function BulkStudentModal({
  isOpen,
  onClose,
  onSaveBulk,
  currentClass,
  existingStudents = [],
}) {
  const [activeTab, setActiveTab] = useState('paste'); // 'paste' | 'file'
  const [rawText, setRawText] = useState('');
  const [idPrefix, setIdPrefix] = useState('2024-');
  const [fileParsedStudents, setFileParsedStudents] = useState([]);
  const [fileError, setFileError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Existing students in this class
  const existingClassStudents = useMemo(() => {
    return existingStudents.filter((s) => s.classId === currentClass?.id);
  }, [existingStudents, currentClass]);

  // Map of normalized existing IDs to student full name
  const existingIdMap = useMemo(() => {
    const map = new Map();
    existingClassStudents.forEach((s) => {
      map.set(s.studentId.trim().toLowerCase(), s.fullName);
    });
    return map;
  }, [existingClassStudents]);

  // Map of normalized existing Names to student object
  const existingNameMap = useMemo(() => {
    const map = new Map();
    existingClassStudents.forEach((s) => {
      map.set(normalizeStudentName(s.fullName), s);
    });
    return map;
  }, [existingClassStudents]);

  // Determine starting sequence number for auto-generated IDs
  const startingSeq = useMemo(() => {
    return existingClassStudents.length + 1;
  }, [existingClassStudents]);

  // Raw parsed items for paste tab
  const rawTextParsed = useMemo(() => {
    if (!rawText.trim()) return [];
    const parsed = parseBulkText(rawText, startingSeq);
    return parsed.map((item, idx) => {
      let finalId = item.studentId;
      if (finalId.startsWith('STU-') && idPrefix) {
        finalId = `${idPrefix}${String(startingSeq + idx).padStart(3, '0')}`;
      }
      return {
        studentId: finalId,
        fullName: item.fullName,
      };
    });
  }, [rawText, idPrefix, startingSeq]);

  // Choose source list based on active tab
  const rawList = activeTab === 'paste' ? rawTextParsed : fileParsedStudents;

  // Validate entire list for duplicate IDs and duplicate Names (both against existing roster and within the batch)
  const validatedStudentList = useMemo(() => {
    if (!rawList || rawList.length === 0) return [];

    // Frequency counts across the new batch
    const batchIdCounts = new Map();
    const batchNameCounts = new Map();

    rawList.forEach((item) => {
      const normId = item.studentId ? item.studentId.trim().toLowerCase() : '';
      const normName = normalizeStudentName(item.fullName);
      if (normId) {
        batchIdCounts.set(normId, (batchIdCounts.get(normId) || 0) + 1);
      }
      if (normName) {
        batchNameCounts.set(normName, (batchNameCounts.get(normName) || 0) + 1);
      }
    });

    return rawList.map((item, index) => {
      const trimmedName = item.fullName ? item.fullName.trim() : '';
      const trimmedId = item.studentId ? item.studentId.trim() : '';
      const normId = trimmedId.toLowerCase();
      const normName = normalizeStudentName(trimmedName);

      const errors = [];

      if (!trimmedName) {
        errors.push('Student name is required');
      }

      if (!trimmedId) {
        errors.push('Student ID is required');
      }

      // Check ID duplicates
      if (normId) {
        if (existingIdMap.has(normId)) {
          errors.push(`ID "${trimmedId}" is already assigned to ${existingIdMap.get(normId)} in this class`);
        } else if (batchIdCounts.get(normId) > 1) {
          errors.push(`ID "${trimmedId}" is repeated ${batchIdCounts.get(normId)} times in this import`);
        }
      }

      // Check Name duplicates
      if (normName) {
        if (existingNameMap.has(normName)) {
          errors.push(`"${trimmedName}" is already enrolled in this class (ID: ${existingNameMap.get(normName).studentId})`);
        } else if (batchNameCounts.get(normName) > 1) {
          errors.push(`"${trimmedName}" appears ${batchNameCounts.get(normName)} times in this import`);
        }
      }

      return {
        ...item,
        index,
        studentId: trimmedId,
        fullName: trimmedName,
        isValid: errors.length === 0,
        errors,
      };
    });
  }, [rawList, existingIdMap, existingNameMap]);

  // Total rows with duplicate/validation errors
  const invalidRowsCount = useMemo(() => {
    return validatedStudentList.filter((item) => !item.isValid).length;
  }, [validatedStudentList]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileUpload = async (file) => {
    if (!file) return;
    setFileError('');

    try {
      const parsed = await parseSpreadsheetFile(file);
      if (parsed.length === 0) {
        setFileError('No student records found in the uploaded spreadsheet. Please check the file format.');
        return;
      }

      // Format items with IDs
      const mapped = parsed.map((item, idx) => {
        let finalId = item.studentId?.trim();
        if (!finalId) {
          finalId = `${idPrefix || 'STU-'}${String(startingSeq + idx).padStart(3, '0')}`;
        }
        return {
          studentId: finalId,
          fullName: item.fullName ? item.fullName.trim() : '',
        };
      });

      setFileParsedStudents(mapped);
    } catch (err) {
      setFileError(err.message || 'Error parsing spreadsheet file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validatedStudentList.length === 0 || invalidRowsCount > 0) return;

    // Map valid items for saving
    const validStudents = validatedStudentList.map((item) => ({
      id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      classId: currentClass.id,
      studentId: item.studentId,
      fullName: item.fullName,
      createdAt: new Date().toISOString(),
    }));

    onSaveBulk(validStudents);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="bulk-modal-title">
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--blue-600)' }}>
              <FileSpreadsheet size={24} />
            </span>
            <div>
              <h2 id="bulk-modal-title" className="modal-title">
                Bulk Add Students
              </h2>
              {currentClass && (
                <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                  Target Class: <strong>{currentClass.name}</strong> &bull; Section: <strong>{currentClass.section}</strong>
                </div>
              )}
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Mode Tabs */}
            <div className="modal-tabs">
              <button
                type="button"
                className={`modal-tab ${activeTab === 'paste' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('paste');
                  setFileError('');
                }}
              >
                <ClipboardPaste size={18} />
                <span>Paste Student Names</span>
              </button>
              <button
                type="button"
                className={`modal-tab ${activeTab === 'file' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('file');
                  setFileError('');
                }}
              >
                <Upload size={18} />
                <span>Upload Excel / CSV File</span>
              </button>
            </div>

            {/* Tab 1: Paste Text */}
            {activeTab === 'paste' && (
              <div>
                <div className="info-box">
                  <Info size={20} className="info-box-icon" />
                  <div>
                    <strong>Paste instructions:</strong> Paste multiple student names, one per line.
                    <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                      <li><strong>Names only:</strong> Type or paste one name per line (e.g. <code>Maria Santos</code>). IDs are generated automatically.</li>
                      <li><strong>With ID:</strong> Paste lines like <code>2024-001, Maria Santos</code> or copy two columns directly from an Excel sheet.</li>
                    </ul>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label htmlFor="id-prefix-input" className="form-label" style={{ fontSize: '0.85rem' }}>
                      Auto ID Prefix (for lines without an ID):
                    </label>
                    <input
                      id="id-prefix-input"
                      type="text"
                      className="form-input"
                      style={{ minHeight: '38px', padding: '6px 12px' }}
                      value={idPrefix}
                      onChange={(e) => setIdPrefix(e.target.value)}
                      placeholder="e.g. 2024-"
                    />
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', paddingBottom: '8px' }}>
                    Next auto-ID starts at: <strong>{idPrefix}{String(startingSeq).padStart(3, '0')}</strong>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="bulk-textarea" className="form-label">
                    Paste Student Roster (One entry per line):
                  </label>
                  <textarea
                    id="bulk-textarea"
                    className="form-textarea"
                    rows={6}
                    placeholder={`Example 1 (Names only):\nSantos, Maria Clara\nDela Cruz, Juan\nAquino, Jeremiah Vance\n\nExample 2 (ID and Name):\n2024-00101, Alonzo, Sofia Marie\n2024-00102, Bernardo, Gabriel Luis`}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Upload Excel / CSV */}
            {activeTab === 'file' && (
              <div>
                <div className="info-box">
                  <Info size={20} className="info-box-icon" />
                  <div>
                    <strong>Spreadsheet file support:</strong> Upload an <code>.xlsx</code>, <code>.xls</code>, or <code>.csv</code> file.
                    Columns labeled <em>Student ID</em> and <em>Full Name</em> (or columns 1 and 2) will be parsed automatically.
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div
                  className={`file-dropzone ${dragOver ? 'dragover' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  style={{ marginBottom: '16px' }}
                >
                  <div style={{ color: 'var(--blue-600)', background: 'var(--blue-50)', padding: '12px', borderRadius: '50%' }}>
                    <Upload size={32} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--slate-900)' }}>
                      Click to choose an Excel (.xlsx) or CSV file
                    </strong>
                    <div style={{ fontSize: '0.88rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                      or drag and drop your spreadsheet file here
                    </div>
                  </div>
                </div>

                {fileError && (
                  <div className="form-error" style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
                    <AlertCircle size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
                    {fileError}
                  </div>
                )}
              </div>
            )}

            {/* Parsed Preview Table & Duplicate Diagnostics */}
            {validatedStudentList.length > 0 && (
              <div>
                {/* Warning Banner if Duplicates or Errors Exist */}
                {invalidRowsCount > 0 ? (
                  <div 
                    className="info-box" 
                    style={{ 
                      backgroundColor: 'var(--danger-50)', 
                      borderColor: 'var(--danger-border)', 
                      color: 'var(--danger-700)',
                      marginBottom: '14px'
                    }}
                  >
                    <AlertCircle size={22} className="info-box-icon" style={{ color: 'var(--danger-600)' }} />
                    <div>
                      <strong>Duplicate or validation issues detected ({invalidRowsCount} row{invalidRowsCount === 1 ? '' : 's'}):</strong>
                      <div style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--danger-700)' }}>
                        Students with duplicate names or IDs cannot be enrolled. Please correct the duplicate rows highlighted in red below before importing.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="preview-summary" style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} color="var(--success-600)" />
                      <span>
                        All <strong>{validatedStudentList.length}</strong> student {validatedStudentList.length === 1 ? 'entry is' : 'entries are'} valid and ready to enroll:
                      </span>
                    </div>
                  </div>
                )}

                <div className="bulk-preview-container">
                  <table className="table" style={{ fontSize: '0.88rem' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th style={{ width: '130px' }}>Student ID</th>
                        <th>Full Name</th>
                        <th style={{ width: '140px' }}>Validation Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validatedStudentList.map((item, idx) => (
                        <tr 
                          key={idx} 
                          style={{ 
                            backgroundColor: !item.isValid ? 'var(--danger-50)' : 'transparent' 
                          }}
                        >
                          <td style={{ verticalAlign: 'top', paddingTop: '12px' }}>{idx + 1}</td>
                          <td style={{ verticalAlign: 'top', paddingTop: '12px' }}>
                            <span className="student-id-badge">{item.studentId || '—'}</span>
                          </td>
                          <td style={{ verticalAlign: 'top', paddingTop: '12px' }}>
                            <div style={{ fontWeight: 600, color: !item.isValid ? 'var(--danger-700)' : 'var(--slate-900)' }}>
                              {item.fullName || '—'}
                            </div>
                            {!item.isValid && item.errors.length > 0 && (
                              <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '0.78rem', color: 'var(--danger-600)' }}>
                                {item.errors.map((err, eIdx) => (
                                  <li key={eIdx}>{err}</li>
                                ))}
                              </ul>
                            )}
                          </td>
                          <td style={{ verticalAlign: 'top', paddingTop: '12px' }}>
                            {!item.isValid ? (
                              <span 
                                className="badge" 
                                style={{ 
                                  backgroundColor: '#fee2e2', 
                                  color: 'var(--danger-700)', 
                                  border: '1px solid var(--danger-border)',
                                  fontSize: '0.74rem' 
                                }}
                              >
                                Needs Fix
                              </span>
                            ) : (
                              <span className="badge badge-green" style={{ fontSize: '0.74rem' }}>
                                Valid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={validatedStudentList.length === 0 || invalidRowsCount > 0}
            >
              <CheckCircle2 size={18} />
              <span>
                {invalidRowsCount > 0
                  ? `Fix ${invalidRowsCount} Duplicate Issue${invalidRowsCount === 1 ? '' : 's'} to Proceed`
                  : validatedStudentList.length === 0
                  ? 'Add Students to Roster'
                  : `Add ${validatedStudentList.length} ${validatedStudentList.length === 1 ? 'Student' : 'Students'} to Roster`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
