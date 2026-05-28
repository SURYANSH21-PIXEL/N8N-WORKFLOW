import { useState, useEffect, useRef, useCallback } from "react";
import {
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line
} from "recharts";

/* ─── INJECT STYLES ─────────────────────────────────────────── */
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#030309;color:#dff0ec;font-family:'DM Sans',sans-serif;overflow-x:hidden;}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  @keyframes blink{0%,89%,100%{transform:scaleY(1)}93%{transform:scaleY(0.08)}}
  @keyframes pulse{0%,100%{opacity:.6;filter:drop-shadow(0 0 6px #00d4be)}50%{opacity:1;filter:drop-shadow(0 0 18px #00d4be) drop-shadow(0 0 36px #00d4be88)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
  @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(400%)}}
  @keyframes progressFill{from{width:0%}to{width:var(--w)}}
  @keyframes typingDot{0%,100%{opacity:.2}50%{opacity:1}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,212,190,.2)}50%{box-shadow:0 0 40px rgba(0,212,190,.5),0 0 80px rgba(0,212,190,.15)}}
  @keyframes particleDrift{0%{opacity:0;transform:translate(0,0)}10%{opacity:.8}90%{opacity:.2}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}
  @keyframes messageIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes creditPop{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
  .robot-float{animation:float 4s ease-in-out infinite;}
  .eye-blink{animation:blink 6s ease-in-out infinite;transform-origin:center;}
  .antenna-pulse{animation:pulse 2.5s ease-in-out infinite;cursor:pointer;}
  .fade-up{animation:fadeUp .5s ease-out both;}
  .slide-in{animation:slideIn .35s ease-out both;}
  .glow-box{animation:glow 3s ease-in-out infinite;}
  input[type=text],input[type=email],input[type=password],textarea{
    background:rgba(255,255,255,.04);border:1px solid rgba(0,212,190,.22);border-radius:10px;
    padding:13px 16px;color:#dff0ec;font-size:14px;outline:none;
    font-family:'DM Sans',sans-serif;transition:border-color .2s;width:100%;
  }
  input:focus,textarea:focus{border-color:#00d4be;}
  input::placeholder,textarea::placeholder{color:rgba(223,240,236,.35);}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:rgba(0,212,190,.3);border-radius:2px;}
  .nav-link{display:flex;align-items:center;gap:11px;padding:9px 14px;border-radius:9px;
    cursor:pointer;transition:all .18s;color:rgba(223,240,236,.48);font-size:13px;font-weight:500;
    border-left:2px solid transparent;}
  .nav-link:hover,.nav-link.active{background:rgba(0,212,190,.09);color:#00d4be;border-left-color:#00d4be;}
`;

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = { bg:"#030309", card:"rgba(255,255,255,.032)", border:"rgba(0,212,190,.18)", cyan:"#00d4be", cyanHi:"#00ffdd", muted:"rgba(223,240,236,.5)", text:"#dff0ec", orange:"#ff7040", purple:"#9d6fff" };
const glass = (r=14,extra={})=>({ background:C.card, border:`1px solid ${C.border}`, borderRadius:r, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", ...extra });

/* ─── BTN ─────────────────────────────────────────────────────── */
const Btn = ({children,onClick,ghost=false,style={}})=>(
  <button onClick={onClick} style={{
    background: ghost ? "transparent" : `linear-gradient(135deg,${C.cyan},#00a896)`,
    color: ghost ? C.cyan : "#030309",
    border: ghost ? `1px solid rgba(0,212,190,.35)` : "none",
    borderRadius:10, padding:"12px 26px", cursor:"pointer",
    fontFamily:"'Orbitron',monospace", fontSize:11, fontWeight:700,
    letterSpacing:"1.2px", transition:"all .2s", ...style
  }}
  onMouseEnter={e=>{e.target.style.transform="translateY(-2px)";e.target.style.boxShadow=ghost?"0 4px 18px rgba(0,212,190,.2)":"0 8px 28px rgba(0,212,190,.45)";}}
  onMouseLeave={e=>{e.target.style.transform="translateY(0)";e.target.style.boxShadow="none";}}
  >{children}</button>
);

/* ─── SIDEBAR ─────────────────────────────────────────────────── */
const NAV = [
  {id:"dashboard",icon:"⬡",label:"Dashboard"},
  {id:"chat",icon:"◈",label:"AI Chat"},
  {id:"resume",icon:"◉",label:"Resume Intel"},
  {id:"emotional",icon:"◍",label:"Emotional"},
  {id:"career",icon:"◎",label:"Career Path"},
  {id:"memory",icon:"◌",label:"Memory"},
  {id:"credits",icon:"◇",label:"Credits"},
  {id:"subscription",icon:"◆",label:"Plans"},
  {id:"settings",icon:"⊙",label:"Settings"},
];
const Sidebar = ({page,setPage,credits,user})=>(
  <div style={{width:210,background:"rgba(3,3,9,.9)", borderRight:`1px solid ${C.border}`, display:"flex",flexDirection:"column",height:"100vh",position:"fixed",left:0,top:0,zIndex:10,padding:"20px 12px",backdropFilter:"blur(30px)"}}>
    <div style={{padding:"4px 14px 20px",borderBottom:`1px solid ${C.border}`,marginBottom:12}}>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:C.cyan,letterSpacing:"2px",marginBottom:2}}>INTELLIGENCE</div>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:9,color:C.muted,letterSpacing:"3px"}}>RETENTION SYS</div>
    </div>
    <div style={{flex:1,overflow:"auto"}}>
      {NAV.map(n=>(
        <div key={n.id} className={`nav-link${page===n.id?" active":""}`} onClick={()=>setPage(n.id)}>
          <span style={{fontSize:15,opacity:.9}}>{n.icon}</span>
          <span>{n.label}</span>
        </div>
      ))}
    </div>
    <div style={{...glass(10),padding:"10px 12px",marginTop:8}}>
      <div style={{fontSize:10,color:C.muted,marginBottom:4,letterSpacing:"1px"}}>CREDITS</div>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:18,color:C.cyan}}>{credits}</div>
      <div style={{fontSize:10,color:C.muted,marginTop:2}}>{user?.plan || "Explorer"} Plan</div>
    </div>
    <div style={{padding:"12px 14px 0",display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.cyan},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#030309"}}>
        {(user?.name||"U")[0]}
      </div>
      <div>
        <div style={{fontSize:12,fontWeight:500}}>{user?.name||"User"}</div>
        <div style={{fontSize:10,color:C.muted}}>{user?.email||""}</div>
      </div>
    </div>
  </div>
);

/* ─── LAYOUT WRAPPER ──────────────────────────────────────────── */
const Layout = ({page,setPage,credits,user,children})=>(
  <div style={{display:"flex",background:C.bg,minHeight:"100vh"}}>
    <Sidebar page={page} setPage={setPage} credits={credits} user={user}/>
    <div style={{marginLeft:210,flex:1,minHeight:"100vh",padding:"32px 36px",maxWidth:"calc(100vw - 210px)"}}>
      {children}
    </div>
  </div>
);

/* ─── CARD ────────────────────────────────────────────────────── */
const Card=({children,style={}})=><div style={{...glass(),padding:22,...style}}>{children}</div>;

/* ─── STAT CARD ───────────────────────────────────────────────── */
const StatCard=({label,value,sub,color=C.cyan,icon})=>(
  <div style={{...glass(12),padding:"18px 20px",transition:"border-color .2s"}}
    onMouseEnter={e=>e.currentTarget.style.borderColor=`rgba(0,212,190,.4)`}
    onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
      <span style={{fontSize:11,color:C.muted,letterSpacing:"1px",textTransform:"uppercase"}}>{label}</span>
      <span style={{fontSize:18,opacity:.7}}>{icon}</span>
    </div>
    <div style={{fontFamily:"'Orbitron',monospace",fontSize:26,color,fontWeight:700,lineHeight:1}}>{value}</div>
    {sub && <div style={{fontSize:11,color:C.muted,marginTop:6}}>{sub}</div>}
  </div>
);

/* ─── PAGE TITLE ──────────────────────────────────────────────── */
const PageTitle=({title,sub})=>(
  <div style={{marginBottom:28}}>
    <h1 style={{fontFamily:"'Orbitron',monospace",fontSize:20,fontWeight:700,color:C.text,letterSpacing:"1px"}}>{title}</h1>
    {sub && <p style={{color:C.muted,fontSize:13,marginTop:4}}>{sub}</p>}
  </div>
);

/* ════════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════ */
function RobotFace({onAntennaClick}){
  return(
    <svg viewBox="0 0 340 400" width="340" height="400" className="robot-float">
      {/* Antenna left */}
      <g className="antenna-pulse" onClick={onAntennaClick}>
        <line x1="120" y1="55" x2="100" y2="8" stroke={C.cyan} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="100" cy="8" r="6" fill={C.cyan} opacity=".9"/>
        <circle cx="100" cy="8" r="10" fill="none" stroke={C.cyan} strokeWidth="1" opacity=".4"/>
      </g>
      {/* Antenna right */}
      <g className="antenna-pulse" onClick={onAntennaClick}>
        <line x1="220" y1="55" x2="240" y2="8" stroke={C.cyan} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="240" cy="8" r="6" fill={C.cyan} opacity=".9"/>
        <circle cx="240" cy="8" r="10" fill="none" stroke={C.cyan} strokeWidth="1" opacity=".4"/>
      </g>
      {/* Head body */}
      <rect x="70" y="55" width="200" height="180" rx="28" fill="rgba(10,10,18,.95)" stroke={C.cyan} strokeWidth="1.5"/>
      {/* Head shine */}
      <rect x="70" y="55" width="200" height="60" rx="28" fill="rgba(0,212,190,.04)"/>
      {/* Scan line */}
      <rect x="70" y="100" width="200" height="2" fill={C.cyan} opacity=".15" className="robot-float" style={{animationDuration:"2s"}}/>
      {/* Eyes */}
      <g className="eye-blink">
        <rect x="100" y="108" width="48" height="38" rx="10" fill="rgba(0,212,190,.12)" stroke={C.cyan} strokeWidth="1.2"/>
        <ellipse cx="124" cy="127" rx="14" ry="14" fill={C.cyan} opacity=".9"/>
        <ellipse cx="124" cy="127" rx="7" ry="7" fill="#030309"/>
        <ellipse cx="128" cy="123" rx="3" ry="3" fill={C.cyanHi} opacity=".8"/>
      </g>
      <g className="eye-blink" style={{animationDelay:"0.3s"}}>
        <rect x="192" y="108" width="48" height="38" rx="10" fill="rgba(0,212,190,.12)" stroke={C.cyan} strokeWidth="1.2"/>
        <ellipse cx="216" cy="127" rx="14" ry="14" fill={C.cyan} opacity=".9"/>
        <ellipse cx="216" cy="127" rx="7" ry="7" fill="#030309"/>
        <ellipse cx="220" cy="123" rx="3" ry="3" fill={C.cyanHi} opacity=".8"/>
      </g>
      {/* Nose */}
      <rect x="160" y="155" width="20" height="12" rx="4" fill="rgba(0,212,190,.2)" stroke={C.cyan} strokeWidth=".8"/>
      {/* Mouth */}
      <rect x="105" y="180" width="130" height="18" rx="8" fill="rgba(0,212,190,.08)" stroke={C.cyan} strokeWidth=".8"/>
      <rect x="112" y="186" width="20" height="6" rx="3" fill={C.cyan} opacity=".6"/>
      <rect x="140" y="186" width="20" height="6" rx="3" fill={C.cyan} opacity=".4"/>
      <rect x="168" y="186" width="20" height="6" rx="3" fill={C.cyan} opacity=".6"/>
      <rect x="196" y="186" width="20" height="6" rx="3" fill={C.cyan} opacity=".4"/>
      {/* Neck */}
      <rect x="150" y="235" width="40" height="24" rx="6" fill="rgba(10,10,18,.95)" stroke={C.cyan} strokeWidth="1"/>
      <rect x="158" y="240" width="6" height="14" rx="3" fill={C.cyan} opacity=".4"/>
      <rect x="168" y="240" width="6" height="14" rx="3" fill={C.cyan} opacity=".6"/>
      <rect x="178" y="240" width="6" height="14" rx="3" fill={C.cyan} opacity=".4"/>
      {/* Body */}
      <rect x="80" y="258" width="180" height="120" rx="20" fill="rgba(10,10,18,.95)" stroke={C.cyan} strokeWidth="1.5"/>
      {/* Chest panel */}
      <rect x="105" y="278" width="130" height="60" rx="10" fill="rgba(0,212,190,.06)" stroke={C.cyan} strokeWidth=".8"/>
      {/* Core orb */}
      <circle cx="170" cy="308" r="18" fill="rgba(0,212,190,.12)" stroke={C.cyan} strokeWidth="1.2"/>
      <circle cx="170" cy="308" r="10" fill={C.cyan} opacity=".7"/>
      <circle cx="166" cy="304" r="4" fill={C.cyanHi} opacity=".9"/>
      {/* Side lights */}
      <circle cx="97" cy="340" r="7" fill="rgba(0,212,190,.15)" stroke={C.cyan} strokeWidth=".8"/>
      <circle cx="97" cy="340" r="4" fill={C.orange} opacity=".8"/>
      <circle cx="243" cy="340" r="7" fill="rgba(0,212,190,.15)" stroke={C.cyan} strokeWidth=".8"/>
      <circle cx="243" cy="340" r="4" fill={C.purple} opacity=".8"/>
    </svg>
  );
}

function LandingPage({onActivate}){
  const [particles,setParticles]=useState([]);
  useEffect(()=>{
    setParticles(Array.from({length:18},(_,i)=>({
      id:i,x:Math.random()*100,y:Math.random()*100,
      dx:(Math.random()-0.5)*200,dy:(Math.random()-0.5)*200,
      size:Math.random()*3+1,delay:Math.random()*4,dur:Math.random()*6+4
    })));
  },[]);
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      {/* Grid bg */}
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(0,212,190,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,190,.05) 1px,transparent 1px)`,backgroundSize:"60px 60px",opacity:.5}}/>
      {/* Particles */}
      {particles.map(p=>(
        <div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,width:p.size,height:p.size,borderRadius:"50%",background:C.cyan,opacity:.6,animation:`particleDrift ${p.dur}s ${p.delay}s ease-in-out infinite alternate`,"--dx":`${p.dx}px`,"--dy":`${p.dy}px`}}/>
      ))}
      {/* Navbar */}
      <nav style={{position:"fixed",top:0,left:0,right:0,padding:"18px 60px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(3,3,9,.8)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`,zIndex:10}}>
        <div style={{fontFamily:"'Orbitron',monospace",fontSize:12,color:C.cyan,letterSpacing:"3px",fontWeight:700}}>IRS · INTELLIGENCE</div>
        <div style={{display:"flex",gap:28}}>
          {["Features","Pricing","Engine","Memory"].map(l=>(
            <span key={l} style={{fontSize:13,color:C.muted,cursor:"pointer",transition:"color .2s"}}
              onMouseEnter={e=>e.target.style.color=C.cyan}
              onMouseLeave={e=>e.target.style.color=C.muted}>{l}</span>
          ))}
        </div>
        <Btn onClick={onActivate} style={{padding:"9px 20px",fontSize:10}}>LOGIN</Btn>
      </nav>
      {/* Main content */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0,position:"relative",zIndex:1}}>
        <RobotFace onAntennaClick={onActivate}/>
        <div style={{textAlign:"center",marginTop:24,maxWidth:520}}>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:C.cyan,letterSpacing:"4px",marginBottom:16,opacity:.8}}>INTELLIGENCE RETENTION SYSTEM</div>
          <h1 style={{fontFamily:"'Orbitron',monospace",fontSize:28,fontWeight:900,lineHeight:1.3,color:C.text,marginBottom:14}}>
            Value my credit,<br/>
            <span style={{color:C.cyan}}>take upfront respect</span><br/>
            of your own knowledge.
          </h1>
          <p style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:28}}>
            Your intelligence deserves memory. An AI career companion that learns, adapts, and grows with you.
          </p>
          <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
            <Btn onClick={onActivate}>ACTIVATE INTELLIGENCE</Btn>
            <Btn onClick={onActivate} ghost>SYNC AI JOB ACCELERATOR</Btn>
          </div>
          <p style={{fontSize:11,color:`rgba(223,240,236,.3)`,marginTop:18}}>↑ Click either antenna to begin</p>
        </div>
      </div>
      {/* Footer */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"14px 60px",display:"flex",justifyContent:"center",gap:28,background:"rgba(3,3,9,.6)",borderTop:`1px solid ${C.border}`}}>
        {["Privacy","AI Ethics","Contact","API","Terms"].map(l=>(
          <span key={l} style={{fontSize:11,color:`rgba(223,240,236,.3)`,cursor:"pointer"}}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   AUTH PAGE
═══════════════════════════════════════════════════════════════ */
function AuthPage({onAuth}){
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [name,setName]=useState("");
  const [loading,setLoading]=useState(false);
  const handle=()=>{
    if(!email) return;
    setLoading(true);
    setTimeout(()=>onAuth({name:name||email.split("@")[0]||"User",email,plan:"Explorer"}),1400);
  };
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",backgroundImage:`radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,212,190,.06) 0%, transparent 70%)`}}>
      <div className="fade-up" style={{...glass(18),padding:"42px 40px",width:400,maxWidth:"95vw"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:20,fontWeight:700,color:C.cyan,marginBottom:6}}>⬡ IRS</div>
          <h2 style={{fontFamily:"'Orbitron',monospace",fontSize:14,fontWeight:600,color:C.text}}>
            {mode==="login"?"Welcome Back":"Create Account"}
          </h2>
          <p style={{color:C.muted,fontSize:12,marginTop:4}}>Intelligence awaits your return</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:18}}>
          {mode==="signup" && (
            <input type="text" placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)}/>
          )}
          <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}/>
          <input type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)}/>
        </div>
        <Btn onClick={handle} style={{width:"100%",textAlign:"center",display:"block",opacity:loading?.7:1}}>
          {loading ? "AUTHENTICATING..." : mode==="login"?"ACTIVATE SESSION":"CREATE ACCOUNT"}
        </Btn>
        <div style={{margin:"18px 0",borderTop:`1px solid ${C.border}`,position:"relative"}}>
          <span style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:"rgba(12,12,24,.9)",padding:"0 10px",fontSize:11,color:C.muted}}>OR</span>
        </div>
        <div style={{display:"flex",gap:10}}>
          <Btn ghost onClick={handle} style={{flex:1,textAlign:"center",fontSize:10}}>G Google</Btn>
          <Btn ghost onClick={handle} style={{flex:1,textAlign:"center",fontSize:10}}>in LinkedIn</Btn>
        </div>
        <p style={{textAlign:"center",fontSize:12,color:C.muted,marginTop:18}}>
          {mode==="login"?"No account? ":"Already synced? "}
          <span style={{color:C.cyan,cursor:"pointer"}} onClick={()=>setMode(mode==="login"?"signup":"login")}>
            {mode==="login"?"Create one →":"Sign in →"}
          </span>
        </p>
        <p style={{textAlign:"center",fontSize:11,color:`rgba(223,240,236,.3)`,marginTop:8,cursor:"pointer"}}>✦ Magic link · Forgot password</p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SYNC PAGE
═══════════════════════════════════════════════════════════════ */
function SyncPage({onDone}){
  const [step,setStep]=useState(0);
  const items=["Resume & Documents","Career History","Target Salary & Industry","Behavioral Profile","Interview Records","Strength & Weakness Map","Emotional Baseline","Communication Score"];
  useEffect(()=>{
    let i=0;
    const iv=setInterval(()=>{
      i++;setStep(i);
      if(i>=items.length){clearInterval(iv);setTimeout(onDone,800);}
    },400);
    return ()=>clearInterval(iv);
  },[]);
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:28}}>
      <div style={{textAlign:"center",marginBottom:8}}>
        <div style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:C.cyan,letterSpacing:"4px",marginBottom:10}}>AI JOB ACCELERATOR SYNC</div>
        <h2 style={{fontFamily:"'Orbitron',monospace",fontSize:20,fontWeight:700}}>Importing Intelligence Data</h2>
        <p style={{color:C.muted,fontSize:13,marginTop:8}}>Connecting to your career intelligence profile…</p>
      </div>
      {/* Spinner */}
      <div style={{position:"relative",width:90,height:90}}>
        <div style={{position:"absolute",inset:0,border:`2px solid ${C.border}`,borderTop:`2px solid ${C.cyan}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <div style={{position:"absolute",inset:10,border:`2px solid ${C.border}`,borderBottom:`2px solid ${C.purple}`,borderRadius:"50%",animation:"spin 1.5s linear infinite reverse"}}/>
        <div style={{position:"absolute",inset:20,background:C.cyan,borderRadius:"50%",opacity:.2}}/>
        <div style={{position:"absolute",inset:22,background:C.cyan,borderRadius:"50%",opacity:.6}}/>
      </div>
      {/* Progress */}
      <div style={{...glass(12),padding:"22px 28px",width:380,maxWidth:"90vw"}}>
        <div style={{marginBottom:14,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:12,color:C.muted}}>Import Progress</span>
          <span style={{fontFamily:"'Orbitron',monospace",fontSize:12,color:C.cyan}}>{Math.round(step/items.length*100)}%</span>
        </div>
        <div style={{height:4,background:"rgba(255,255,255,.06)",borderRadius:2,marginBottom:16,overflow:"hidden"}}>
          <div style={{height:"100%",background:C.cyan,borderRadius:2,transition:"width .4s ease",width:`${step/items.length*100}%`}}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {items.map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,opacity:i<step?1:.35,transition:"opacity .3s"}}>
              <div style={{width:16,height:16,borderRadius:"50%",background:i<step?C.cyan:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#030309",fontWeight:700,flexShrink:0,transition:"background .3s"}}>
                {i<step?"✓":""}
              </div>
              <span style={{fontSize:12,color:i<step?C.text:C.muted}}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
═══════════════════════════════════════════════════════════════ */
const growthData=[{m:"Jan",score:58},{m:"Feb",score:62},{m:"Mar",score:67},{m:"Apr",score:71},{m:"May",score:75},{m:"Jun",score:78},{m:"Jul",score:82}];
const radarData=[{s:"Resume",v:74},{s:"Emotional",v:68},{s:"Comms",v:81},{s:"AI Ready",v:88},{s:"Knowledge",v:72},{s:"Interview",v:65}];
function DashboardPage({user}){
  return(
    <div className="fade-up">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
        <div>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:C.cyan,letterSpacing:"3px",marginBottom:6}}>WELCOME BACK</div>
          <h1 style={{fontFamily:"'Orbitron',monospace",fontSize:22,fontWeight:700}}>{user?.name||"Intelligence Agent"}</h1>
          <p style={{color:C.muted,fontSize:13,marginTop:4}}>Your intelligence matrix is active and learning</p>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Daily Credits Reset</div>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:16,color:C.cyan}}>06:42:18</div>
        </div>
      </div>
      {/* Stat cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
        <StatCard label="Career Acceleration" value="82" sub="+7 from last week" icon="🚀" color={C.cyan}/>
        <StatCard label="Resume Strength" value="74%" sub="ATS optimized" icon="📄" color={C.purple}/>
        <StatCard label="Emotional Stability" value="Good" sub="Burnout risk: Low" icon="💡" color="#00e87a"/>
        <StatCard label="Communication Score" value="81/100" sub="Top 15% in network" icon="◈" color={C.cyan}/>
        <StatCard label="AI Readiness Index" value="88%" sub="Model: Elite tier" icon="⬡" color={C.orange}/>
        <StatCard label="Knowledge Utilization" value="72%" sub="3 gaps identified" icon="◌" color={C.purple}/>
      </div>
      {/* Charts row */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1.2fr",gap:16,marginBottom:24}}>
        <Card>
          <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:16}}>INTELLIGENCE GROWTH TREND</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.cyan} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={C.cyan} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="m" stroke="rgba(223,240,236,.3)" tick={{fontSize:10,fill:"rgba(223,240,236,.5)"}}/>
              <YAxis domain={[50,90]} stroke="rgba(223,240,236,.3)" tick={{fontSize:10,fill:"rgba(223,240,236,.5)"}}/>
              <Tooltip contentStyle={{background:"rgba(10,10,20,.9)",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}}/>
              <Area type="monotone" dataKey="score" stroke={C.cyan} fill="url(#cg)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:16}}>INTELLIGENCE RADAR</div>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(0,212,190,.15)"/>
              <PolarAngleAxis dataKey="s" tick={{fontSize:9,fill:"rgba(223,240,236,.6)"}}/>
              <Radar dataKey="v" stroke={C.cyan} fill={C.cyan} fillOpacity={0.15} strokeWidth={1.5}/>
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {/* Suggestions */}
      <Card>
        <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:16}}>AI RECOMMENDATIONS</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[
            {icon:"📄",text:"Optimize resume for Senior Product roles — 3 missing keywords identified",tag:"Resume"},
            {icon:"🎤",text:"Practice STAR method — your behavioral responses score 62% clarity",tag:"Interview"},
            {icon:"📚",text:"Add Python ML certification to boost AI Readiness from 88% to 94%",tag:"Skills"},
            {icon:"💬",text:"Communication score dip on Tuesdays — likely fatigue pattern detected",tag:"Wellness"},
          ].map((r,i)=>(
            <div key={i} style={{...glass(9),padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:16}}>{r.icon}</span>
              <span style={{fontSize:12,color:C.text,flex:1}}>{r.text}</span>
              <span style={{fontSize:10,background:"rgba(0,212,190,.12)",color:C.cyan,padding:"3px 8px",borderRadius:20,flexShrink:0}}>{r.tag}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   AI CHAT PAGE
═══════════════════════════════════════════════════════════════ */
function ChatPage({credits,setCredits}){
  const [msgs,setMsgs]=useState([
    {role:"assistant",text:"Your intelligence matrix is active. I remember your career trajectory and emotional patterns from our last 12 sessions. How can I support your growth today?",ts:"Now"}
  ]);
  const [input,setInput]=useState("");
  const [typing,setTyping]=useState(false);
  const [history,setHistory]=useState([]);
  const endRef=useRef();

  const SYSTEM=`You are the Intelligence Retention System (IRS) — an elite AI career and emotional intelligence companion. You are:
- Calm, observant, emotionally aware, and strategically focused
- A mentor figure — not robotic, not overly cheerful
- Expert in career development, resume optimization, interview prep, emotional wellness
- Aware that you track the user's memory, emotional patterns, and career trajectory
- You speak concisely and with depth. You never use bullet points excessively.
Keep responses under 120 words. Be warm, intelligent, and precise.`;

  const sendMsg=useCallback(async()=>{
    if(!input.trim()||typing) return;
    const userMsg=input.trim();
    setInput("");
    const cost=userMsg.length>100?5:1;
    setCredits(c=>Math.max(0,c-cost));
    const newMsgs=[...msgs,{role:"user",text:userMsg,ts:"Now"}];
    setMsgs(newMsgs);
    setTyping(true);
    try{
      const apiHistory=[...history,{role:"user",content:userMsg}];
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:SYSTEM,
          messages:apiHistory
        })
      });
      const data=await res.json();
      const reply=data.content?.[0]?.text||"My neural pathways are recalibrating. Please try again.";
      setHistory([...apiHistory,{role:"assistant",content:reply}]);
      setMsgs(m=>[...m,{role:"assistant",text:reply,ts:"Now"}]);
    }catch{
      setMsgs(m=>[...m,{role:"assistant",text:"Neural link interrupted. Reconnecting to intelligence grid...",ts:"Now"}]);
    }
    setTyping(false);
  },[input,msgs,typing,history,credits]);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,typing]);

  const suggestions=["Analyze my resume weaknesses","I'm feeling burned out","Help me prep for an interview","What skills should I develop?"];

  return(
    <div style={{height:"calc(100vh - 64px)",display:"flex",flexDirection:"column",gap:0}}>
      <PageTitle title="AI Intelligence Chat" sub="Emotionally aware · Memory-enabled · Career-focused"/>
      <div style={{display:"flex",flex:1,gap:16,minHeight:0}}>
        {/* Sidebar */}
        <div style={{width:200,display:"flex",flexDirection:"column",gap:12,flexShrink:0}}>
          <Card style={{padding:16}}>
            <div style={{fontSize:10,color:C.muted,letterSpacing:"1.5px",marginBottom:10}}>CREDITS LEFT</div>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:24,color:C.cyan}}>{credits}</div>
            <div style={{height:3,background:"rgba(255,255,255,.06)",borderRadius:2,marginTop:8}}>
              <div style={{height:"100%",background:C.cyan,borderRadius:2,width:`${Math.min(100,credits/5)}%`,transition:"width .4s"}}/>
            </div>
            <div style={{fontSize:10,color:C.muted,marginTop:6}}>Chat: 1–5 cr/msg</div>
          </Card>
          <Card style={{padding:16,flex:1}}>
            <div style={{fontSize:10,color:C.muted,letterSpacing:"1.5px",marginBottom:10}}>MEMORY TAGS</div>
            {["Career Stress","Resume","Interview Prep","Skills","Burnout"].map(t=>(
              <div key={t} style={{fontSize:11,padding:"5px 8px",borderRadius:6,background:"rgba(0,212,190,.08)",color:C.cyan,marginBottom:5,cursor:"pointer"}}>{t}</div>
            ))}
          </Card>
        </div>
        {/* Chat area */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          <div style={{...glass(14),flex:1,padding:"20px 24px",overflowY:"auto",marginBottom:12,display:"flex",flexDirection:"column",gap:14}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",gap:10,justifyContent:m.role==="user"?"flex-end":"flex-start",animation:"messageIn .3s ease-out"}}>
                {m.role==="assistant" && (
                  <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.cyan},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0,marginTop:2}}>⬡</div>
                )}
                <div style={{...glass(12,{}),padding:"11px 15px",maxWidth:"72%",background:m.role==="user"?`linear-gradient(135deg,rgba(0,212,190,.18),rgba(157,111,255,.12))`:"rgba(255,255,255,.04)"}}>
                  <p style={{fontSize:13,lineHeight:1.65,color:C.text}}>{m.text}</p>
                  <div style={{fontSize:10,color:C.muted,marginTop:5,textAlign:"right"}}>{m.ts}</div>
                </div>
                {m.role==="user" && (
                  <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.orange},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0,marginTop:2}}>U</div>
                )}
              </div>
            ))}
            {typing && (
              <div style={{display:"flex",gap:10}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.cyan},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>⬡</div>
                <div style={{...glass(12),padding:"14px 18px"}}>
                  <span className="typing-dot" style={{width:7,height:7,borderRadius:"50%",background:C.cyan,display:"inline-block",margin:"0 3px",animation:"typingDot 1.2s ease infinite"}}/>
                  <span className="typing-dot" style={{width:7,height:7,borderRadius:"50%",background:C.cyan,display:"inline-block",margin:"0 3px",animation:"typingDot 1.2s ease .2s infinite"}}/>
                  <span className="typing-dot" style={{width:7,height:7,borderRadius:"50%",background:C.cyan,display:"inline-block",margin:"0 3px",animation:"typingDot 1.2s ease .4s infinite"}}/>
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>
          {/* Suggestions */}
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
            {suggestions.map(s=>(
              <div key={s} onClick={()=>setInput(s)} style={{fontSize:11,padding:"6px 12px",borderRadius:20,background:"rgba(0,212,190,.08)",border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,212,190,.15)";e.currentTarget.style.color=C.cyan;}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,212,190,.08)";e.currentTarget.style.color=C.muted;}}
              >{s}</div>
            ))}
          </div>
          {/* Input bar */}
          <div style={{...glass(12),padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-end"}}>
            <textarea value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}}
              placeholder="Speak to your intelligence companion..." rows={1}
              style={{flex:1,resize:"none",lineHeight:1.5,border:"none",background:"transparent",outline:"none"}}/>
            <div style={{display:"flex",gap:8}}>
              <div style={{width:36,height:36,borderRadius:9,background:"rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14}}>📎</div>
              <div style={{width:36,height:36,borderRadius:9,background:"rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14}}>🎙</div>
              <div onClick={sendMsg} style={{width:36,height:36,borderRadius:9,background:`linear-gradient(135deg,${C.cyan},#00a896)`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,transition:"all .2s"}}
                onMouseEnter={e=>e.currentTarget.style.transform="scale(1.08)"}
                onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>▶</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   RESUME PAGE
═══════════════════════════════════════════════════════════════ */
function ResumePage({credits,setCredits}){
  const [state,setState]=useState("idle");
  const [score,setScore]=useState(null);
  const analyze=()=>{
    setState("scanning");
    setCredits(c=>Math.max(0,c-25));
    setTimeout(()=>{setState("done");setScore(74);},2400);
  };
  const bars=[{l:"ATS Compatibility",v:86},{l:"Keyword Density",v:68},{l:"Formatting Score",v:91},{l:"Impact Statements",v:62},{l:"Quantified Results",v:55},{l:"Action Verbs",v:79}];
  return(
    <div className="fade-up">
      <PageTitle title="Resume Intelligence" sub="ATS analysis · Keyword scanning · AI rewrite generation"/>
      <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:18}}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:16}}>UPLOAD RESUME</div>
            <div style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:"36px 24px",textAlign:"center",cursor:"pointer",transition:"border-color .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.cyan}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
              onClick={()=>state==="idle"&&analyze()}>
              <div style={{fontSize:32,marginBottom:12}}>📄</div>
              <div style={{fontSize:14,color:C.text,marginBottom:6}}>Drop resume here or click to upload</div>
              <div style={{fontSize:11,color:C.muted}}>PDF, DOCX — Max 10MB · Costs 25 credits</div>
            </div>
            {state==="idle" && <Btn onClick={analyze} style={{width:"100%",marginTop:14,textAlign:"center"}}>ANALYZE RESUME (25 cr)</Btn>}
            {state==="scanning" && (
              <div style={{marginTop:16}}>
                <div style={{fontSize:12,color:C.cyan,marginBottom:8,fontFamily:"'Orbitron',monospace"}}>Scanning…</div>
                {["Parsing document structure","ATS compatibility check","Keyword extraction","Impact analysis","Generating recommendations"].map((s,i)=>(
                  <div key={i} style={{fontSize:11,color:C.muted,padding:"4px 0",display:"flex",gap:8}}>
                    <span style={{color:C.cyan}}>›</span>{s}
                    <span style={{animation:`typingDot 1s ${i*0.2}s ease infinite`,display:"inline-block"}}>…</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          {state==="done" && (
            <Card>
              <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:16}}>WEAKNESS ANALYSIS</div>
              {["Missing: ML/AI keywords for target roles","Quantify impact in 4 bullet points","LinkedIn URL not included","No GitHub portfolio link"].map((w,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:9,alignItems:"flex-start"}}>
                  <span style={{color:C.orange,flexShrink:0,fontSize:13}}>⚠</span>
                  <span style={{fontSize:12,color:C.text}}>{w}</span>
                </div>
              ))}
              <Btn style={{width:"100%",marginTop:14,textAlign:"center",fontSize:10}}>GENERATE AI REWRITE</Btn>
            </Card>
          )}
        </div>
        {state==="done" && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <Card>
              <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:16}}>OVERALL SCORE</div>
              <div style={{textAlign:"center",marginBottom:16}}>
                <div style={{fontFamily:"'Orbitron',monospace",fontSize:56,fontWeight:900,color:C.cyan,lineHeight:1}}>{score}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:4}}>/ 100 · Above Average</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {bars.map(b=>(
                  <div key={b.l}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                      <span style={{color:C.muted}}>{b.l}</span>
                      <span style={{color:b.v>75?C.cyan:b.v>60?C.purple:C.orange,fontFamily:"'Orbitron',monospace",fontSize:11}}>{b.v}%</span>
                    </div>
                    <div style={{height:4,background:"rgba(255,255,255,.06)",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:2,transition:"width 1s ease",width:`${b.v}%`,background:b.v>75?C.cyan:b.v>60?C.purple:C.orange}}/>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   EMOTIONAL PAGE
═══════════════════════════════════════════════════════════════ */
const moodData=[{d:"Mon",e:72},{d:"Tue",e:65},{d:"Wed",e:58},{d:"Thu",e:71},{d:"Fri",e:76},{d:"Sat",e:82},{d:"Sun",e:79}];
function EmotionalPage(){
  const [mood,setMood]=useState(null);
  const moods=[{e:"🌟",l:"Energized"},{e:"😌",l:"Calm"},{e:"😐",l:"Neutral"},{e:"😔",l:"Low"},{e:"🔥",l:"Stressed"}];
  return(
    <div className="fade-up">
      <PageTitle title="Emotional Guidance" sub="Burnout detection · Confidence meter · Wellness intelligence"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
        <StatCard label="Burnout Risk" value="Low" sub="Patterns: Stable" icon="💚" color="#00e87a"/>
        <StatCard label="Confidence Index" value="73%" sub="Rising +5% this week" icon="⭐" color={C.cyan}/>
        <StatCard label="Energy Pattern" value="Peak AM" sub="Best focus: 9–11am" icon="⚡" color={C.orange}/>
        <StatCard label="Recovery Score" value="81/100" sub="Sleep quality detected" icon="🌙" color={C.purple}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:18}}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:16}}>EMOTIONAL TREND — 7 DAYS</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={moodData}>
                <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.purple} stopOpacity={0.3}/><stop offset="95%" stopColor={C.purple} stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="d" stroke="rgba(223,240,236,.3)" tick={{fontSize:10,fill:"rgba(223,240,236,.5)"}}/>
                <YAxis domain={[40,100]} stroke="rgba(223,240,236,.3)" tick={{fontSize:10,fill:"rgba(223,240,236,.5)"}}/>
                <Tooltip contentStyle={{background:"rgba(10,10,20,.9)",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}}/>
                <Area type="monotone" dataKey="e" stroke={C.purple} fill="url(#eg)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:14}}>AI WELLNESS INSIGHTS</div>
            {["Your energy peaks on Friday — schedule important interviews then","Wednesday dip pattern detected — plan lighter tasks","Social interaction boost noted after team calls","3+ hours of focused work correlates with higher next-day score"].map((i,idx)=>(
              <div key={idx} style={{fontSize:12,color:C.text,padding:"9px 0",borderBottom:`1px solid ${C.border}`,lineHeight:1.6,display:"flex",gap:8}}>
                <span style={{color:C.cyan,flexShrink:0}}>◈</span>{i}
              </div>
            ))}
          </Card>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:14}}>HOW ARE YOU TODAY?</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {moods.map(m=>(
                <div key={m.l} onClick={()=>setMood(m.l)} style={{...glass(10),padding:"12px 14px",display:"flex",gap:12,alignItems:"center",cursor:"pointer",borderColor:mood===m.l?C.cyan:C.border,transition:"all .2s"}}>
                  <span style={{fontSize:22}}>{m.e}</span>
                  <span style={{fontSize:13,color:mood===m.l?C.cyan:C.text}}>{m.l}</span>
                  {mood===m.l && <span style={{marginLeft:"auto",color:C.cyan,fontSize:12}}>✓</span>}
                </div>
              ))}
            </div>
            {mood && <div style={{marginTop:14,fontSize:12,color:C.muted,lineHeight:1.6,padding:"10px 12px",background:"rgba(0,212,190,.06)",borderRadius:9}}>
              Logged: <span style={{color:C.cyan}}>{mood}</span>. Pattern analysis updated. Your AI companion has noted this for contextual support.
            </div>}
          </Card>
          <Card>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:12}}>RECOMMENDED NOW</div>
            {["5-min breathing technique","Review one achievement today","Step away from screen for 10 min","Hydrate + light movement"].map((r,i)=>(
              <div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:i<3?`1px solid ${C.border}`:"none",fontSize:12,color:C.text}}>
                <span style={{color:C.purple}}>◍</span>{r}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CAREER PAGE
═══════════════════════════════════════════════════════════════ */
function CareerPage(){
  const stages=[
    {title:"Now",role:"Mid-Level Developer",salary:"₹12L",skills:["React","Node.js","SQL"],color:C.cyan},
    {title:"6 Months",role:"Senior Engineer",salary:"₹18L",skills:["System Design","Leadership","Cloud"],color:C.purple},
    {title:"1 Year",role:"Tech Lead",salary:"₹26L",skills:["Architecture","Team Mgmt","AI/ML"],color:C.orange},
    {title:"2 Years",role:"Principal / Staff",salary:"₹40L+",skills:["Strategy","Cross-team","Innovation"],color:"#00e87a"},
  ];
  return(
    <div className="fade-up">
      <PageTitle title="Career Pathway" sub="AI-generated roadmap · Salary projections · Skill timeline"/>
      {/* Roadmap */}
      <Card style={{marginBottom:18}}>
        <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:24}}>YOUR AI-GENERATED CAREER TRAJECTORY</div>
        <div style={{display:"flex",gap:0,overflowX:"auto",paddingBottom:8}}>
          {stages.map((s,i)=>(
            <div key={i} style={{flex:1,minWidth:160,display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
              {i<stages.length-1 && (
                <div style={{position:"absolute",top:20,left:"60%",right:"-40%",height:2,background:`linear-gradient(90deg,${s.color},${stages[i+1].color})`,zIndex:0}}/>
              )}
              <div style={{width:40,height:40,borderRadius:"50%",background:`rgba(0,0,0,.8)`,border:`2px solid ${s.color}`,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1,boxShadow:`0 0 16px ${s.color}44`}}>
                <div style={{width:14,height:14,borderRadius:"50%",background:s.color}}/>
              </div>
              <div style={{fontSize:10,color:s.color,fontFamily:"'Orbitron',monospace",marginTop:10,letterSpacing:"1px"}}>{s.title}</div>
              <div style={{fontSize:13,fontWeight:600,color:C.text,textAlign:"center",marginTop:6,lineHeight:1.3}}>{s.role}</div>
              <div style={{fontFamily:"'Orbitron',monospace",fontSize:14,color:s.color,marginTop:6}}>{s.salary}</div>
              <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
                {s.skills.map(sk=>(
                  <span key={sk} style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:`rgba(0,0,0,.5)`,border:`1px solid ${s.color}44`,color:C.muted}}>{sk}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
      {/* Industry recommendations */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card>
          <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:14}}>RECOMMENDED INDUSTRIES</div>
          {[{n:"AI/ML Engineering",match:92,color:C.cyan},{n:"FinTech Product",match:87,color:C.purple},{n:"SaaS Platforms",match:84,color:C.orange},{n:"EdTech",match:76,color:"#00e87a"}].map(ind=>(
            <div key={ind.n} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                <span style={{color:C.text}}>{ind.n}</span>
                <span style={{color:ind.color,fontFamily:"'Orbitron',monospace",fontSize:11}}>{ind.match}%</span>
              </div>
              <div style={{height:4,background:"rgba(255,255,255,.06)",borderRadius:2}}>
                <div style={{height:"100%",borderRadius:2,background:ind.color,width:`${ind.match}%`,transition:"width 1s ease"}}/>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:14}}>PRIORITY SKILLS TO ACQUIRE</div>
          {[
            {skill:"System Design",urgency:"High",time:"3 months",icon:"🏗"},
            {skill:"Python ML Basics",urgency:"High",time:"2 months",icon:"🤖"},
            {skill:"Team Leadership",urgency:"Med",time:"Ongoing",icon:"👥"},
            {skill:"Cloud Architecture",urgency:"Med",time:"4 months",icon:"☁"},
          ].map(s=>(
            <div key={s.skill} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:18}}>{s.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,color:C.text}}>{s.skill}</div>
                <div style={{fontSize:10,color:C.muted}}>{s.time}</div>
              </div>
              <span style={{fontSize:10,padding:"3px 8px",borderRadius:20,background:s.urgency==="High"?`rgba(255,112,64,.15)`:`rgba(0,212,190,.1)`,color:s.urgency==="High"?C.orange:C.cyan}}>{s.urgency}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MEMORY PAGE
═══════════════════════════════════════════════════════════════ */
function MemoryPage(){
  const events=[
    {date:"Today",time:"09:14",type:"Chat",text:"Discussed interview nerves for upcoming Razorpay round","tag":"Interview"},
    {date:"Yesterday",time:"14:30",type:"Resume",text:"Resume scan: 74/100. Added ML keywords suggestion.","tag":"Resume"},
    {date:"Mon",time:"11:05",type:"Emotion",text:"Emotional low detected — stress from project deadline","tag":"Wellness"},
    {date:"Sat",time:"16:22",type:"Career",text:"Career pathway generated — Senior Engineer in 6 months","tag":"Career"},
    {date:"Last Week",time:"10:00",type:"Chat",text:"Explored transition from fullstack to ML engineering","tag":"Skills"},
    {date:"2 Weeks",time:"09:45",type:"Upload",text:"Uploaded portfolio: 3 projects analyzed, 2 missing metrics","tag":"Resume"},
    {date:"3 Weeks",time:"15:00",type:"Emotion",text:"High energy day — peak performance logged","tag":"Wellness"},
  ];
  const typeColor={Chat:C.cyan,Resume:C.purple,Emotion:"#00e87a",Career:C.orange,Upload:C.muted,Skills:C.cyan};
  return(
    <div className="fade-up">
      <PageTitle title="Memory Timeline" sub="Persistent AI memory · Learned preferences · Behavioral patterns"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 2.5fr",gap:18}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:14}}>MEMORY STATS</div>
            {[{l:"Sessions",v:"47"},{l:"Patterns Learned",v:"128"},{l:"Preferences",v:"34"},{l:"Emotional Points",v:"312"}].map(s=>(
              <div key={s.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:12}}>
                <span style={{color:C.muted}}>{s.l}</span>
                <span style={{fontFamily:"'Orbitron',monospace",color:C.cyan,fontSize:13}}>{s.v}</span>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:12}}>FILTER</div>
            {["All","Chat","Resume","Emotion","Career","Skills"].map(f=>(
              <div key={f} style={{fontSize:12,padding:"7px 10px",borderRadius:8,cursor:"pointer",color:f==="All"?C.cyan:C.muted,background:f==="All"?"rgba(0,212,190,.1)":"transparent",marginBottom:4}}>{f}</div>
            ))}
          </Card>
        </div>
        <Card>
          <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:20}}>INTELLIGENCE TIMELINE</div>
          <div style={{position:"relative",paddingLeft:24}}>
            <div style={{position:"absolute",left:8,top:0,bottom:0,width:1,background:`linear-gradient(${C.cyan},rgba(0,212,190,.1))`}}/>
            {events.map((ev,i)=>(
              <div key={i} style={{position:"relative",marginBottom:20,animation:`fadeUp .4s ${i*0.08}s ease-out both`}}>
                <div style={{position:"absolute",left:-20,top:4,width:10,height:10,borderRadius:"50%",background:typeColor[ev.type]||C.cyan,boxShadow:`0 0 8px ${typeColor[ev.type]||C.cyan}`}}/>
                <div style={{...glass(10),padding:"12px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{fontSize:10,color:C.muted}}>{ev.date} · {ev.time}</span>
                      <span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:`rgba(0,212,190,.1)`,color:C.cyan}}>{ev.type}</span>
                    </div>
                    <span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"rgba(255,255,255,.05)",color:C.muted}}>{ev.tag}</span>
                  </div>
                  <p style={{fontSize:12,color:C.text,lineHeight:1.55}}>{ev.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CREDITS PAGE
═══════════════════════════════════════════════════════════════ */
const spendData=[{d:"Mon",c:45},{d:"Tue",c:28},{d:"Wed",c:67},{d:"Thu",c:38},{d:"Fri",c:52},{d:"Sat",c:18},{d:"Sun",c:31}];
function CreditsPage({credits,setCredits}){
  const economy=[
    {action:"Basic Chat",cost:1,icon:"💬"},{action:"Advanced Reasoning",cost:5,icon:"🧠"},
    {action:"Resume Scan",cost:25,icon:"📄"},{action:"Voice Session",cost:"15/min",icon:"🎙"},
    {action:"Career Roadmap",cost:40,icon:"🗺"},{action:"Mock Interview",cost:50,icon:"🎤"},
    {action:"Memory Recall",cost:8,icon:"◌"},{action:"File Analysis",cost:20,icon:"📁"},
  ];
  return(
    <div className="fade-up">
      <PageTitle title="Credit Economy" sub="Usage tracking · Refill options · Earned bonuses"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20}}>
        <StatCard label="Credits Remaining" value={credits} sub="Resets in 06:42" icon="◇" color={C.cyan}/>
        <StatCard label="Used Today" value="148" sub="of 500 daily" icon="⚡" color={C.orange}/>
        <StatCard label="Earned Bonus" value="80" sub="From streak & tasks" icon="🌟" color="#00e87a"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:16}}>7-DAY CREDIT USAGE</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={spendData}>
                <XAxis dataKey="d" stroke="rgba(223,240,236,.3)" tick={{fontSize:10,fill:"rgba(223,240,236,.5)"}}/>
                <YAxis stroke="rgba(223,240,236,.3)" tick={{fontSize:10,fill:"rgba(223,240,236,.5)"}}/>
                <Tooltip contentStyle={{background:"rgba(10,10,20,.9)",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}}/>
                <Bar dataKey="c" fill={C.cyan} radius={[4,4,0,0]} fillOpacity={.8}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:14}}>CREDIT ECONOMY TABLE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {economy.map(e=>(
                <div key={e.action} style={{...glass(9),padding:"10px 12px",display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:16}}>{e.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.action}</div>
                    <div style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:C.cyan,marginTop:2}}>{e.cost} cr</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:14}}>REFILL OPTIONS</div>
            {[{pack:"Starter",cr:500,price:"₹99"},{pack:"Pro Bundle",cr:2000,price:"₹299"},{pack:"Elite Pack",cr:10000,price:"₹999"}].map(p=>(
              <div key={p.pack} style={{...glass(10),padding:"14px",marginBottom:10,cursor:"pointer",transition:"border-color .2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.cyan}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:600}}>{p.pack}</span>
                  <span style={{fontFamily:"'Orbitron',monospace",fontSize:14,color:C.cyan}}>{p.price}</span>
                </div>
                <div style={{fontSize:11,color:C.muted}}>{p.cr.toLocaleString()} credits</div>
                <div style={{height:2,background:"rgba(255,255,255,.06)",marginTop:10,borderRadius:1}}>
                  <div style={{height:"100%",background:`linear-gradient(90deg,${C.cyan},${C.purple})`,width:`${Math.min(100,p.cr/100)}%`,borderRadius:1}}/>
                </div>
              </div>
            ))}
            <Btn style={{width:"100%",textAlign:"center",marginTop:4,fontSize:10}}>PURCHASE CREDITS</Btn>
          </Card>
          <Card>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:12}}>EARN BONUS CREDITS</div>
            {[{t:"Daily Login",cr:10,done:true},{t:"Complete Profile",cr:50,done:false},{t:"7-Day Streak",cr:80,done:false},{t:"Share Feedback",cr:25,done:true}].map(b=>(
              <div key={b.t} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`,alignItems:"center"}}>
                <span style={{fontSize:12,color:b.done?C.muted:C.text,textDecoration:b.done?"line-through":"none"}}>{b.t}</span>
                <span style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:b.done?C.muted:C.cyan}}>+{b.cr}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUBSCRIPTION PAGE
═══════════════════════════════════════════════════════════════ */
function SubscriptionPage({onSelect}){
  const plans=[
    {name:"Explorer",price:"₹0",sub:"Free forever",color:C.muted,features:["100 credits/day","3 AI chat sessions","Basic resume scan","Career snapshot"],popular:false},
    {name:"Professional",price:"₹999",sub:"per month",color:C.cyan,features:["500 credits/day","Unlimited AI chat","Full resume analysis","Career roadmap","Emotional tracking","Priority reasoning","Voice sessions"],popular:true},
    {name:"Elite",price:"₹2,499",sub:"per month",color:C.orange,features:["2,000 credits/day","Dedicated AI model","Advanced memory depth","Mock interviews","Real-time analytics","API access","White-glove support"],popular:false},
  ];
  return(
    <div className="fade-up">
      <PageTitle title="Intelligence Plans" sub="Unlock deeper memory, faster reasoning, and advanced AI capabilities"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
        {plans.map(p=>(
          <div key={p.name} style={{...glass(16),padding:"28px 24px",position:"relative",transition:"all .25s",borderColor:p.popular?C.cyan:C.border}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 16px 40px rgba(0,212,190,.15)`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
            {p.popular && <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:`linear-gradient(90deg,${C.cyan},${C.purple})`,color:"#030309",fontSize:10,fontWeight:700,padding:"4px 16px",borderRadius:20,fontFamily:"'Orbitron',monospace",letterSpacing:"1px",whiteSpace:"nowrap"}}>MOST POPULAR</div>}
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:14,color:p.color,letterSpacing:"2px",marginBottom:8}}>{p.name.toUpperCase()}</div>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:32,fontWeight:900,color:C.text,lineHeight:1}}>{p.price}</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:20,marginTop:4}}>{p.sub}</div>
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:18,marginBottom:20}}>
              {p.features.map(f=>(
                <div key={f} style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                  <span style={{color:p.color,fontSize:12}}>✓</span>
                  <span style={{fontSize:12,color:C.text}}>{f}</span>
                </div>
              ))}
            </div>
            <Btn ghost={!p.popular} onClick={()=>onSelect&&onSelect(p.name)} style={{width:"100%",textAlign:"center",background:p.popular?`linear-gradient(135deg,${C.cyan},#00a896)`:undefined,color:p.popular?"#030309":p.color,borderColor:p.popular?"transparent":p.color}}>
              {p.price==="₹0"?"GET STARTED":"ACTIVATE"}
            </Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SETTINGS PAGE
═══════════════════════════════════════════════════════════════ */
function SettingsPage({user}){
  const [persona,setPersona]=useState("Strategic Mentor");
  const [memory,setMemory]=useState(true);
  const [notifs,setNotifs]=useState(true);
  const Toggle=({val,onChange})=>(
    <div onClick={()=>onChange(!val)} style={{width:40,height:22,borderRadius:11,background:val?C.cyan:"rgba(255,255,255,.1)",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
      <div style={{position:"absolute",top:3,left:val?20:3,width:16,height:16,borderRadius:"50%",background:"white",transition:"left .2s"}}/>
    </div>
  );
  return(
    <div className="fade-up">
      <PageTitle title="Settings" sub="Profile · AI personality · Memory · Preferences"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:16}}>PROFILE</div>
            <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:18}}>
              <div style={{width:54,height:54,borderRadius:"50%",background:`linear-gradient(135deg,${C.cyan},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#030309"}}>{(user?.name||"U")[0]}</div>
              <div>
                <div style={{fontSize:15,fontWeight:600}}>{user?.name||"User"}</div>
                <div style={{fontSize:12,color:C.muted}}>{user?.email||"user@email.com"}</div>
                <div style={{fontSize:10,color:C.cyan,marginTop:2}}>{user?.plan||"Explorer"} Plan</div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <input type="text" placeholder="Full Name" defaultValue={user?.name}/>
              <input type="email" placeholder="Email" defaultValue={user?.email}/>
              <input type="text" placeholder="LinkedIn URL"/>
              <input type="text" placeholder="GitHub URL"/>
            </div>
            <Btn style={{width:"100%",textAlign:"center",marginTop:14,fontSize:10}}>SAVE PROFILE</Btn>
          </Card>
          <Card>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:14}}>AI PERSONALITY TUNING</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:10}}>Current: <span style={{color:C.cyan}}>{persona}</span></div>
            {["Strategic Mentor","Emotional Coach","Direct Advisor","Analytical Guide"].map(p=>(
              <div key={p} onClick={()=>setPersona(p)} style={{...glass(9),padding:"10px 14px",marginBottom:8,cursor:"pointer",borderColor:persona===p?C.cyan:C.border,display:"flex",justifyContent:"space-between",alignItems:"center",transition:"border-color .2s"}}>
                <span style={{fontSize:12,color:persona===p?C.cyan:C.text}}>{p}</span>
                {persona===p && <span style={{color:C.cyan,fontSize:11}}>Active</span>}
              </div>
            ))}
          </Card>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:14}}>MEMORY CONTROLS</div>
            {[{l:"Enable Persistent Memory",s:"AI remembers your history",v:memory,fn:setMemory},{l:"Emotional Pattern Tracking",s:"Track mood for better support",v:notifs,fn:setNotifs}].map(s=>(
              <div key={s.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
                <div>
                  <div style={{fontSize:13,color:C.text}}>{s.l}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.s}</div>
                </div>
                <Toggle val={s.v} onChange={s.fn}/>
              </div>
            ))}
            <div style={{marginTop:14}}>
              <div style={{fontSize:12,color:C.muted,marginBottom:8}}>Memory Depth</div>
              <input type="range" min={1} max={100} defaultValue={60} style={{width:"100%",accentColor:C.cyan}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginTop:4}}>
                <span>3 sessions</span><span>Lifetime</span>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{fontSize:12,color:C.muted,letterSpacing:"1.5px",marginBottom:14}}>DATA & PRIVACY</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <Btn ghost style={{width:"100%",textAlign:"center",fontSize:10}}>EXPORT ALL DATA</Btn>
              <Btn ghost style={{width:"100%",textAlign:"center",fontSize:10}}>CLEAR MEMORY</Btn>
              <div style={{borderTop:`1px solid ${C.border}`,marginTop:4,paddingTop:14}}>
                <Btn ghost style={{width:"100%",textAlign:"center",fontSize:10,borderColor:C.orange,color:C.orange}}>DELETE ACCOUNT</Btn>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */
export default function App(){
  const [flow,setFlow]=useState("landing"); // landing|auth|sync|app
  const [page,setPage]=useState("dashboard");
  const [user,setUser]=useState(null);
  const [credits,setCredits]=useState(352);

  // Inject global styles
  useEffect(()=>{
    const el=document.createElement("style");
    el.textContent=STYLE;
    document.head.appendChild(el);
    return ()=>document.head.removeChild(el);
  },[]);

  const handleAuth=(u)=>{setUser(u);setFlow("sync");};
  const handleSync=()=>setFlow("app");

  if(flow==="landing") return <LandingPage onActivate={()=>setFlow("auth")}/>;
  if(flow==="auth") return <AuthPage onAuth={handleAuth}/>;
  if(flow==="sync") return <SyncPage onDone={handleSync}/>;

  return(
    <Layout page={page} setPage={setPage} credits={credits} user={user}>
      {page==="dashboard" && <DashboardPage user={user}/>}
      {page==="chat" && <ChatPage credits={credits} setCredits={setCredits}/>}
      {page==="resume" && <ResumePage credits={credits} setCredits={setCredits}/>}
      {page==="emotional" && <EmotionalPage/>}
      {page==="career" && <CareerPage/>}
      {page==="memory" && <MemoryPage/>}
      {page==="credits" && <CreditsPage credits={credits} setCredits={setCredits}/>}
      {page==="subscription" && <SubscriptionPage/>}
      {page==="settings" && <SettingsPage user={user}/>}
    </Layout>
  );
}
