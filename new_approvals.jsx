function ApprovalsModule({ orders, expenses, onExpenseUpdate, pushNotif, currentRole, currentUser }){
  const [tab,setTab]=React.useState("mine");
  const [detail,setDetail]=React.useState(null);
  const [rejectNote,setRejectNote]=React.useState("");
  const [showReject,setShowReject]=React.useState(false);
  const [filterStatus,setFilterStatus]=React.useState("all");

  const PS=EXP_PIPELINE_STATUS;
  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";
  const fmtDate=(d)=>d?new Date(d).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"}):"—";

  // Determine what this role can act on
  const roleStage={accountant:"pending_kt",manager:"pending_gd",cashier:"pending_pay"};
  const myStage=roleStage[currentRole];

  const chiExpenses=expenses.filter(e=>e.type==="chi");

  // Tabs
  const myQueue=chiExpenses.filter(e=>e.status===myStage);
  const allPending=chiExpenses.filter(e=>["pending_kt","pending_gd","pending_pay"].includes(e.status));
  const done=chiExpenses.filter(e=>["paid","rejected"].includes(e.status));
  const myCreated=chiExpenses.filter(e=>e.createdBy===currentUser?.name||e.sale===currentUser?.name);

  const tabs=[
    ...(myStage?[{k:"mine",label:"Cần duyệt",count:myQueue.length,color:"#ef4444"}]:[]),
    {k:"all_pending",label:"Đang chờ",count:allPending.length,color:"#f59e0b"},
    {k:"done",label:"Hoàn tất",count:done.length,color:"#10b981"},
    {k:"created",label:"Phiếu của tôi",count:myCreated.length,color:"#6366f1"},
  ];

  const activeTab=tab==="mine"&&!myStage?"all_pending":tab;
  let list=activeTab==="mine"?myQueue:activeTab==="all_pending"?allPending:activeTab==="done"?done:myCreated;
  if(filterStatus!=="all") list=list.filter(e=>e.status===filterStatus);

  // Pipeline advance
  const nextStatus={pending_kt:"pending_gd",pending_gd:"pending_pay",pending_pay:"paid"};
  const approveLabel={accountant:"KT Trưởng duyệt",manager:"GĐ phê duyệt",cashier:"Chuyển tiền"};

  const doApprove=(exp)=>{
    const ns=nextStatus[exp.status];
    if(!ns) return;
    const log=[...(exp.pipelineLog||[]),{status:ns,by:currentUser?.name,role:currentRole,at:new Date().toISOString(),action:"approve"}];
    const updated={...exp,status:ns,pipelineLog:log};
    onExpenseUpdate(updated);
    const msg=ns==="paid"?"Đã chuyển tiền phiếu "+exp.id:ns==="pending_pay"?"GĐ đã duyệt, chờ KT Quỹ chuyển tiền":ns==="pending_gd"?"KT Trưởng đã duyệt, chờ GĐ phê duyệt":"Đã duyệt";
    pushNotif&&pushNotif(msg,"success");
    if(detail?.id===exp.id) setDetail(updated);
  };

  const doReject=(exp,note)=>{
    const log=[...(exp.pipelineLog||[]),{status:"rejected",by:currentUser?.name,role:currentRole,at:new Date().toISOString(),action:"reject",note}];
    const updated={...exp,status:"rejected",rejectedBy:currentUser?.name,rejectedAt:new Date().toISOString(),rejectNote:note,pipelineLog:log};
    onExpenseUpdate(updated);
    pushNotif&&pushNotif("Đã từ chối phiếu "+exp.id,"error");
    setShowReject(false); setRejectNote("");
    if(detail?.id===exp.id) setDetail(updated);
  };

  const canActOn=(exp)=>myStage&&exp.status===myStage;

  // Pipeline steps UI
  const STAGES=["pending_kt","pending_gd","pending_pay","paid"];
  const STAGE_LABELS=["KT Trưởng","GĐ","KT Quỹ","Hoàn tất"];

  function PipelineBar({exp}){
    const curIdx=exp.status==="rejected"?-1:STAGES.indexOf(exp.status);
    return(
      <div style={{display:"flex",alignItems:"center",gap:0,margin:"16px 0"}}>
        {STAGES.map((s,i)=>{
          const log=(exp.pipelineLog||[]).find(l=>l.status===s||l.status===STAGES[i]);
          const isPast=exp.status!=="rejected"&&i<curIdx;
          const isCur=i===curIdx;
          const isRej=exp.status==="rejected"&&(exp.pipelineLog||[]).some(l=>l.status==="rejected");
          const color=isPast||isCur?"#10b981":"#d1d5db";
          return(
            <React.Fragment key={s}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flex:1}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:isPast?"#10b981":isCur?PS[s]?.dot||"#f59e0b":"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:isPast||isCur?"#fff":"#94a3b8",border:isCur?`3px solid ${PS[s]?.dot}`:isPast?"3px solid #10b981":"none",transition:"all .3s"}}>
                  {isPast?"✓":i+1}
                </div>
                <div style={{fontSize:11,color:isPast?"#10b981":isCur?"#1e293b":"#94a3b8",fontWeight:isCur?700:400,textAlign:"center",lineHeight:1.2}}>{STAGE_LABELS[i]}</div>
                {log&&<div style={{fontSize:10,color:"#6b7280"}}>{log.by?.split(" ")[0]||""}</div>}
              </div>
              {i<STAGES.length-1&&<div style={{height:2,flex:0,width:24,background:isPast?"#10b981":"#e2e8f0",marginBottom:20}}/>}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Detail view
  if(detail){
    const st=PS[detail.status]||{label:detail.status,color:"#64748b",bg:"#f1f5f9"};
    const isRejected=detail.status==="rejected";
    return(
      <div style={{padding:24,maxWidth:680,margin:"0 auto"}}>
        <button onClick={()=>{setDetail(null);setShowReject(false);setRejectNote("");}} style={{background:"none",border:"none",color:"#2563eb",cursor:"pointer",fontSize:14,marginBottom:16,display:"flex",alignItems:"center",gap:6}}>← Quay lại</button>
        <div style={{background:"#fff",borderRadius:16,padding:28,boxShadow:"0 2px 16px rgba(0,0,0,.09)"}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:"#0f172a"}}>{detail.id}</div>
              <div style={{fontSize:13,color:"#64748b",marginTop:4}}>Tạo bởi <strong>{detail.createdBy||"—"}</strong> · {fmtDate(detail.createdAt)}</div>
            </div>
            <span style={{background:isRejected?"#fee2e2":st.bg,color:isRejected?"#dc2626":st.color,borderRadius:20,padding:"6px 16px",fontWeight:700,fontSize:13,whiteSpace:"nowrap"}}>
              {isRejected?"❌ Bị từ chối":st.label}
            </span>
          </div>

          {/* Pipeline bar */}
          {!isRejected&&<PipelineBar exp={detail}/>}
          {isRejected&&(
            <div style={{background:"#fee2e2",borderRadius:10,padding:12,marginBottom:16,fontSize:13,color:"#991b1b"}}>
              ❌ Từ chối bởi <strong>{detail.rejectedBy||"—"}</strong> · {fmtDate(detail.rejectedAt)}
              {detail.rejectNote&&<div style={{marginTop:4}}>Lý do: {detail.rejectNote}</div>}
            </div>
          )}

          {/* Info rows */}
          <div style={{background:"#f8fafc",borderRadius:10,overflow:"hidden",marginBottom:16}}>
            {[
              ["Loại chi","Phiếu chi NCC"],
              ["NCC / Đối tác",detail.nccName||detail.ncc||"—"],
              ["Số tiền",<span style={{color:"#dc2626",fontWeight:800,fontSize:16}}>{fmtMoney(detail.amount)}</span>],
              ["Hình thức",detail.method==="cash"?"💵 Tiền mặt":"🏦 Chuyển khoản"],
              ["Đơn hàng",detail.orderId||"—"],
              ["Mã booking / PNR",detail.pnrCode||"—"],
              ["Ghi chú",detail.note||"—"],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"11px 14px",borderBottom:"1px solid #f1f5f9",fontSize:14}}>
                <span style={{color:"#64748b"}}>{k}</span>
                <span style={{fontWeight:600,textAlign:"right"}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Pipeline log */}
          {(detail.pipelineLog||[]).length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Lịch sử duyệt</div>
              {detail.pipelineLog.map((l,i)=>{
                const s=PS[l.status]||{label:l.status,dot:"#94a3b8"};
                return(
                  <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:l.status==="rejected"?"#ef4444":s.dot||"#10b981",marginTop:5,flexShrink:0}}/>
                    <div style={{fontSize:13}}>
                      <strong>{l.by||"—"}</strong> · {l.action==="approve"?s.label:"Từ chối"} · {fmtDate(l.at)}
                      {l.note&&<div style={{color:"#ef4444",fontSize:12}}>Lý do: {l.note}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          {canActOn(detail)&&!showReject&&(
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button onClick={()=>doApprove(detail)} style={{flex:2,background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:800,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                ✓ {approveLabel[currentRole]||"Duyệt"}
              </button>
              <button onClick={()=>setShowReject(true)} style={{flex:1,background:"#fff",color:"#dc2626",border:"2px solid #dc2626",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:14}}>
                ✗ Từ chối
              </button>
            </div>
          )}
          {showReject&&(
            <div style={{marginTop:8,background:"#fff5f5",borderRadius:12,padding:16,border:"1px solid #fecaca"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#dc2626",marginBottom:8}}>Lý do từ chối</div>
              <textarea value={rejectNote} onChange={e=>setRejectNote(e.target.value)} placeholder="Nhập lý do từ chối..." rows={3}
                style={{width:"100%",border:"1px solid #fca5a5",borderRadius:8,padding:10,fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
              <div style={{display:"flex",gap:8,marginTop:10}}>
                <button onClick={()=>doReject(detail,rejectNote)} style={{flex:1,background:"#dc2626",color:"#fff",border:"none",borderRadius:8,padding:10,cursor:"pointer",fontWeight:700}}>Xác nhận từ chối</button>
                <button onClick={()=>{setShowReject(false);setRejectNote("");}} style={{flex:1,background:"#e2e8f0",color:"#475569",border:"none",borderRadius:8,padding:10,cursor:"pointer",fontWeight:700}}>Hủy</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  const statusBadge=(exp)=>{
    if(exp.status==="rejected") return{bg:"#fee2e2",c:"#dc2626",label:"Từ chối"};
    const s=PS[exp.status]||{bg:"#f1f5f9",color:"#64748b",label:exp.status};
    return{bg:s.bg,c:s.color,label:s.label};
  };

  return(
    <div style={{padding:24}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:22,fontWeight:900}}>Phê duyệt phiếu chi</h2>
          {myStage&&<div style={{fontSize:13,color:"#64748b",marginTop:2}}>Hàng đợi của bạn ({PS[myStage]?.label}): <strong style={{color:myQueue.length>0?"#ef4444":"#16a34a"}}>{myQueue.length} phiếu</strong></div>}
        </div>
      </div>

      {/* Pipeline summary bar */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {s:"pending_kt",label:"Chờ KT Trưởng",color:"#e8c53a",bg:"#fef9e7",tc:"#7a5a00"},
          {s:"pending_gd",label:"Chờ GĐ",color:"#8b5cf6",bg:"#f3f0ff",tc:"#5c2eb0"},
          {s:"pending_pay",label:"Chờ chuyển tiền",color:"#3a8bd4",bg:"#e6f1fb",tc:"#1a4d8f"},
          {s:"paid",label:"Đã chuyển",color:"#10b981",bg:"#f0fdf4",tc:"#15803d"},
        ].map(({s,label,color,bg,tc})=>{
          const cnt=chiExpenses.filter(e=>e.status===s).length;
          const amt=chiExpenses.filter(e=>e.status===s).reduce((sum,e)=>sum+(e.amount||0),0);
          return(
            <div key={s} style={{background:bg,borderRadius:12,padding:"14px 16px",borderLeft:`4px solid ${color}`,cursor:"pointer"}}
              onClick={()=>{setTab("all_pending");setFilterStatus(s);}}>
              <div style={{fontSize:12,color:tc,fontWeight:700,marginBottom:4}}>{label}</div>
              <div style={{fontSize:24,fontWeight:900,color:tc}}>{cnt}</div>
              <div style={{fontSize:12,color:tc,opacity:.8}}>{(amt/1e6).toFixed(1)}tr</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:16,background:"#f1f5f9",borderRadius:10,padding:4,width:"fit-content"}}>
        {tabs.map(({k,label,count,color})=>(
          <button key={k} onClick={()=>{setTab(k);setFilterStatus("all");}}
            style={{padding:"8px 18px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,
              background:activeTab===k?"#fff":"transparent",color:activeTab===k?"#1e293b":"#64748b",
              boxShadow:activeTab===k?"0 1px 4px rgba(0,0,0,.1)":"none"}}>
            {label}
            {count>0&&<span style={{background:activeTab===k?color:"#e2e8f0",color:activeTab===k?"#fff":"#475569",borderRadius:20,padding:"1px 7px",fontSize:11,marginLeft:4}}>{count}</span>}
          </button>
        ))}
      </div>

      {/* Filter by status (when on all_pending) */}
      {activeTab==="all_pending"&&(
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
          {["all","pending_kt","pending_gd","pending_pay"].map(s=>{
            const info=s==="all"?{label:"Tất cả"}:PS[s]||{label:s};
            return(
              <button key={s} onClick={()=>setFilterStatus(s)}
                style={{padding:"4px 12px",borderRadius:20,border:"1px solid",fontSize:12,cursor:"pointer",fontWeight:600,
                  background:filterStatus===s?(s==="all"?"#1e293b":PS[s]?.dot||"#94a3b8"):"transparent",
                  color:filterStatus===s?"#fff":(s==="all"?"#1e293b":PS[s]?.color||"#64748b"),
                  borderColor:filterStatus===s?"transparent":(s==="all"?"#cbd5e1":PS[s]?.dot||"#cbd5e1")}}>
                {info.label}
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,.07)",overflow:"hidden"}}>
        {list.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:56,fontSize:15}}>Không có phiếu nào</div>}
        {list.map(e=>{
          const badge=statusBadge(e);
          const actOn=canActOn(e);
          return(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:"1px solid #f8fafc",cursor:"pointer",transition:"background .1s"}}
              onMouseEnter={ev=>ev.currentTarget.style.background="#f8fafc"}
              onMouseLeave={ev=>ev.currentTarget.style.background=""}
              onClick={()=>setDetail(e)}>
              {/* Left indicator */}
              <div style={{width:4,height:48,borderRadius:2,background:e.status==="rejected"?"#ef4444":PS[e.status]?.dot||"#94a3b8",flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:6}}>
                  {e.id}
                  {actOn&&<span style={{background:"#fef3c7",color:"#d97706",fontSize:10,borderRadius:4,padding:"1px 6px",fontWeight:700}}>CẦN DUYỆT</span>}
                </div>
                <div style={{fontSize:12,color:"#64748b",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.nccName||e.ncc||e.note||"—"} · {e.orderId||"—"} · {e.createdBy||"—"}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontWeight:800,fontSize:15,color:"#dc2626"}}>{fmtMoney(e.amount)}</div>
                <span style={{fontSize:11,background:badge.bg,color:badge.c,borderRadius:20,padding:"2px 8px",fontWeight:600}}>{badge.label}</span>
              </div>
              {actOn&&(
                <div style={{display:"flex",gap:6,flexShrink:0}} onClick={ev=>{ev.stopPropagation();}}>
                  <button onClick={ev=>{ev.stopPropagation();doApprove(e);}}
                    style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"7px 13px",cursor:"pointer",fontSize:12,fontWeight:700}}>✓</button>
                  <button onClick={ev=>{ev.stopPropagation();setDetail(e);setShowReject(true);}}
                    style={{background:"#fff",color:"#dc2626",border:"1px solid #dc2626",borderRadius:8,padding:"7px 13px",cursor:"pointer",fontSize:12,fontWeight:700}}>✗</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
