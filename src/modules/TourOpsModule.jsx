import React from "react";
import {
  buildDispatch, buildGuideContract, buildTourSettlement, downloadAsWord,
} from "../print/index.jsx";
import { openPrintWindow } from "../print/legacy.jsx";
import { DEFAULT_CHECKLIST } from "../constants/checklist.js";
import { getOpsStage, daysToDepart } from "../utils/tourOpsStage.js";

export default function TourOpsModule({ orders=[], pushNotif, currentUser, currentRole, hdvList=[], onUpdateOrder, prefillOrderId, onPrefillConsumed }) {
  const [selected,setSelected]=React.useState(null);
  const [assignHdv,setAssignHdv]=React.useState("");

  // Mở sẵn đúng đơn khi được điều hướng tới từ "Chưa có HDV" ở Chi tiết đơn hàng
  React.useEffect(()=>{
    if(!prefillOrderId) return;
    const o=orders.find(x=>x.id===prefillOrderId);
    if(o) setSelected(o);
    else pushNotif&&pushNotif("Không tìm thấy đơn "+prefillOrderId,"error");
    onPrefillConsumed&&onPrefillConsumed();
  },[prefillOrderId]);

  // Chỉ tour trọn gói tự thiết kế mới cần điều hành (tự cử HDV, tự vận hành đoàn) —
  // Tour ghép mua lại từ đối tác khác vận hành, Combo/vé/khách sạn đơn lẻ không có
  // đoàn+HDV riêng, nên không thuộc phạm vi module này dù đơn đã xác nhận.
  const activeOrders = orders.filter(o=>['confirmed','in_progress'].includes(o.status) && o.service==="tour_package");
  const fmtDate=(d)=>d?new Date(d).toLocaleDateString("vi-VN"):"—";
  const daysTo=daysToDepart;

  const MILESTONES=["assigned","departed","returned","settled"];
  const MILESTONE_LABEL={assigned:"Đã giao HDV",departed:"Đã khởi hành",returned:"Đã về điểm cuối",settled:"Đã quyết toán"};
  const MILESTONE_ICON={assigned:"🧑‍🦯",departed:"🚌",returned:"🏁",settled:"✅"};

  const getStage=getOpsStage;

  const toggleMilestone=(o,key)=>{
    const m={...(o.opsMilestones||{})};
    m[key]=!m[key];
    onUpdateOrder&&onUpdateOrder({...o,opsMilestones:m});
    pushNotif&&pushNotif(m[key]?"Đã đánh dấu: "+MILESTONE_LABEL[key]:"Đã bỏ đánh dấu: "+MILESTONE_LABEL[key]);
  };

  const doAssignHdv=(o)=>{
    if(!assignHdv) return pushNotif&&pushNotif("Chọn HDV","error");
    const hdv=hdvList.find(h=>h.id===assignHdv);
    const m={...(o.opsMilestones||{}),assigned:true};
    onUpdateOrder&&onUpdateOrder({...o,hdvName:hdv?.name,hdvId:hdv?.id,opsMilestones:m});
    pushNotif&&pushNotif("Đã giao "+(hdv?.name||"")+" cho đơn "+o.id);
    setAssignHdv("");
    if(selected?.id===o.id) setSelected({...o,hdvName:hdv?.name,hdvId:hdv?.id,opsMilestones:m});
  };

  const urgentSoon=activeOrders.filter(o=>{
    const d=daysTo(o.departDate);
    return d!==null&&d>=0&&d<=2&&getStage(o)<1;
  });

  if(selected){
    const stage=getStage(selected);
    return(
      <div style={{padding:24,maxWidth:680,margin:"0 auto"}}>
        <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:"var(--c-primary-mid)",cursor:"pointer",fontSize:14,marginBottom:16}}>← Danh sách tour</button>
        <div style={{background:"var(--c-surface)",borderRadius:16,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:16}}>
          <div style={{fontSize:19,fontWeight:800}}>{selected.id} — {selected.tourName||selected.service}</div>
          <div style={{fontSize:13,color:"var(--c-text-3)",marginTop:4}}>{selected.customerName||(typeof selected.customer==="object"?selected.customer?.name:selected.customer)||""} · {typeof selected.pax==="object"?(selected.pax.adults||0)+(selected.pax.children||0)+(selected.pax.babies||0):selected.pax||1} khách</div>
          <div style={{fontSize:13,color:"var(--c-text-3)",marginTop:2}}>📅 Khởi hành: {fmtDate(selected.departDate)} {selected.returnDate?"→ "+fmtDate(selected.returnDate):""}</div>

          <div style={{marginTop:18}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:"var(--c-text-2)"}}>Hướng dẫn viên</div>
            {selected.hdvName?(
              <div style={{background:"var(--c-success-bg)",borderRadius:8,padding:"8px 12px",fontSize:13,color:"var(--c-success)",fontWeight:600}}>🧑‍🦯 {selected.hdvName}</div>
            ):(
              <div style={{display:"flex",gap:8}}>
                <select value={assignHdv} onChange={e=>setAssignHdv(e.target.value)} style={{flex:1,border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13}}>
                  <option value="">-- Chọn HDV --</option>
                  {hdvList.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                <button onClick={()=>doAssignHdv(selected)} style={{background:"var(--c-primary-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:700,fontSize:13}}>Giao</button>
              </div>
            )}
          </div>
        </div>

        {/* ── TÀI LIỆU IN ── */}
        <div style={{background:"var(--c-surface)",borderRadius:16,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:16}}>
          <div style={{fontWeight:700,marginBottom:12,fontSize:14,color:"var(--c-text-2)"}}>🖨️ Tài liệu điều hành</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {/* Phiếu điều tour */}
            {(()=>{const hdvObj=hdvList.find(h=>h.id===selected.hdvId)||{name:selected.hdvName};const html=buildDispatch({order:selected,hdv:hdvObj,meetPoint:selected.meetPoint,meetTime:selected.meetTime,notes:selected.note,issuerName:currentUser?.name});return(
              <div style={{display:"inline-flex",alignItems:"stretch",borderRadius:8,overflow:"hidden",border:"1px solid var(--c-primary-pale)"}}>
                <button onClick={()=>openPrintWindow(html)} style={{padding:"8px 12px",background:"var(--c-primary-light)",color:"var(--c-primary)",border:"none",borderRight:"1px solid var(--c-primary-pale)",cursor:"pointer",fontSize:12,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>🗂 Phiếu điều tour &nbsp;🖨</button>
                <button onClick={()=>downloadAsWord(html,"PhieuDieuTour-"+(selected.id||""))} style={{padding:"8px 10px",background:"var(--c-primary-pale)",color:"var(--c-primary)",border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>📝 Word</button>
              </div>
            );})()}
            {/* Hợp đồng HDV */}
            {selected.hdvId&&(()=>{const hdvObj=hdvList.find(h=>h.id===selected.hdvId)||{name:selected.hdvName};const days=selected.departDate&&selected.returnDate?Math.max(1,Math.ceil((new Date(selected.returnDate)-new Date(selected.departDate))/86400000)):1;const html=buildGuideContract({order:selected,hdv:hdvObj,dailyFee:hdvObj.dailyFee||800000,totalFee:(hdvObj.dailyFee||800000)*days,advanceAmount:Math.round(((hdvObj.dailyFee||800000)*days)*0.5),tourDays:days+"N"+(days-1)+"Đ",issuerName:currentUser?.name});return(
              <div style={{display:"inline-flex",alignItems:"stretch",borderRadius:8,overflow:"hidden",border:"1px solid var(--c-success-border)"}}>
                <button onClick={()=>openPrintWindow(html)} style={{padding:"8px 12px",background:"var(--c-success-bg)",color:"var(--c-success)",border:"none",borderRight:"1px solid var(--c-success-border)",cursor:"pointer",fontSize:12,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>📝 Hợp đồng HDV &nbsp;🖨</button>
                <button onClick={()=>downloadAsWord(html,"HopDong-HDV-"+(selected.id||""))} style={{padding:"8px 10px",background:"var(--c-success-bg)",color:"var(--c-success)",border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>📝 Word</button>
              </div>
            );})()}
            {/* Quyết toán tour */}
            {(selected.opsMilestones||{}).returned&&(()=>{const hdvObj=hdvList.find(h=>h.id===selected.hdvId)||{name:selected.hdvName};const html=buildTourSettlement({order:selected,hdv:hdvObj,advanceAmount:selected.advanceAmount||0,expenseItems:[],totalCollected:selected.totalPaid||0,issuerName:currentUser?.name});return(
              <div style={{display:"inline-flex",alignItems:"stretch",borderRadius:8,overflow:"hidden",border:"1px solid var(--c-purple-border)"}}>
                <button onClick={()=>openPrintWindow(html)} style={{padding:"8px 12px",background:"var(--c-purple-bg)",color:"var(--c-purple)",border:"none",borderRight:"1px solid var(--c-purple-border)",cursor:"pointer",fontSize:12,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>📊 Quyết toán tour &nbsp;🖨</button>
                <button onClick={()=>downloadAsWord(html,"QuyetToan-Tour-"+(selected.id||""))} style={{padding:"8px 10px",background:"var(--c-purple-bg)",color:"var(--c-purple)",border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>📝 Word</button>
              </div>
            );})()}
          </div>
        </div>

        <div style={{background:"var(--c-surface)",borderRadius:16,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <div style={{fontWeight:700,marginBottom:16}}>Tiến độ vận hành</div>
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {MILESTONES.map((key,i)=>{
              const done=!!(selected.opsMilestones||{})[key];
              const isCurrent=i===stage;
              return(
                <div key={key} style={{display:"flex",gap:12,alignItems:"flex-start",position:"relative",paddingBottom:i<MILESTONES.length-1?28:0}}>
                  {i<MILESTONES.length-1&&<div style={{position:"absolute",left:13,top:28,bottom:0,width:2,background:done?"var(--c-success-mid)":"var(--c-border)"}}/>}
                  <div onClick={()=>toggleMilestone(selected,key)} style={{width:28,height:28,borderRadius:"50%",background:done?"var(--c-success-mid)":"var(--c-surface)",border:"2px solid "+(done?"var(--c-success-mid)":"var(--c-border-mid)"),display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,zIndex:1}}>
                    {done?<span style={{color:"var(--c-text-inverse)",fontWeight:800,fontSize:13}}>✓</span>:<span style={{fontSize:13}}>{MILESTONE_ICON[key]}</span>}
                  </div>
                  <div style={{paddingTop:4}}>
                    <div style={{fontWeight:700,fontSize:14,color:done?"var(--c-success-mid)":isCurrent?"var(--c-text-2)":"var(--c-text-muted)"}}>{MILESTONE_LABEL[key]}</div>
                    {isCurrent&&!done&&<div style={{fontSize:12,color:"var(--c-warning-mid)",fontWeight:600}}>Đang chờ xác nhận bước này</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{background:"var(--c-surface)",borderRadius:16,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontWeight:700}}>Checklist công việc</div>
            <div style={{fontSize:12,color:"var(--c-text-3)",fontWeight:600}}>
              {(()=>{const cl=selected.checklist||DEFAULT_CHECKLIST;return cl.filter(c=>c.done).length+"/"+cl.length+" hoàn thành";})()}
            </div>
          </div>
          {(()=>{
            const checklist=selected.checklist||DEFAULT_CHECKLIST;
            const cats=[...new Set(checklist.map(c=>c.cat))];
            const toggleItem=(id)=>{
              const updated=checklist.map(c=>c.id===id?{...c,done:!c.done}:c);
              onUpdateOrder&&onUpdateOrder({...selected,checklist:updated});
              setSelected({...selected,checklist:updated});
            };
            return cats.map(cat=>(
              <div key={cat} style={{marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:700,color:"var(--c-text-muted)",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>{cat}</div>
                {checklist.filter(c=>c.cat===cat).map(item=>(
                  <div key={item.id} onClick={()=>toggleItem(item.id)} style={{display:"flex",gap:10,alignItems:"center",padding:"7px 0",cursor:"pointer"}}>
                    <div style={{width:18,height:18,borderRadius:5,border:"2px solid "+(item.done?"var(--c-success-mid)":"var(--c-border-mid)"),background:item.done?"var(--c-success-mid)":"var(--c-surface)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {item.done&&<span style={{color:"var(--c-text-inverse)",fontSize:11,fontWeight:800}}>✓</span>}
                    </div>
                    <span style={{fontSize:13,color:item.done?"var(--c-text-muted)":"var(--c-text-2)",textDecoration:item.done?"line-through":"none"}}>{item.item}</span>
                  </div>
                ))}
              </div>
            ));
          })()}
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:24}}>
      <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:800}}>Điều hành Tour</h2>
      <div style={{fontSize:13,color:"var(--c-text-3)",marginBottom:20}}>{activeOrders.length} đơn đang trong quy trình vận hành</div>

      {urgentSoon.length>0&&(
        <div style={{background:"var(--c-danger-bg)",borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:13,color:"var(--c-danger-mid)",fontWeight:600}}>
          🚨 {urgentSoon.length} tour khởi hành trong 48h <b>chưa giao HDV</b> — xử lý ngay
        </div>
      )}

      <div style={{display:'grid',gap:12}}>
        {activeOrders.length===0 && <div style={{textAlign:'center',color:'var(--c-text-muted)',padding:40}}>Không có tour nào đang chạy</div>}
        {activeOrders.map(o=>{
          const stage=getStage(o);
          const d=daysTo(o.departDate);
          const isUrgent=d!==null&&d>=0&&d<=2&&stage<1;
          return(
            <div key={o.id} onClick={()=>setSelected(o)} style={{background:'var(--c-surface)',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.07)',cursor:"pointer",border:isUrgent?"1px solid var(--c-danger-border)":"1px solid transparent",transition:"box-shadow .15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.07)"}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15}}>{o.id} — {o.tourName||o.service}</div>
                  <div style={{fontSize:13,color:'var(--c-text-3)',marginTop:4}}>Khách: {o.customerName||(typeof o.customer==="object"?o.customer?.name:o.customer)||""} · Pax: {typeof o.pax==="object"?(o.pax.adults||0)+(o.pax.children||0)+(o.pax.babies||0):o.pax||1}</div>
                  <div style={{fontSize:13,color:'var(--c-text-3)'}}>Khởi hành: {fmtDate(o.departDate)} {d!==null&&d>=0&&<span style={{color:d<=2?"var(--c-danger-mid)":"var(--c-text-3)",fontWeight:600}}>({d===0?"hôm nay":"còn "+d+" ngày"})</span>} · HDV: {o.hdvName||<span style={{color:"var(--c-danger-mid)"}}>Chưa phân công</span>}</div>
                </div>
                <span style={{background:o.status==='in_progress'?'var(--c-success-bg)':'var(--c-warning-bg)',color:o.status==='in_progress'?'var(--c-success-mid)':'var(--c-warning)',borderRadius:6,padding:'4px 10px',fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>
                  {o.status==='in_progress'?'Đang chạy':'Đã xác nhận'}
                </span>
              </div>
              <div style={{display:"flex",gap:4,marginTop:12}}>
                {MILESTONES.map((key,i)=>(
                  <div key={key} style={{flex:1,height:5,borderRadius:3,background:i<=stage-1||(!!(o.opsMilestones||{})[key])?"var(--c-success-mid)":"var(--c-border)"}}/>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

