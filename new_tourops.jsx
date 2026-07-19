function TourOpsModule({ orders=[], pushNotif, currentUser, currentRole, hdvList=[], onUpdateOrder }) {
  const [selected,setSelected]=React.useState(null);
  const [assignHdv,setAssignHdv]=React.useState("");

  const activeOrders = orders.filter(o=>['confirmed','in_progress'].includes(o.status));
  const fmtDate=(d)=>d?new Date(d).toLocaleDateString("vi-VN"):"—";
  const daysTo=(d)=>d?Math.ceil((new Date(d)-new Date())/86400000):null;

  const MILESTONES=["assigned","departed","returned","settled"];
  const MILESTONE_LABEL={assigned:"Đã giao HDV",departed:"Đã khởi hành",returned:"Đã về điểm cuối",settled:"Đã quyết toán"};
  const MILESTONE_ICON={assigned:"🧑‍🦯",departed:"🚌",returned:"🏁",settled:"✅"};

  const getStage=(o)=>{
    const m=o.opsMilestones||{};
    if(m.settled) return 4;
    if(m.returned) return 3;
    if(m.departed) return 2;
    if(m.assigned||o.hdvName) return 1;
    return 0;
  };

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
        <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:"#2563eb",cursor:"pointer",fontSize:14,marginBottom:16}}>← Danh sách tour</button>
        <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:16}}>
          <div style={{fontSize:19,fontWeight:800}}>{selected.id} — {selected.tourName||selected.service}</div>
          <div style={{fontSize:13,color:"#64748b",marginTop:4}}>{selected.customerName||selected.customer} · {selected.pax||1} khách</div>
          <div style={{fontSize:13,color:"#64748b",marginTop:2}}>📅 Khởi hành: {fmtDate(selected.departDate)} {selected.returnDate?"→ "+fmtDate(selected.returnDate):""}</div>

          <div style={{marginTop:18}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:"#374151"}}>Hướng dẫn viên</div>
            {selected.hdvName?(
              <div style={{background:"#dcfce7",borderRadius:8,padding:"8px 12px",fontSize:13,color:"#15803d",fontWeight:600}}>🧑‍🦯 {selected.hdvName}</div>
            ):(
              <div style={{display:"flex",gap:8}}>
                <select value={assignHdv} onChange={e=>setAssignHdv(e.target.value)} style={{flex:1,border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13}}>
                  <option value="">-- Chọn HDV --</option>
                  {hdvList.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                <button onClick={()=>doAssignHdv(selected)} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:700,fontSize:13}}>Giao</button>
              </div>
            )}
          </div>
        </div>

        <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <div style={{fontWeight:700,marginBottom:16}}>Tiến độ vận hành</div>
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {MILESTONES.map((key,i)=>{
              const done=!!(selected.opsMilestones||{})[key];
              const isCurrent=i===stage;
              return(
                <div key={key} style={{display:"flex",gap:12,alignItems:"flex-start",position:"relative",paddingBottom:i<MILESTONES.length-1?28:0}}>
                  {i<MILESTONES.length-1&&<div style={{position:"absolute",left:13,top:28,bottom:0,width:2,background:done?"#16a34a":"#e2e8f0"}}/>}
                  <div onClick={()=>toggleMilestone(selected,key)} style={{width:28,height:28,borderRadius:"50%",background:done?"#16a34a":"#fff",border:"2px solid "+(done?"#16a34a":"#cbd5e1"),display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,zIndex:1}}>
                    {done?<span style={{color:"#fff",fontWeight:800,fontSize:13}}>✓</span>:<span style={{fontSize:13}}>{MILESTONE_ICON[key]}</span>}
                  </div>
                  <div style={{paddingTop:4}}>
                    <div style={{fontWeight:700,fontSize:14,color:done?"#16a34a":isCurrent?"#1e293b":"#94a3b8"}}>{MILESTONE_LABEL[key]}</div>
                    {isCurrent&&!done&&<div style={{fontSize:12,color:"#d97706",fontWeight:600}}>Đang chờ xác nhận bước này</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:24}}>
      <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:800}}>Điều hành Tour</h2>
      <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>{activeOrders.length} đơn đang trong quy trình vận hành</div>

      {urgentSoon.length>0&&(
        <div style={{background:"#fee2e2",borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:13,color:"#dc2626",fontWeight:600}}>
          🚨 {urgentSoon.length} tour khởi hành trong 48h <b>chưa giao HDV</b> — xử lý ngay
        </div>
      )}

      <div style={{display:'grid',gap:12}}>
        {activeOrders.length===0 && <div style={{textAlign:'center',color:'#9ca3af',padding:40}}>Không có tour nào đang chạy</div>}
        {activeOrders.map(o=>{
          const stage=getStage(o);
          const d=daysTo(o.departDate);
          const isUrgent=d!==null&&d>=0&&d<=2&&stage<1;
          return(
            <div key={o.id} onClick={()=>setSelected(o)} style={{background:'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.07)',cursor:"pointer",border:isUrgent?"1px solid #fecaca":"1px solid transparent",transition:"box-shadow .15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.07)"}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15}}>{o.id} — {o.tourName||o.service}</div>
                  <div style={{fontSize:13,color:'#64748b',marginTop:4}}>Khách: {o.customerName||o.customer} · Pax: {o.pax||1}</div>
                  <div style={{fontSize:13,color:'#64748b'}}>Khởi hành: {fmtDate(o.departDate)} {d!==null&&d>=0&&<span style={{color:d<=2?"#dc2626":"#64748b",fontWeight:600}}>({d===0?"hôm nay":"còn "+d+" ngày"})</span>} · HDV: {o.hdvName||<span style={{color:"#dc2626"}}>Chưa phân công</span>}</div>
                </div>
                <span style={{background:o.status==='in_progress'?'#dcfce7':'#fef9c3',color:o.status==='in_progress'?'#16a34a':'#ca8a04',borderRadius:6,padding:'4px 10px',fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>
                  {o.status==='in_progress'?'Đang chạy':'Đã xác nhận'}
                </span>
              </div>
              <div style={{display:"flex",gap:4,marginTop:12}}>
                {MILESTONES.map((key,i)=>(
                  <div key={key} style={{flex:1,height:5,borderRadius:3,background:i<=stage-1||(!!(o.opsMilestones||{})[key])?"#16a34a":"#e2e8f0"}}/>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
