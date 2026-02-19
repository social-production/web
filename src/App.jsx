import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mockThreads, channels, CARD, STATUS } from "./data";
import "./App.css";

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

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const options = [
    { value:"Top",    label:"Top",    icon:"🔥", available:true },
    { value:"Latest", label:"Latest", icon:"🕐", available:true },
    { value:"Rising", label:"Rising", icon:"📈", available:false },
  ];
  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{position:"relative",userSelect:"none"}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{display:"flex",alignItems:"center",gap:"6px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"6px 12px",fontSize:"13px",fontWeight:500,color:"#374151",cursor:"pointer",fontFamily:"Inter,sans-serif"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor="#52b788"}
        onMouseLeave={e=>{ if(!open) e.currentTarget.style.borderColor="#e5e7eb"; }}>
        <svg width="14" height="14" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="9" y2="18"/>
        </svg>
        Sort: <strong>{selected.label}</strong>
        <svg width="12" height="12" fill="none" stroke="#9ca3af" strokeWidth="2.5" viewBox="0 0 24 24"
          style={{transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.15s"}}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,background:"#fff",border:"1px solid #e5e7eb",borderRadius:"10px",boxShadow:"0 4px 16px rgba(0,0,0,0.1)",minWidth:"160px",zIndex:200,overflow:"hidden"}}>
          {options.map(opt=>(
            <div key={opt.value}
              onClick={()=>{ if(opt.available){ onChange(opt.value); setOpen(false); } }}
              style={{padding:"9px 14px",fontSize:"13px",fontWeight:opt.value===value?600:400,cursor:opt.available?"pointer":"default",display:"flex",alignItems:"center",gap:"8px",
                color: !opt.available ? "#d1d5db" : opt.value===value ? "#2d6a4f" : "#374151",
                background: opt.value===value ? "#f0faf3" : "transparent",
              }}
              onMouseEnter={e=>{ if(opt.available && opt.value!==value) e.currentTarget.style.background="#f9fafb"; }}
              onMouseLeave={e=>{ if(opt.value!==value) e.currentTarget.style.background="transparent"; }}>
              <span>{opt.icon}</span>
              <span style={{flex:1}}>{opt.label}</span>
              {!opt.available && <span style={{fontSize:"10px",color:"#d1d5db",fontWeight:500,background:"#f3f4f6",padding:"1px 6px",borderRadius:"999px"}}>soon</span>}
              {opt.value===value && opt.available && <span style={{color:"#52b788",fontSize:"14px"}}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChannelTag({ name, onClick }) {
  return (
    <span onClick={e=>{e.stopPropagation();onClick(name)}}
      style={{fontSize:"11px",fontWeight:500,color:"#4a7c59",background:"#f0faf3",border:"1px solid #bbdec8",padding:"2px 8px",borderRadius:"999px",cursor:"pointer"}}
      onMouseEnter={e=>e.currentTarget.style.background="#ddf0e5"}
      onMouseLeave={e=>e.currentTarget.style.background="#f0faf3"}>
      {name}
    </span>
  );
}

function HappeningSoon() {
  const navigate = useNavigate();
  const [going, setGoing] = useState({});
  const allMeetups = mockThreads
    .filter(t => t.type === "project" && t.meetups?.length)
    .flatMap(t => t.meetups.map(m => ({ ...m, project: t.title, projectId: t.id })))
    .slice(0, 5);

  return (
    <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"16px",marginBottom:"12px"}}>
      <div style={{fontSize:"12px",fontWeight:700,color:"#374151",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:"14px"}}>🌟 Happening Soon</div>
      {allMeetups.map((m, i) => (
        <div key={i} style={{paddingBottom: i < allMeetups.length - 1 ? "14px" : "0", marginBottom: i < allMeetups.length - 1 ? "14px" : "0", borderBottom: i < allMeetups.length - 1 ? "1px solid #f3f4f6" : "none"}}>
          <div style={{fontSize:"13px",fontWeight:600,color:"#111827",marginBottom:"2px",lineHeight:"1.4"}}>{m.title}</div>
          <div style={{fontSize:"11px",color:"#9ca3af",marginBottom:"6px",cursor:"pointer"}} onClick={()=>navigate(`/post/${m.projectId}`)}
            onMouseEnter={e=>e.currentTarget.style.color="#2d6a4f"}
            onMouseLeave={e=>e.currentTarget.style.color="#9ca3af"}>
            {m.project}
          </div>
          <div style={{fontSize:"12px",color:"#6b7280",marginBottom:"8px"}}>
            <div>📆 {m.date} · {m.time}</div>
            <div>📍 {m.location}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"12px",color:"#9ca3af",fontWeight:500}}>{m.going} going</span>
            <button
              onClick={() => setGoing(prev => ({ ...prev, [i]: !prev[i] }))}
              style={{
                fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "6px",
                cursor: "pointer", fontFamily: "Inter,sans-serif", border: "none",
                background: going[i] ? "#2d6a4f" : "#f0faf3",
                color: going[i] ? "#fff" : "#2d6a4f",
              }}>
              {going[i] ? "✓ Going" : "+ Going"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsDropdown({ navigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const options = [
    { label: "Profile", icon: "👤", path: "/settings/profile" },
    { label: "Network Settings", icon: "🌐", path: "/settings/network" },
    { label: "Moderator Dashboard", icon: "🛡️", path: "/moderation" },
  ];

  return (
    <div ref={ref} style={{position:"relative",userSelect:"none"}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{background:"none",border:"none",cursor:"pointer",color:"#6b7280",fontSize:"18px",padding:"4px 6px",borderRadius:"6px"}}
        onMouseEnter={e=>e.currentTarget.style.background="#f3f4f6"}
        onMouseLeave={e=>{ if(!open) e.currentTarget.style.background="none"; }}>
        ⚙️
      </button>
      {open && (
        <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:200,background:"#fff",border:"1px solid #e5e7eb",borderRadius:"10px",boxShadow:"0 4px 16px rgba(0,0,0,0.10)",minWidth:"180px",overflow:"hidden"}}>
          {options.map(opt=>(
            <div key={opt.path} onClick={()=>{navigate(opt.path);setOpen(false);}}
              style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",cursor:"pointer",fontSize:"13px",fontWeight:400,color:"#374151",background:"transparent"}}
              onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span>{opt.icon}</span>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const options = [
    { value:"All",      label:"All posts", icon:"◈" },
    { value:"Projects", label:"Projects",  icon:"🟢" },
    { value:"Threads",  label:"Threads",   icon:"◻" },
  ];
  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{position:"relative",userSelect:"none"}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{display:"flex",alignItems:"center",gap:"6px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"6px 12px",fontSize:"13px",fontWeight:500,color:"#374151",cursor:"pointer",fontFamily:"Inter,sans-serif"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor="#52b788"}
        onMouseLeave={e=>{ if(!open) e.currentTarget.style.borderColor="#e5e7eb"; }}>
        <svg width="14" height="14" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
        </svg>
        Filter: <strong>{selected.label}</strong>
        <svg width="12" height="12" fill="none" stroke="#9ca3af" strokeWidth="2.5" viewBox="0 0 24 24"
          style={{transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.15s"}}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:200,background:"#fff",border:"1px solid #e5e7eb",borderRadius:"10px",boxShadow:"0 4px 16px rgba(0,0,0,0.10)",minWidth:"160px",overflow:"hidden"}}>
          {options.map(opt=>(
            <div key={opt.value} onClick={()=>{onChange(opt.value);setOpen(false);}}
              style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",cursor:"pointer",fontSize:"13px",fontWeight:value===opt.value?600:400,color:value===opt.value?"#2d6a4f":"#374151",background:value===opt.value?"#f0faf3":"transparent"}}
              onMouseEnter={e=>{if(value!==opt.value)e.currentTarget.style.background="#f9fafb";}}
              onMouseLeave={e=>{if(value!==opt.value)e.currentTarget.style.background="transparent";}}>
              <span>{opt.icon}</span>
              {opt.label}
              {value===opt.value&&(
                <svg style={{marginLeft:"auto"}} width="14" height="14" fill="none" stroke="#2d6a4f" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Home");
  const [activeChannel, setActiveChannel] = useState(null);
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Top");
  const [votes, setVotes] = useState({});

  const vote = (id, dir) => setVotes(prev => ({ ...prev, [id]: prev[id]===dir ? null : dir }));
  const getScore = item => item.upvotes + (votes[item.id]==="up"?1:votes[item.id]==="down"?-1:0);

  const filtered = mockThreads
    .filter(t => activeChannel ? t.channels.includes(activeChannel) : true)
    .filter(t => typeFilter==="All" ? true : typeFilter==="Projects" ? t.type==="project" : t.type==="thread")
    .slice()
    .sort((a, b) => {
      if (sortBy === "Top")    return b.upvotes - a.upvotes;
      if (sortBy === "Latest") {
        const aDate = a.updatedDate || a.date;
        const bDate = b.updatedDate || b.date;
        return new Date(bDate) - new Date(aDate);
      }
      return 0;
    });

  return (
    <div style={{fontFamily:"'Inter',sans-serif",background:"#f6f7f8",minHeight:"100vh",color:"#1c1c1c"}}>

      {/* TOP NAV */}
      <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",height:"48px",display:"flex",alignItems:"center",padding:"0 20px",gap:"16px",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginRight:"8px"}}>
          <div style={{width:"28px",height:"28px",background:"linear-gradient(135deg,#2d6a4f,#52b788)",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px"}}>🌱</div>
          <span style={{fontWeight:700,fontSize:"15px",color:"#1c1c1c",letterSpacing:"-0.3px"}}>Social Production</span>
        </div>
        <div style={{flex:1,maxWidth:"520px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"7px 14px"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#52b788"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#e5e7eb"}>
            <svg width="15" height="15" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span style={{fontSize:"13px",color:"#9ca3af"}}>Search threads, projects, channels…</span>
          </div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:"8px",alignItems:"center"}}>
          <button style={{background:"none",border:"none",cursor:"pointer",color:"#6b7280",fontSize:"18px",padding:"4px 6px",borderRadius:"6px"}} onMouseEnter={e=>e.currentTarget.style.background="#f3f4f6"} onMouseLeave={e=>e.currentTarget.style.background="none"}>🔔</button>
          <button style={{background:"none",border:"none",cursor:"pointer",color:"#6b7280",fontSize:"18px",padding:"4px 6px",borderRadius:"6px"}} onMouseEnter={e=>e.currentTarget.style.background="#f3f4f6"} onMouseLeave={e=>e.currentTarget.style.background="none"}>✉️</button>
          <SettingsDropdown navigate={navigate} />
          <button onClick={()=>navigate("/auth?mode=login")} style={{background:"#f3f4f6",border:"1px solid #e5e7eb",color:"#374151",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"Inter,sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background="#e5e7eb"} onMouseLeave={e=>e.currentTarget.style.background="#f3f4f6"}>Log in</button>
          <button onClick={()=>navigate("/auth?mode=signup")} style={{background:"#2d6a4f",border:"none",color:"#fff",padding:"6px 16px",borderRadius:"8px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background="#1f4f3a"} onMouseLeave={e=>e.currentTarget.style.background="#2d6a4f"}>Sign up</button>
        </div>
      </div>

      <div style={{display:"flex",maxWidth:"1280px",margin:"0 auto",padding:"0 16px"}}>

        {/* LEFT SIDEBAR */}
        <div style={{width:"200px",flexShrink:0,paddingTop:"20px",paddingRight:"16px",position:"sticky",top:"48px",height:"calc(100vh - 48px)",overflowY:"auto"}}>
          {["🏠  Home","📋  My Feed","📍  Local"].map(item=>(
            <div key={item} style={{padding:"7px 10px",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:500,color:"#374151",marginBottom:"1px"}}
              onMouseEnter={e=>e.currentTarget.style.background="#f3f4f6"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{item}</div>
          ))}
          <div style={{height:"1px",background:"#e5e7eb",margin:"12px 0"}}/>
          <div style={{fontSize:"11px",fontWeight:600,color:"#9ca3af",letterSpacing:"0.8px",textTransform:"uppercase",padding:"0 10px",marginBottom:"6px"}}>Channels</div>
          {channels.filter(c=>c.system).map(ch=>(
            <div key={ch.name} onClick={()=>navigate(`/channel/${encodeURIComponent(ch.name)}`)}
              style={{padding:"6px 10px",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:activeChannel===ch.name?600:400,color:activeChannel===ch.name?"#2d6a4f":"#4b5563",background:activeChannel===ch.name?"#f0faf3":"transparent",marginBottom:"1px",display:"flex",alignItems:"center",gap:"8px"}}
              onMouseEnter={e=>{if(activeChannel!==ch.name)e.currentTarget.style.background="#f9fafb";}}
              onMouseLeave={e=>{if(activeChannel!==ch.name)e.currentTarget.style.background="transparent";}}>
              <span>{ch.icon}</span><span style={{flex:1}}>{ch.name}</span>
              <span style={{fontSize:"10px",color:"#d1d5db",fontWeight:500}}>SYS</span>
            </div>
          ))}
          <div style={{height:"1px",background:"#e5e7eb",margin:"8px 0"}}/>
          {channels.filter(c=>!c.system).map(ch=>(
            <div key={ch.name} onClick={()=>navigate(`/channel/${encodeURIComponent(ch.name)}`)}
              style={{padding:"6px 10px",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:activeChannel===ch.name?600:400,color:activeChannel===ch.name?"#2d6a4f":"#4b5563",background:activeChannel===ch.name?"#f0faf3":"transparent",marginBottom:"1px",display:"flex",alignItems:"center",gap:"8px"}}
              onMouseEnter={e=>{if(activeChannel!==ch.name)e.currentTarget.style.background="#f9fafb";}}
              onMouseLeave={e=>{if(activeChannel!==ch.name)e.currentTarget.style.background="transparent";}}>
              <span>{ch.icon}</span><span>{ch.name}</span>
            </div>
          ))}
          <div style={{margin:"10px 0",padding:"7px 10px",border:"1px dashed #d1d5db",borderRadius:"8px",fontSize:"13px",color:"#9ca3af",cursor:"pointer",textAlign:"center",fontWeight:500}}
            onClick={()=>navigate("/create-channel")} onMouseEnter={e=>{e.currentTarget.style.borderColor="#52b788";e.currentTarget.style.color="#2d6a4f";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#d1d5db";e.currentTarget.style.color="#9ca3af";}}>
            + New Channel
          </div>
        </div>

        {/* MAIN FEED */}
        <div style={{flex:1,paddingTop:"20px",paddingLeft:"8px",paddingRight:"8px",minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",borderBottom:"1px solid #e5e7eb",marginBottom:"14px"}}>
            {[["Home","🏠"],["My Feed","📋"],["Local","📍"]].map(([tab,icon])=>(
              <button key={tab} onClick={()=>setActiveTab(tab)} style={{padding:"10px 16px",background:"none",border:"none",borderBottom:activeTab===tab?"2px solid #2d6a4f":"2px solid transparent",color:activeTab===tab?"#2d6a4f":"#6b7280",fontWeight:activeTab===tab?600:400,fontSize:"13px",cursor:"pointer",fontFamily:"Inter,sans-serif",marginBottom:"-1px"}}>
                {icon} {tab}
              </button>
            ))}
            <div style={{marginLeft:"auto",display:"flex",gap:"8px",paddingBottom:"8px"}}>
              <button onClick={()=>navigate("/create?type=thread")} style={{background:"#f0faf3",border:"1px solid #bbdec8",color:"#2d6a4f",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background="#ddf0e5"} onMouseLeave={e=>e.currentTarget.style.background="#f0faf3"}>+ Thread</button>
              <button onClick={()=>navigate("/create?type=project")} style={{background:"#2d6a4f",border:"none",color:"#fff",padding:"6px 16px",borderRadius:"8px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background="#1f4f3a"} onMouseLeave={e=>e.currentTarget.style.background="#2d6a4f"}>+ Project</button>
            </div>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
            <FilterDropdown value={typeFilter} onChange={setTypeFilter}/>
            <SortDropdown value={sortBy} onChange={setSortBy}/>
            {activeChannel&&(
              <div style={{display:"flex",alignItems:"center",gap:"6px",background:"#f0faf3",border:"1px solid #bbdec8",borderRadius:"999px",padding:"5px 12px",fontSize:"12px",fontWeight:500,color:"#2d6a4f"}}>
                {activeChannel}
                <button onClick={()=>setActiveChannel(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#52b788",fontSize:"15px",fontWeight:700,fontFamily:"Inter,sans-serif",lineHeight:1,padding:0}}>×</button>
              </div>
            )}
            <span style={{marginLeft:"auto",fontSize:"12px",color:"#9ca3af"}}>{filtered.length} posts</span>
          </div>

          {filtered.length===0&&(
            <div style={{textAlign:"center",padding:"56px 24px",color:"#9ca3af",fontSize:"14px",background:"#fff",borderRadius:"12px",border:"1px solid #e5e7eb"}}>
              No posts match your current filters.
            </div>
          )}

          {filtered.map(item=>{
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
                    {item.channels.map(ch=><ChannelTag key={ch} name={ch} onClick={(name)=>navigate(`/channel/${encodeURIComponent(name)}`)}/>)}
                  </div>
                  <div style={{fontSize:"15px",fontWeight:600,color:"#111827",marginBottom:"5px",lineHeight:"1.45",letterSpacing:"-0.1px"}}>{item.title}</div>
                  <div style={{fontSize:"13px",color:"#6b7280",marginBottom:"10px",lineHeight:"1.6"}}>{item.description}</div>
                  {item.image && (
                    <div style={{marginTop:"10px",marginBottom:"8px",borderRadius:"8px",overflow:"hidden"}}>
                      <img src={item.image} alt="" style={{width:"100%",height:"auto",maxHeight:"160px",objectFit:"cover",display:"block"}} />
                    </div>
                  )}
                  <div style={{display:"flex",gap:"14px",fontSize:"12px",color:"#9ca3af",alignItems:"center",flexWrap:"wrap"}}>
                    <span
                      onClick={e=>{e.stopPropagation();navigate(`/user/${item.author}`)}}
                      style={{fontWeight:500,color:"#2d6a4f",cursor:"pointer"}}
                      onMouseEnter={e=>e.currentTarget.style.textDecoration="underline"}
                      onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}>
                      u/{item.author}
                    </span>
                    <span>{item.updatedDate ? `Updated ${item.time}` : item.time}</span>
                    <span style={{display:"flex",alignItems:"center",gap:"4px"}}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {item.comments}
                    </span>
                    {item.rsvps!==undefined&&(
                      <span style={{display:"flex",alignItems:"center",gap:"4px",color:"#52b788",fontWeight:500}}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        {item.rsvps} members
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{width:"272px",flexShrink:0,paddingTop:"20px",paddingLeft:"16px",position:"sticky",top:"48px",height:"calc(100vh - 48px)",overflowY:"auto"}}>
          
          {/* Your Meetups */}
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"16px",marginBottom:"12px"}}>
            <div style={{fontSize:"12px",fontWeight:700,color:"#374151",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:"10px"}}>📅 Your Meetups</div>
            <div style={{fontSize:"13px",color:"#9ca3af",textAlign:"center",padding:"12px 0"}}>
              You haven't joined any meetups yet.
            </div>
          </div>

          {/* Happening Soon */}
          <HappeningSoon />
          <div style={{background:"linear-gradient(135deg,#1a3a2a,#2d6a4f)",borderRadius:"12px",padding:"16px",marginBottom:"12px"}}>
            <div style={{fontSize:"12px",fontWeight:700,color:"#a7f3d0",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:"14px"}}>🌱 Platform Activity</div>
            {[["Members","1,247"],["Active Projects","83"],["Meetups This Month","21"],["Pooled Funds","$4,820"]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                <span style={{fontSize:"12px",color:"#6ee7b7"}}>{l}</span>
                <span style={{fontSize:"14px",fontWeight:700,color:"#fff"}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"16px"}}>
            <div style={{fontSize:"12px",fontWeight:700,color:"#374151",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:"10px"}}>🤝 Collective Fund</div>
            <div style={{fontSize:"13px",color:"#6b7280",marginBottom:"14px",lineHeight:"1.6"}}>Pool resources to collectively own land, tools & equipment.</div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"6px"}}>
              <span style={{fontWeight:600,color:"#111827"}}>Brooklyn Tool Library</span>
              <span style={{color:"#6b7280"}}>38%</span>
            </div>
            <div style={{background:"#f3f4f6",borderRadius:"999px",height:"6px",marginBottom:"6px",overflow:"hidden"}}>
              <div style={{background:"linear-gradient(90deg,#2d6a4f,#52b788)",width:"38%",height:"100%",borderRadius:"999px"}}/>
            </div>
            <div style={{fontSize:"11px",color:"#9ca3af",marginBottom:"14px"}}>$4,820 raised of $12,500 goal</div>
            <button style={{width:"100%",background:"#2d6a4f",border:"none",color:"#fff",padding:"9px",borderRadius:"8px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}
              onMouseEnter={e=>e.currentTarget.style.background="#1f4f3a"} onMouseLeave={e=>e.currentTarget.style.background="#2d6a4f"}>
              Contribute
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
