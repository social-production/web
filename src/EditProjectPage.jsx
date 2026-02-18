import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mockThreads, channels } from "./data";
import FundingForm from "./FundingForm";
import MeetupForm from "./MeetupForm";

export default function EditProjectPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const project = mockThreads.find(t => t.id === parseInt(id));

  if (!project || project.type !== "project") {
    return (
      <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af", fontFamily: "Inter,sans-serif" }}>
        Project not found. <span style={{ color: "#2d6a4f", cursor: "pointer" }} onClick={() => navigate("/")}>Go home</span>
      </div>
    );
  }

  const [title, setTitle] = useState(project.title);
  const [body, setBody] = useState(project.body);
  const [selectedChannels, setSelectedChannels] = useState(project.channels || []);
  const [status, setStatus] = useState(project.status);
  const [meetups, setMeetups] = useState(project.meetups || []);
  const [showMeetupForm, setShowMeetupForm] = useState(false);
  const [fundingData, setFundingData] = useState(project.fund ? {
    enabled: true,
    goal: project.fund.goal,
    purpose: project.fund.purpose || "",
    deadline: project.fund.deadline || ""
  } : { enabled: false });
  const [announceChange, setAnnounceChange] = useState(true);
  const [errors, setErrors] = useState({});

  const toggleChannel = (name) => {
    setSelectedChannels(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : prev.length < 5 ? [...prev, name] : prev
    );
  };

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = "Title is required";
    if (!body.trim()) e.body = "Description is required";
    if (selectedChannels.length === 0) e.channels = "Select at least one channel";
    if (fundingData.enabled && !fundingData.goal) e.funding = "Funding goal is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      // In real implementation, this would save to backend
      alert(`Changes saved! ${announceChange ? "Update posted to project feed." : ""}\n\nWhen backend is connected, this will update the database.`);
      navigate(`/post/${id}`);
    }
  };

  return (
    <div style={{ fontFamily: "Inter,sans-serif", background: "#f6f7f8", minHeight: "100vh", color: "#1c1c1c" }}>
      
      {/* TOP NAV */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", height: "48px", display: "flex", alignItems: "center", padding: "0 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => navigate("/")}>
          <div style={{ width: "28px", height: "28px", background: "linear-gradient(135deg,#2d6a4f,#52b788)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🌱</div>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#1c1c1c", letterSpacing: "-0.3px" }}>Social Production</span>
        </div>
        <button onClick={() => navigate(-1)}
          style={{ marginLeft: "24px", background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "13px", fontWeight: 500, fontFamily: "Inter,sans-serif" }}
          onMouseEnter={e => e.currentTarget.style.color = "#2d6a4f"}
          onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}>
          ← Back
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button onClick={() => navigate("/auth?mode=login")} style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#374151", padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>Log in</button>
          <button onClick={() => navigate("/auth?mode=signup")} style={{ background: "#2d6a4f", border: "none", color: "#fff", padding: "6px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>Sign up</button>
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 16px" }}>
        
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "4px", letterSpacing: "-0.3px" }}>Edit Project</h1>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>Update your project details. Changes can be announced to followers.</p>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", marginBottom: "16px" }}>
          
          {/* Title */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
              Title <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              style={{ width: "100%", border: `1px solid ${errors.title ? "#fca5a5" : "#e5e7eb"}`, borderRadius: "8px", padding: "10px 14px", fontSize: "14px", fontFamily: "Inter,sans-serif", color: "#374151", outline: "none", background: errors.title ? "#fff5f5" : "#fff" }}
              onFocus={e => e.target.style.borderColor = "#52b788"}
              onBlur={e => e.target.style.borderColor = errors.title ? "#fca5a5" : "#e5e7eb"}
            />
            {errors.title && <span style={{ fontSize: "12px", color: "#ef4444" }}>{errors.title}</span>}
          </div>

          {/* Description */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
              Description <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              style={{ width: "100%", minHeight: "160px", border: `1px solid ${errors.body ? "#fca5a5" : "#e5e7eb"}`, borderRadius: "8px", padding: "10px 14px", fontSize: "14px", fontFamily: "Inter,sans-serif", color: "#374151", resize: "vertical", outline: "none", background: errors.body ? "#fff5f5" : "#fff" }}
              onFocus={e => e.target.style.borderColor = "#52b788"}
              onBlur={e => e.target.style.borderColor = errors.body ? "#fca5a5" : "#e5e7eb"}
            />
            {errors.body && <span style={{ fontSize: "12px", color: "#ef4444" }}>{errors.body}</span>}
          </div>

          {/* Status */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>Project Status</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {["Proposed", "Active", "Completed"].map(s => {
                const colors = { Proposed: { bg: "#fef9c3", text: "#854d0e", dot: "#eab308" }, Active: { bg: "#dcfce7", text: "#166534", dot: "#22c55e" }, Completed: { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" } };
                const c = colors[s];
                return (
                  <button key={s} onClick={() => setStatus(s)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "999px", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "12px", fontWeight: 600, border: status === s ? `2px solid ${c.dot}` : "2px solid transparent", background: c.bg, color: c.text }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.dot, display: "inline-block" }} />{s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Channels */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
              Channels <span style={{ color: "#ef4444" }}>*</span> <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: "8px" }}>Select up to 5</span>
            </label>
            {errors.channels && <span style={{ fontSize: "12px", color: "#ef4444", display: "block", marginBottom: "6px" }}>{errors.channels}</span>}
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "6px" }}>System</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
              {channels.filter(c => c.system).map(ch => (
                <button key={ch.name} onClick={() => toggleChannel(ch.name)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "999px", cursor: selectedChannels.length >= 5 && !selectedChannels.includes(ch.name) ? "not-allowed" : "pointer", fontFamily: "Inter,sans-serif", fontSize: "12px", fontWeight: 500, border: selectedChannels.includes(ch.name) ? "2px solid #2d6a4f" : "1px solid #e5e7eb", background: selectedChannels.includes(ch.name) ? "#f0faf3" : "#fff", color: selectedChannels.includes(ch.name) ? "#2d6a4f" : "#6b7280", opacity: selectedChannels.length >= 5 && !selectedChannels.includes(ch.name) ? 0.4 : 1 }}>
                  {ch.icon} {ch.name}{selectedChannels.includes(ch.name) && <span style={{ fontSize: "14px", lineHeight: 1 }}>✓</span>}
                </button>
              ))}
            </div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "6px" }}>Community</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {channels.filter(c => !c.system).map(ch => (
                <button key={ch.name} onClick={() => toggleChannel(ch.name)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "999px", cursor: selectedChannels.length >= 5 && !selectedChannels.includes(ch.name) ? "not-allowed" : "pointer", fontFamily: "Inter,sans-serif", fontSize: "12px", fontWeight: 500, border: selectedChannels.includes(ch.name) ? "2px solid #2d6a4f" : "1px solid #e5e7eb", background: selectedChannels.includes(ch.name) ? "#f0faf3" : "#fff", color: selectedChannels.includes(ch.name) ? "#2d6a4f" : "#6b7280", opacity: selectedChannels.length >= 5 && !selectedChannels.includes(ch.name) ? 0.4 : 1 }}>
                  {ch.icon} {ch.name}{selectedChannels.includes(ch.name) && <span style={{ fontSize: "14px", lineHeight: 1 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Meetups Management */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>Meetups</label>
            
            {meetups.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                {meetups.map((m, i) => (
                  <div key={i} style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "8px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
                          {m.title}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          📆 {m.date} · {m.time}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          📍 {m.location}
                        </div>
                        {m.going > 0 && (
                          <div style={{ fontSize: "11px", color: "#52b788", marginTop: "4px", fontWeight: 500 }}>
                            {m.going} going
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setMeetups(prev => prev.filter((_, idx) => idx !== i))}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "18px",
                          padding: "0 4px",
                          lineHeight: 1
                        }}>
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showMeetupForm ? (
              <MeetupForm
                onSave={(meetup) => {
                  setMeetups(prev => [...prev, meetup]);
                  setShowMeetupForm(false);
                }}
                onCancel={() => setShowMeetupForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowMeetupForm(true)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "1px dashed #bbdec8",
                  color: "#2d6a4f",
                  padding: "8px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "Inter,sans-serif"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#2d6a4f"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#bbdec8"}>
                + Add Meetup
              </button>
            )}
          </div>

          {/* Funding Form */}
          <FundingForm initialData={fundingData} onChange={setFundingData} />
          {errors.funding && <span style={{ fontSize: "12px", color: "#ef4444", display: "block", marginTop: "6px" }}>{errors.funding}</span>}

        </div>

        {/* Announce Change */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", userSelect: "none" }}>
            <input type="checkbox" checked={announceChange} onChange={e => setAnnounceChange(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#2d6a4f" }}
            />
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Post update about these changes</div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>Followers will see a notification that the project was updated</div>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={() => navigate(`/post/${id}`)}
            style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#6b7280", padding: "9px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "Inter,sans-serif" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            Cancel
          </button>
          <button onClick={handleSave}
            style={{ background: "#2d6a4f", border: "none", color: "#fff", padding: "9px 24px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif" }}
            onMouseEnter={e => e.currentTarget.style.background = "#1a3d2b"}
            onMouseLeave={e => e.currentTarget.style.background = "#2d6a4f"}>
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
