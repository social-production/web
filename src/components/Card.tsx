import React from 'react';
import { CardProps } from '../types';

const CARD_STYLES = {
  default: {
    bg: '#fff',
    border: '#e5e7eb',
    hoverBorder: '#9ca3af',
  },
  project: {
    bg: '#f0faf3',
    border: '#c8e6d0',
    hoverBorder: '#52b788',
  },
  thread: {
    bg: '#fff',
    border: '#e5e7eb',
    hoverBorder: '#9ca3af',
  },
};

export default function Card({
  children,
  variant = 'default',
  onClick,
  style = {},
}: CardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const styles = CARD_STYLES[variant];

  const handleMouseEnter = () => {
    if (cardRef.current && onClick) {
      cardRef.current.style.borderColor = styles.hoverBorder;
      cardRef.current.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.borderColor = styles.border;
      cardRef.current.style.boxShadow = 'none';
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: '12px',
        padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}