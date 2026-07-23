import React from "react";
import { Btn, SearchInp, DateInput } from "../components/ui.jsx";
import { canManageTask, isTaskAssignee, isSelfAssignedTask } from "../utils/taskPermissions.js";
import { overlayCloseHandlers } from "../utils/modalOverlay.js";
import { SERVICE_TYPES } from "../constants/serviceTypes.js";

const SERVICE_TYPE_MAP = Object.fromEntries(SERVICE_TYPES.map(s=>[s.id,s]));

export default function TaskModule({ tasks=[], onUpdateTasks, orders=[], customers=[], currentUser, currentRole, userAccounts=[], pushNotif, saveNotification, prefill=null, onPrefillConsumed, openTaskId=null, onOpenTaskConsumed }) {
  const [view, setView] = React.useState("today"); // today | kanban | list | mine
  const [showForm, setShowForm] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [filterAssignee, setFilterAssignee] = React.useState("all");
  const [filterPriority, setFilterPriority] = React.useState("all");
  const [searchQ, setSearchQ] = React.useState("");

  const today = new Date().toISOString().slice(0, 10);
  const fmtDate = d => d ? new Date(d).toLocaleDateString("vi-VN", {day:"2-digit",month:"2-digit",year:"numeric"}) : "—";
  const daysLeft = d => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;

  const PRIORITY = {
    urgent: { label:"Khẩn",       color:"var(--c-danger-mid)", bg:"var(--c-danger-bg)", icon:"ti-flame" },
    normal: { label:"Bình thường", color:"var(--c-primary-mid)", bg:"var(--c-primary-light)", icon:"ti-point" },
    low:    { label:"Thấp",        color:"var(--c-text-3)", bg:"var(--c-surface-2)", icon:"ti-arrow-down" },
  };
  const STATUS = {
    new:            { label:"Mới",            color:"var(--c-text-3)", bg:"var(--c-surface-2)",  border:"var(--c-border)" },
    in_progress:    { label:"Đang làm",       color:"var(--c-primary-mid)", bg:"var(--c-primary-light)",  border:"var(--c-primary-pale)" },
    pending_review: { label:"Chờ duyệt hoàn thành",  color:"var(--c-warning-mid)", bg:"var(--c-warning-bg)",  border:"var(--c-warning-border)" },
    done:           { label:"Hoàn thành",     color:"var(--c-success-mid)", bg:"var(--c-success-bg)",  border:"var(--c-success-border)" },
  };
  const COLUMNS = ["new","in_progress","pending_review","done"];

  // Tạo task mới
  const BLANK = { id:"", title:"", description:"", priority:"normal", status:"new",
    assignee:"", dueDate:"", orderId:"", customerId:"", serviceType:"", tags:[], comments:[] };
  const [form, setForm] = React.useState({...BLANK});
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));
  // Tạo nhiều công việc cùng lúc cho 1 đơn hàng (đơn Combo/Tour trọn gói nhiều dịch vụ
  // thường cần chia cho 2-3 người) — mỗi dòng vẫn là 1 task 1-người bình thường,
  // chỉ khác là được tạo hàng loạt và gắn chung groupId để nhận biết cùng 1 lô giao việc.
  // serviceType riêng từng dòng (không dùng chung cho cả lô) vì mỗi dòng đại diện
  // 1 dịch vụ khác nhau trong cùng đơn (vd dòng "Đặt vé máy bay" ≠ "Đặt khách sạn").
  const BLANK_ROW = { title:"", serviceType:"", assignee:"", dueDate:"" };
  const [formMode, setFormMode] = React.useState("single"); // single | multi
  const [multiRows, setMultiRows] = React.useState([{...BLANK_ROW}]);
  const resetForm = () => { setForm({...BLANK}); setFormMode("single"); setMultiRows([{...BLANK_ROW}]); };
  const addMultiRow = () => setMultiRows(rows => [...rows, {...BLANK_ROW}]);
  const updateMultiRow = (idx,k,v) => setMultiRows(rows => rows.map((r,i)=>i===idx?{...r,[k]:v}:r));
  const removeMultiRow = (idx) => setMultiRows(rows => rows.length>1 ? rows.filter((_,i)=>i!==idx) : rows);

  // Tạo nhanh việc mới cho cùng khách hàng/đơn hàng đang xem (từ CRM hoặc chi tiết đơn)
  React.useEffect(() => {
    if (!prefill) return;
    setForm({...BLANK, customerId: prefill.customerId||"", orderId: prefill.orderId||""});
    setFormMode("single");
    setShowForm(true);
    onPrefillConsumed && onPrefillConsumed();
  }, [prefill]);

  // Mở đúng task khi bấm vào từ thông báo (bell) trỏ tới taskId cụ thể
  React.useEffect(() => {
    if (!openTaskId) return;
    const found = tasks.find(t => t.id === openTaskId);
    if (found) setSelectedTask(found);
    onOpenTaskConsumed && onOpenTaskConsumed();
  }, [openTaskId, tasks]);

  // Báo cho đúng người liên quan (bỏ qua nếu báo cho chính người đang thao tác)
  const notifyUser = (name, msg, type, taskId) => {
    if (!name || name === currentUser?.name) return;
    saveNotification?.({ id:"N"+Date.now()+"_"+Math.random().toString(36).slice(2,7),
      msg, type, targetUser:name, createdBy:currentUser?.name, taskId });
  };

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
    if (isNew) notifyUser(t.assignee, `📋 Bạn được giao việc mới: ${t.title}`, "info", t.id);
    pushNotif?.(isNew ? `Đã tạo việc: ${t.title}` : `Đã cập nhật: ${t.title}`, "success");
    setShowForm(false);
    setSelectedTask(null);
    resetForm();
  };

  // Tạo hàng loạt N task 1-người, cùng đơn hàng, gắn chung groupId.
  // form.title/form.description dùng chung với chế độ 1-người, đóng vai trò
  // "tiêu đề chung"/"ghi chú chung" của cả lô — ghép vào đầu tên mỗi task con
  // để xem task riêng lẻ ở đâu cũng biết ngay thuộc lô/đơn nào.
  const saveMultiTasks = () => {
    if (!form.title.trim()) return;
    const validRows = multiRows.filter(r => r.title.trim() && r.assignee);
    if (!validRows.length) return;
    const groupId = "GRP-" + Date.now();
    const now = new Date().toISOString();
    const newTasks = validRows.map((r,i) => ({ ...BLANK,
      id: "T-" + Date.now() + "-" + i,
      title: form.title.trim() + " - " + r.title.trim(), description: form.description,
      assignee: r.assignee, dueDate: r.dueDate, serviceType: r.serviceType,
      orderId: form.orderId, customerId: form.customerId, groupId,
      createdBy: currentUser?.name, createdAt: now, updatedAt: now,
    }));
    onUpdateTasks(prev => [...newTasks, ...prev]);
    newTasks.forEach(t => notifyUser(t.assignee, `📋 Bạn được giao việc mới: ${t.title}`, "info", t.id));
    pushNotif?.(`Đã tạo ${newTasks.length} công việc`, "success");
    setShowForm(false);
    setSelectedTask(null);
    resetForm();
  };

  // Quyền bàn giao: đúng người tạo (giao việc) hoặc Ban Giám đốc mới được duyệt/trả lại/giao lại.
  const canManage = (t) => canManageTask(t, currentUser, currentRole);
  const isAssignee = (t) => isTaskAssignee(t, currentUser);
  const isSelfAssigned = (t) => isSelfAssignedTask(t);

  const applyTaskUpdate = (taskId, updater) => {
    onUpdateTasks(prev => prev.map(t => t.id===taskId ? updater(t) : t));
    setSelectedTask(prev => prev && prev.id===taskId ? updater(prev) : prev);
  };

  const startTask = (t) => {
    if (!(isAssignee(t) || canManage(t))) return;
    applyTaskUpdate(t.id, cur => ({ ...cur, status:"in_progress", updatedAt:new Date().toISOString() }));
  };

  const submitForReview = (t) => {
    if (isSelfAssigned(t) || !(isAssignee(t) || canManage(t))) return;
    applyTaskUpdate(t.id, cur => ({ ...cur, status:"pending_review", updatedAt:new Date().toISOString() }));
    notifyUser(t.createdBy, `✅ ${t.assignee} đã báo cáo hoàn thành: ${t.title}`, "info", t.id);
  };

  const approveTask = (t) => {
    const canFinishSelf = isSelfAssigned(t) && (isAssignee(t) || canManage(t));
    if (!canFinishSelf && !canManage(t)) return;
    const now = new Date().toISOString();
    applyTaskUpdate(t.id, cur => ({ ...cur, status:"done", approvedBy:currentUser?.name, completedAt:now, updatedAt:now }));
    if (!isSelfAssigned(t)) notifyUser(t.assignee, `🎉 Việc đã được duyệt hoàn thành: ${t.title}`, "success", t.id);
  };

  const returnTask = (t, reason) => {
    if (!canManage(t) || !reason.trim()) return;
    const now = new Date().toISOString();
    applyTaskUpdate(t.id, cur => ({ ...cur, status:"in_progress", updatedAt:now,
      comments:[...(cur.comments||[]), { id:Date.now(), by:currentUser?.name, text:`↩ Trả lại: ${reason.trim()}`, ts:now, kind:"return" }] }));
    notifyUser(t.assignee, `↩ Việc bị trả lại, cần làm lại: ${t.title}`, "warning", t.id);
  };

  const reassignTask = (t, newAssignee) => {
    if (!canManage(t) || !newAssignee || newAssignee===t.assignee) return;
    notifyUser(newAssignee, `📋 Bạn được giao việc mới: ${t.title}`, "info", t.id);
    const now = new Date().toISOString();
    applyTaskUpdate(t.id, cur => ({ ...cur, assignee:newAssignee, updatedAt:now,
      comments:[...(cur.comments||[]), { id:Date.now(), by:currentUser?.name, text:`🔁 Đổi người nhận: ${t.assignee||"—"} → ${newAssignee}`, ts:now, kind:"system" }] }));
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
      const customerName = findCustomer(t.customerId)?.name || "";
      return t.title?.toLowerCase().includes(q) || t.assignee?.toLowerCase().includes(q) || t.orderId?.toLowerCase().includes(q) || customerName.toLowerCase().includes(q);
    }
    return true;
  });

  // Stats
  const overdue   = tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== "done");
  const dueToday  = tasks.filter(t => t.dueDate === today && t.status !== "done");
  const inProgress= tasks.filter(t => t.status === "in_progress");
  const doneThis  = tasks.filter(t => t.completedAt && t.completedAt.slice(0,7) === today.slice(0,7));

  const findCustomer = (id) => customers.find(c=>c.id===id);

  const staffList = [...new Set([
    ...userAccounts.filter(u=>u.active!==false).map(u=>u.name),
    ...tasks.map(t=>t.assignee).filter(Boolean),
  ])].filter(Boolean);

  // Style helpers
  const card = { background:"var(--c-surface)", borderRadius:"var(--r-lg)", boxShadow:"var(--sh-sm)", overflow:"hidden" };
  const fieldLbl = {fontSize:"var(--text-xs)",fontWeight:700,color:"var(--c-text-3)",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6};
  const fieldInp = {width:"100%",border:"2px solid var(--c-border)",borderRadius:"var(--r-md)",padding:"11px 14px",fontSize:"var(--text-md)",outline:"none",background:"var(--c-surface)",boxSizing:"border-box",color:"var(--c-text)"};

  // ── FORM TẠO/SỬA TASK ──────────────────────────────────
  const TaskForm = () => (
    <div className="modal-overlay" {...overlayCloseHandlers(()=>{setShowForm(false);resetForm();})}>
      <div style={{background:"var(--c-surface)",borderRadius:"var(--r-2xl)",width:580,maxWidth:"95vw",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"var(--sh-modal)"}}>
        {/* Header */}
        <div style={{padding:"20px 24px",background:"linear-gradient(135deg,var(--c-primary),var(--c-primary-mid))",color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:"var(--text-xl)",fontWeight:800}}>{form.id?"Sửa công việc":"Tạo công việc mới"}</div>
            <div style={{fontSize:"var(--text-base)",color:"rgba(255,255,255,.7)",marginTop:2}}>Giao việc, đặt deadline, theo dõi tiến độ</div>
          </div>
          <button onClick={()=>{setShowForm(false);resetForm();}} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:"var(--r-md)",width:36,height:36,color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"20px 24px",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:16}}>
          {/* Chọn kiểu giao việc — chỉ khi tạo mới, không hiện lúc sửa */}
          {!form.id && (
            <div style={{display:"flex",gap:8}}>
              {[["single","👤 1 người"],["multi","👥 Nhiều người"]].map(([k,label])=>(
                <button key={k} onClick={()=>setFormMode(k)}
                  style={{flex:1,padding:"10px 8px",borderRadius:"var(--r-md)",border:`2px solid ${formMode===k?"var(--c-primary-mid)":"var(--c-border)"}`,background:formMode===k?"var(--c-primary-light)":"var(--c-surface)",color:formMode===k?"var(--c-primary-mid)":"var(--c-text-muted)",fontWeight:700,fontSize:"var(--text-sm)",cursor:"pointer",transition:"all .15s"}}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {formMode==="multi" && !form.id ? (
            <>
              {/* Tiêu đề chung + ghi chú chung cho cả lô — ghép vào đầu tên mỗi task con */}
              <div>
                <label style={fieldLbl}>Tiêu đề chung *</label>
                <input value={form.title} onChange={e=>setF("title",e.target.value)}
                  placeholder="VD: Chuẩn bị dịch vụ - Tour Nhật Bản 6N5Đ" autoFocus
                  style={{...fieldInp,padding:"12px 14px",fontSize:"var(--text-lg)",fontWeight:500}}/>
              </div>
              <div>
                <label style={fieldLbl}>Ghi chú chung (tuỳ chọn)</label>
                <textarea value={form.description} onChange={e=>setF("description",e.target.value)}
                  placeholder="Thông tin áp dụng chung cho cả lô việc này..." rows={2}
                  style={{...fieldInp,padding:"12px 14px",resize:"vertical",fontFamily:"inherit"}}/>
              </div>
              {/* Liên kết khách hàng + đơn hàng — chọn trước để biết đơn có mấy dịch vụ cần chia */}
              <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={fieldLbl}>Khách hàng (tuỳ chọn)</label>
                  <select value={form.customerId} onChange={e=>setF("customerId",e.target.value)} style={fieldInp}>
                    <option value="">-- Không liên kết --</option>
                    {customers.map(c=><option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
                  </select>
                </div>
                <div>
                  <label style={fieldLbl}>Đơn hàng</label>
                  <select value={form.orderId} onChange={e=>{
                    const oid=e.target.value;
                    const ord=orders.find(o=>o.id===oid);
                    setForm(f=>({...f,orderId:oid,customerId:ord?.customerId||f.customerId}));
                  }} style={fieldInp}>
                    <option value="">-- Không liên kết --</option>
                    {orders.slice(0,50).map(o=><option key={o.id} value={o.id}>{o.id} · {o.customerName} · {o.tourName||o.service}</option>)}
                  </select>
                </div>
              </div>
              {/* Danh sách việc cần giao — mỗi dòng sẽ tạo thành 1 công việc riêng, 1 người phụ trách */}
              <div>
                <label style={fieldLbl}>Danh sách việc cần giao</label>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {multiRows.map((r,idx)=>(
                    <div key={idx} style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <input value={r.title} onChange={e=>updateMultiRow(idx,"title",e.target.value)}
                        placeholder="VD: Đặt vé máy bay..." style={{...fieldInp,flex:"2 1 160px"}}/>
                      <select value={r.serviceType} onChange={e=>updateMultiRow(idx,"serviceType",e.target.value)} style={{...fieldInp,flex:"1 1 120px"}}>
                        <option value="">-- Loại dịch vụ --</option>
                        {SERVICE_TYPES.map(s=><option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                      </select>
                      <select value={r.assignee} onChange={e=>updateMultiRow(idx,"assignee",e.target.value)} style={{...fieldInp,flex:"1 1 120px"}}>
                        <option value="">-- Người phụ trách --</option>
                        {staffList.map(n=><option key={n} value={n}>{n}</option>)}
                      </select>
                      <DateInput value={r.dueDate} onChange={v=>updateMultiRow(idx,"dueDate",v)} style={{...fieldInp,flex:"1 1 120px"}}/>
                      <button onClick={()=>removeMultiRow(idx)} disabled={multiRows.length===1}
                        style={{background:"var(--c-danger-bg)",border:"none",borderRadius:"var(--r-md)",width:40,height:44,color:"var(--c-danger-mid)",cursor:multiRows.length===1?"default":"pointer",opacity:multiRows.length===1?.4:1,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <i className="ti ti-trash" style={{fontSize:15}}/>
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={addMultiRow} style={{marginTop:10,background:"none",border:"none",color:"var(--c-primary-mid)",cursor:"pointer",fontSize:"var(--text-sm)",fontWeight:700,display:"flex",alignItems:"center",gap:4,padding:0}}>
                  <i className="ti ti-plus" style={{fontSize:14}}/>Thêm dòng
                </button>
              </div>
            </>
          ) : (
          <>
          {/* Tiêu đề */}
          <div>
            <label style={fieldLbl}>Tiêu đề công việc *</label>
            <input value={form.title} onChange={e=>setF("title",e.target.value)}
              placeholder="VD: Xác nhận khách sạn cho đoàn 4/7..." autoFocus
              style={{...fieldInp,padding:"12px 14px",fontSize:"var(--text-lg)",fontWeight:500,transition:"border .15s"}}
              onFocus={e=>e.target.style.borderColor="var(--c-primary-mid)"}
              onBlur={e=>e.target.style.borderColor="var(--c-border)"}/>
          </div>
          {/* Mô tả */}
          <div>
            <label style={fieldLbl}>Mô tả chi tiết</label>
            <textarea value={form.description} onChange={e=>setF("description",e.target.value)}
              placeholder="Thêm thông tin, yêu cầu cụ thể..." rows={3}
              style={{...fieldInp,padding:"12px 14px",resize:"vertical",fontFamily:"inherit"}}
              onFocus={e=>e.target.style.borderColor="var(--c-primary-mid)"}
              onBlur={e=>e.target.style.borderColor="var(--c-border)"}/>
          </div>
          {/* Giao cho + Ưu tiên */}
          <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={fieldLbl}>Giao cho</label>
              <select value={form.assignee} onChange={e=>setF("assignee",e.target.value)} style={fieldInp}>
                <option value="">-- Chọn nhân viên --</option>
                {staffList.map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLbl}>Mức độ ưu tiên</label>
              <div style={{display:"flex",gap:8}}>
                {Object.entries(PRIORITY).map(([k,p])=>(
                  <button key={k} onClick={()=>setF("priority",k)}
                    style={{flex:1,padding:"10px 8px",borderRadius:"var(--r-md)",border:`2px solid ${form.priority===k?p.color:"var(--c-border)"}`,background:form.priority===k?p.bg:"var(--c-surface)",color:form.priority===k?p.color:"var(--c-text-muted)",fontWeight:700,fontSize:"var(--text-sm)",cursor:"pointer",transition:"all .15s"}}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Loại dịch vụ (tag hiển thị, chưa link đơn hàng thật) + Deadline */}
          <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={fieldLbl}>Loại dịch vụ (tuỳ chọn)</label>
              <select value={form.serviceType} onChange={e=>setF("serviceType",e.target.value)} style={fieldInp}>
                <option value="">-- Không chọn --</option>
                {SERVICE_TYPES.map(s=><option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLbl}>Deadline</label>
              <DateInput value={form.dueDate} onChange={v=>setF("dueDate",v)} style={fieldInp}/>
            </div>
          </div>
          {/* Liên kết khách hàng + đơn hàng */}
          <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={fieldLbl}>Liên kết khách hàng (tuỳ chọn)</label>
              <select value={form.customerId} onChange={e=>setF("customerId",e.target.value)} style={fieldInp}>
                <option value="">-- Không liên kết --</option>
                {customers.map(c=><option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLbl}>Liên kết đơn hàng (tuỳ chọn)</label>
              <select value={form.orderId} onChange={e=>{
                const oid=e.target.value;
                const ord=orders.find(o=>o.id===oid);
                setForm(f=>({...f,orderId:oid,customerId:ord?.customerId||f.customerId}));
              }} style={fieldInp}>
                <option value="">-- Không liên kết --</option>
                {orders.slice(0,50).map(o=><option key={o.id} value={o.id}>{o.id} · {o.customerName} · {o.tourName||o.service}</option>)}
              </select>
            </div>
          </div>
          </>
          )}
        </div>
        {/* Footer */}
        <div style={{padding:"16px 24px",borderTop:"1px solid var(--c-border)",display:"flex",gap:10,justifyContent:"flex-end",background:"var(--c-surface-2)"}}>
          <Btn variant="secondary" onClick={()=>{setShowForm(false);resetForm();}}>Hủy</Btn>
          {formMode==="multi" && !form.id ? (
            <Btn disabled={!form.title.trim()||!multiRows.some(r=>r.title.trim()&&r.assignee)} onClick={saveMultiTasks}>
              Tạo {multiRows.filter(r=>r.title.trim()&&r.assignee).length||""} công việc
            </Btn>
          ) : (
            <Btn disabled={!form.title.trim()} onClick={saveTask}>{form.id?"Lưu thay đổi":"Tạo công việc"}</Btn>
          )}
        </div>
      </div>
    </div>
  );

  // ── TASK DETAIL PANEL ────────────────────────────────────
  const [commentText, setCommentText] = React.useState("");
  const [showReturnBox, setShowReturnBox] = React.useState(false);
  const [returnReason, setReturnReason] = React.useState("");
  const [reassignSelect, setReassignSelect] = React.useState("");
  const TaskDetail = ({t}) => {
    if (!t) return null;
    const dl = daysLeft(t.dueDate);
    const isOverdue = dl !== null && dl < 0 && t.status !== "done";
    const p = PRIORITY[t.priority] || PRIORITY.normal;
    const s = STATUS[t.status] || STATUS.new;
    const linkedOrder = orders.find(o=>o.id===t.orderId);
    const linkedCustomer = findCustomer(t.customerId);
    return (
      <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",justifyContent:"flex-end"}} {...overlayCloseHandlers(()=>setSelectedTask(null))}>
        <div style={{width:480,maxWidth:"95vw",height:"100vh",background:"var(--c-surface)",boxShadow:"var(--sh-xl)",display:"flex",flexDirection:"column",animation:"slideInRight .25s ease"}}>
          <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
          {/* Header */}
          <div style={{padding:"20px 22px",borderBottom:"1px solid var(--c-border)",display:"flex",alignItems:"flex-start",gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <span style={{background:p.bg,color:p.color,borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",fontWeight:700,padding:"3px 10px",display:"inline-flex",alignItems:"center",gap:4}}>
                  <i className={`ti ${p.icon}`} style={{fontSize:12}}/>{p.label}
                </span>
                <span style={{background:s.bg,color:s.color,borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",fontWeight:700,padding:"3px 10px",border:`1px solid ${s.border}`}}>{s.label}</span>
                {t.serviceType&&SERVICE_TYPE_MAP[t.serviceType]&&<span style={{background:"var(--c-surface-2)",color:"var(--c-text-2)",borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",fontWeight:600,padding:"3px 10px"}}>{SERVICE_TYPE_MAP[t.serviceType].icon} {SERVICE_TYPE_MAP[t.serviceType].label}</span>}
                {isOverdue&&<span style={{background:"var(--c-danger-bg)",color:"var(--c-danger-mid)",borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",fontWeight:700,padding:"3px 10px"}}>⚠ Trễ {Math.abs(dl)} ngày</span>}
              </div>
              <div style={{fontSize:"var(--text-xl)",fontWeight:800,color:"var(--c-text)",lineHeight:1.3}}>{t.title}</div>
              <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-muted)",marginTop:6}}>Tạo bởi {t.createdBy||"—"} · {t.createdAt?new Date(t.createdAt).toLocaleDateString("vi-VN"):""}</div>
            </div>
            <button onClick={()=>setSelectedTask(null)} style={{background:"var(--c-surface-2)",border:"none",borderRadius:"var(--r-md)",width:36,height:36,fontSize:18,cursor:"pointer",color:"var(--c-text-3)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          {/* Body */}
          <div style={{flex:1,overflowY:"auto",padding:"18px 22px",display:"flex",flexDirection:"column",gap:16}}>
            {/* Info grid */}
            <div className="resp-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                ["Giao cho",    t.assignee||"Chưa giao", "ti-user"],
                ["Deadline",   t.dueDate?`${fmtDate(t.dueDate)}${dl!==null?" ("+( dl===0?"Hôm nay":dl>0?`còn ${dl} ngày`:`trễ ${Math.abs(dl)} ngày`)+")":""}` : "Không có", "ti-calendar"],
              ].map(([k,v,ic])=>(
                <div key={k} style={{background:"var(--c-surface-2)",borderRadius:"var(--r-md)",padding:"12px 14px"}}>
                  <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-muted)",fontWeight:600,textTransform:"uppercase",marginBottom:4,display:"flex",alignItems:"center",gap:4}}><i className={`ti ${ic}`}/>{k}</div>
                  <div style={{fontSize:"var(--text-md)",fontWeight:600,color:"var(--c-text)"}}>{v}</div>
                </div>
              ))}
            </div>
            {/* Mô tả */}
            {t.description&&(
              <div style={{background:"var(--c-surface-2)",borderRadius:"var(--r-md)",padding:"14px 16px"}}>
                <div style={{fontSize:"var(--text-xs)",color:"var(--c-text-muted)",fontWeight:600,textTransform:"uppercase",marginBottom:8}}>Mô tả</div>
                <div style={{fontSize:"var(--text-md)",color:"var(--c-text-2)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{t.description}</div>
              </div>
            )}
            {/* Khách hàng liên kết */}
            {linkedCustomer&&(
              <div style={{background:"var(--c-purple-light,#f3f0ff)",borderRadius:"var(--r-md)",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                <i className="ti ti-user" style={{fontSize:20,color:"var(--c-purple,#7c3aed)"}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:"var(--text-xs)",color:"var(--c-purple,#7c3aed)",fontWeight:600}}>Khách hàng liên kết</div>
                  <div style={{fontSize:"var(--text-base)",color:"var(--c-text-2)"}}>{linkedCustomer.name} · {linkedCustomer.phone}</div>
                </div>
              </div>
            )}
            {/* Đơn hàng liên kết */}
            {linkedOrder&&(
              <div style={{background:"var(--c-primary-light)",borderRadius:"var(--r-md)",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                <i className="ti ti-file-text" style={{fontSize:20,color:"var(--c-primary-mid)"}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:"var(--text-xs)",color:"var(--c-primary-mid)",fontWeight:600}}>{linkedOrder.id}</div>
                  <div style={{fontSize:"var(--text-base)",color:"var(--c-text-2)"}}>{linkedOrder.customerName} · {linkedOrder.tourName||linkedOrder.service}</div>
                </div>
              </div>
            )}
            {/* Đổi trạng thái — bàn giao 2 chiều, chỉ đúng vai trò mới thao tác được */}
            <div>
              <div style={{fontSize:"var(--text-sm)",fontWeight:700,color:"var(--c-text-3)",textTransform:"uppercase",marginBottom:8}}>Cập nhật trạng thái</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {t.status==="new" && (isAssignee(t)||canManage(t)) && (
                    <Btn onClick={()=>startTask(t)}><i className="ti ti-player-play" style={{fontSize:15}}/>Bắt đầu làm</Btn>
                  )}
                  {t.status==="in_progress" && isSelfAssigned(t) && (isAssignee(t)||canManage(t)) && (
                    <Btn onClick={()=>approveTask(t)}><i className="ti ti-check" style={{fontSize:15}}/>Hoàn thành</Btn>
                  )}
                  {t.status==="in_progress" && !isSelfAssigned(t) && (isAssignee(t)||canManage(t)) && (
                    <Btn onClick={()=>submitForReview(t)}><i className="ti ti-send" style={{fontSize:15}}/>Báo cáo hoàn thành</Btn>
                  )}
                  {t.status==="pending_review" && canManage(t) && (
                    <>
                      <Btn onClick={()=>approveTask(t)}><i className="ti ti-check" style={{fontSize:15}}/>Duyệt hoàn thành</Btn>
                      <Btn variant="secondary" onClick={()=>setShowReturnBox(v=>!v)}><i className="ti ti-arrow-back-up" style={{fontSize:15}}/>Trả lại</Btn>
                    </>
                  )}
                  {t.status==="done" && (
                    <span style={{fontSize:"var(--text-sm)",color:"var(--c-success-mid)",fontWeight:600}}>
                      ✓ Đã hoàn thành{t.approvedBy?` · duyệt bởi ${t.approvedBy}`:""}
                    </span>
                  )}
                </div>
                {(() => {
                  const canActNow = t.status==="pending_review" ? canManage(t) : (isAssignee(t)||canManage(t));
                  if (t.status==="done" || canActNow) return null;
                  return (
                    <div style={{fontSize:"var(--text-sm)",color:"var(--c-text-muted)"}}>
                      Đang chờ {t.status==="pending_review" ? (t.createdBy||"người giao việc") : (t.assignee||"người nhận việc")} xử lý
                    </div>
                  );
                })()}
                {showReturnBox && (
                  <div style={{background:"var(--c-warning-bg)",borderRadius:"var(--r-md)",padding:12,display:"flex",flexDirection:"column",gap:8}}>
                    <textarea value={returnReason} onChange={e=>setReturnReason(e.target.value)} rows={2}
                      placeholder="Lý do trả lại (bắt buộc)..."
                      style={{...fieldInp,padding:"8px 12px",resize:"vertical",fontFamily:"inherit"}}/>
                    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                      <Btn variant="secondary" onClick={()=>{setShowReturnBox(false);setReturnReason("");}}>Hủy</Btn>
                      <Btn disabled={!returnReason.trim()} onClick={()=>{returnTask(t,returnReason);setShowReturnBox(false);setReturnReason("");}}>Xác nhận trả lại</Btn>
                    </div>
                  </div>
                )}
                {canManage(t) && t.status!=="done" && (
                  <div>
                    <label style={fieldLbl}>Đổi người nhận</label>
                    <div style={{display:"flex",gap:8}}>
                      <select value={reassignSelect} onChange={e=>setReassignSelect(e.target.value)} style={{...fieldInp,flex:1}}>
                        <option value="">-- Chọn người nhận mới --</option>
                        {staffList.filter(n=>n!==t.assignee).map(n=><option key={n} value={n}>{n}</option>)}
                      </select>
                      <Btn variant="secondary" disabled={!reassignSelect} onClick={()=>{reassignTask(t,reassignSelect);setReassignSelect("");}}>Xác nhận</Btn>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Comments */}
            <div>
              <div style={{fontSize:"var(--text-sm)",fontWeight:700,color:"var(--c-text-3)",textTransform:"uppercase",marginBottom:10}}>Cập nhật tiến độ ({(t.comments||[]).length})</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                {(t.comments||[]).map(c=>(
                  <div key={c.id} style={{background:"var(--c-surface-2)",borderRadius:"var(--r-md)",padding:"10px 14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:"var(--text-sm)",fontWeight:700,color:"var(--c-primary)"}}>{c.by}</span>
                      <span style={{fontSize:"var(--text-xs)",color:"var(--c-text-muted)"}}>{new Date(c.ts).toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</span>
                    </div>
                    <div style={{fontSize:"var(--text-base)",color:"var(--c-text-2)",lineHeight:1.6}}>{c.text}</div>
                  </div>
                ))}
                {(t.comments||[]).length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:"16px 0",fontSize:"var(--text-base)"}}>Chưa có cập nhật nào</div>}
              </div>
              <div style={{display:"flex",gap:8}}>
                <input value={commentText} onChange={e=>setCommentText(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addComment(t.id,commentText);setCommentText("");}}}
                  placeholder="Nhập cập nhật, Enter để gửi..."
                  style={{flex:1,border:"1.5px solid var(--c-border-mid)",borderRadius:"var(--r-md)",padding:"10px 14px",fontSize:"var(--text-sm)",outline:"none",fontFamily:"inherit",background:"var(--c-surface)",color:"var(--c-text)"}}
                  onFocus={e=>e.target.style.borderColor="var(--c-primary-mid)"}
                  onBlur={e=>e.target.style.borderColor="var(--c-border-mid)"}/>
                <Btn disabled={!commentText.trim()} onClick={()=>{addComment(t.id,commentText);setCommentText("");}}>Gửi</Btn>
              </div>
            </div>
          </div>
          {/* Footer actions — chỉ người tạo hoặc Ban Giám đốc mới sửa/xóa được */}
          {canManage(t) && (
            <div style={{padding:"14px 22px",borderTop:"1px solid var(--c-border)",display:"flex",gap:8,background:"var(--c-surface-2)"}}>
              <Btn variant="secondary" style={{flex:1,justifyContent:"center",background:"var(--c-primary-light)",color:"var(--c-primary-mid)"}} onClick={()=>{setForm({...t});setFormMode("single");setShowForm(true);setSelectedTask(null);}}>
                <i className="ti ti-edit" style={{fontSize:16}}/>Sửa
              </Btn>
              <Btn variant="danger" onClick={()=>deleteTask(t.id)}>
                <i className="ti ti-trash" style={{fontSize:16}}/>
              </Btn>
            </div>
          )}
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
    const linkedCustomer = findCustomer(t.customerId);

    return (
      <div onClick={()=>setSelectedTask(t)}
        style={{background:"var(--c-surface)",borderRadius:"var(--r-md)",padding:"14px 16px",cursor:"pointer",borderLeft:`3px solid ${p.color}`,boxShadow:"var(--sh-sm)",transition:"all .15s",marginBottom:8}}
        onMouseEnter={e=>e.currentTarget.style.boxShadow="var(--sh-md)"}
        onMouseLeave={e=>e.currentTarget.style.boxShadow="var(--sh-sm)"}>
        {/* Title */}
        <div style={{fontSize:"var(--text-md)",fontWeight:700,color:"var(--c-text)",marginBottom:8,lineHeight:1.4}}>{t.title}</div>
        {/* Tags row */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          <span style={{background:p.bg,color:p.color,borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",fontWeight:700,padding:"2px 8px"}}>{p.label}</span>
          {t.serviceType&&SERVICE_TYPE_MAP[t.serviceType]&&<span style={{background:"var(--c-surface-2)",color:"var(--c-text-2)",borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",fontWeight:600,padding:"2px 8px"}}>{SERVICE_TYPE_MAP[t.serviceType].icon} {SERVICE_TYPE_MAP[t.serviceType].label}</span>}
          {t.orderId&&<span style={{background:"var(--c-primary-light)",color:"var(--c-primary-mid)",borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",fontWeight:600,padding:"2px 8px",display:"flex",alignItems:"center",gap:3}}><i className="ti ti-file-text" style={{fontSize:11}}/>{t.orderId}</span>}
          {linkedCustomer&&<span style={{background:"var(--c-purple-light,#f3f0ff)",color:"var(--c-purple,#7c3aed)",borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",fontWeight:600,padding:"2px 8px",display:"flex",alignItems:"center",gap:3}}><i className="ti ti-user" style={{fontSize:11}}/>{linkedCustomer.name}</span>}
          {isOverdue&&<span style={{background:"var(--c-danger-bg)",color:"var(--c-danger-mid)",borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",fontWeight:700,padding:"2px 8px"}}>Trễ {Math.abs(dl)}n</span>}
          {isDueToday&&!isOverdue&&<span style={{background:"var(--c-warning-bg)",color:"var(--c-warning-mid)",borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",fontWeight:700,padding:"2px 8px"}}>Hôm nay</span>}
        </div>
        {/* Footer */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:avatarColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"var(--text-xs)",fontWeight:800,color:"#fff"}}>{avatar}</div>
            <span style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)",fontWeight:500}}>{t.assignee||"Chưa giao"}</span>
          </div>
          {t.dueDate&&(
            <div style={{display:"flex",alignItems:"center",gap:4,fontSize:"var(--text-sm)",color:isOverdue?"var(--c-danger-mid)":isDueToday?"var(--c-warning-mid)":"var(--c-text-muted)",fontWeight:isOverdue||isDueToday?700:400}}>
              <i className="ti ti-calendar" style={{fontSize:13}}/>
              {fmtDate(t.dueDate)}
            </div>
          )}
        </div>
        {t.comments?.length>0&&(
          <div style={{display:"flex",alignItems:"center",gap:4,marginTop:8,fontSize:"var(--text-xs)",color:"var(--c-text-muted)"}}>
            <i className="ti ti-message-circle" style={{fontSize:13}}/>{t.comments.length} cập nhật
          </div>
        )}
      </div>
    );
  };

  // ── KANBAN VIEW ──────────────────────────────────────────
  const KanbanView = () => (
    <div className="resp-grid-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,alignItems:"start"}}>
      {COLUMNS.map(col=>{
        const s = STATUS[col];
        const colTasks = filtered.filter(t=>t.status===col);
        return(
          <div key={col} style={{background:"var(--c-surface-2)",borderRadius:"var(--r-lg)",padding:"14px",minHeight:200}}>
            {/* Column header */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:s.color,flexShrink:0}}/>
              <span style={{fontWeight:700,fontSize:"var(--text-md)",color:"var(--c-text)",flex:1}}>{s.label}</span>
              <span style={{background:s.bg,color:s.color,borderRadius:"var(--r-pill)",fontSize:"var(--text-sm)",fontWeight:700,padding:"2px 9px",border:`1px solid ${s.border}`}}>{colTasks.length}</span>
            </div>
            {/* Cards */}
            {colTasks.map(t=><TaskCard key={t.id} t={t}/>)}
            {colTasks.length===0&&(
              <div style={{textAlign:"center",color:"var(--c-border-mid)",padding:"24px 0",fontSize:"var(--text-base)"}}>
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
    <div style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",overflow:"hidden",boxShadow:"var(--sh-sm)"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr style={{background:"var(--c-surface-2)"}}>
            {["Công việc","Giao cho","Ưu tiên","Trạng thái","Deadline","Đơn hàng"].map(h=>(
              <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:"var(--text-sm)",fontWeight:700,color:"var(--c-text-3)",textTransform:"uppercase",letterSpacing:.5,borderBottom:"1px solid var(--c-border)"}}>{h}</th>
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
                style={{borderBottom:"1px solid var(--c-border)",cursor:"pointer",background:idx%2===0?"var(--c-surface)":"var(--c-bg)"}}
                onMouseEnter={e=>e.currentTarget.style.background="var(--c-primary-light)"}
                onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"var(--c-surface)":"var(--c-bg)"}>
                <td style={{padding:"12px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {t.serviceType&&SERVICE_TYPE_MAP[t.serviceType]&&<span title={SERVICE_TYPE_MAP[t.serviceType].label}>{SERVICE_TYPE_MAP[t.serviceType].icon}</span>}
                    <div style={{fontWeight:600,fontSize:"var(--text-md)",color:"var(--c-text)"}}>{t.title}</div>
                  </div>
                  {t.comments?.length>0&&<div style={{fontSize:"var(--text-xs)",color:"var(--c-text-muted)",marginTop:2}}><i className="ti ti-message-circle" style={{fontSize:11}}/> {t.comments.length}</div>}
                </td>
                <td style={{padding:"12px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:"var(--c-primary-mid)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"var(--text-xs)",fontWeight:800,color:"#fff"}}>{(t.assignee||"?")[0]}</div>
                    <span style={{fontSize:"var(--text-sm)",color:"var(--c-text-2)"}}>{t.assignee||"Chưa giao"}</span>
                  </div>
                </td>
                <td style={{padding:"12px 16px"}}><span style={{background:p.bg,color:p.color,borderRadius:"var(--r-pill)",fontSize:"var(--text-sm)",fontWeight:700,padding:"3px 10px"}}>{p.label}</span></td>
                <td style={{padding:"12px 16px"}}><span style={{background:s.bg,color:s.color,borderRadius:"var(--r-pill)",fontSize:"var(--text-sm)",fontWeight:700,padding:"3px 10px",border:`1px solid ${s.border}`}}>{s.label}</span></td>
                <td style={{padding:"12px 16px",fontSize:"var(--text-base)",color:isOverdue?"var(--c-danger-mid)":"var(--c-text-2)",fontWeight:isOverdue?700:400}}>
                  {t.dueDate?fmtDate(t.dueDate):"—"}
                  {isOverdue&&<span style={{fontSize:"var(--text-xs)",marginLeft:6,color:"var(--c-danger-mid)"}}>({Math.abs(dl)}n trễ)</span>}
                </td>
                <td style={{padding:"12px 16px"}}>
                  {t.orderId?<span style={{background:"var(--c-primary-light)",color:"var(--c-primary-mid)",borderRadius:"var(--r-sm)",fontSize:"var(--text-sm)",padding:"3px 8px",fontWeight:600}}>{t.orderId}</span>:"—"}
                </td>
              </tr>
            );
          })}
          {filtered.length===0&&(
            <tr><td colSpan={6} style={{textAlign:"center",padding:"48px",color:"var(--c-text-muted)",fontSize:"var(--text-md)"}}>
              <i className="ti ti-clipboard-off" style={{fontSize:36,display:"block",marginBottom:8}}/>
              Không có công việc nào
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // ── VIEW "HÔM NAY" — gộp theo nhân viên, để chủ liếc nhanh ai đang làm gì,
  // ai đang rảnh cần giao thêm. Chỉ hiện việc còn active (bỏ qua Hoàn thành).
  // Khối trễ hạn lên đầu, khối rảnh (0 việc) xuống cuối.
  const staffBlocks = staffList.map(name => {
    const myActive = filtered.filter(t => t.assignee===name && t.status!=="done");
    return { name,
      tasks: myActive,
      overdueN: myActive.filter(t => t.dueDate && t.dueDate < today).length,
      newN: myActive.filter(t => t.status==="new").length,
      inProgressN: myActive.filter(t => t.status==="in_progress").length,
      reviewN: myActive.filter(t => t.status==="pending_review").length,
    };
  }).sort((a,b) => (b.overdueN-a.overdueN) || (b.tasks.length-a.tasks.length));

  const TodayView = () => (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {staffBlocks.map(b=>(
        <div key={b.name} style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",padding:"16px 18px",boxShadow:"var(--sh-sm)",borderLeft:`4px solid ${b.overdueN>0?"var(--c-danger-mid)":"transparent"}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"var(--c-primary-mid)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"var(--text-sm)",fontWeight:800,color:"#fff",flexShrink:0}}>{b.name[0]}</div>
            <span style={{fontWeight:800,fontSize:"var(--text-lg)",color:"var(--c-text)"}}>{b.name}</span>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginLeft:"auto"}}>
              {b.overdueN>0&&<span style={{background:"var(--c-danger-bg)",color:"var(--c-danger-mid)",borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",fontWeight:700,padding:"3px 10px"}}>{b.overdueN} trễ hạn</span>}
              {b.inProgressN>0&&<span style={{background:STATUS.in_progress.bg,color:STATUS.in_progress.color,borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",fontWeight:700,padding:"3px 10px"}}>{b.inProgressN} đang làm</span>}
              {b.reviewN>0&&<span style={{background:STATUS.pending_review.bg,color:STATUS.pending_review.color,borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",fontWeight:700,padding:"3px 10px"}}>{b.reviewN} chờ duyệt</span>}
              {b.newN>0&&<span style={{background:STATUS.new.bg,color:STATUS.new.color,borderRadius:"var(--r-pill)",fontSize:"var(--text-xs)",fontWeight:700,padding:"3px 10px"}}>{b.newN} mới</span>}
            </div>
          </div>
          {b.tasks.length===0 ? (
            <div style={{color:"var(--c-text-muted)",fontSize:"var(--text-base)",padding:"8px 0 0 42px"}}>Chưa có việc nào</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:6,paddingLeft:42,marginTop:10}}>
              {b.tasks.map(t=>{
                const dl=daysLeft(t.dueDate);
                const isOverdue=dl!==null&&dl<0;
                const s=STATUS[t.status]||STATUS.new;
                return(
                  <div key={t.id} onClick={()=>setSelectedTask(t)}
                    style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"7px 10px",borderRadius:"var(--r-md)",background:"var(--c-surface-2)"}}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--c-primary-light)"}
                    onMouseLeave={e=>e.currentTarget.style.background="var(--c-surface-2)"}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                    {t.serviceType&&SERVICE_TYPE_MAP[t.serviceType]&&<span title={SERVICE_TYPE_MAP[t.serviceType].label}>{SERVICE_TYPE_MAP[t.serviceType].icon}</span>}
                    <span style={{flex:1,fontSize:"var(--text-base)",color:"var(--c-text)",fontWeight:500}}>{t.title}</span>
                    {t.orderId&&<span style={{fontSize:"var(--text-xs)",color:"var(--c-primary-mid)",fontWeight:600}}>{t.orderId}</span>}
                    {t.dueDate&&<span style={{fontSize:"var(--text-xs)",color:isOverdue?"var(--c-danger-mid)":"var(--c-text-muted)",fontWeight:isOverdue?700:400,flexShrink:0}}>{isOverdue?`Trễ ${Math.abs(dl)}n`:fmtDate(t.dueDate)}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
      {staffBlocks.length===0&&(
        <div style={{textAlign:"center",padding:"48px",color:"var(--c-text-muted)",fontSize:"var(--text-md)",background:"var(--c-surface)",borderRadius:"var(--r-lg)"}}>
          <i className="ti ti-users" style={{fontSize:36,display:"block",marginBottom:8}}/>
          Chưa có nhân viên nào
        </div>
      )}
    </div>
  );

  return (
    <div style={{padding:24,background:"var(--c-bg)",minHeight:"100vh"}}>

      {/* HEADER */}
      <div className="resp-header-row" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:"var(--text-2xl)",fontWeight:800,color:"var(--c-text)",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:"var(--r-md)",background:"linear-gradient(135deg,var(--c-primary),var(--c-primary-mid))",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <i className="ti ti-checklist" style={{fontSize:22,color:"#fff"}}/>
            </div>
            Quản lý công việc
          </h2>
          <div style={{fontSize:"var(--text-md)",color:"var(--c-text-3)",marginTop:4,marginLeft:50}}>{tasks.length} công việc · {inProgress.length} đang thực hiện</div>
        </div>
        <Btn size="lg" onClick={()=>{resetForm();setShowForm(true);}}>
          <i className="ti ti-plus" style={{fontSize:18}}/>
          Tạo công việc
        </Btn>
      </div>

      {/* KPI CARDS */}
      <div className="resp-grid-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {[
          {label:"Tổng công việc",  val:tasks.length,      icon:"ti-list",        bg:"linear-gradient(135deg,var(--c-primary),var(--c-primary-mid))",    sub:`${doneThis.length} hoàn thành tháng này`},
          {label:"Đang thực hiện",  val:inProgress.length, icon:"ti-loader",      bg:"linear-gradient(135deg,var(--c-purple),#a78bfa)",    sub:`${filtered.filter(t=>t.status==="new").length} chờ bắt đầu`},
          {label:"Đến hạn hôm nay", val:dueToday.length,   icon:"ti-clock",       bg:"linear-gradient(135deg,var(--c-warning-mid),#fbbf24)",    sub:"Cần xử lý ngay"},
          {label:"Trễ deadline",    val:overdue.length,    icon:"ti-alert-circle", bg:`linear-gradient(135deg,${overdue.length>0?"var(--c-danger-mid),#ef4444":"var(--c-success-mid),#34d399"})`, sub:overdue.length>0?"Cần ưu tiên":"Không có"},
        ].map(k=>(
          <div key={k.label} style={{background:k.bg,borderRadius:"var(--r-lg)",padding:"18px 20px",boxShadow:"var(--sh-md)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:14,top:14,opacity:.2,fontSize:36}}><i className={`ti ${k.icon}`}/></div>
            <div style={{fontSize:"var(--text-sm)",color:"rgba(255,255,255,.75)",fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>{k.label}</div>
            <div style={{fontSize:"var(--text-3xl)",fontWeight:800,color:"#fff",lineHeight:1,marginBottom:4}}>{k.val}</div>
            <div style={{fontSize:"var(--text-sm)",color:"rgba(255,255,255,.65)"}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
        {/* View tabs */}
        <div style={{display:"flex",gap:2,background:"var(--c-surface)",borderRadius:"var(--r-md)",padding:4,boxShadow:"var(--sh-sm)",overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          {[{k:"today",icon:"ti-calendar-event",label:"Hôm nay"},{k:"kanban",icon:"ti-layout-kanban",label:"Kanban"},{k:"list",icon:"ti-list",label:"Danh sách"},{k:"mine",icon:"ti-user",label:"Của tôi"}].map(v=>(
            <button key={v.k} onClick={()=>setView(v.k)}
              style={{padding:"8px 16px",border:"none",borderRadius:"var(--r-sm)",background:view===v.k?"linear-gradient(135deg,var(--c-primary),var(--c-primary-mid))":"transparent",color:view===v.k?"#fff":"var(--c-text-3)",fontWeight:700,fontSize:"var(--text-sm)",cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all .15s",whiteSpace:"nowrap",flexShrink:0}}>
              <i className={`ti ${v.icon}`} style={{fontSize:16}}/>{v.label}
            </button>
          ))}
        </div>
        {/* Search */}
        <SearchInp value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Tìm công việc, nhân viên..." style={{flex:1,minWidth:200}}/>
        {/* Filters */}
        <select value={filterAssignee} onChange={e=>setFilterAssignee(e.target.value)}
          style={{border:"1.5px solid var(--c-border-mid)",borderRadius:"var(--r-md)",padding:"10px 14px",fontSize:"var(--text-md)",background:"var(--c-surface)",color:"var(--c-text)",outline:"none",minWidth:160}}>
          <option value="all">Tất cả nhân viên</option>
          {staffList.map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterPriority} onChange={e=>setFilterPriority(e.target.value)}
          style={{border:"1.5px solid var(--c-border-mid)",borderRadius:"var(--r-md)",padding:"10px 14px",fontSize:"var(--text-md)",background:"var(--c-surface)",color:"var(--c-text)",outline:"none"}}>
          <option value="all">Mọi ưu tiên</option>
          {Object.entries(PRIORITY).map(([k,p])=><option key={k} value={k}>{p.label}</option>)}
        </select>
      </div>

      {/* MAIN VIEW */}
      {(view==="today") && TodayView()}
      {(view==="kanban") && KanbanView()}
      {(view==="list" || view==="mine") && ListView()}

      {/* MODALS — gọi function trực tiếp, không dùng JSX component để tránh unmount */}
      {showForm && TaskForm({})}
      {selectedTask && TaskDetail({t:selectedTask})}

    </div>
  );
}
