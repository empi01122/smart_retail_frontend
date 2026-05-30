import React from 'react';

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, secondary, danger, outline
  size = 'md', // sm, md, lg
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  id,
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    borderRadius: '10px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    border: '1px solid transparent',
    gap: '8px',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || loading ? 0.6 : 1,
  };

  const sizes = {
    sm: { padding: '8px 14px', fontSize: '0.85rem' },
    md: { padding: '11px 20px', fontSize: '0.92rem' },
    lg: { padding: '14px 26px', fontSize: '1rem', borderRadius: '12px' },
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--primary-color)',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(var(--primary-color-rgb), 0.25)',
      ':hover': {
        backgroundColor: 'rgba(var(--primary-color-rgb), 0.85)',
        boxShadow: '0 6px 16px rgba(var(--primary-color-rgb), 0.35)',
        transform: 'translateY(-1px)',
      },
    },
    secondary: {
      backgroundColor: 'var(--glass-card-bg, rgba(255, 255, 255, 0.05))',
      border: '1px solid var(--glass-card-border, rgba(255, 255, 255, 0.08))',
      color: 'var(--text-primary, #ffffff)',
      ':hover': {
        backgroundColor: 'var(--input-bg, rgba(255, 255, 255, 0.1))',
        transform: 'translateY(-1px)',
      },
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
      ':hover': {
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        boxShadow: '0 6px 16px rgba(239, 68, 68, 0.35)',
        transform: 'translateY(-1px)',
      },
    },
    outline: {
      backgroundColor: 'transparent',
      border: '1px solid var(--primary-color)',
      color: 'var(--primary-color)',
      ':hover': {
        backgroundColor: 'rgba(var(--primary-color-rgb), 0.05)',
        transform: 'translateY(-1px)',
      },
    },
  };

  // State-based styles
  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.md;

  const [hovered, setHovered] = React.useState(false);

  const mergedStyles = {
    ...baseStyles,
    ...currentSize,
    ...currentVariant,
    ...(hovered && !disabled && !loading ? currentVariant[':hover'] : {}),
  };

  return (
    <button
      id={id}
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      style={mergedStyles}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {loading ? (
        <div style={{
          width: '18px',
          height: '18px',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: 'currentColor',
          borderRadius: '50%',
          animation: 'buttonSpin 0.8s linear infinite'
        }} />
      ) : (
        icon && <span style={{ display: 'inline-flex' }}>{icon}</span>
      )}
      <span>{children}</span>
      
      {/* Local styles for loading spin */}
      <style>{`
        @keyframes buttonSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default Button;