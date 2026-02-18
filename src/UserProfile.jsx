import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { mockThreads, mockComments, CARD, STATUS } from "./data";

const DARK_GREEN = "#1a3d2b";

const mockUsers = {
  "Rosa_M":       { username:"Rosa_M",       bio:"Community organizer in East Village. Passionate about urban gardens and mutual aid.", joined:"3 months ago", score:1247 },
  "commonist":    { username:"commonist",    bio:"Thinking about collective action and what it means to build together.", joined:"2 months ago", score:892 },
  "buildtogether":{ username:"buildtogether",bio:"Builder, maker, fixer. Let's share tools and skills.", joined:"4 months ago", score:1034 },
  "urbanwatch_k": { username:"urbanwatch_k", bio:"Watching urban planning decisions so you don't have to.", joined:"5 months ago", score:743 },
  "teach_bk":     { username:"teach_bk",     bio:"Educator and organiser based in Bushwick.", joined:"2 months ago", score:612 },
  "dekalb_arts":  { username:"dekalb_arts",  bio:"Arts collective on Dekalb Ave, Brooklyn.", joined:"6 months ago", score:2103 },
  "land_common":  { username:"land_common",  bio:"Researching collective land ownership models.", joined:"1 month ago", score:421 },
  "platform_q":   { username:"platform_q",   bio:"Thinking about how platforms shape communities.", joined:"2 months ago", score:334 },
};

function getAllComments(list) {
  let all = [];
  for (const c of list) {
    all.push(c);
    if (c.replies?.length) all = all.concat(getAllComments(c.replies));
  }
  return all;
}

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

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const user = mockUsers[username] || { username, bio:"No bio yet.", joined:"Recently", score:0 };
  const [activeTab, setActiveTab] = useState("Threads");
  const [projectFilter, setProjectFilter] = useState("All");
  const [votes, setVotes] = useState({});

  const vote = (id, dir) => setVotes(prev => ({ ...prev, [id]: prev[id] === dir ? null : dir }));
  const getScore = item => item.upvotes + (votes[item.id]==="up"?1:votes[item.id]==="down"?-1:0);

  // Threads created by user only
  const userThreads = mockThreads.filter(t => t.author === username && t.type === "thread");

  // All projects user is involved with (created OR joined as member)
  const allProjects = mockThreads.filter(t =>
    t.type === "project" && (t.author === username || t.members?.includes(username))
  );

  // Created = author
  const createdProjects = allProjects.filter(t => t.author === username);

  // Joined = member but NOT author
  const joinedProjects = allProjects.filter(t => t.author !== username && t.members?.includes(username));

  // Filtered list for the tab
  const displayProjects = projectFilter === "Created" ? createdProjects
    : projectFilter === "Joined" ? joinedProjects
    : allProjects;

  // Comments
  const allComments = getAllComments(mockComments);
  const userComments = allComments.filter(c => c.author === username);

  const tabs = [
    ["Threads",  "💬", userThreads.length],
    ["Projects", "🟢", allProjects.length],
    ["Comments", "🗨️", userComments.length],
  ];

  const PostCard = ({ item }) => {
    const cs = CARD[item.type];
    const isCreator = item.author === username;
    return (
      <div onClick={()=>navigate(`/post/${item.id}`)}
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
            {/* Creator badge */}
            {item.type === "project" && isCreator && (
              <span style={{fontSize:"11px",fontWeight:600,color:DARK_GREEN,background:"#e8f0eb",border:`1px solid ${DARK_GREEN}33`,padding:"2px 8px",borderRadius:"999px"}}>
                Creator
              </span>
            )}
            {item.channels.map(ch=>(
              <span key={ch} onClick={e=>{e.stopPropagation();navigate(`/channel/${encodeURIComponent(ch)}`);}}
                style={{fontSize:"11px",fontWeight:500,color:"#4a7c59",background:"#f0faf3",border:"1px solid #bbdec8",padding:"2px 8px",borderRadius:"999px",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.background="#ddf0e5"}
                onMouseLeave={e=>e.currentTarget.style.background="#f0faf3"}>
                {ch}
              </span>
            ))}
          </div>
          <div style={{fontSize:"15px",fontWeight:600,color:"#111827",marginBottom:"5px",lineHeight:"1.45"}}>{item.title}</div>
          <div style={{fontSize:"13px",color:"#6b7280",marginBottom:"10px",lineHeight:"1.6"}}>{item.description}</div>
          {item.image && (
            <div style={{marginTop:"10px",marginBottom:"8px",borderRadius:"8px",overflow:"hidden"}}>
              <img src={item.image} alt="" style={{width:"100%",height:"auto",maxHeight:"160px",objectFit:"cover",display:"block"}}/>
            </div>
          )}
          <div style={{display:"flex",gap:"14px",fontSize:"12px",color:"#9ca3af",alignItems:"center",flexWrap:"wrap"}}>
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
  };

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
          <button onClick={()=>navigate("/auth?mode=login")} style={{background:"#f3f4f6",border:"1px solid #e5e7eb",color:"#374151",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Log in</button>
          <button onClick={()=>navigate("/auth?mode=signup")} style={{background:"#2d6a4f",border:"none",color:"#fff",padding:"6px 16px",borderRadius:"8px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>Sign up</button>
        </div>
      </div>

      {/* PROFILE HEADER */}
      <div style={{background:"linear-gradient(135deg,#2d6a4f18,#2d6a4f08)",borderBottom:"1px solid #2d6a4f22"}}>
        <div style={{maxWidth:"1280px",margin:"0 auto",padding:"32px 32px 24px"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:"24px",flexWrap:"wrap"}}>
            <div style={{width:"80px",height:"80px",background:`linear-gradient(135deg,${DARK_GREEN},#2d6a4f)`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",fontWeight:700,color:"#fff",flexShrink:0}}>
              {username[0].toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:"300px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px",flexWrap:"wrap"}}>
                <h1 style={{fontSize:"28px",fontWeight:700,color:"#111827",letterSpacing:"-0.4px"}}>u/{username}</h1>
                <span style={{fontSize:"11px",fontWeight:600,color:"#52b788",background:"#f0faf3",padding:"3px 10px",borderRadius:"999px"}}>
                  {user.score} contribution score
                </span>
              </div>
              <p style={{fontSize:"15px",color:"#6b7280",marginBottom:"12px",lineHeight:"1.6",maxWidth:"600px"}}>{user.bio}</p>
              <div style={{display:"flex",gap:"20px",fontSize:"13px",color:"#9ca3af",flexWrap:"wrap"}}>
                <span>🗓️ Joined {user.joined}</span>
                <span>💬 {userThreads.length} threads</span>
                <span>🟢 {allProjects.length} projects</span>
                <span>🗨️ {userComments.length} comments</span>
              </div>
            </div>
            <button style={{background:"#2d6a4f",border:"none",color:"#fff",padding:"9px 20px",borderRadius:"8px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}
              onMouseEnter={e=>e.currentTarget.style.background=DARK_GREEN}
              onMouseLeave={e=>e.currentTarget.style.background="#2d6a4f"}>
              Send Message
            </button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:"1280px",margin:"0 auto",padding:"24px 32px",display:"flex",gap:"24px"}}>

        {/* MAIN CONTENT */}
        <div style={{flex:1,minWidth:0}}>

          {/* Tabs */}
          <div style={{display:"flex",alignItems:"center",borderBottom:"1px solid #e5e7eb",marginBottom:"16px"}}>
            {tabs.map(([tab,icon,count])=>(
              <button key={tab} onClick={()=>setActiveTab(tab)}
                style={{padding:"10px 16px",background:"none",border:"none",borderBottom:activeTab===tab?"2px solid #2d6a4f":"2px solid transparent",color:activeTab===tab?"#2d6a4f":"#6b7280",fontWeight:activeTab===tab?600:400,fontSize:"13px",cursor:"pointer",fontFamily:"Inter,sans-serif",marginBottom:"-1px",display:"flex",alignItems:"center",gap:"5px"}}>
                {icon} {tab}
                <span style={{fontSize:"11px",background:activeTab===tab?"#f0faf3":"#f3f4f6",color:activeTab===tab?"#2d6a4f":"#9ca3af",padding:"1px 6px",borderRadius:"999px",fontWeight:600}}>{count}</span>
              </button>
            ))}
          </div>

          {/* THREADS TAB */}
          {activeTab === "Threads" && (
            <>
              {userThreads.length === 0
                ? <div style={{textAlign:"center",padding:"56px 24px",color:"#9ca3af",fontSize:"14px",background:"#fff",borderRadius:"12px",border:"1px solid #e5e7eb"}}>No threads yet.</div>
                : userThreads.map(item => <PostCard key={item.id} item={item}/>)
              }
            </>
          )}

          {/* PROJECTS TAB */}
          {activeTab === "Projects" && (
            <>
              {/* Filter pills */}
              <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
                {["All","Created","Joined"].map(f=>(
                  <button key={f} onClick={()=>setProjectFilter(f)} style={{
                    padding:"5px 14px",borderRadius:"999px",fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",
                    border: projectFilter===f ? "none" : "1px solid #e5e7eb",
                    background: projectFilter===f ? DARK_GREEN : "#fff",
                    color: projectFilter===f ? "#fff" : "#6b7280",
                  }}>{f}</button>
                ))}
                <span style={{marginLeft:"auto",fontSize:"12px",color:"#9ca3af",alignSelf:"center"}}>{displayProjects.length} projects</span>
              </div>

              {displayProjects.length === 0
                ? <div style={{textAlign:"center",padding:"56px 24px",color:"#9ca3af",fontSize:"14px",background:"#fff",borderRadius:"12px",border:"1px solid #e5e7eb"}}>No {projectFilter.toLowerCase()} projects.</div>
                : displayProjects.map(item => <PostCard key={item.id} item={item}/>)
              }
            </>
          )}

          {/* COMMENTS TAB */}
          {activeTab === "Comments" && (
            <>
              {userComments.length === 0
                ? <div style={{textAlign:"center",padding:"56px 24px",color:"#9ca3af",fontSize:"14px",background:"#fff",borderRadius:"12px",border:"1px solid #e5e7eb"}}>No comments yet.</div>
                : userComments.map(c => {
                    const parentPost = mockThreads.find(t => t.id === c.postId);
                    return (
                      <div key={c.id} onClick={()=>navigate(`/post/${c.postId}`)}
                        style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"14px 16px",marginBottom:"8px",cursor:"pointer",transition:"box-shadow 0.15s,border-color 0.15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)";e.currentTarget.style.borderColor="#9ca3af";}}
                        onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor="#e5e7eb";}}>
                        {parentPost && (
                          <div style={{fontSize:"11px",color:"#9ca3af",marginBottom:"6px",fontWeight:500}}>
                            On: <span style={{color:"#2d6a4f"}}>{parentPost.title}</span>
                          </div>
                        )}
                        <div style={{fontSize:"14px",color:"#374151",lineHeight:"1.65",marginBottom:"8px"}}>{c.text}</div>
                        <div style={{display:"flex",gap:"12px",fontSize:"12px",color:"#9ca3af"}}>
                          <span>{c.time}</span>
                          <span>▲ {c.upvotes}</span>
                        </div>
                      </div>
                    );
                  })
              }
            </>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{width:"280px",flexShrink:0}}>
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"16px",marginBottom:"12px"}}>
            <div style={{fontSize:"12px",fontWeight:700,color:"#374151",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:"12px"}}>About</div>
            <div style={{fontSize:"13px",color:"#6b7280",lineHeight:"1.6"}}>{user.bio}</div>
          </div>

          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"16px"}}>
            <div style={{fontSize:"12px",fontWeight:700,color:"#374151",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:"12px"}}>Activity</div>
            {[
              ["Contribution score", user.score],
              ["Threads created",    userThreads.length],
              ["Projects created",   createdProjects.length],
              ["Projects joined",    joinedProjects.length],
              ["Comments made",      userComments.length],
              ["Member since",       user.joined],
            ].map(([label,val])=>(
              <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px",fontSize:"13px"}}>
                <span style={{color:"#9ca3af"}}>{label}</span>
                <span style={{fontWeight:600,color:"#111827"}}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
