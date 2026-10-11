import React from 'react';

export default function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  variant = 'blue',
  onClick,
}) {
  const iconClass =
    variant === 'navy'
      ? 'stat-icon-navy'
      : variant === 'green'
      ? 'stat-icon-green'
      : 'stat-icon-blue';

  return (
    <div
      className="stat-card"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={`stat-icon-wrapper ${iconClass}`}>
        <Icon size={28} />
      </div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {helper && <span className="stat-helper">{helper}</span>}
      </div>
    </div>
  );
}
