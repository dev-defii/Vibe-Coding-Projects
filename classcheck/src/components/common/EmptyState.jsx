import React from 'react';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionButton,
  secondaryAction,
}) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={32} />
        </div>
      )}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {actionButton}
        {secondaryAction}
      </div>
    </div>
  );
}
