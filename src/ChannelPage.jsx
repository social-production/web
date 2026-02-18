import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { mockThreads, channels, CARD, STATUS } from "./data";

const CHANNEL_INFO = {
  "Meta":                 { description:"Discuss the platform itself — suggest features, report issues, share feedback.", color:"#6366f1" },
  "Politics":             { description:"Political discussion, civic issues, and policy debates.", color:"#ef4444" },
  "Philosophy":           { description:"Ideas about society, productivity, collective action and the good life.", color:"#8b5cf6" },
  "New York":             { description:"Projects, threads and events happening in and around New York City.", color:"#0ea5e9" },
  "Brooklyn":             { description:"Hyperlocal projects and discussions for Brooklyn communities.", color:"#f59e0b" },
  "Housing & Construction":{ description:"Building, renovating, housing rights, and construction projects.", color:"#d97706" },
  "Food & Agriculture":   { description:"Community gardens, food systems, farming, and nutrition.", color:"#22c55e" },
  "Arts & Culture":       { description:"Creative projects, murals, music, performance and cultural events.", color:"#ec4899" },
  "Education":            { description:"Learning, teaching, skills sharing and educational projects.", color:"#14b8a6" },
};

function Badge({ type, status }) {
  if (type === "thread") return (
    <span style={{fontSize:"11px",fontWeight:600,color:"#6b7280",background:"#f3f4f6",padding:"2px 8px",borderRadius:"999px"}}>THREAD</span>
  );
  const s = STATUS[status];
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:"5px",fontSize:"11px",fontWeight:600,color:s.text,background:s.bg,padding:"2px 10px",borderRadius:"999px"}}>
      <span style={{width:"6px",height:"6px",borderRadius:"50%",background:s.dot,display:"inline-block"}}/>
      PROJECT · {status.toUpperCase()}
    </span>
  );
}

export default function ChannelPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const channelName = decodeURIComponent(name);
  const channel = channels.find(c => c.name === channelName);
  const info = CHANNEL_INFO[channelName] || { description:"A community channel.", color:"#2d6a4f" };
  const posts = mockThreads.filter(t => t.channels.includes(channelName));
  const [votes, setVotes] = useState({});
  const [typeFilter, setTypeFilter] = useState("All");

  const vote = (id, dir) => setVotes(prev => ({ ...prev, [id]: prev[id] === dir ? null : dir }));
  const getScore = item => item.upvotes + (votes[item.id]==="up"?1:votes[item.id]==="down"?-1:0);

  const filtered = posts.filter(t =>
    typeFilter === "All" ? true : typeFilter === "Projects" ? t.type === "project" : t.type === "thread"
  );

  const projectCount = posts.filter(t => t.type === "project").length;
  const threadCount = posts.filter(t => t.type === "thread").length;

  if (!channel) return (
    <div style={{padding:"48px",textAlign:"center",color:"#9ca3af",fontFamily:"Inter,sans-serif"}}>
      Channel not found. <span style={{color:"#2d6a4f",cursor:"pointer"}} onClick={()=>navigate("/")}>Go home</span>
    </div>
  );

  return (
    <div style={{fontFamily:"Inter,sans-serif",background:"#f6f7f8",minHeight:"100vh",color:"#1c1c1c"}}>

      {/* TOP NAV */}
      <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",height:"48px",display:"flex",alignItems:"center",padding:"0 20px",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer"}} onClick={()=>navigate("/")}>
          <div style={{width:"28px",height:"28px",background:"linear-gradient(135deg,#2d6a4f,#52b788)",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px"}}>🌱</div>
          <span style={{fontWeight:700,fontSize:"15px",color:"#1c1c1c",letterSpacing:"-0.3px"}}>Social Production</span>
        </div>
        <button onClick={()=>navigate(-1)}
          style={{marginLeft:"24px",background:"none",border:"none",cursor:"pointer",color:"#6b7280",fontSize:"13px",fontWeight:500,fontFamily:"Inter,sans-serif"}}
          onMouseEnter={e=>e.currentTarget.style.color="#2d6a4f"}
          onMouseLeave={e=>e.currentTarget.style.color="#6b7280"}>
          ← Back
        </button>
        <div style={{marginLeft:"auto",display:"flex",gap:"8px"}}>
          <button onClick={()=>navigate("/auth?mode=login")} style={{background:"#f3f4f6",border:"1px solid #e5e7eb",color:"#374151",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"Inter,sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background="#e5e7eb"} onMouseLeave={e=>e.currentTarget.style.background="#f3f4f6"}>Log in</button>
          <button onClick={()=>navigate("/auth?mode=signup")} style={{background:"#2d6a4f",border:"none",color:"#fff",padding:"6px 16px",borderRadius:"8px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background="#1f4f3a"} onMouseLeave={e=>e.currentTarget.style.background="#2d6a4f"}>Sign up</button>
        </div>
      </div>

      {/* CHANNEL HEADER BANNER */}
      <div style={{background:`linear-gradient(135deg,${info.color}18,${info.color}08)`,borderBottom:`1px solid ${info.color}22`}}>
        <div style={{maxWidth:"1280px",margin:"0 auto",padding:"32px 32px 24px"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
              <div style={{width:"56px",height:"56px",background:`${info.color}18`,border:`2px solid ${info.color}33`,borderRadius:"14px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"26px"}}>
                {channel.icon}
              </div>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
                  <h1 style={{fontSize:"24px",fontWeight:700,color:"#111827",letterSpacing:"-0.3px"}}>{channelName}</h1>
                  {channel.system && (
                    <span style={{fontSize:"10px",fontWeight:600,color:"#9ca3af",background:"#f3f4f6",padding:"2px 7px",borderRadius:"999px",letterSpacing:"0.5px"}}>SYSTEM</span>
                  )}
                </div>
                <p style={{fontSize:"14px",color:"#6b7280",maxWidth:"480px",lineHeight:"1.5"}}>{info.description}</p>
              </div>
            </div>

            {/* Stats + join */}
            <div style={{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:"20px",fontWeight:700,color:"#111827"}}>{channel.subscribers || 0}</div>
                <div style={{fontSize:"11px",color:"#9ca3af",fontWeight:500}}>Subscribers</div>
              </div>
              <button
                style={{background:info.color,border:"none",color:"#fff",padding:"9px 22px",borderRadius:"8px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                + Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:"1280px",margin:"0 auto",padding:"24px 32px",display:"flex",gap:"24px"}}>

        {/* MAIN FEED */}
        <div style={{flex:1,minWidth:0}}>

          {/* Filter row */}
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px"}}>
            <span style={{fontSize:"13px",fontWeight:600,color:"#374151"}}>Show:</span>
            {["All","Projects","Threads"].map(f=>(
              <button key={f} onClick={()=>setTypeFilter(f)} style={{
                padding:"5px 14px",borderRadius:"999px",fontSize:"12px",fontWeight:600,cursor:"pointer",
                fontFamily:"Inter,sans-serif",
                border: typeFilter===f ? "none" : "1px solid #e5e7eb",
                background: typeFilter===f ? "#2d6a4f" : "#fff",
                color: typeFilter===f ? "#fff" : "#6b7280",
              }}>{f}</button>
            ))}
            <button
              onClick={()=>navigate(`/create`)}
              style={{marginLeft:"auto",background:"#2d6a4f",border:"none",color:"#fff",padding:"6px 16px",borderRadius:"8px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}
              onMouseEnter={e=>e.currentTarget.style.background="#1f4f3a"}
              onMouseLeave={e=>e.currentTarget.style.background="#2d6a4f"}>
              + Post here
            </button>
          </div>

          {filtered.length === 0 && (
            <div style={{textAlign:"center",padding:"56px 24px",color:"#9ca3af",fontSize:"14px",background:"#fff",borderRadius:"12px",border:"1px solid #e5e7eb"}}>
              No posts in this channel yet. Be the first!
            </div>
          )}

          {filtered.map(item => {
            const cs = CARD[item.type];
            return (
              <div key={item.id}
                onClick={()=>navigate(`/post/${item.id}`)}
                style={{background:cs.bg,border:`1px solid ${cs.border}`,borderRadius:"12px",marginBottom:"8px",display:"flex",overflow:"hidden",cursor:"pointer",transition:"box-shadow 0.15s,border-color 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)";e.currentTarget.style.borderColor=cs.hoverBorder;}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=cs.border;}}>
                <div style={{width:"3px",background:cs.bar,flexShrink:0}}/>
                <div style={{width:"44px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"14px 0",gap:"3px",flexShrink:0,borderRight:"1px solid #f3f4f6"}}>
                  <button onClick={e=>{e.stopPropagation();vote(item.id,"up");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:"16px",color:votes[item.id]==="up"?"#2d6a4f":"#d1d5db",padding:"2px",lineHeight:1,userSelect:"none"}}
                    onMouseEnter={e=>{if(votes[item.id]!=="up")e.currentTarget.style.color="#52b788";}}
                    onMouseLeave={e=>{if(votes[item.id]!=="up")e.currentTarget.style.color="#d1d5db";}}>▲</button>
                  <span style={{fontSize:"12px",fontWeight:700,color:votes[item.id]==="up"?"#2d6a4f":votes[item.id]==="down"?"#dc2626":"#374151",minWidth:"24px",textAlign:"center"}}>{getScore(item)}</span>
                  <button onClick={e=>{e.stopPropagation();vote(item.id,"down");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:"14px",color:votes[item.id]==="down"?"#dc2626":"#d1d5db",padding:"2px",lineHeight:1,userSelect:"none"}}
                    onMouseEnter={e=>{if(votes[item.id]!=="down")e.currentTarget.style.color="#f87171";}}
                    onMouseLeave={e=>{if(votes[item.id]!=="down")e.currentTarget.style.color="#d1d5db";}}>▼</button>
                </div>
                <div style={{padding:"12px 16px",flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"7px",flexWrap:"wrap"}}>
                    <Badge type={item.type} status={item.status}/>
                    {item.channels.filter(ch=>ch!==channelName).map(ch=>(
                      <span key={ch} onClick={e=>{e.stopPropagation();navigate(`/channel/${encodeURIComponent(ch)}`);}}
                        style={{fontSize:"11px",fontWeight:500,color:"#4a7c59",background:"#f0faf3",border:"1px solid #bbdec8",padding:"2px 8px",borderRadius:"999px",cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#ddf0e5"}
                        onMouseLeave={e=>e.currentTarget.style.background="#f0faf3"}>
                        {ch}
                      </span>
                    ))}
                  </div>
                  <div style={{fontSize:"15px",fontWeight:600,color:"#111827",marginBottom:"5px",lineHeight:"1.45",letterSpacing:"-0.1px"}}>{item.title}</div>
                  <div style={{fontSize:"13px",color:"#6b7280",marginBottom:"10px",lineHeight:"1.6"}}>{item.description}</div>
                  <div style={{display:"flex",gap:"14px",fontSize:"12px",color:"#9ca3af",alignItems:"center",flexWrap:"wrap"}}>
                    <span
                      onClick={e=>{e.stopPropagation();navigate(`/user/${item.author}`);}}
                      style={{fontWeight:500,color:"#2d6a4f",cursor:"pointer"}}
                      onMouseEnter={e=>e.currentTarget.style.textDecoration="underline"}
                      onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}>
                      u/{item.author}
                    </span>
                    <span>{item.time}</span>
                    <span style={{display:"flex",alignItems:"center",gap:"4px"}}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {item.comments}
                    </span>
                    {item.rsvps!==undefined&&(
                      <span style={{display:"flex",alignItems:"center",gap:"4px",color:"#52b788",fontWeight:500}}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        {item.rsvps} going
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{width:"240px",flexShrink:0}}>

          {/* Related channels */}
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"16px",marginBottom:"12px"}}>
            <div style={{fontSize:"12px",fontWeight:700,color:"#374151",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:"12px"}}>Other Channels</div>
            {channels.filter(c=>c.name!==channelName).slice(0,6).map(ch=>(
              <div key={ch.name}
                onClick={()=>navigate(`/channel/${encodeURIComponent(ch.name)}`)}
                style={{display:"flex",alignItems:"center",gap:"8px",padding:"7px 8px",borderRadius:"8px",cursor:"pointer",fontSize:"13px",color:"#4b5563",marginBottom:"1px"}}
                onMouseEnter={e=>{e.currentTarget.style.background="#f9fafb";e.currentTarget.style.color="#2d6a4f";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#4b5563";}}>
                <span>{ch.icon}</span>
                <span>{ch.name}</span>
              </div>
            ))}
          </div>

          {/* Channel rules placeholder */}
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"16px"}}>
            <div style={{fontSize:"12px",fontWeight:700,color:"#374151",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:"12px"}}>Channel Guidelines</div>
            {["Be constructive", "Stay on topic", "Respect others", "No spam"].map((rule,i)=>(
              <div key={rule} style={{display:"flex",alignItems:"flex-start",gap:"8px",marginBottom:"8px",fontSize:"13px",color:"#6b7280"}}>
                <span style={{fontWeight:600,color:info.color,flexShrink:0}}>{i+1}.</span>
                {rule}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
