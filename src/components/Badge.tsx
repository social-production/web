import { BadgeProps } from '../types';

// STATUS styles consistent with data.js
const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  Active: { bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
  Proposed: { bg: '#fef9c3', text: '#854d0e', dot: '#eab308' },
  Completed: { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' },
  'On Hold': { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
};

export default function Badge({ type, status }: BadgeProps) {
  if (type === 'thread') {
    return (
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#6b7280',
          background: '#f3f4f6',
          padding: '2px 8px',
          borderRadius: '999px',
        }}
      >
        THREAD
      </span>
    );
  }

  const s = STATUS_STYLES[status || 'Active'];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11px',
        fontWeight: 600,
        color: s.text,
        background: s.bg,
        padding: '2px 10px',
        borderRadius: '999px',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: s.dot,
          display: 'inline-block',
        }}
      />
      PROJECT · {(status || 'Active').toUpperCase()}
    </span>
  );
}