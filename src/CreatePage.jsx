import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { channels } from "./data";
import FundingForm from "./FundingForm";
import MeetupForm from "./MeetupForm";

export default function CreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get("type") === "thread" ? "thread" : "project";

  const [type, setType] = useState(defaultType);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [status, setStatus] = useState("Proposed");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [fundingData, setFundingData] = useState({ enabled: false });
  const [meetups, setMeetups] = useState([]);
  const [showMeetupForm, setShowMeetupForm] = useState(false);
  const [errors, setErrors] = useState({});

  const toggleChannel = (name) => {
    setSelectedChannels(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : prev.length < 5 ? [...prev, name] : prev
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = "Title is required";
    if (!body.trim()) e.body = "Body is required";
    if (selectedChannels.length === 0) e.channels = "Select at least one channel";
    if (type === "project" && fundingData.enabled && !fundingData.goal) e.funding = "Funding goal is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      alert("Post created! (Will save to database once backend is set up)");
      navigate(-1);
    }
  };

  const inputStyle = (hasError) => ({
    width: "100%", border: `1px solid ${hasError ? "#fca5a5" : "#e5e7eb"}`,
    borderRadius: "8px", padding: "10px 14px", fontSize: "14px",
    fontFamily: "Inter,sans-serif", color: "#374151", outline: "none",
    background: hasError ? "#fff5f5" : "#fff", transition: "border-color 0.15s",
  });

  return (
    <div style={{ fontFamily: "Inter,sans-serif", background: "#f6f7f8", minHeight: "100vh", color: "#1c1c1c" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", height: "48px", display: "flex", alignItems: "center", padding: "0 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => navigate("/")}>
          <div style={{ width: "28px", height: "28px", background: "linear-gradient(135deg,#2d6a4f,#52b788)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🌱</div>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#1c1c1c", letterSpacing: "-0.3px" }}>Social Production</span>
        </div>
        <button onClick={() => navigate(-1)} style={{ marginLeft: "24px", background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "13px", fontWeight: 500, fontFamily: "Inter,sans-serif" }}
          onMouseEnter={e => e.currentTarget.style.color = "#2d6a4f"} onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}>← Back</button>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button onClick={() => navigate("/auth?mode=login")} style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#374151", padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>Log in</button>
          <button onClick={() => navigate("/auth?mode=signup")} style={{ background: "#2d6a4f", border: "none", color: "#fff", padding: "6px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>Sign up</button>
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 16px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "4px", letterSpacing: "-0.3px" }}>Create a post</h1>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>Share an idea, start a discussion, or propose a project.</p>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "4px", display: "flex", marginBottom: "20px", gap: "4px" }}>
          {["thread", "project"].map(t => (
            <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: "9px", borderRadius: "9px", border: "none", cursor: "pointer", fontFamily: "Inter,sans-serif", fontSize: "13px", fontWeight: 600, background: type === t ? "#2d6a4f" : "transparent", color: type === t ? "#fff" : "#6b7280", transition: "all 0.15s" }}>
              {t === "thread" ? "💬 Thread" : "🟢 Project"}
            </button>
          ))}
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", marginBottom: "16px" }}>
          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Title <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={type === "thread" ? "What do you want to discuss?" : "What is your project?"} maxLength={200} style={inputStyle(errors.title)}
              onFocus={e => e.target.style.borderColor = "#52b788"} onBlur={e => e.target.style.borderColor = errors.title ? "#fca5a5" : "#e5e7eb"} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              {errors.title && <span style={{ fontSize: "12px", color: "#ef4444" }}>{errors.title}</span>}
              <span style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "auto" }}>{title.length}/200</span>
            </div>
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>{type === "thread" ? "Body" : "Description & Goals"} <span style={{ color: "#ef4444" }}>*</span></label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder={type === "thread" ? "Share your thoughts, questions, or ideas…" : "Describe the project, what you need, and how people can get involved…"}
              style={{ ...inputStyle(errors.body), minHeight: "160px", resize: "vertical" }}
              onFocus={e => e.target.style.borderColor = "#52b788"} onBlur={e => e.target.style.borderColor = errors.body ? "#fca5a5" : "#e5e7eb"} />
            {errors.body && <span style={{ fontSize: "12px", color: "#ef4444" }}>{errors.body}</span>}
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Image (optional)</label>
            {!imagePreview ? (
              <label style={{ display: "block", width: "100%", border: "2px dashed #d1d5db", borderRadius: "8px", padding: "24px", textAlign: "center", cursor: "pointer", background: "#f9fafb", transition: "border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#52b788"} onMouseLeave={e => e.currentTarget.style.borderColor = "#d1d5db"}>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div>
                <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px", fontWeight: 500 }}>Click to upload an image</div>
                <div style={{ fontSize: "12px", color: "#9ca3af" }}>PNG, JPG, GIF up to 10MB</div>
              </label>
            ) : (
              <div style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "auto", maxHeight: "300px", objectFit: "cover", display: "block" }} />
                <button onClick={removeImage} style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>Remove</button>
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Channels <span style={{ color: "#ef4444" }}>*</span> <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: "8px" }}>Select up to 5</span></label>
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
            {errors.channels && <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "8px" }}>{errors.channels}</div>}
            {selectedChannels.length > 0 && <div style={{ fontSize: "12px", color: "#52b788", marginTop: "8px", fontWeight: 500 }}>{selectedChannels.length}/5 selected: {selectedChannels.join(", ")}</div>}
          </div>
        </div>

        {/* Meetups - Only for Projects */}
        {type === "project" && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px 24px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "12px" }}>
                📅 Schedule Meetups (Optional)
              </div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
                Add in-person or online gatherings for your project
              </div>

              {meetups.length > 0 && (
                <div style={{ marginBottom: "14px" }}>
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
                    padding: "10px",
                    borderRadius: "8px",
                    fontSize: "13px",
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
          </div>
        )}

        {/* Funding Form - Only for Projects */}
        {type === "project" && (
          <div style={{ marginBottom: "16px" }}>
            <FundingForm initialData={fundingData} onChange={setFundingData} />
            {errors.funding && <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "8px" }}>{errors.funding}</div>}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={() => navigate(-1)} style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#6b7280", padding: "9px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "Inter,sans-serif" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>Cancel</button>
          <button onClick={handleSubmit} style={{ background: "#2d6a4f", border: "none", color: "#fff", padding: "9px 24px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif" }}
            onMouseEnter={e => e.currentTarget.style.background = "#1f4f3a"} onMouseLeave={e => e.currentTarget.style.background = "#2d6a4f"}>{type === "thread" ? "Post Thread" : "Create Project"}</button>
        </div>
      </div>
    </div>
  );
}
