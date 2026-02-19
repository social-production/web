import React from 'react';
import { TextareaProps } from '../types';

const LIGHT_GREEN = '#52b788';

export default function Textarea({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  error,
  hint,
  maxLength,
  rows = 4,
}: TextareaProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleFocus = () => {
    if (textareaRef.current) {
      textareaRef.current.style.borderColor = LIGHT_GREEN;
    }
  };

  const handleBlur = () => {
    if (textareaRef.current) {
      textareaRef.current.style.borderColor = error ? '#dc2626' : '#e5e7eb';
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
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        rows={rows}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          width: '100%',
          minHeight: `${rows * 24 + 20}px`,
          border: `1px solid ${error ? '#dc2626' : '#e5e7eb'}`,
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
          color: '#374151',
          outline: 'none',
          backgroundColor: disabled ? '#f9fafb' : '#fff',
          cursor: disabled ? 'not-allowed' : 'text',
          resize: 'vertical',
          transition: 'border-color 0.15s ease',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        {error && (
          <p style={{ fontSize: '12px', color: '#dc2626', margin: 0 }}>{error}</p>
        )}
        {hint && !error && (
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{hint}</p>
        )}
        {maxLength && (
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}