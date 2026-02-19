import React from 'react';
import { ButtonProps } from '../types';

const DARK_GREEN = '#1a3d2b';
const PRIMARY_GREEN = '#2d6a4f';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  style = {},
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    borderRadius: '8px',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.6 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '5px 12px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '13px' },
    lg: { padding: '10px 20px', fontSize: '14px' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: PRIMARY_GREEN,
      color: '#fff',
    },
    secondary: {
      background: '#f0faf3',
      color: PRIMARY_GREEN,
      border: `1px solid #bbdec8`,
    },
    ghost: {
      background: 'transparent',
      color: '#6b7280',
    },
    danger: {
      background: '#dc2626',
      color: '#fff',
    },
  };

  const mergedStyles: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const target = e.currentTarget;
    switch (variant) {
      case 'primary':
        target.style.background = DARK_GREEN;
        break;
      case 'secondary':
        target.style.background = '#ddf0e5';
        break;
      case 'ghost':
        target.style.background = '#f3f4f6';
        target.style.color = '#374151';
        break;
      case 'danger':
        target.style.background = '#b91c1c';
        break;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const target = e.currentTarget;
    switch (variant) {
      case 'primary':
        target.style.background = PRIMARY_GREEN;
        break;
      case 'secondary':
        target.style.background = '#f0faf3';
        break;
      case 'ghost':
        target.style.background = 'transparent';
        target.style.color = '#6b7280';
        break;
      case 'danger':
        target.style.background = '#dc2626';
        break;
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={mergedStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
}