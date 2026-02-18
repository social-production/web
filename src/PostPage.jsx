import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { mockThreads, mockComments, STATUS } from "./data";
// STATUS is imported from data.js — no local redefinition needed
import MeetupForm from "./MeetupForm";

const INDENT_COLORS = ["#2d6a4f","#52b788","#74c69d","#95d5b2","#b7e4c7"];

function Comment({ comment, depth = 0 }) {
  const navigate = useNavigate();
  const [votes, setVotes] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  const vote = (id, dir) => setVotes(prev => ({ ...prev, [id]: prev[id] === dir ? null : dir }));
  const score = comment.upvotes + (votes[comment.id] === "up" ? 1 : votes[comment.id] === "down" ? -1 : 0);
  const borderColor = INDENT_COLORS[Math.min(depth, INDENT_COLORS.length - 1)];

  return (
    <div style={{
      marginTop: "0",
      paddingLeft: depth === 0 ? "0" : "16px",
      borderLeft: depth === 0 ? "none" : `2px solid ${borderColor}22`,
    }}>
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "12px 14px",
        marginBottom: "8px",
      }}>
        {/* Comment header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
          <span
            onClick={() => navigate(`/user/${comment.author}`)}
            style={{ fontSize: "13px", fontWeight: 600, color: "#2d6a4f", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
            u/{comment.author}
          </span>
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>{comment.time}</span>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "#9ca3af", fontFamily: "Inter,sans-serif", padding: "0 4px" }}
            onMouseEnter={e => e.currentTarget.style.color = "#2d6a4f"}
            onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}>
            {collapsed ? "[+]" : "[–]"}
          </button>
        </div>

        {!collapsed && (
          <>
            <div style={{ fontSize: "14px", color: "#374151", lineHeight: "1.65", marginBottom: "10px" }}>
              {comment.text}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button onClick={() => vote(comment.id, "up")}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: votes[comment.id] === "up" ? "#2d6a4f" : "#d1d5db", padding: "1px", lineHeight: 1, userSelect: "none" }}
                  onMouseEnter={e => { if (votes[comment.id] !== "up") e.currentTarget.style.color = "#52b788"; }}
                  onMouseLeave={e => { if (votes[comment.id] !== "up") e.currentTarget.style.color = "#d1d5db"; }}>▲</button>
                <span style={{ fontSize: "12px", fontWeight: 700, color: votes[comment.id] === "up" ? "#2d6a4f" : votes[comment.id] === "down" ? "#dc2626" : "#6b7280", minWidth: "20px", textAlign: "center" }}>
                  {score}
                </span>
                <button onClick={() => vote(comment.id, "down")}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: votes[comment.id] === "down" ? "#dc2626" : "#d1d5db", padding: "1px", lineHeight: 1, userSelect: "none" }}
                  onMouseEnter={e => { if (votes[comment.id] !== "down") e.currentTarget.style.color = "#f87171"; }}
                  onMouseLeave={e => { if (votes[comment.id] !== "down") e.currentTarget.style.color = "#d1d5db"; }}>▼</button>
              </div>

              <button onClick={() => setShowReply(r => !r)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500, color: showReply ? "#2d6a4f" : "#9ca3af", fontFamily: "Inter,sans-serif", padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = "#2d6a4f"}
                onMouseLeave={e => { if (!showReply) e.currentTarget.style.color = "#9ca3af"; }}>
                💬 Reply
              </button>

              {comment.replies?.length > 0 && (
                <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                  {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                </span>
              )}
            </div>

            {showReply && (
              <div style={{ marginTop: "10px" }}>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder={`Reply to u/${comment.author}…`}
                  style={{ width: "100%", minHeight: "70px", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", fontFamily: "Inter,sans-serif", color: "#374151", resize: "vertical", outline: "none" }}
                  onFocus={e => e.target.style.borderColor = "#52b788"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "6px" }}>
                  <button onClick={() => setShowReply(false)}
                    style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", padding: "5px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>
                    Cancel
                  </button>
                  <button style={{ background: "#2d6a4f", border: "none", color: "#fff", padding: "5px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#1f4f3a"}
                    onMouseLeave={e => e.currentTarget.style.background = "#2d6a4f"}>
                    Reply
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Nested replies */}
      {!collapsed && comment.replies?.length > 0 && (
        <div style={{ marginLeft: "8px" }}>
          {comment.replies.map(reply => (
            <Comment key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const post = mockThreads.find(t => t.id === parseInt(id));
  const comments = mockComments.filter(c => c.postId === parseInt(id));
  const [votes, setVotes] = useState({});
  const [commentText, setCommentText] = useState("");
  const [meetupGoing, setMeetupGoing] = useState({});
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [showMeetupForm, setShowMeetupForm] = useState(false);
  const [localMeetups, setLocalMeetups] = useState(null); // null = use post.meetups from data

  // Mock: assume current user is the creator for demo purposes
  const isCreator = true; // In real app: currentUser?.username === post.author

  if (!post) return (
    <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af", fontFamily: "Inter,sans-serif" }}>
      Post not found. <span style={{ color: "#2d6a4f", cursor: "pointer" }} onClick={() => navigate("/")}>Go home</span>
    </div>
  );

  const vote = (id, dir) => setVotes(prev => ({ ...prev, [id]: prev[id] === dir ? null : dir }));
  const score = post.upvotes + (votes[post.id] === "up" ? 1 : votes[post.id] === "down" ? -1 : 0);
  const isProject = post.type === "project";
  const s = isProject ? STATUS[post.status] : null;

  function countAllComments(list) {
    return list.reduce((acc, c) => acc + 1 + countAllComments(c.replies || []), 0);
  }
  const totalComments = countAllComments(comments);
  const displayMeetups = localMeetups ?? post.meetups ?? [];

  return (
    <div style={{ fontFamily: "Inter,sans-serif", background: "#f6f7f8", minHeight: "100vh", color: "#1c1c1c" }}>

      {/* TOP NAV */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", height: "48px", display: "flex", alignItems: "center", padding: "0 20px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
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

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px" }}>

        {/* POST CARD */}
        <div style={{ background: isProject ? "#f0faf3" : "#fff", border: isProject ? "1px solid #c8e6d0" : "1px solid #e5e7eb", borderRadius: "16px", overflow: "hidden", marginBottom: "16px" }}>
          <div style={{ display: "flex" }}>
            <div style={{ width: "4px", background: isProject ? "#2d6a4f" : "#e5e7eb", flexShrink: 0 }} />
            <div style={{ width: "56px", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0", gap: "4px", flexShrink: 0, borderRight: "1px solid #f3f4f6" }}>
              <button onClick={() => vote(post.id, "up")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: votes[post.id] === "up" ? "#2d6a4f" : "#d1d5db", padding: "2px", lineHeight: 1, userSelect: "none" }}
                onMouseEnter={e => { if (votes[post.id] !== "up") e.currentTarget.style.color = "#52b788"; }}
                onMouseLeave={e => { if (votes[post.id] !== "up") e.currentTarget.style.color = "#d1d5db"; }}>▲</button>
              <span style={{ fontSize: "14px", fontWeight: 700, color: votes[post.id] === "up" ? "#2d6a4f" : votes[post.id] === "down" ? "#dc2626" : "#374151" }}>{score}</span>
              <button onClick={() => vote(post.id, "down")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: votes[post.id] === "down" ? "#dc2626" : "#d1d5db", padding: "2px", lineHeight: 1, userSelect: "none" }}
                onMouseEnter={e => { if (votes[post.id] !== "down") e.currentTarget.style.color = "#f87171"; }}
                onMouseLeave={e => { if (votes[post.id] !== "down") e.currentTarget.style.color = "#d1d5db"; }}>▼</button>
            </div>
            <div style={{ padding: "24px", flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                {isProject ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 600, color: s.text, background: s.bg, padding: "3px 10px", borderRadius: "999px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot, display: "inline-block" }} />
                    PROJECT · {post.status.toUpperCase()}
                  </span>
                ) : (
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", background: "#f3f4f6", padding: "3px 10px", borderRadius: "999px" }}>THREAD</span>
                )}
                {post.channels.map(ch => (
                  <span key={ch} onClick={() => navigate(`/channel/${encodeURIComponent(ch)}`)}
                    style={{ fontSize: "11px", fontWeight: 500, color: "#4a7c59", background: "#f0faf3", border: "1px solid #bbdec8", padding: "2px 8px", borderRadius: "999px", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#ddf0e5"}
                    onMouseLeave={e => e.currentTarget.style.background = "#f0faf3"}>
                    {ch}
                  </span>
                ))}
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "8px", lineHeight: "1.35", letterSpacing: "-0.3px" }}>{post.title}</h1>
              <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <span
                  onClick={() => navigate(`/user/${post.author}`)}
                  style={{ fontWeight: 500, color: "#2d6a4f", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                  u/{post.author}
                </span>
                <span>{post.time}</span>
                <span>{totalComments} comments</span>
              </div>

              {post.image && (
                <img src={post.image} alt="" style={{ width: "100%", height: "auto", maxHeight: "400px", objectFit: "cover", borderRadius: "10px", marginBottom: "16px" }} />
              )}

              <div style={{ fontSize: "15px", color: "#374151", lineHeight: "1.75", whiteSpace: "pre-line" }}>{post.body}</div>
            </div>
          </div>

          {isProject && (
            <div style={{ borderTop: "1px solid #c8e6d0", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div style={{ padding: "20px 24px", borderRight: "1px solid #c8e6d0" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#374151", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "12px" }}>👥 Members ({post.members?.length || 0})</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                  {post.members?.map(m => {
                    const isCreator = m === post.author;
                    return (
                      <span key={m}
                        onClick={() => navigate(`/user/${m}`)}
                        style={{
                          fontSize: "13px", fontWeight: 500, padding: "4px 10px", borderRadius: "999px", cursor: "pointer",
                          color:       isCreator ? "#1a3d2b" : "#2d6a4f",
                          background:  isCreator ? "#c8ddd1" : "#f0faf3",
                          border:      isCreator ? "1px solid #1a3d2b44" : "1px solid #bbdec8",
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                        u/{m}{isCreator ? " · Creator" : ""}
                      </span>
                    );
                  })}
                </div>
                <button style={{ background: "#2d6a4f", border: "none", color: "#fff", padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1f4f3a"}
                  onMouseLeave={e => e.currentTarget.style.background = "#2d6a4f"}>Join Project</button>
              </div>
              <div style={{ padding: "20px 24px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#374151", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "12px" }}>📅 Meetups ({displayMeetups.length})</div>
                {displayMeetups.length === 0 && <div style={{ fontSize: "13px", color: "#9ca3af" }}>No meetups scheduled yet.</div>}
                {displayMeetups.map((m, i) => (
                  <div key={i} style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: i < displayMeetups.length - 1 ? "1px solid #e8f5ee" : "none" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "3px" }}>{m.title}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>📆 {m.date} · {m.time}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>📍 {m.location}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>{m.going} going</span>
                      <button
                        onClick={() => setMeetupGoing(prev => ({ ...prev, [i]: !prev[i] }))}
                        style={{
                          fontSize: "11px", fontWeight: 600, padding: "4px 12px", borderRadius: "6px",
                          cursor: "pointer", fontFamily: "Inter,sans-serif", border: "none",
                          background: meetupGoing[i] ? "#2d6a4f" : "#f0faf3",
                          color: meetupGoing[i] ? "#fff" : "#2d6a4f",
                        }}>
                        {meetupGoing[i] ? "✓ Going" : "+ Going"}
                      </button>
                    </div>
                  </div>
                ))}
                {isCreator && (
                  showMeetupForm ? (
                    <div style={{ marginTop: "12px" }}>
                      <MeetupForm
                        onSave={(meetup) => {
                          setLocalMeetups(prev => [...(prev ?? post.meetups ?? []), meetup]);
                          setShowMeetupForm(false);
                        }}
                        onCancel={() => setShowMeetupForm(false)}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowMeetupForm(true)}
                      style={{
                        marginTop: "4px",
                        background: "none",
                        border: "1px dashed #bbdec8",
                        color: "#52b788",
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "Inter,sans-serif",
                        width: "100%"
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#2d6a4f"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "#bbdec8"}>
                      + Schedule Meetup
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* EDIT PROJECT BUTTON */}
        {isProject && isCreator && (
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => navigate(`/edit-project/${id}`)}
              style={{
                background: "#fff", border: "1px solid #e5e7eb", color: "#374151",
                padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
                cursor: "pointer", fontFamily: "Inter,sans-serif", display: "flex", alignItems: "center", gap: "6px"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
              ✏️ Edit Project
            </button>
          </div>
        )}

        {/* POST UPDATE FORM */}
        {isProject && isCreator && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
            {!showUpdateForm ? (
              <button
                onClick={() => setShowUpdateForm(true)}
                style={{
                  width: "100%", background: "#f0faf3", border: "1px dashed #bbdec8",
                  color: "#2d6a4f", padding: "10px", borderRadius: "8px", fontSize: "13px",
                  fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#2d6a4f"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#bbdec8"}>
                📢 + Post Update
              </button>
            ) : (
              <>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "10px" }}>Post an update</div>
                <textarea
                  value={updateText}
                  onChange={e => setUpdateText(e.target.value)}
                  placeholder="Share progress, announce changes, or update your community..."
                  maxLength={500}
                  style={{
                    width: "100%", minHeight: "90px", border: "1px solid #e5e7eb",
                    borderRadius: "8px", padding: "10px 12px", fontSize: "14px",
                    fontFamily: "Inter,sans-serif", color: "#374151", resize: "vertical", outline: "none"
                  }}
                  onFocus={e => e.target.style.borderColor = "#52b788"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#9ca3af" }}>{updateText.length}/500</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => { setShowUpdateForm(false); setUpdateText(""); }}
                      style={{
                        background: "none", border: "1px solid #e5e7eb", color: "#6b7280",
                        padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 500,
                        cursor: "pointer", fontFamily: "Inter,sans-serif"
                      }}>
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (updateText.trim()) {
                          alert("Update posted! (Will save to database once backend is connected)");
                          setUpdateText("");
                          setShowUpdateForm(false);
                        }
                      }}
                      style={{
                        background: "#2d6a4f", border: "none", color: "#fff",
                        padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                        cursor: "pointer", fontFamily: "Inter,sans-serif"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#1a3d2b"}
                      onMouseLeave={e => e.currentTarget.style.background = "#2d6a4f"}>
                      Post Update
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* UPDATES FEED */}
        {isProject && post.updates && post.updates.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              📢 Updates ({post.updates.length})
            </div>
            {post.updates.slice().reverse().map((update, i) => {
              const icons = { status: "🎯", meetup: "📅", fund: "💰", text: "📢" };
              return (
                <div key={i} style={{
                  paddingBottom: i < post.updates.length - 1 ? "14px" : "0",
                  marginBottom: i < post.updates.length - 1 ? "14px" : "0",
                  borderBottom: i < post.updates.length - 1 ? "1px solid #f3f4f6" : "none"
                }}>
                  <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px", fontWeight: 500 }}>
                    {icons[update.type] || "📢"} {update.type === "status" ? "Status Changed" : update.type === "meetup" ? "Meetup Added" : update.type === "fund" ? "Funding Milestone" : "Update"} · {update.time}
                  </div>
                  <div style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", marginBottom: "4px" }}>{update.text}</div>
                  <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                    Posted by <span
                      onClick={() => navigate(`/user/${update.author}`)}
                      style={{ color: "#2d6a4f", cursor: "pointer", fontWeight: 500 }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                      u/{update.author}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* COLLECTIVE FUND WIDGET */}
        {isProject && post.fund && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              💰 Collective Fund
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>
                  ${post.fund.raised.toLocaleString()}
                </div>
                <div style={{ fontSize: "13px", color: "#9ca3af" }}>
                  of ${post.fund.goal.toLocaleString()} goal
                </div>
              </div>

              <div style={{ width: "100%", height: "12px", background: "#f3f4f6", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{
                  width: `${Math.min((post.fund.raised / post.fund.goal) * 100, 100)}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #2d6a4f, #52b788)",
                  transition: "width 0.3s"
                }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "12px", color: "#9ca3af" }}>
                <span>{Math.round((post.fund.raised / post.fund.goal) * 100)}% funded</span>
                <span>{post.fund.contributors.length} contributors</span>
                {post.fund.deadline && <span>Deadline: {post.fund.deadline}</span>}
              </div>
            </div>

            <button
              onClick={() => {
                alert("Payment processing will be enabled when backend is connected. Stripe integration coming soon!");
              }}
              style={{
                width: "100%",
                background: "#2d6a4f",
                border: "none",
                color: "#fff",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Inter,sans-serif",
                marginBottom: "16px"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#1a3d2b"}
              onMouseLeave={e => e.currentTarget.style.background = "#2d6a4f"}>
              Contribute
            </button>

            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "10px" }}>
                Top Contributors
              </div>
              {post.fund.contributors
                .filter(c => c.public)
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 3)
                .map((c, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    fontSize: "13px"
                  }}>
                    <span
                      onClick={() => c.name !== "Anonymous" && navigate(`/user/${c.name}`)}
                      style={{
                        color: c.name === "Anonymous" ? "#9ca3af" : "#2d6a4f",
                        cursor: c.name === "Anonymous" ? "default" : "pointer",
                        fontWeight: 500
                      }}
                      onMouseEnter={e => c.name !== "Anonymous" && (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={e => c.name !== "Anonymous" && (e.currentTarget.style.textDecoration = "none")}>
                      {c.name === "Anonymous" ? "Anonymous" : `u/${c.name}`}
                    </span>
                    <span style={{ fontWeight: 600, color: "#111827" }}>${c.amount}</span>
                  </div>
                ))}
              {post.fund.contributors.filter(c => !c.public || c.name === "Anonymous").length > 0 && (
                <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "6px" }}>
                  + {post.fund.contributors.filter(c => !c.public).length} other contributors
                </div>
              )}
            </div>
          </div>
        )}

        {/* COMMENT BOX */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "10px" }}>Leave a comment</div>
          <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="What do you think?"
            style={{ width: "100%", minHeight: "80px", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px 12px", fontSize: "14px", fontFamily: "Inter,sans-serif", color: "#374151", resize: "vertical", outline: "none" }}
            onFocus={e => e.target.style.borderColor = "#52b788"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
            <button style={{ background: "#2d6a4f", border: "none", color: "#fff", padding: "7px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif" }}
              onMouseEnter={e => e.currentTarget.style.background = "#1f4f3a"}
              onMouseLeave={e => e.currentTarget.style.background = "#2d6a4f"}>Comment</button>
          </div>
        </div>

        {/* COMMENTS */}
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "12px" }}>{totalComments} Comments</div>
        {comments.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
            No comments yet. Be the first!
          </div>
        )}
        {comments.map(c => (
          <Comment key={c.id} comment={c} depth={0} />
        ))}
      </div>
    </div>
  );
}
