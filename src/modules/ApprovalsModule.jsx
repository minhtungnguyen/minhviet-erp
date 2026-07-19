import React from "react";
import { isBanGiamDoc } from "../utils/permissions.js";
import { Btn } from "../components/ui.jsx";

const EXP_PIPELINE_STATUS = {
  draft:       { label:"Nháp",              color:"var(--c-text-muted)", bg:"var(--c-surface-2)",  dot:"var(--c-border-mid)"    },
  pending_kt:  { label:"Chờ KT Trưởng",    color:"var(--c-warning)", bg:"var(--c-warning-bg)",  dot:"var(--c-warning-mid)" },
  pending_gd:  { label:"Chờ Giám đốc",     color:"var(--c-purple)", bg:"var(--c-purple-bg)",  dot:"var(--c-purple)" },
  pending_pay: { label:"Chờ chuyển tiền",  color:"var(--c-info)", bg:"var(--c-info-bg)",  dot:"var(--c-info)" },
  paid:        { label:"Đã chuyển tiền",   color:"var(--c-primary-mid)", bg:"var(--c-primary-light)",  dot:"var(--c-primary-mid)" },
  rejected:    { label:"Bị từ chối",       color:"var(--c-danger)", bg:"var(--c-danger-bg)",  dot:"var(--c-danger-mid)" },
};

function PipelineBar({exp}){
  const STAGES=["pending_kt","pending_gd","pending_pay","paid"];
  const STAGE_LABELS=["KT Trưởng","GĐ","KT Quỹ","Hoàn tất"];
  const curIdx=exp.status==="rejected"?-1:STAGES.indexOf(exp.status);
  return(
    <div style={{display:"flex",alignItems:"center",gap:0,margin:"16px 0"}}>
      {STAGES.map((s,i)=>{
        const log=(exp.pipelineLog||[]).find(l=>l.status===s||l.status===STAGES[i]);
        const isPast=exp.status!=="rejected"&&i<curIdx;
        const isCur=i===curIdx;
        const isRej=exp.status==="rejected"&&(exp.pipelineLog||[]).some(l=>l.status==="rejected");
        const color=isPast||isCur?"var(--c-success-mid)":"var(--c-border-mid)";
        return(
          <React.Fragment key={s}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flex:1}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:isPast?"var(--c-success-mid)":isCur?EXP_PIPELINE_STATUS[s]?.dot||"#f59e0b":"var(--c-border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"var(--text-base)",fontWeight:800,color:isPast||isCur?"#fff":"var(--c-text-muted)",border:isCur?`3px solid ${EXP_PIPELINE_STATUS[s]?.dot}`:isPast?"3px solid var(--c-success-mid)":"none",transition:"all .3s"}}>
                {isPast?"✓":i+1}
              </div>
              <div style={{fontSize:"var(--text-xs)",color:isPast?"var(--c-success-mid)":isCur?"var(--c-text)":"var(--c-text-muted)",fontWeight:isCur?700:400,textAlign:"center",lineHeight:1.2}}>{STAGE_LABELS[i]}</div>
              {log&&<div style={{fontSize:10,color:"var(--c-text-3)"}}>{log.by?.split(" ")[0]||""}</div>}
            </div>
            {i<STAGES.length-1&&<div style={{height:2,flex:0,width:24,background:isPast?"var(--c-success-mid)":"var(--c-border)",marginBottom:20}}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function ApprovalsModule({ orders, expenses, vouchers=[], onExpenseUpdate, onVoucherUpdate, pushNotif, currentRole, currentUser }){
  const [tab,setTab]=React.useState("mine");
  const [detail,setDetail]=React.useState(null);
  const [rejectNote,setRejectNote]=React.useState("");
  const [showReject,setShowReject]=React.useState(false);
  const [filterStatus,setFilterStatus]=React.useState("all");
  const [apprBill,setApprBill]=React.useState(null);

  const PS=EXP_PIPELINE_STATUS;
  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";
  const fmtDate=(d)=>d?new Date(d).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"}):"—";

  // Determine what this role can act on
  const roleStage={accountant:"pending_kt",manager:"pending_gd",pho_giam_doc:"pending_gd",cashier:"pending_pay"};
  const myStage=roleStage[currentRole];

  const chiExpenses=expenses.filter(e=>e.type==="chi");

  // Tabs
  const myQueue=chiExpenses.filter(e=>e.status===myStage);
  const allPending=chiExpenses.filter(e=>["pending_kt","pending_gd","pending_pay"].includes(e.status));
  const done=chiExpenses.filter(e=>["paid","rejected"].includes(e.status));
  const myCreated=chiExpenses.filter(e=>e.createdBy===currentUser?.name||e.sale===currentUser?.name);

  const tabs=[
    ...(myStage?[{k:"mine",label:"Cần duyệt",count:myQueue.length,color:"var(--c-danger-mid)"}]:[]),
    {k:"all_pending",label:"Đang chờ",count:allPending.length,color:"var(--c-warning-mid)"},
    {k:"done",label:"Hoàn tất",count:done.length,color:"var(--c-success-mid)"},
    {k:"created",label:"Phiếu của tôi",count:myCreated.length,color:"var(--c-accent)"},
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

  // Detail view
  if(detail){
    const st=PS[detail.status]||{label:detail.status,color:"var(--c-text-3)",bg:"var(--c-surface-2)"};
    const isRejected=detail.status==="rejected";
    return(
      <div style={{padding:24,maxWidth:680,margin:"0 auto"}}>
        <button onClick={()=>{setDetail(null);setShowReject(false);setRejectNote("");}} style={{background:"none",border:"none",color:"var(--c-primary-mid)",cursor:"pointer",fontSize:"var(--text-md)",marginBottom:16,display:"flex",alignItems:"center",gap:6}}>← Quay lại</button>
        <div style={{background:"var(--c-surface)",borderRadius:"var(--r-xl)",padding:28,boxShadow:"var(--sh-lg)"}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div>
              <div style={{fontSize:"var(--text-2xl)",fontWeight:900,color:"var(--c-text)"}}>{detail.id}</div>
              <div style={{fontSize:"var(--text-base)",color:"var(--c-text-3)",marginTop:4}}>Tạo bởi <strong>{detail.createdBy||"—"}</strong> · {fmtDate(detail.createdAt)}</div>
            </div>
            <span style={{background:isRejected?"var(--c-danger-bg)":st.bg,color:isRejected?"var(--c-danger-mid)":st.color,borderRadius:"var(--r-pill)",padding:"6px 16px",fontWeight:700,fontSize:"var(--text-base)",whiteSpace:"nowrap"}}>
              {isRejected?"❌ Bị từ chối":st.label}
            </span>
          </div>

          {/* Pipeline bar */}
          {!isRejected&&<PipelineBar exp={detail}/>}
          {isRejected&&(
            <div style={{background:"var(--c-danger-bg)",borderRadius:"var(--r-md)",padding:12,marginBottom:16,fontSize:"var(--text-base)",color:"var(--c-danger)"}}>
              ❌ Từ chối bởi <strong>{detail.rejectedBy||"—"}</strong> · {fmtDate(detail.rejectedAt)}
              {detail.rejectNote&&<div style={{marginTop:4}}>Lý do: {detail.rejectNote}</div>}
            </div>
          )}

          {/* Info rows */}
          <div style={{background:"var(--c-surface-2)",borderRadius:"var(--r-md)",overflow:"hidden",marginBottom:16}}>
            {[
              ["Loại chi","Phiếu chi NCC"],
              ["NCC / Đối tác",detail.nccName||detail.ncc||"—"],
              ["Số tiền",<span style={{color:"var(--c-danger-mid)",fontWeight:800,fontSize:"var(--text-lg)"}}>{fmtMoney(detail.amount)}</span>],
              ["Hình thức",detail.method==="cash"?"💵 Tiền mặt":"🏦 Chuyển khoản"],
              ["Đơn hàng",detail.orderId||"—"],
              ["Mã booking / PNR",detail.pnrCode||"—"],
              ["Ghi chú",detail.note||"—"],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"11px 14px",borderBottom:"1px solid var(--c-border)",fontSize:"var(--text-md)"}}>
                <span style={{color:"var(--c-text-3)"}}>{k}</span>
                <span style={{fontWeight:600,textAlign:"right"}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Pipeline log */}
          {(detail.pipelineLog||[]).length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:"var(--text-sm)",color:"var(--c-text-muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Lịch sử duyệt</div>
              {detail.pipelineLog.map((l,i)=>{
                const s=PS[l.status]||{label:l.status,dot:"var(--c-text-muted)"};
                return(
                  <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:l.status==="rejected"?"var(--c-danger-mid)":s.dot||"var(--c-success-mid)",marginTop:5,flexShrink:0}}/>
                    <div style={{fontSize:"var(--text-base)"}}>
                      <strong>{l.by||"—"}</strong> · {l.action==="approve"?s.label:"Từ chối"} · {fmtDate(l.at)}
                      {l.note&&<div style={{color:"var(--c-danger-mid)",fontSize:"var(--text-sm)"}}>Lý do: {l.note}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          {canActOn(detail)&&!showReject&&(
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <Btn variant="success" size="lg" style={{flex:2,justifyContent:"center",background:"linear-gradient(135deg,var(--c-success-mid),var(--c-success))",color:"#fff",border:"none",fontWeight:800,fontSize:"var(--text-lg)"}} onClick={()=>doApprove(detail)}>
                ✓ {approveLabel[currentRole]||"Duyệt"}
              </Btn>
              <Btn variant="danger" size="lg" style={{flex:1,justifyContent:"center",border:"2px solid var(--c-danger-mid)"}} onClick={()=>setShowReject(true)}>
                ✗ Từ chối
              </Btn>
            </div>
          )}
          {showReject&&(
            <div style={{marginTop:8,background:"var(--c-danger-bg)",borderRadius:"var(--r-md)",padding:16,border:"1px solid var(--c-danger-border)"}}>
              <div style={{fontSize:"var(--text-base)",fontWeight:700,color:"var(--c-danger-mid)",marginBottom:8}}>Lý do từ chối</div>
              <textarea value={rejectNote} onChange={e=>setRejectNote(e.target.value)} placeholder="Nhập lý do từ chối..." rows={3}
                style={{width:"100%",border:"1px solid var(--c-danger-border)",borderRadius:"var(--r-sm)",padding:10,fontSize:"var(--text-base)",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
              <div style={{display:"flex",gap:8,marginTop:10}}>
                <Btn variant="danger" style={{flex:1,justifyContent:"center",background:"var(--c-danger-mid)",color:"#fff",border:"none"}} onClick={()=>doReject(detail,rejectNote)}>Xác nhận từ chối</Btn>
                <Btn variant="secondary" style={{flex:1,justifyContent:"center"}} onClick={()=>{setShowReject(false);setRejectNote("");}}>Hủy</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  const statusBadge=(exp)=>{
    if(exp.status==="rejected") return{bg:"var(--c-danger-bg)",c:"var(--c-danger-mid)",label:"Từ chối"};
    const s=PS[exp.status]||{bg:"var(--c-surface-2)",color:"var(--c-text-3)",label:exp.status};
    return{bg:s.bg,c:s.color,label:s.label};
  };

  return(
    <div style={{padding:24}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:"var(--text-2xl)",fontWeight:900,color:"var(--c-text)"}}>Phê duyệt phiếu chi</h2>
          {myStage&&<div style={{fontSize:"var(--text-base)",color:"var(--c-text-3)",marginTop:2}}>Hàng đợi của bạn ({PS[myStage]?.label}): <strong style={{color:myQueue.length>0?"var(--c-danger-mid)":"var(--c-success-mid)"}}>{myQueue.length} phiếu</strong></div>}
        </div>
      </div>

      {/* Pipeline summary bar */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {s:"pending_kt",label:"Chờ KT Trưởng",color:"var(--c-warning-mid)",bg:"var(--c-warning-bg)",tc:"var(--c-warning)"},
          {s:"pending_gd",label:"Chờ GĐ",color:"var(--c-purple)",bg:"var(--c-purple-bg)",tc:"var(--c-purple)"},
          {s:"pending_pay",label:"Chờ chuyển tiền",color:"var(--c-info)",bg:"var(--c-info-bg)",tc:"var(--c-info)"},
          {s:"paid",label:"Đã chuyển",color:"var(--c-success-mid)",bg:"var(--c-success-bg)",tc:"var(--c-success)"},
        ].map(({s,label,color,bg,tc})=>{
          const cnt=chiExpenses.filter(e=>e.status===s).length;
          const amt=chiExpenses.filter(e=>e.status===s).reduce((sum,e)=>sum+(e.amount||0),0);
          return(
            <div key={s} style={{background:bg,borderRadius:"var(--r-md)",padding:"14px 16px",borderLeft:`4px solid ${color}`,cursor:"pointer"}}
              onClick={()=>{setTab("all_pending");setFilterStatus(s);}}>
              <div style={{fontSize:"var(--text-sm)",color:tc,fontWeight:700,marginBottom:4}}>{label}</div>
              <div style={{fontSize:"var(--text-2xl)",fontWeight:900,color:tc}}>{cnt}</div>
              <div style={{fontSize:"var(--text-sm)",color:tc,opacity:.8}}>{(amt/1e6).toFixed(1)}tr</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:16,background:"var(--c-surface-2)",borderRadius:"var(--r-md)",padding:4,width:"fit-content"}}>
        {tabs.map(({k,label,count,color})=>(
          <button key={k} onClick={()=>{setTab(k);setFilterStatus("all");}}
            style={{padding:"8px 18px",borderRadius:"var(--r-sm)",border:"none",cursor:"pointer",fontWeight:600,fontSize:"var(--text-base)",
              background:activeTab===k?"var(--c-surface)":"transparent",color:activeTab===k?"var(--c-text)":"var(--c-text-3)",
              boxShadow:activeTab===k?"var(--sh-xs)":"none"}}>
            {label}
            {count>0&&<span style={{background:activeTab===k?color:"var(--c-border)",color:activeTab===k?"#fff":"var(--c-text-2)",borderRadius:"var(--r-pill)",padding:"1px 7px",fontSize:"var(--text-xs)",marginLeft:4}}>{count}</span>}
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
                style={{padding:"4px 12px",borderRadius:"var(--r-pill)",border:"1px solid",fontSize:"var(--text-sm)",cursor:"pointer",fontWeight:600,
                  background:filterStatus===s?(s==="all"?"var(--c-text)":PS[s]?.dot||"var(--c-text-muted)"):"transparent",
                  color:filterStatus===s?"#fff":(s==="all"?"var(--c-text)":PS[s]?.color||"var(--c-text-3)"),
                  borderColor:filterStatus===s?"transparent":(s==="all"?"var(--c-border-mid)":PS[s]?.dot||"var(--c-border-mid)")}}>
                {info.label}
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      <div style={{background:"var(--c-surface)",borderRadius:"var(--r-lg)",boxShadow:"var(--sh-sm)",overflow:"hidden"}}>
        {list.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:56,fontSize:"var(--text-lg)"}}>Không có phiếu nào</div>}
        {list.map(e=>{
          const badge=statusBadge(e);
          const actOn=canActOn(e);
          return(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:"1px solid var(--c-border)",cursor:"pointer",transition:"background .1s"}}
              onMouseEnter={ev=>ev.currentTarget.style.background="var(--c-surface-2)"}
              onMouseLeave={ev=>ev.currentTarget.style.background=""}
              onClick={()=>setDetail(e)}>
              {/* Left indicator */}
              <div style={{width:4,height:48,borderRadius:2,background:e.status==="rejected"?"var(--c-danger-mid)":PS[e.status]?.dot||"var(--c-text-muted)",flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:"var(--text-md)",display:"flex",alignItems:"center",gap:6}}>
                  {e.id}
                  {actOn&&<span style={{background:"var(--c-warning-bg)",color:"var(--c-warning-mid)",fontSize:10,borderRadius:4,padding:"1px 6px",fontWeight:700}}>CẦN DUYỆT</span>}
                </div>
                <div style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.nccName||e.ncc||e.note||"—"} · {e.orderId||"—"} · {e.createdBy||"—"}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontWeight:800,fontSize:"var(--text-lg)",color:"var(--c-danger-mid)"}}>{fmtMoney(e.amount)}</div>
                <span style={{fontSize:"var(--text-xs)",background:badge.bg,color:badge.c,borderRadius:"var(--r-pill)",padding:"2px 8px",fontWeight:600}}>{badge.label}</span>
              </div>
              {actOn&&(
                <div style={{display:"flex",gap:6,flexShrink:0}} onClick={ev=>{ev.stopPropagation();}}>
                  <Btn size="sm" variant="success" style={{background:"var(--c-success-mid)",color:"#fff",border:"none"}} onClick={ev=>{ev.stopPropagation();doApprove(e);}}>✓</Btn>
                  <Btn size="sm" variant="danger" onClick={ev=>{ev.stopPropagation();setDetail(e);setShowReject(true);}}>✗</Btn>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── PHIẾU THU/CHI CHỜ DUYỆT (từ OrderDetail) ── */}
      {(()=>{
        const pendingVouchers = (vouchers||[]).filter(v=>v.status==="pending");
        if(pendingVouchers.length===0) return null;
        return(
          <div style={{marginTop:24}}>
            <div style={{fontWeight:700,fontSize:"var(--text-lg)",color:"var(--c-text)",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
              <i className="ti ti-receipt" style={{color:"var(--c-primary-mid)",fontSize:18}}/>
              Phiếu thu / chi chờ duyệt
              <span style={{background:"var(--c-danger-bg)",color:"var(--c-danger-mid)",borderRadius:"var(--r-pill)",fontSize:"var(--text-sm)",fontWeight:700,padding:"2px 9px"}}>{pendingVouchers.length}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {pendingVouchers.map(v=>{
                const linkedOrder=orders.find(o=>o.id===v.orderId);
                return(
                  <div key={v.id} style={{background:"var(--c-surface)",borderRadius:"var(--r-md)",padding:"14px 18px",boxShadow:"var(--sh-sm)",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:4,height:40,borderRadius:2,background:v.type==="thu"?"var(--c-primary-mid)":"var(--c-danger-mid)",flexShrink:0}}/>
                    {v.billImg
                      ? <img src={v.billImg} alt="bill" onClick={()=>setApprBill(v.billImg)} style={{width:52,height:52,objectFit:"cover",borderRadius:"var(--r-sm)",cursor:"zoom-in",border:"1px solid var(--c-border)",flexShrink:0}} title="Xem bill"/>
                      : <div style={{width:52,height:52,borderRadius:"var(--r-sm)",background:"var(--c-surface-2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"var(--text-xs)",color:"var(--c-border-mid)",flexShrink:0,textAlign:"center"}}>Không<br/>bill</div>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:"var(--text-md)",color:"var(--c-text)"}}>{v.id}{v.billImg&&<span style={{marginLeft:6,fontSize:"var(--text-xs)",color:"var(--c-success)"}}>📎 Có bill</span>}</div>
                      <div style={{fontSize:"var(--text-sm)",color:"var(--c-text-3)",marginTop:2}}>
                        {v.type==="thu"?"📥 Phiếu thu":"📤 Phiếu chi"} · {v.method==="cash"?"Tiền mặt":"Chuyển khoản"} · {v.date}
                        {linkedOrder&&` · ${linkedOrder.customerName} — ${linkedOrder.tourName||linkedOrder.service}`}
                      </div>
                      {v.note&&<div style={{fontSize:"var(--text-sm)",color:"var(--c-text-muted)",marginTop:2}}>{v.note}</div>}
                      {v.createdBy&&<div style={{fontSize:"var(--text-xs)",color:"var(--c-primary-mid)",marginTop:2}}>Tạo bởi: {v.createdBy}</div>}
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontWeight:800,fontSize:"var(--text-lg)",color:v.type==="thu"?"var(--c-primary-mid)":"var(--c-danger-mid)"}}>{fmtMoney(v.amount)}</div>
                      {/* Phiếu chi: chỉ Ban GĐ duyệt | Phiếu thu: KT/thủ quỹ/Ban GĐ duyệt */}
                      {(v.type==="thu"?["accountant","cashier","manager","pho_giam_doc"].includes(currentRole):isBanGiamDoc(currentRole))?(
                        <div style={{display:"flex",gap:6,marginTop:8,justifyContent:"flex-end"}}>
                          <Btn size="sm" variant="success" style={{background:"var(--c-success-mid)",color:"#fff",border:"none"}} onClick={()=>{
                            onVoucherUpdate&&onVoucherUpdate({...v,status:"approved",approvedBy:currentUser?.name,approvedAt:new Date().toISOString()});
                            pushNotif&&pushNotif("Đã duyệt "+v.id,"success");
                          }}>
                            ✓ Duyệt
                          </Btn>
                          <Btn size="sm" variant="danger" onClick={()=>{
                            onVoucherUpdate&&onVoucherUpdate({...v,status:"rejected",rejectedBy:currentUser?.name});
                            pushNotif&&pushNotif("Đã từ chối "+v.id,"warning");
                          }}>
                            ✗
                          </Btn>
                        </div>
                      ):(
                        <div style={{marginTop:8,fontSize:"var(--text-xs)",color:"var(--c-text-muted)",fontStyle:"italic"}}>{v.type==="chi"?"Chờ Ban Giám đốc duyệt":"Chờ duyệt"}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Lightbox xem bill trong Phê duyệt */}
      {apprBill&&(
        <div onClick={()=>setApprBill(null)} style={{position:"fixed",inset:0,background:"rgba(15,23,42,.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
          <img src={apprBill} alt="bill" style={{maxWidth:"90vw",maxHeight:"90vh",borderRadius:"var(--r-md)"}}/>
          <button onClick={()=>setApprBill(null)} style={{position:"absolute",top:20,right:28,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:"50%",width:36,height:36,fontSize:20,cursor:"pointer"}}>×</button>
        </div>
      )}
    </div>
  );
}
