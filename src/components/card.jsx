import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  actions,
  hoverable = false,
  padding = '24px',
  style = {},
  id,
}) => {
  return (
    <div
      id={id}
      className={`glass-panel ${hoverable ? 'glass-panel-hover' : ''}`}
      style={{
        padding,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {(title || subtitle || actions) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          gap: '16px',
        }}>
          <div>
            {title && <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{subtitle}</p>}
          </div>
          {actions && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{actions}</div>}
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
};

export default Card;