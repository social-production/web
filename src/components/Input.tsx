import React from 'react';
import { InputProps } from '../types';

const LIGHT_GREEN = '#52b788';

export default function Input({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  required = false,
  disabled = false,
  error,
  hint,
}: InputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.style.borderColor = LIGHT_GREEN;
    }
  };

  const handleBlur = () => {
    if (inputRef.current) {
      inputRef.current.style.borderColor = error ? '#dc2626' : '#e5e7eb';
    }
  };

  return (
    <div style={{ marginBottom: '14px' }}>
      {label && (
        <label
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#374151',
            display: 'block',
            marginBottom: '6px',
          }}
        >
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
        </label>
      )}
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          width: '100%',
          border: `1px solid ${error ? '#dc2626' : '#e5e7eb'}`,
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          color: '#374151',
          outline: 'none',
          backgroundColor: disabled ? '#f9fafb' : '#fff',
          cursor: disabled ? 'not-allowed' : 'text',
          transition: 'border-color 0.15s ease',
          boxSizing: 'border-box',
        }}
      />
      {error && (
        <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>{error}</p>
      )}
      {hint && !error && (
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{hint}</p>
      )}
    </div>
  );
}