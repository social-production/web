import { useState } from "react";

export default function MeetupForm({ onSave, onCancel, initialData = null }) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [date, setDate] = useState(initialData?.date || "");
  const [time, setTime] = useState(initialData?.time || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = "Title is required";
    if (!date.trim()) e.date = "Date is required";
    if (!time.trim()) e.time = "Time is required";
    if (!location.trim()) e.location = "Location is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave({ title, date, time, location, going: initialData?.going || 0 });
    }
  };

  return (
    <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "14px" }}>
        {initialData ? "Edit Meetup" : "Schedule New Meetup"}
      </div>

      {/* Title */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
          Title <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Planning Session"
          style={{
            width: "100%",
            border: `1px solid ${errors.title ? "#fca5a5" : "#e5e7eb"}`,
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "13px",
            fontFamily: "Inter,sans-serif",
            color: "#374151",
            outline: "none",
            background: errors.title ? "#fff5f5" : "#fff"
          }}
          onFocus={e => e.target.style.borderColor = "#52b788"}
          onBlur={e => e.target.style.borderColor = errors.title ? "#fca5a5" : "#e5e7eb"}
        />
        {errors.title && <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "2px", display: "block" }}>{errors.title}</span>}
      </div>

      {/* Date & Time */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
            Date <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              width: "100%",
              border: `1px solid ${errors.date ? "#fca5a5" : "#e5e7eb"}`,
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "13px",
              fontFamily: "Inter,sans-serif",
              color: "#374151",
              outline: "none",
              background: errors.date ? "#fff5f5" : "#fff"
            }}
            onFocus={e => e.target.style.borderColor = "#52b788"}
            onBlur={e => e.target.style.borderColor = errors.date ? "#fca5a5" : "#e5e7eb"}
          />
          {errors.date && <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "2px", display: "block" }}>{errors.date}</span>}
        </div>

        <div>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
            Time <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            style={{
              width: "100%",
              border: `1px solid ${errors.time ? "#fca5a5" : "#e5e7eb"}`,
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "13px",
              fontFamily: "Inter,sans-serif",
              color: "#374151",
              outline: "none",
              background: errors.time ? "#fff5f5" : "#fff"
            }}
            onFocus={e => e.target.style.borderColor = "#52b788"}
            onBlur={e => e.target.style.borderColor = errors.time ? "#fca5a5" : "#e5e7eb"}
          />
          {errors.time && <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "2px", display: "block" }}>{errors.time}</span>}
        </div>
      </div>

      {/* Location */}
      <div style={{ marginBottom: "14px" }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
          Location <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Brooklyn Public Library, Room 2 (or 'Online')"
          style={{
            width: "100%",
            border: `1px solid ${errors.location ? "#fca5a5" : "#e5e7eb"}`,
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "13px",
            fontFamily: "Inter,sans-serif",
            color: "#374151",
            outline: "none",
            background: errors.location ? "#fff5f5" : "#fff"
          }}
          onFocus={e => e.target.style.borderColor = "#52b788"}
          onBlur={e => e.target.style.borderColor = errors.location ? "#fca5a5" : "#e5e7eb"}
        />
        {errors.location && <span style={{ fontSize: "11px", color: "#ef4444", marginTop: "2px", display: "block" }}>{errors.location}</span>}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          style={{
            background: "none",
            border: "1px solid #e5e7eb",
            color: "#6b7280",
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "Inter,sans-serif"
          }}>
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            background: "#2d6a4f",
            border: "none",
            color: "#fff",
            padding: "6px 16px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "Inter,sans-serif"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#1a3d2b"}
          onMouseLeave={e => e.currentTarget.style.background = "#2d6a4f"}>
          {initialData ? "Save Changes" : "Add Meetup"}
        </button>
      </div>
    </div>
  );
}
