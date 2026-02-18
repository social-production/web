import { useState } from "react";
import { useNavigate } from "react-router-dom";

const EMOJI_OPTIONS = [
  "🌱","🏙️","🌉","🏠","🌿","🎨","📚","🏛️","💬","⚙️","🤝","🌍",
  "🔧","🍎","🎵","🏗️","📢","💡","🌊","🔬","🎭","🏡","🌾","⚡",
];

const COLOR_OPTIONS = [
  { label:"Forest",  value:"#2d6a4f" },
  { label:"Sky",     value:"#0ea5e9" },
  { label:"Amber",   value:"#f59e0b" },
  { label:"Rose",    value:"#ec4899" },
  { label:"Violet",  value:"#8b5cf6" },
  { label:"Red",     value:"#ef4444" },
  { label:"Teal",    value:"#14b8a6" },
  { label:"Indigo",  value:"#6366f1" },
];

export default function CreateChannelPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🌱");
  const [color, setColor] = useState("#2d6a4f");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Channel name is required";
    else if (name.length < 2) e.name = "Name must be at least 2 characters";
    if (!description.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) setSubmitted(true);
  };

  const inputStyle = (hasError) => ({
    width: "100%", border: `1px solid ${hasError ? "#fca5a5" : "#e5e7eb"}`,
    borderRadius: "8px", padding: "10px 14px", fontSize: "14px",
    fontFamily: "Inter,sans-serif", color: "#374151", outline: "none",
    background: hasError ? "#fff5f5" : "#fff", transition: "border-color 0.15s",
  });

  if (submitted) return (
    <div style={{fontFamily:"Inter,sans-serif",background:"#f6f7f8",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"16px",padding:"48px 40px",textAlign:"center",maxWidth:"400px",width:"100%"}}>
        <div style={{width:"56px",height:"56px",background:`linear-gradient(135deg,${color},${color}99)`,borderRadius:"14px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"26px",margin:"0 auto 16px"}}>
          {icon}
        </div>
        <h2 style={{fontSize:"20px",fontWeight:700,color:"#111827",marginBottom:"8px"}}>Channel created!</h2>
        <p style={{fontSize:"14px",color:"#6b7280",marginBottom:"8px",lineHeight:"1.6"}}>
          <strong style={{color:"#111827"}}>#{name}</strong> is ready.
        </p>
        <p style={{fontSize:"13px",color:"#9ca3af",marginBottom:"24px",lineHeight:"1.6"}}>
          Once the backend is connected this will be saved and visible to everyone.
        </p>
        <div style={{display:"flex",gap:"8px",justifyContent:"center"}}>
          <button onClick={()=>navigate("/")}
            style={{background:"#f3f4f6",border:"1px solid #e5e7eb",color:"#374151",padding:"9px 20px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"Inter,sans-serif"}}
            onMouseEnter={e=>e.currentTarget.style.background="#e5e7eb"}
            onMouseLeave={e=>e.currentTarget.style.background="#f3f4f6"}>
            Go to feed
          </button>
          <button onClick={()=>{setSubmitted(false);setName("");setDescription("");setIcon("🌱");setColor("#2d6a4f");}}
            style={{background:"#2d6a4f",border:"none",color:"#fff",padding:"9px 20px",borderRadius:"8px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}
            onMouseEnter={e=>e.currentTarget.style.background="#1a3d2b"}
            onMouseLeave={e=>e.currentTarget.style.background="#2d6a4f"}>
            Create another
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:"Inter,sans-serif",background:"#f6f7f8",minHeight:"100vh",color:"#1c1c1c"}}>

      {/* TOP NAV */}
      <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",height:"48px",display:"flex",alignItems:"center",padding:"0 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
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

      <div style={{maxWidth:"680px",margin:"0 auto",padding:"32px 16px"}}>

        <h1 style={{fontSize:"22px",fontWeight:700,color:"#111827",marginBottom:"4px",letterSpacing:"-0.3px"}}>Create a channel</h1>
        <p style={{fontSize:"14px",color:"#6b7280",marginBottom:"24px"}}>Channels organise posts by topic or geography. Anyone can create one.</p>

        {/* PREVIEW */}
        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"16px",marginBottom:"20px",display:"flex",alignItems:"center",gap:"14px"}}>
          <div style={{width:"48px",height:"48px",background:`${color}18`,border:`2px solid ${color}33`,borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",flexShrink:0}}>
            {icon}
          </div>
          <div>
            <div style={{fontSize:"16px",fontWeight:700,color:"#111827",marginBottom:"2px"}}>{name || "Channel name"}</div>
            <div style={{fontSize:"13px",color:"#9ca3af"}}>{description || "Channel description will appear here"}</div>
          </div>
          <div style={{marginLeft:"auto",fontSize:"11px",color:"#9ca3af",fontWeight:500}}>PREVIEW</div>
        </div>

        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"24px",marginBottom:"16px"}}>

          {/* Name */}
          <div style={{marginBottom:"20px"}}>
            <label style={{fontSize:"13px",fontWeight:600,color:"#374151",display:"block",marginBottom:"6px"}}>
              Channel name <span style={{color:"#ef4444"}}>*</span>
            </label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",fontSize:"14px",color:"#9ca3af",fontFamily:"Inter,sans-serif"}}>#</span>
              <input type="text" value={name} onChange={e=>setName(e.target.value.replace(/\s/g,"-").toLowerCase())}
                placeholder="east-village"
                maxLength={40}
                style={{...inputStyle(errors.name),paddingLeft:"28px"}}
                onFocus={e=>e.target.style.borderColor="#52b788"}
                onBlur={e=>e.target.style.borderColor=errors.name?"#fca5a5":"#e5e7eb"}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}>
              {errors.name
                ? <span style={{fontSize:"12px",color:"#ef4444"}}>{errors.name}</span>
                : <span style={{fontSize:"12px",color:"#9ca3af"}}>Lowercase, hyphens allowed. No spaces.</span>
              }
              <span style={{fontSize:"11px",color:"#9ca3af",marginLeft:"auto"}}>{name.length}/40</span>
            </div>
          </div>

          {/* Description */}
          <div style={{marginBottom:"20px"}}>
            <label style={{fontSize:"13px",fontWeight:600,color:"#374151",display:"block",marginBottom:"6px"}}>
              Description <span style={{color:"#ef4444"}}>*</span>
            </label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)}
              placeholder="What is this channel about? Who should subscribe?"
              maxLength={200}
              style={{...inputStyle(errors.description),minHeight:"90px",resize:"vertical"}}
              onFocus={e=>e.target.style.borderColor="#52b788"}
              onBlur={e=>e.target.style.borderColor=errors.description?"#fca5a5":"#e5e7eb"}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}>
              {errors.description && <span style={{fontSize:"12px",color:"#ef4444"}}>{errors.description}</span>}
              <span style={{fontSize:"11px",color:"#9ca3af",marginLeft:"auto"}}>{description.length}/200</span>
            </div>
          </div>

          {/* Icon picker */}
          <div style={{marginBottom:"20px"}}>
            <label style={{fontSize:"13px",fontWeight:600,color:"#374151",display:"block",marginBottom:"8px"}}>Icon</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
              {EMOJI_OPTIONS.map(e=>(
                <button key={e} onClick={()=>setIcon(e)} style={{
                  width:"38px",height:"38px",borderRadius:"8px",border: icon===e ? `2px solid #2d6a4f` : "1px solid #e5e7eb",
                  background: icon===e ? "#f0faf3" : "#fff",fontSize:"18px",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"border-color 0.1s",
                }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#52b788"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=icon===e?"#2d6a4f":"#e5e7eb"}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Colour picker */}
          <div>
            <label style={{fontSize:"13px",fontWeight:600,color:"#374151",display:"block",marginBottom:"8px"}}>Accent colour</label>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {COLOR_OPTIONS.map(c=>(
                <button key={c.value} onClick={()=>setColor(c.value)} style={{
                  display:"flex",alignItems:"center",gap:"6px",padding:"6px 12px",borderRadius:"999px",cursor:"pointer",
                  fontFamily:"Inter,sans-serif",fontSize:"12px",fontWeight:500,
                  border: color===c.value ? `2px solid ${c.value}` : "1px solid #e5e7eb",
                  background: color===c.value ? `${c.value}18` : "#fff",
                  color: color===c.value ? c.value : "#6b7280",
                }}>
                  <span style={{width:"10px",height:"10px",borderRadius:"50%",background:c.value,display:"inline-block",flexShrink:0}}/>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit row */}
        <div style={{display:"flex",gap:"10px",justifyContent:"flex-end"}}>
          <button onClick={()=>navigate(-1)}
            style={{background:"#fff",border:"1px solid #e5e7eb",color:"#6b7280",padding:"9px 20px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"Inter,sans-serif"}}
            onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"}
            onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
            Cancel
          </button>
          <button onClick={handleSubmit}
            style={{background:"#2d6a4f",border:"none",color:"#fff",padding:"9px 24px",borderRadius:"8px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}
            onMouseEnter={e=>e.currentTarget.style.background="#1a3d2b"}
            onMouseLeave={e=>e.currentTarget.style.background="#2d6a4f"}>
            Create channel
          </button>
        </div>
      </div>
    </div>
  );
}
