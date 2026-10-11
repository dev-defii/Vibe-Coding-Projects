import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Delete',
  confirmVariant = 'danger', // 'danger' | 'primary'
  requireTypedText = '', // Optional: text the user must type (e.g. 'RESET') to enable confirmation
  onConfirm,
  onCancel,
}) {
  const [typedValue, setTypedValue] = useState('');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isConfirmDisabled = requireTypedText
    ? typedValue.trim() !== requireTypedText
    : false;

  return (
    <div className="modal-backdrop" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: confirmVariant === 'danger' ? 'var(--danger-600)' : 'var(--blue-600)' }}>
              {confirmVariant === 'danger' ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
            </span>
            <h2 id="confirm-modal-title" className="modal-title" style={{ fontSize: '1.15rem' }}>
              {title}
            </h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onCancel} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="confirm-dialog-content">
            <div className={`confirm-icon-box ${confirmVariant === 'danger' ? 'confirm-icon-danger' : ''}`}>
              <AlertTriangle size={26} />
            </div>
            <div className="confirm-text-group" style={{ flex: 1 }}>
              <p className="confirm-description">{message}</p>

              {requireTypedText && (
                <div style={{ marginTop: '16px' }}>
                  <label 
                    htmlFor="confirm-typed-input" 
                    style={{ 
                      display: 'block', 
                      fontSize: '0.88rem', 
                      fontWeight: 600, 
                      color: 'var(--slate-800)', 
                      marginBottom: '8px' 
                    }}
                  >
                    To confirm this action, please type{' '}
                    <strong style={{ color: 'var(--danger-600)', letterSpacing: '0.5px' }}>
                      {requireTypedText}
                    </strong>{' '}
                    below:
                  </label>
                  <input
                    id="confirm-typed-input"
                    type="text"
                    className="form-input"
                    placeholder={`Type ${requireTypedText} to confirm`}
                    value={typedValue}
                    onChange={(e) => setTypedValue(e.target.value)}
                    autoFocus
                    style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontWeight: 600,
                      borderColor: typedValue && typedValue.trim() !== requireTypedText ? 'var(--danger-border)' : undefined
                    }}
                  />
                  {typedValue && typedValue.trim() !== requireTypedText && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--danger-600)', marginTop: '4px' }}>
                      Text must match "{requireTypedText}" exactly.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            autoFocus={!requireTypedText}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
