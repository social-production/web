interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

const PRIMARY_GREEN = '#2d6a4f';

export default function Toggle({
  enabled,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: description ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      {(label || description) && (
        <div>
          {label && (
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#111827',
                marginBottom: description ? '2px' : '0',
              }}
            >
              {label}
            </div>
          )}
          {description && (
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {description}
            </div>
          )}
        </div>
      )}
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '999px',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: enabled ? PRIMARY_GREEN : '#d1d5db',
          position: 'relative',
          transition: 'background 0.2s ease',
          opacity: disabled ? 0.6 : 1,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: '2px',
            left: enabled ? '22px' : '2px',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>
    </div>
  );
}