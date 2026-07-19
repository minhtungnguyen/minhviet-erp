import React from "react";

export default function AfterSaleModule({ careTasks=[], onUpdateTasks, orders=[], customers=[], currentUser, currentRole, pushNotif }) {
  const [showForm, setShowForm] = React.useState(false);
  const [filterType, setFilterType] = React.useState("all");
  const [form, setForm] = React.useState({ orderId:'', customerName:'', type:'call', note:'', dueDate:'' });

  const myTasks = currentRole==='manager' ? careTasks : careTasks.filter(t=>t.assignee===currentUser?.name);
  const TYPE_LABEL={call:"Gọi điện",review:"Xin review",birthday:"Sinh nhật",pre_trip:"Nhắc trước tour",upsell:"Chốt tour mới",other:"Khác"};
  const TYPE_ICON={call:"📞",review:"⭐",birthday:"🎂",pre_trip:"🧳",upsell:"🎯",other:"📌"};

  const fmtDate=(d)=>d?new Date(d).toLocaleDateString("vi-VN"):"—";
  const daysBetween=(a,b)=>Math.round((new Date(b)-new Date(a))/86400000);

  // ── Gợi ý tự động ────────────────────────────────────────
  const suggestions = React.useMemo(()=>{
    const now=new Date();
    const list=[];
    const existsTask=(orderId,type)=>careTasks.some(t=>t.orderId===orderId&&t.type===type);

    // 1) Sinh nhật khách trong 14 ngày tới
    customers.forEach(c=>{
      (c.events||[]).filter(e=>e.type==="birthday").forEach(e=>{
        const bday=new Date(e.date);
        const thisYear=new Date(now.getFullYear(),bday.getMonth(),bday.getDate());
        let diff=daysBetween(now,thisYear);
        if(diff<0) diff=daysBetween(now,new Date(now.getFullYear()+1,bday.getMonth(),bday.getDate()));
        if(diff>=0&&diff<=14&&!existsTask(c.id,"birthday")){
          list.push({key:"bday-"+c.id,type:"birthday",orderId:c.id,customerName:c.name,reason:"Sinh nhật trong "+diff+" ngày nữa",dueDate:thisYear.toISOString().slice(0,10),note:"Chúc mừng sinh nhật + ưu đãi nhỏ"});
        }
      });
    });

    // 2) Đơn đã đóng trong 7 ngày qua → xin review
    orders.filter(o=>o.status==="closed").forEach(o=>{
      const closedAt=o.closedAt||o.departDate;
      if(!closedAt) return;
      const diff=daysBetween(closedAt,now);
      if(diff>=1&&diff<=7&&!existsTask(o.id,"review")){
        list.push({key:"review-"+o.id,type:"review",orderId:o.id,customerName:o.customerName,reason:"Tour kết thúc "+diff+" ngày trước",dueDate:now.toISOString().slice(0,10),note:"Xin đánh giá 5⭐ trên Google/Facebook"});
      }
    });

    // 3) Đơn khởi hành trong 3 ngày tới → gọi xác nhận
    orders.filter(o=>["confirmed"].includes(o.status)).forEach(o=>{
      if(!o.departDate) return;
      const diff=daysBetween(now,o.departDate);
      if(diff>=0&&diff<=3&&!existsTask(o.id,"pre_trip")){
        list.push({key:"pretrip-"+o.id,type:"pre_trip",orderId:o.id,customerName:o.customerName,reason:"Khởi hành trong "+diff+" ngày",dueDate:now.toISOString().slice(0,10),note:"Gọi xác nhận giờ đón, số khách, yêu cầu đặc biệt"});
      }
    });

    // 4) Đơn đã đóng 30-120 ngày trước → upsell tour tiếp theo
    orders.filter(o=>o.status==="closed").forEach(o=>{
      const closedAt=o.closedAt||o.departDate;
      if(!closedAt) return;
      const diff=daysBetween(closedAt,now);
      if(diff>=30&&diff<=120&&!existsTask(o.id,"upsell")){
        const nextDue=new Date(now); nextDue.setDate(nextDue.getDate()+3);
        list.push({key:"upsell-"+o.id,type:"upsell",orderId:o.id,customerName:o.customerName,reason:"Tour kết thúc "+diff+" ngày trước — khách sẵn sàng đặt lại",dueDate:nextDue.toISOString().slice(0,10),note:"Tư vấn tour phù hợp, ưu đãi khách quen"});
      }
    });

    return list;
  },[customers,orders,careTasks]);

  const acceptSuggestion = (s) => {
    onUpdateTasks([...careTasks, {id:'CARE'+Date.now(), orderId:s.orderId, type:s.type, note:s.note, dueDate:s.dueDate, done:false, assignee:currentUser?.name, createdAt:new Date().toISOString(), fromSuggestion:true}]);
    pushNotif&&pushNotif("Đã tạo task: "+TYPE_LABEL[s.type]+" — "+(s.customerName||s.orderId));
  };

  const save = () => {
    if (!form.orderId) return pushNotif('Chọn đơn hàng','error');
    onUpdateTasks([...careTasks, {...form, id:'CARE'+Date.now(), done:false, assignee:currentUser?.name, createdAt:new Date().toISOString()}]);
    pushNotif('Đã tạo task chăm sóc');
    setShowForm(false);
    setForm({orderId:'',customerName:'',type:'call',note:'',dueDate:''});
  };
  const toggle = (id) => onUpdateTasks(careTasks.map(t=>t.id===id?{...t,done:!t.done}:t));

  const filteredTasks = filterType==="all"?myTasks:myTasks.filter(t=>t.type===filterType);
  const sorted = [...filteredTasks].sort((a,b)=>{
    if(a.done!==b.done) return a.done?1:-1;
    return new Date(a.dueDate||0)-new Date(b.dueDate||0);
  });

  const isOverdue=(t)=>!t.done&&t.dueDate&&new Date(t.dueDate)<new Date(new Date().toDateString());

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:"wrap",gap:12}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Chăm sóc sau bán ({myTasks.filter(t=>!t.done).length} chưa xong)</h2>
        <button onClick={()=>setShowForm(true)} style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:9,padding:'9px 18px',cursor:'pointer',fontWeight:700,fontSize:13}}>+ Tạo task</button>
      </div>

      {suggestions.length>0&&(
        <div style={{background:"#fff",borderRadius:14,padding:18,marginBottom:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)",border:"1px solid #fde68a"}}>
          <div style={{fontWeight:700,marginBottom:10,color:"#92400e",fontSize:14}}>💡 Gợi ý tự động ({suggestions.length})</div>
          <div style={{display:"grid",gap:8}}>
            {suggestions.map(s=>(
              <div key={s.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fffbeb",borderRadius:10,padding:"10px 14px"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>{TYPE_ICON[s.type]} {TYPE_LABEL[s.type]} — {s.customerName||s.orderId}</div>
                  <div style={{fontSize:12,color:"#92400e",marginTop:2}}>{s.reason}</div>
                </div>
                <button onClick={()=>acceptSuggestion(s)} style={{background:"#d97706",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>+ Tạo task</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div style={{background:'#fff',borderRadius:14,padding:20,marginBottom:16,boxShadow:'0 1px 6px rgba(0,0,0,.07)'}}>
          <h3 style={{marginTop:0,marginBottom:16}}>Task chăm sóc mới</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:12,fontWeight:600,color:"#374151"}}>Đơn hàng</label>
              <select value={form.orderId} onChange={e=>{const o=orders.find(x=>x.id===e.target.value);setForm(f=>({...f,orderId:e.target.value,customerName:o?.customerName||""}));}} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 12px',fontSize:13}}>
                <option value=''>-- Chọn đơn --</option>
                {orders.map(o=><option key={o.id} value={o.id}>{o.id} - {o.customerName||(typeof o.customer==="object"?o.customer?.name:o.customer)||"—"}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:12,fontWeight:600,color:"#374151"}}>Loại</label>
              <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 12px',fontSize:13}}>
                {Object.entries(TYPE_LABEL).map(([k,v])=><option key={k} value={k}>{TYPE_ICON[k]} {v}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:12,fontWeight:600,color:"#374151"}}>Ngày hẹn</label>
              <input type='date' value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} style={{width:"100%",border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 12px',fontSize:13,boxSizing:"border-box"}}/>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <label style={{display:'block',marginBottom:4,fontSize:12,fontWeight:600,color:"#374151"}}>Ghi chú</label>
            <textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} rows={2} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 12px',fontSize:13,boxSizing:'border-box',resize:"vertical"}}/>
          </div>
          <div style={{display:'flex',gap:8,marginTop:14}}>
            <button onClick={save} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontWeight:700}}>Lưu</button>
            <button onClick={()=>setShowForm(false)} style={{background:'#6b7280',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontWeight:600}}>Hủy</button>
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        <button onClick={()=>setFilterType("all")} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filterType==="all"?"#1e293b":"#f1f5f9",color:filterType==="all"?"#fff":"#64748b"}}>Tất cả</button>
        {Object.entries(TYPE_LABEL).map(([k,v])=>(
          <button key={k} onClick={()=>setFilterType(k)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filterType===k?"#1e293b":"#f1f5f9",color:filterType===k?"#fff":"#64748b"}}>{TYPE_ICON[k]} {v}</button>
        ))}
      </div>

      <div style={{display:'grid',gap:8}}>
        {sorted.length===0 && <div style={{textAlign:'center',color:'#9ca3af',padding:40}}>Không có task nào</div>}
        {sorted.map(t=>(
          <div key={t.id} style={{background:t.done?"#f8fafc":'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.07)',display:'flex',gap:12,alignItems:'flex-start',border:isOverdue(t)?"1px solid #fecaca":"1px solid transparent"}}>
            <input type='checkbox' checked={!!t.done} onChange={()=>toggle(t.id)} style={{marginTop:3,width:16,height:16,cursor:'pointer'}}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,textDecoration:t.done?"line-through":"none",color:t.done?"#94a3b8":"#1e293b"}}>{TYPE_ICON[t.type]} {t.orderId} — {TYPE_LABEL[t.type]||t.type}</div>
              {t.note && <div style={{fontSize:13,color:'#64748b',marginTop:2}}>{t.note}</div>}
              <div style={{fontSize:12,marginTop:4,color:isOverdue(t)?"#dc2626":"#94a3b8",fontWeight:isOverdue(t)?700:400}}>
                {isOverdue(t)&&"⚠️ Quá hạn · "}Hẹn: {fmtDate(t.dueDate)} · {t.assignee}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
