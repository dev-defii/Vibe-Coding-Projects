import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  ChevronDown
} from 'lucide-react';
import { parseMeetAttendanceFile, extractParticipantsFromRows } from '../../services/spreadsheetService.js';

export default function ImportMeetModal({
  isOpen,
  onClose,
  session,
  onProcessImport,
}) {
  const [fileData, setFileData] = useState(null);
  const [selectedNameCol, setSelectedNameCol] = useState(null);
  const [selectedEmailCol, setSelectedEmailCol] = useState(-1);
  const [selectedDurationCol, setSelectedDurationCol] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setFileData(null);
      setSelectedNameCol(null);
      setSelectedEmailCol(-1);
      setSelectedDurationCol(-1);
      setErrorMessage('');
      setIsProcessing(false);
    }
  }, [isOpen]);

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

  const handleFile = async (file) => {
    if (!file) return;
    setErrorMessage('');
    setIsProcessing(true);

    try {
      const parsed = await parseMeetAttendanceFile(file);
      setFileData(parsed);
      setSelectedNameCol(parsed.detectedNameColIndex >= 0 ? parsed.detectedNameColIndex : 0);
      setSelectedEmailCol(parsed.detectedEmailColIndex >= 0 ? parsed.detectedEmailColIndex : -1);
      setSelectedDurationCol(parsed.detectedDurationColIndex >= 0 ? parsed.detectedDurationColIndex : -1);
    } catch (err) {
      setErrorMessage(err.message || 'Error parsing the uploaded spreadsheet.');
      setFileData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  // Preview extracted participants
  const extractedParticipants = fileData && selectedNameCol !== null
    ? extractParticipantsFromRows(fileData.dataRows, selectedNameCol, selectedEmailCol, selectedDurationCol)
    : [];

  const handleConfirmImport = (e) => {
    e.preventDefault();
    if (!fileData || extractedParticipants.length === 0) return;

    onProcessImport({
      participants: extractedParticipants,
      importMetadata: {
        filename: fileData.filename,
        importedAt: new Date().toISOString(),
        totalRows: fileData.totalRows,
        nameColumnUsed: fileData.columns.find(c => c.index === selectedNameCol)?.label || `Column ${selectedNameCol + 1}`,
      },
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="import-meet-modal-title">
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--blue-600)' }}>
              <FileSpreadsheet size={24} />
            </span>
            <div>
              <h2 id="import-meet-modal-title" className="modal-title">
                Import Google Meet Attendance File
              </h2>
              {session && (
                <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                  Session: <strong>{session.title || session.subject}</strong> &bull; {session.date}
                </div>
              )}
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleConfirmImport}>
          <div className="modal-body">
            <div className="info-box">
              <Info size={20} className="info-box-icon" />
              <div>
                <strong>Supported formats:</strong> Upload an <code>.xlsx</code>, <code>.xls</code>, or <code>.csv</code> attendance export from Google Meet or meeting tracking extensions.
                ClassCheck will detect the participant name column, match attendees against your class roster, and flag any unmatched or repeated attendees for review.
              </div>
            </div>

            {/* File Dropzone */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".xlsx, .xls, .csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            {!fileData ? (
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
                <div style={{ color: 'var(--blue-600)', background: 'var(--blue-50)', padding: '14px', borderRadius: '50%' }}>
                  <Upload size={32} />
                </div>
                <div>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--slate-900)' }}>
                    {isProcessing ? 'Analyzing spreadsheet...' : 'Choose a Google Meet attendance file'}
                  </strong>
                  <div style={{ fontSize: '0.88rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                    Click to browse or drag and drop your .xlsx / .csv file here
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* File Selected Badge */}
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'var(--slate-50)',
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '18px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileSpreadsheet size={22} color="var(--success-600)" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--slate-900)' }}>
                        {fileData.filename}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                        {fileData.dataRows.length} data rows found &bull; Header located at Row {fileData.headerRowIndex + 1}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setFileData(null);
                      setErrorMessage('');
                    }}
                  >
                    Change File
                  </button>
                </div>

                {/* Column Mapping Section */}
                <div 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                    gap: '16px', 
                    marginBottom: '20px',
                    backgroundColor: 'var(--slate-50)',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--slate-200)'
                  }}
                >
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="participant-name-col-select" className="form-label" style={{ fontSize: '0.88rem' }}>
                      Participant Name Column <span className="required">*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        id="participant-name-col-select"
                        className="form-select"
                        value={selectedNameCol !== null ? selectedNameCol : ''}
                        onChange={(e) => setSelectedNameCol(parseInt(e.target.value, 10))}
                      >
                        {fileData.columns.map((col) => (
                          <option key={col.index} value={col.index}>
                            {col.label} (Col {col.index + 1})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-helper">Matches attendees to your class roster.</div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="duration-col-select" className="form-label" style={{ fontSize: '0.88rem' }}>
                      Duration / Time Column <span style={{ color: 'var(--slate-400)', fontWeight: 'normal' }}>(Optional)</span>
                    </label>
                    <select
                      id="duration-col-select"
                      className="form-select"
                      value={selectedDurationCol}
                      onChange={(e) => setSelectedDurationCol(parseInt(e.target.value, 10))}
                    >
                      <option value={-1}>-- None --</option>
                      {fileData.columns.map((col) => (
                        <option key={col.index} value={col.index}>
                          {col.label} (Col {col.index + 1})
                        </option>
                      ))}
                    </select>
                    <div className="form-helper">Included in attendance notes if available.</div>
                  </div>
                </div>

                {/* Data Preview Summary */}
                <div className="preview-summary" style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} color="var(--success-600)" />
                    <span>
                      Detected <strong>{extractedParticipants.length}</strong> participant {extractedParticipants.length === 1 ? 'entry' : 'entries'} in file:
                    </span>
                  </div>
                </div>

                {/* Preview Table of Raw Extracted Attendees */}
                <div className="bulk-preview-container">
                  <table className="table" style={{ fontSize: '0.88rem' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Attendee Name from File</th>
                        <th>Duration / Time</th>
                        <th>File Row</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extractedParticipants.slice(0, 8).map((p, idx) => (
                        <tr key={p.id}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                            {p.name}
                          </td>
                          <td style={{ color: 'var(--slate-600)' }}>
                            {p.duration || '—'}
                          </td>
                          <td style={{ color: 'var(--slate-400)' }}>
                            Row {p.rowNumber}
                          </td>
                        </tr>
                      ))}
                      {extractedParticipants.length > 8 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: 'var(--slate-500)', fontStyle: 'italic', padding: '10px' }}>
                            ... and {extractedParticipants.length - 8} more attendees in file
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {errorMessage && (
              <div 
                className="info-box" 
                style={{ 
                  backgroundColor: 'var(--danger-50)', 
                  borderColor: 'var(--danger-border)', 
                  color: 'var(--danger-700)',
                  marginTop: '16px'
                }}
              >
                <AlertCircle size={20} className="info-box-icon" style={{ color: 'var(--danger-600)' }} />
                <div>{errorMessage}</div>
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
              disabled={!fileData || extractedParticipants.length === 0}
            >
              <CheckCircle2 size={18} />
              <span>
                {extractedParticipants.length > 0
                  ? `Process ${extractedParticipants.length} Participants & Match`
                  : 'Import Attendance'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
