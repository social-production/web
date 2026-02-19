import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SettingsDropdown({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const options = [
    { label: "Profile", icon: "👤", path: "/settings/profile" },
    { label: "Network Settings", icon: "🌐", path: "/settings/network" },
    { label: "Moderator Dashboard", icon: "🛡️", path: "/moderation" },
  ];

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "18px", padding: "4px 6px", borderRadius: "6px" }}
        onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "none"; }}
      >
        ⚙️
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.10)", minWidth: "180px", overflow: "hidden" }}>
          {options.map(opt => (
            <div
              key={opt.path}
              onClick={() => { navigate(opt.path); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", cursor: "pointer", fontSize: "13px", fontWeight: 400, color: "#374151", background: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TopNavProps {
  showBack?: boolean;
  backAction?: () => void;
}

export default function TopNav({ showBack = false, backAction }: TopNavProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backAction) {
      backAction();
    } else {
      navigate(-1);
    }
  };

  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", height: "48px", display: "flex", alignItems: "center", padding: "0 20px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
        onClick={() => navigate("/")}
      >
        <div style={{ width: "28px", height: "28px", background: "linear-gradient(135deg, #2d6a4f, #52b788)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🌱</div>
        <span style={{ fontWeight: 700, fontSize: "15px", color: "#1c1c1c", letterSpacing: "-0.3px" }}>Social Production</span>
      </div>
      
      {showBack && (
        <button
          onClick={handleBack}
          style={{ marginLeft: "24px", background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "13px", fontWeight: 500, fontFamily: "Inter, sans-serif" }}
          onMouseEnter={e => e.currentTarget.style.color = "#2d6a4f"}
          onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}
        >
          ← Back
        </button>
      )}
      
      <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "18px", padding: "4px 6px", borderRadius: "6px" }} onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"} onMouseLeave={e => e.currentTarget.style.background = "none"}>🔔</button>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "18px", padding: "4px 6px", borderRadius: "6px" }} onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"} onMouseLeave={e => e.currentTarget.style.background = "none"}>✉️</button>
        <SettingsDropdown navigate={navigate} />
        <button onClick={() => navigate("/auth?mode=login")} style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#374151", padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }} onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"} onMouseLeave={e => e.currentTarget.style.background = "#f3f4f6"}>Log in</button>
        <button onClick={() => navigate("/auth?mode=signup")} style={{ background: "#2d6a4f", border: "none", color: "#fff", padding: "6px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }} onMouseEnter={e => e.currentTarget.style.background = "#1f4f3a"} onMouseLeave={e => e.currentTarget.style.background = "#2d6a4f"}>Sign up</button>
      </div>
    </div>
  );
}