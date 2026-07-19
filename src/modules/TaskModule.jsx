import React from "react";

export default function TaskModule({ tasks=[], onUpdateTasks, orders=[], customers=[], currentUser, currentRole, userAccounts=[], pushNotif }) {
  const [view, setView] = React.useState("kanban"); // kanban | list | mine
  const [showForm, setShowForm] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [filterAssignee, setFilterAssignee] = React.useState("all");
  const [filterPriority, setFilterPriority] = React.useState("all");
  const [searchQ, setSearchQ] = React.useState("");

  const today = new Date().toISOString().slice(0, 10);
  const fmtDate = d => d ? new Date(d).toLocaleDateString("vi-VN", {day:"2-digit",month:"2-digit",year:"numeric"}) : "—";
  const daysLeft = d => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;

  const PRIORITY = {
    urgent: { label:"Khẩn",       color:"#dc2626", bg:"#fee2e2", icon:"ti-flame" },
    normal: { label:"Bình thường", color:"#2563eb", bg:"#eff6ff", icon:"ti-point" },
    low:    { label:"Thấp",        color:"#64748b", bg:"#f1f5f9", icon:"ti-arrow-down" },
  };
  const STATUS = {
    new:            { label:"Mới",            color:"#64748b", bg:"#f8fafc",  border:"#e2e8f0" },
    in_progress:    { label:"Đang làm",       color:"#2563eb", bg:"#eff6ff",  border:"#bfdbfe" },
    pending_review: { label:"Chờ xác nhận",  color:"#d97706", bg:"#fffbeb",  border:"#fde68a" },
    done:           { label:"Hoàn thành",     color:"#059669", bg:"#ecfdf5",  border:"#6ee7b7" },
  };
  const COLUMNS = ["new","in_progress","pending_review","done"];

  // Tạo task mới
  const BLANK = { id:"", title:"", description:"", priority:"normal", status:"new",
    assignee:"", dueDate:"", orderId:"", customerId:"", tags:[], comments:[] };
  const [form, setForm] = React.useState({...BLANK});
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  const saveTask = () => {
    if (!form.title.trim()) return;
    const isNew = !form.id;
    const t = { ...form,
      id: form.id || "T-" + Date.now(),
      createdBy: currentUser?.name,
      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onUpdateTasks(prev => isNew ? [t, ...prev] : prev.map(x => x.id===t.id ? t : x));
    pushNotif?.(isNew ? `Đã tạo việc: ${t.title}` : `Đã cập nhật: ${t.title}`, "success");
    setShowForm(false);
    setSelectedTask(null);
    setForm({...BLANK});
  };

  const updateStatus = (taskId, newStatus) => {
    onUpdateTasks(prev => prev.map(t => t.id===taskId
      ? { ...t, status:newStatus, updatedAt:new Date().toISOString(),
          completedAt: newStatus==="done" ? new Date().toISOString() : t.completedAt }
      : t));
  };

  const addComment = (taskId, text) => {
    if (!text.trim()) return;
    onUpdateTasks(prev => prev.map(t => t.id===taskId
      ? { ...t, comments:[...(t.comments||[]), { id:Date.now(), by:currentUser?.name, text, ts:new Date().toISOString() }] }
      : t));
    setSelectedTask(prev => prev ? {...prev, comments:[...(prev.comments||[]), {id:Date.now(),by:currentUser?.name,text,ts:new Date().toISOString()}]} : prev);
  };

  const deleteTask = (taskId) => {
    if (!window.confirm("Xóa công việc này?")) return;
    onUpdateTasks(prev => prev.filter(t => t.id !== taskId));
    setSelectedTask(null);
  };

  // Lọc
  const filtered = tasks.filter(t => {
    if (view==="mine" && t.assignee !== currentUser?.name) return false;
    if (filterAssignee !== "all" && t.assignee !== filterAssignee) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      return t.title?.toLowerCase().includes(q) || t.assignee?.toLowerCase().includes(q) || t.orderId?.toLowerCase().includes(q);
    }
    return true;
  });

  // Stats
  const overdue   = tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== "done");
  const dueToday  = tasks.filter(t => t.dueDate === today && t.status !== "done");
  const inProgress= tasks.filter(t => t.status === "in_progress");
  const doneThis  = tasks.filter(t => t.completedAt && t.completedAt.slice(0,7) === today.slice(0,7));

  const staffList = [...new Set([
    ...userAccounts.filter(u=>u.active!==false).map(u=>u.name),
    ...tasks.map(t=>t.assignee).filter(Boolean),
  ])].filter(Boolean);

  // Style helpers
  const card = { background:"#fff", borderRadius:14, boxShadow:"0 2px 12px rgba(0,0,0,.07)", overflow:"hidden" };

  // ── FORM TẠO/SỬA TASK ──────────────────────────────────
  const TaskForm = () => (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowForm(false),setForm({...BLANK}))}>
      <div style={{background:"#fff",borderRadius:20,width:580,maxWidth:"95vw",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
        {/* Header */}
        <div style={{padding:"20px 24px",background:"linear-gradient(135deg,#1e40af,#3b82f6)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:18,fontWeight:800}}>{form.id?"Sửa công việc":"Tạo công việc mới"}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginTop:2}}>Giao việc, đặt deadline, theo dõi tiến độ</div>
          </div>
          <button onClick={()=>{setShowForm(false);setForm({...BLANK});}} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:10,width:36,height:36,color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"20px 24px",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:16}}>
          {/* Tiêu đề */}
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>Tiêu đề công việc *</label>
            <input value={form.title} onChange={e=>setF("title",e.target.value)}
              placeholder="VD: Xác nhận khách sạn cho đoàn 4/7..." autoFocus
              style={{width:"100%",border:"2px solid #e2e8f0",borderRadius:10,padding:"12px 14px",fontSize:15,fontWeight:500,outline:"none",boxSizing:"border-box",transition:"border .15s"}}
              onFocus={e=>e.target.style.borderColor="#3b82f6"}
              onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>
          {/* Mô tả */}
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>Mô tả chi tiết</label>
            <textarea value={form.description} onChange={e=>setF("description",e.target.value)}
              placeholder="Thêm thông tin, yêu cầu cụ thể..." rows={3}
              style={{width:"100%",border:"2px solid #e2e8f0",borderRadius:10,padding:"12px 14px",fontSize:14,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}
              onFocus={e=>e.target.style.borderColor="#3b82f6"}
              onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>
          {/* Giao cho + Ưu tiên */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>Giao cho</label>
              <select value={form.assignee} onChange={e=>setF("assignee",e.target.value)}
                style={{width:"100%",border:"2px solid #e2e8f0",borderRadius:10,padding:"11px 14px",fontSize:14,outline:"none",background:"#fff",boxSizing:"border-box"}}>
                <option value="">-- Chọn nhân viên --</option>
                {staffList.map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>Mức độ ưu tiên</label>
              <div style={{display:"flex",gap:8}}>
                {Object.entries(PRIORITY).map(([k,p])=>(
                  <button key={k} onClick={()=>setF("priority",k)}
                    style={{flex:1,padding:"10px 8px",borderRadius:10,border:`2px solid ${form.priority===k?p.color:"#e2e8f0"}`,background:form.priority===k?p.bg:"#fff",color:form.priority===k?p.color:"#94a3b8",fontWeight:700,fontSize:12,cursor:"pointer",transition:"all .15s"}}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Deadline + Trạng thái */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>Deadline</label>
              <input type="date" value={form.dueDate} onChange={e=>setF("dueDate",e.target.value)}
                style={{width:"100%",border:"2px solid #e2e8f0",borderRadius:10,padding:"11px 14px",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>Trạng thái</label>
              <select value={form.status} onChange={e=>setF("status",e.target.value)}
                style={{width:"100%",border:"2px solid #e2e8f0",borderRadius:10,padding:"11px 14px",fontSize:14,outline:"none",background:"#fff",boxSizing:"border-box"}}>
                {Object.entries(STATUS).map(([k,s])=><option key={k} value={k}>{s.label}</option>)}
              </select>
            </div>
          </div>
          {/* Liên kết đơn hàng */}
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>Liên kết đơn hàng (tuỳ chọn)</label>
            <select value={form.orderId} onChange={e=>setF("orderId",e.target.value)}
              style={{width:"100%",border:"2px solid #e2e8f0",borderRadius:10,padding:"11px 14px",fontSize:14,outline:"none",background:"#fff",boxSizing:"border-box"}}>
              <option value="">-- Không liên kết --</option>
              {orders.slice(0,50).map(o=><option key={o.id} value={o.id}>{o.id} · {o.customerName} · {o.tourName||o.service}</option>)}
            </select>
          </div>
        </div>
        {/* Footer */}
        <div style={{padding:"16px 24px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10,justifyContent:"flex-end",background:"#fafafa"}}>
          <button onClick={()=>{setShowForm(false);setForm({...BLANK});}}
            style={{padding:"11px 22px",border:"1.5px solid #e2e8f0",borderRadius:10,background:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",color:"#64748b"}}>
            Hủy
          </button>
          <button onClick={saveTask} disabled={!form.title.trim()}
            style={{padding:"11px 28px",border:"none",borderRadius:10,background:form.title.trim()?"linear-gradient(135deg,#1e40af,#3b82f6)":"#e2e8f0",color:form.title.trim()?"#fff":"#94a3b8",fontSize:14,fontWeight:700,cursor:form.title.trim()?"pointer":"not-allowed",boxShadow:form.title.trim()?"0 4px 12px rgba(59,130,246,.4)":"none"}}>
            {form.id?"Lưu thay đổi":"Tạo công việc"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── TASK DETAIL PANEL ────────────────────────────────────
  const [commentText, setCommentText] = React.useState("");
  const TaskDetail = ({t}) => {
    if (!t) return null;
    const dl = daysLeft(t.dueDate);
    const isOverdue = dl !== null && dl < 0 && t.status !== "done";
    const p = PRIORITY[t.priority] || PRIORITY.normal;
    const s = STATUS[t.status] || STATUS.new;
    const linkedOrder = orders.find(o=>o.id===t.orderId);
    return (
      <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",justifyContent:"flex-end"}} onClick={e=>e.target===e.currentTarget&&setSelectedTask(null)}>
        <div style={{width:480,maxWidth:"95vw",height:"100vh",background:"#fff",boxShadow:"-8px 0 40px rgba(0,0,0,.15)",display:"flex",flexDirection:"column",animation:"slideInRight .25s ease"}}>
          <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
          {/* Header */}
          <div style={{padding:"20px 22px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"flex-start",gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <span style={{background:p.bg,color:p.color,borderRadius:99,fontSize:11,fontWeight:700,padding:"3px 10px",display:"inline-flex",alignItems:"center",gap:4}}>
                  <i className={`ti ${p.icon}`} style={{fontSize:12}}/>{p.label}
                </span>
                <span style={{background:s.bg,color:s.color,borderRadius:99,fontSize:11,fontWeight:700,padding:"3px 10px",border:`1px solid ${s.border}`}}>{s.label}</span>
                {isOverdue&&<span style={{background:"#fee2e2",color:"#dc2626",borderRadius:99,fontSize:11,fontWeight:700,padding:"3px 10px"}}>⚠ Trễ {Math.abs(dl)} ngày</span>}
              </div>
              <div style={{fontSize:17,fontWeight:800,color:"#0f172a",lineHeight:1.3}}>{t.title}</div>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:6}}>Tạo bởi {t.createdBy||"—"} · {t.createdAt?new Date(t.createdAt).toLocaleDateString("vi-VN"):""}</div>
            </div>
            <button onClick={()=>setSelectedTask(null)} style={{background:"#f1f5f9",border:"none",borderRadius:10,width:36,height:36,fontSize:18,cursor:"pointer",color:"#64748b",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          {/* Body */}
          <div style={{flex:1,overflowY:"auto",padding:"18px 22px",display:"flex",flexDirection:"column",gap:16}}>
            {/* Info grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                ["Giao cho",    t.assignee||"Chưa giao", "ti-user"],
                ["Deadline",   t.dueDate?`${fmtDate(t.dueDate)}${dl!==null?" ("+( dl===0?"Hôm nay":dl>0?`còn ${dl} ngày`:`trễ ${Math.abs(dl)} ngày`)+")":""}` : "Không có", "ti-calendar"],
              ].map(([k,v,ic])=>(
                <div key={k} style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:4,display:"flex",alignItems:"center",gap:4}}><i className={`ti ${ic}`}/>{k}</div>
                  <div style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>{v}</div>
                </div>
              ))}
            </div>
            {/* Mô tả */}
            {t.description&&(
              <div style={{background:"#f8fafc",borderRadius:10,padding:"14px 16px"}}>
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:8}}>Mô tả</div>
                <div style={{fontSize:14,color:"#374151",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{t.description}</div>
              </div>
            )}
            {/* Đơn hàng liên kết */}
            {linkedOrder&&(
              <div style={{background:"#eff6ff",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                <i className="ti ti-file-text" style={{fontSize:20,color:"#2563eb"}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:"#2563eb",fontWeight:600}}>{linkedOrder.id}</div>
                  <div style={{fontSize:13,color:"#374151"}}>{linkedOrder.customerName} · {linkedOrder.tourName||linkedOrder.service}</div>
                </div>
              </div>
            )}
            {/* Đổi trạng thái */}
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",marginBottom:8}}>Cập nhật trạng thái</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {Object.entries(STATUS).map(([k,s])=>(
                  <button key={k} onClick={()=>{updateStatus(t.id,k);setSelectedTask(prev=>({...prev,status:k}));}}
                    style={{padding:"8px 14px",borderRadius:99,border:`1.5px solid ${t.status===k?s.color:"#e2e8f0"}`,background:t.status===k?s.bg:"#fff",color:t.status===k?s.color:"#94a3b8",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Comments */}
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",marginBottom:10}}>Cập nhật tiến độ ({(t.comments||[]).length})</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                {(t.comments||[]).map(c=>(
                  <div key={c.id} style={{background:"#f8fafc",borderRadius:10,padding:"10px 14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#1e40af"}}>{c.by}</span>
                      <span style={{fontSize:11,color:"#94a3b8"}}>{new Date(c.ts).toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</span>
                    </div>
                    <div style={{fontSize:13,color:"#374151",lineHeight:1.6}}>{c.text}</div>
                  </div>
                ))}
                {(t.comments||[]).length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:"16px 0",fontSize:13}}>Chưa có cập nhật nào</div>}
              </div>
              <div style={{display:"flex",gap:8}}>
                <input value={commentText} onChange={e=>setCommentText(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addComment(t.id,commentText);setCommentText("");}}}
                  placeholder="Nhập cập nhật, Enter để gửi..."
                  style={{flex:1,border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:13,outline:"none",fontFamily:"inherit"}}
                  onFocus={e=>e.target.style.borderColor="#3b82f6"}
                  onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                <button onClick={()=>{addComment(t.id,commentText);setCommentText("");}} disabled={!commentText.trim()}
                  style={{padding:"10px 16px",background:commentText.trim()?"#2563eb":"#e2e8f0",color:commentText.trim()?"#fff":"#94a3b8",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:commentText.trim()?"pointer":"not-allowed"}}>
                  Gửi
                </button>
              </div>
            </div>
          </div>
          {/* Footer actions */}
          <div style={{padding:"14px 22px",borderTop:"1px solid #f1f5f9",display:"flex",gap:8,background:"#fafafa"}}>
            <button onClick={()=>{setForm({...t});setShowForm(true);setSelectedTask(null);}}
              style={{flex:1,padding:"11px",background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <i className="ti ti-edit" style={{fontSize:16}}/>Sửa
            </button>
            <button onClick={()=>deleteTask(t.id)}
              style={{padding:"11px 18px",background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              <i className="ti ti-trash" style={{fontSize:16}}/>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── TASK CARD (dùng trong Kanban & List) ─────────────────
  const TaskCard = ({t, compact=false}) => {
    const p  = PRIORITY[t.priority] || PRIORITY.normal;
    const s  = STATUS[t.status]     || STATUS.new;
    const dl = daysLeft(t.dueDate);
    const isOverdue = dl!==null && dl<0 && t.status!=="done";
    const isDueToday = t.dueDate===today && t.status!=="done";
    const avatar = (t.assignee||"?")[0].toUpperCase();
    const avatarColor = { "Nguyễn Thị Hoa":"#059669","Trần Văn Nam":"#2563eb","Lê Thị Mai":"#7c3aed","Phạm Quốc Hùng":"#d97706" }[t.assignee]||"#64748b";

    return (
      <div onClick={()=>setSelectedTask(t)}
        style={{background:"#fff",borderRadius:12,padding:"14px 16px",cursor:"pointer",borderLeft:`3px solid ${p.color}`,boxShadow:"0 2px 8px rgba(0,0,0,.07)",transition:"all .15s",marginBottom:8}}
        onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.12)"}
        onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.07)"}>
        {/* Title */}
        <div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginBottom:8,lineHeight:1.4}}>{t.title}</div>
        {/* Tags row */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          <span style={{background:p.bg,color:p.color,borderRadius:99,fontSize:11,fontWeight:700,padding:"2px 8px"}}>{p.label}</span>
          {t.orderId&&<span style={{background:"#eff6ff",color:"#2563eb",borderRadius:99,fontSize:11,fontWeight:600,padding:"2px 8px",display:"flex",alignItems:"center",gap:3}}><i className="ti ti-file-text" style={{fontSize:11}}/>{t.orderId}</span>}
          {isOverdue&&<span style={{background:"#fee2e2",color:"#dc2626",borderRadius:99,fontSize:11,fontWeight:700,padding:"2px 8px"}}>Trễ {Math.abs(dl)}n</span>}
          {isDueToday&&!isOverdue&&<span style={{background:"#fef3c7",color:"#d97706",borderRadius:99,fontSize:11,fontWeight:700,padding:"2px 8px"}}>Hôm nay</span>}
        </div>
        {/* Footer */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:avatarColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{avatar}</div>
            <span style={{fontSize:12,color:"#64748b",fontWeight:500}}>{t.assignee||"Chưa giao"}</span>
          </div>
          {t.dueDate&&(
            <div style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:isOverdue?"#dc2626":isDueToday?"#d97706":"#94a3b8",fontWeight:isOverdue||isDueToday?700:400}}>
              <i className="ti ti-calendar" style={{fontSize:13}}/>
              {fmtDate(t.dueDate)}
            </div>
          )}
        </div>
        {t.comments?.length>0&&(
          <div style={{display:"flex",alignItems:"center",gap:4,marginTop:8,fontSize:11,color:"#94a3b8"}}>
            <i className="ti ti-message-circle" style={{fontSize:13}}/>{t.comments.length} cập nhật
          </div>
        )}
      </div>
    );
  };

  // ── KANBAN VIEW ──────────────────────────────────────────
  const KanbanView = () => (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,alignItems:"start"}}>
      {COLUMNS.map(col=>{
        const s = STATUS[col];
        const colTasks = filtered.filter(t=>t.status===col);
        return(
          <div key={col} style={{background:"#f8fafc",borderRadius:14,padding:"14px",minHeight:200}}>
            {/* Column header */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:s.color,flexShrink:0}}/>
              <span style={{fontWeight:700,fontSize:14,color:"#0f172a",flex:1}}>{s.label}</span>
              <span style={{background:s.bg,color:s.color,borderRadius:99,fontSize:12,fontWeight:700,padding:"2px 9px",border:`1px solid ${s.border}`}}>{colTasks.length}</span>
            </div>
            {/* Cards */}
            {colTasks.map(t=><TaskCard key={t.id} t={t}/>)}
            {colTasks.length===0&&(
              <div style={{textAlign:"center",color:"#cbd5e1",padding:"24px 0",fontSize:13}}>
                <i className="ti ti-inbox" style={{fontSize:28,display:"block",marginBottom:6}}/>
                Không có
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── LIST VIEW ───────────────────────────────────────────
  const ListView = () => (
    <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr style={{background:"#f8fafc"}}>
            {["Công việc","Giao cho","Ưu tiên","Trạng thái","Deadline","Đơn hàng"].map(h=>(
              <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,borderBottom:"1px solid #f1f5f9"}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((t,idx)=>{
            const p=PRIORITY[t.priority]||PRIORITY.normal;
            const s=STATUS[t.status]||STATUS.new;
            const dl=daysLeft(t.dueDate);
            const isOverdue=dl!==null&&dl<0&&t.status!=="done";
            return(
              <tr key={t.id} onClick={()=>setSelectedTask(t)}
                style={{borderBottom:"1px solid #f8fafc",cursor:"pointer",background:idx%2===0?"#fff":"#fafafa"}}
                onMouseEnter={e=>e.currentTarget.style.background="#eff6ff"}
                onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"#fff":"#fafafa"}>
                <td style={{padding:"12px 16px"}}>
                  <div style={{fontWeight:600,fontSize:14,color:"#0f172a"}}>{t.title}</div>
                  {t.comments?.length>0&&<div style={{fontSize:11,color:"#94a3b8",marginTop:2}}><i className="ti ti-message-circle" style={{fontSize:11}}/> {t.comments.length}</div>}
                </td>
                <td style={{padding:"12px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{(t.assignee||"?")[0]}</div>
                    <span style={{fontSize:13,color:"#374151"}}>{t.assignee||"Chưa giao"}</span>
                  </div>
                </td>
                <td style={{padding:"12px 16px"}}><span style={{background:p.bg,color:p.color,borderRadius:99,fontSize:12,fontWeight:700,padding:"3px 10px"}}>{p.label}</span></td>
                <td style={{padding:"12px 16px"}}><span style={{background:s.bg,color:s.color,borderRadius:99,fontSize:12,fontWeight:700,padding:"3px 10px",border:`1px solid ${s.border}`}}>{s.label}</span></td>
                <td style={{padding:"12px 16px",fontSize:13,color:isOverdue?"#dc2626":"#374151",fontWeight:isOverdue?700:400}}>
                  {t.dueDate?fmtDate(t.dueDate):"—"}
                  {isOverdue&&<span style={{fontSize:11,marginLeft:6,color:"#dc2626"}}>({Math.abs(dl)}n trễ)</span>}
                </td>
                <td style={{padding:"12px 16px"}}>
                  {t.orderId?<span style={{background:"#eff6ff",color:"#2563eb",borderRadius:8,fontSize:12,padding:"3px 8px",fontWeight:600}}>{t.orderId}</span>:"—"}
                </td>
              </tr>
            );
          })}
          {filtered.length===0&&(
            <tr><td colSpan={6} style={{textAlign:"center",padding:"48px",color:"#94a3b8",fontSize:14}}>
              <i className="ti ti-clipboard-off" style={{fontSize:36,display:"block",marginBottom:8}}/>
              Không có công việc nào
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{padding:24,background:"#f1f5f9",minHeight:"100vh"}}>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:22,fontWeight:800,color:"#0f172a",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#1e40af,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <i className="ti ti-checklist" style={{fontSize:22,color:"#fff"}}/>
            </div>
            Quản lý công việc
          </h2>
          <div style={{fontSize:14,color:"#64748b",marginTop:4,marginLeft:50}}>{tasks.length} công việc · {inProgress.length} đang thực hiện</div>
        </div>
        <button onClick={()=>{setForm({...BLANK});setShowForm(true);}}
          style={{background:"linear-gradient(135deg,#1e40af,#3b82f6)",color:"#fff",border:"none",borderRadius:12,padding:"12px 22px",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 14px rgba(59,130,246,.4)"}}>
          <i className="ti ti-plus" style={{fontSize:18}}/>
          Tạo công việc
        </button>
      </div>

      {/* KPI CARDS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {[
          {label:"Tổng công việc",  val:tasks.length,      icon:"ti-list",        bg:"linear-gradient(135deg,#1e40af,#3b82f6)",    sub:`${doneThis.length} hoàn thành tháng này`},
          {label:"Đang thực hiện",  val:inProgress.length, icon:"ti-loader",      bg:"linear-gradient(135deg,#7c3aed,#a78bfa)",    sub:`${filtered.filter(t=>t.status==="new").length} chờ bắt đầu`},
          {label:"Đến hạn hôm nay", val:dueToday.length,   icon:"ti-clock",       bg:"linear-gradient(135deg,#d97706,#fbbf24)",    sub:"Cần xử lý ngay"},
          {label:"Trễ deadline",    val:overdue.length,    icon:"ti-alert-circle", bg:`linear-gradient(135deg,${overdue.length>0?"#dc2626,#ef4444":"#059669,#34d399"})`, sub:overdue.length>0?"Cần ưu tiên":"Không có"},
        ].map(k=>(
          <div key={k.label} style={{background:k.bg,borderRadius:14,padding:"18px 20px",boxShadow:"0 4px 14px rgba(0,0,0,.12)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:14,top:14,opacity:.2,fontSize:36}}><i className={`ti ${k.icon}`}/></div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.75)",fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>{k.label}</div>
            <div style={{fontSize:30,fontWeight:800,color:"#fff",lineHeight:1,marginBottom:4}}>{k.val}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.65)"}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
        {/* View tabs */}
        <div style={{display:"flex",gap:2,background:"#fff",borderRadius:12,padding:4,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          {[{k:"kanban",icon:"ti-layout-kanban",label:"Kanban"},{k:"list",icon:"ti-list",label:"Danh sách"},{k:"mine",icon:"ti-user",label:"Của tôi"}].map(v=>(
            <button key={v.k} onClick={()=>setView(v.k)}
              style={{padding:"8px 16px",border:"none",borderRadius:9,background:view===v.k?"linear-gradient(135deg,#1e40af,#3b82f6)":"transparent",color:view===v.k?"#fff":"#64748b",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all .15s"}}>
              <i className={`ti ${v.icon}`} style={{fontSize:16}}/>{v.label}
            </button>
          ))}
        </div>
        {/* Search */}
        <div style={{position:"relative",flex:1,minWidth:200}}>
          <i className="ti ti-search" style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",fontSize:16}}/>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Tìm công việc, nhân viên..."
            style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 12px 10px 38px",fontSize:14,outline:"none",background:"#fff",boxSizing:"border-box"}}/>
        </div>
        {/* Filters */}
        <select value={filterAssignee} onChange={e=>setFilterAssignee(e.target.value)}
          style={{border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:14,background:"#fff",outline:"none",minWidth:160}}>
          <option value="all">Tất cả nhân viên</option>
          {staffList.map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterPriority} onChange={e=>setFilterPriority(e.target.value)}
          style={{border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:14,background:"#fff",outline:"none"}}>
          <option value="all">Mọi ưu tiên</option>
          {Object.entries(PRIORITY).map(([k,p])=><option key={k} value={k}>{p.label}</option>)}
        </select>
      </div>

      {/* MAIN VIEW */}
      {(view==="kanban") && KanbanView()}
      {(view==="list" || view==="mine") && ListView()}

      {/* MODALS — gọi function trực tiếp, không dùng JSX component để tránh unmount */}
      {showForm && TaskForm({})}
      {selectedTask && TaskDetail({t:selectedTask})}

    </div>
  );
}
