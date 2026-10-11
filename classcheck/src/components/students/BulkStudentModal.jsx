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

  // Existing student IDs set for quick duplicate checking
  const existingIdSet = useMemo(() => {
    return new Set(
      existingStudents
        .filter((s) => s.classId === currentClass?.id)
        .map((s) => s.studentId.trim().toLowerCase())
    );
  }, [existingStudents, currentClass]);

  // Determine starting sequence number for auto-generated IDs
  const startingSeq = useMemo(() => {
    const classCount = existingStudents.filter((s) => s.classId === currentClass?.id).length;
    return classCount + 1;
  }, [existingStudents, currentClass]);

  // Derive parsed students for the 'paste' tab directly during render
  const textParsedStudents = useMemo(() => {
    if (!rawText.trim()) return [];
    const parsed = parseBulkText(rawText, startingSeq);
    return parsed.map((item, idx) => {
      let finalId = item.studentId;
      if (finalId.startsWith('STU-') && idPrefix) {
        finalId = `${idPrefix}${String(startingSeq + idx).padStart(3, '0')}`;
      }
      return {
        ...item,
        studentId: finalId,
        isDuplicate: existingIdSet.has(finalId.toLowerCase()),
      };
    });
  }, [rawText, idPrefix, startingSeq, existingIdSet]);

  // Active student list based on current tab
  const activeStudentList = useMemo(() => {
    if (activeTab === 'paste') return textParsedStudents;
    return fileParsedStudents.map((item) => ({
      ...item,
      isDuplicate: existingIdSet.has(item.studentId.toLowerCase()),
    }));
  }, [activeTab, textParsedStudents, fileParsedStudents, existingIdSet]);

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
          fullName: item.fullName.trim(),
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
    if (activeStudentList.length === 0) return;

    // Filter out invalid items (must have name)
    const validStudents = activeStudentList
      .filter((item) => item.fullName.trim().length > 0)
      .map((item) => ({
        id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        classId: currentClass.id,
        studentId: item.studentId.trim(),
        fullName: item.fullName.trim(),
        createdAt: new Date().toISOString(),
      }));

    if (validStudents.length === 0) return;

    onSaveBulk(validStudents);
    onClose();
  };

  const duplicateCount = activeStudentList.filter((item) => item.isDuplicate).length;

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
                      <li><strong>Names only:</strong> Type or paste one name per line (e.g. <code>Maria Santos</code>). IDs will be generated automatically.</li>
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

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label htmlFor="bulk-textarea" className="form-label">
                    Paste Student Roster (One entry per line):
                  </label>
                  <textarea
                    id="bulk-textarea"
                    className="form-textarea"
                    rows={7}
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
                    Columns labeled <em>Student ID</em> and <em>Full Name</em> (or column 1 and 2) will be parsed automatically.
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
                  <div className="form-error" style={{ marginTop: '12px', fontSize: '0.9rem' }}>
                    <AlertCircle size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
                    {fileError}
                  </div>
                )}
              </div>
            )}

            {/* Parsed Preview Table */}
            {activeStudentList.length > 0 && (
              <div>
                <div className="preview-summary">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} color="var(--success-600)" />
                    <span>
                      Detected <strong>{activeStudentList.length}</strong> student {activeStudentList.length === 1 ? 'entry' : 'entries'} ready to enroll:
                    </span>
                  </div>
                  {duplicateCount > 0 && (
                    <span style={{ color: 'var(--warning-700)', fontSize: '0.85rem', fontWeight: 600 }}>
                      ⚠️ {duplicateCount} ID(s) already exist in roster
                    </span>
                  )}
                </div>

                <div className="bulk-preview-container">
                  <table className="table" style={{ fontSize: '0.88rem' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th style={{ width: '140px' }}>Student ID</th>
                        <th>Full Name</th>
                        <th style={{ width: '90px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStudentList.map((item, idx) => (
                        <tr key={idx} style={{ backgroundColor: item.isDuplicate ? 'var(--warning-50)' : 'transparent' }}>
                          <td>{idx + 1}</td>
                          <td>
                            <span className="student-id-badge">{item.studentId}</span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{item.fullName}</td>
                          <td>
                            {item.isDuplicate ? (
                              <span className="badge" style={{ backgroundColor: '#fed7aa', color: '#9a3412', fontSize: '0.72rem' }}>
                                Duplicate
                              </span>
                            ) : (
                              <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
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
              disabled={activeStudentList.length === 0}
            >
              <CheckCircle2 size={18} />
              <span>
                {activeStudentList.length === 0
                  ? 'Add Students'
                  : `Add ${activeStudentList.length} ${activeStudentList.length === 1 ? 'Student' : 'Students'} to Roster`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
