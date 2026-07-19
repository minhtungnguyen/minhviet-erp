import React from "react";

function TourProgramForm({ initial, onSave, onCancel, pushNotif, tourPrograms }){
  const [form,setForm]=React.useState(initial||{name:"",route:"",days:2,nights:1,type:"standard",targetGroup:"",organizer:"Minh Việt Travel",highlights:"",includes:"",excludes:"",note:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=()=>{
    if(!form.name.trim()) return pushNotif&&pushNotif("Nhập tên chương trình","error");
    const prog={...form,id:initial?.id||"TP-"+Date.now(),days:Number(form.days)||2,nights:Number(form.nights)||1};
    onSave(prog);
  };
  return(
    <div style={{background:"var(--c-surface)",borderRadius:14,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
      <h3 style={{margin:"0 0 20px",fontSize:16,fontWeight:800}}>{initial?"Sửa chương trình":"Thêm chương trình mới"}</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {[["Tên chương trình *","name"],["Lộ trình","route"],["Nhóm đối tượng","targetGroup"],["Đơn vị tổ chức","organizer"]].map(([label,key])=>(
          <div key={key}>
            <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"}}>{label}</label>
            <input value={form[key]||""} onChange={e=>set(key,e.target.value)} style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
          </div>
        ))}
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"}}>Số ngày</label>
          <input type="number" min={1} value={form.days} onChange={e=>set("days",e.target.value)} style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"}}>Số đêm</label>
          <input type="number" min={0} value={form.nights} onChange={e=>set("nights",e.target.value)} style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"}}>Loại tour</label>
          <select value={form.type} onChange={e=>set("type",e.target.value)} style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13}}>
            {["standard","mice_teambuilding","incentive","luxury","family","ghep"].map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      {[["Điểm nổi bật","highlights"],["Bao gồm","includes"],["Không bao gồm","excludes"],["Ghi chú","note"]].map(([label,key])=>(
        <div key={key} style={{marginTop:12}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"var(--c-text-2)"}}>{label}</label>
          <textarea value={form[key]||""} onChange={e=>set(key,e.target.value)} rows={2} style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box",resize:"vertical"}}/>
        </div>
      ))}
      <div style={{display:"flex",gap:10,marginTop:18}}>
        <button onClick={save} style={{flex:2,background:"var(--c-primary-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:700}}>Lưu</button>
        <button onClick={onCancel} style={{flex:1,background:"var(--c-surface-3)",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:600}}>Hủy</button>
      </div>
    </div>
  );
}

export default function TourProgramModule({ tourPrograms, onUpdate, currentRole, pushNotif, currentUser }){
  const [search,setSearch]=React.useState("");
  const [showForm,setShowForm]=React.useState(false);
  const [editProg,setEditProg]=React.useState(null);
  const [detail,setDetail]=React.useState(null);

  const canEdit=currentRole==="manager"||currentRole==="dieu_hanh";
  const filtered=(tourPrograms||[]).filter(t=>{
    const q=search.toLowerCase();
    return !q||t.name?.toLowerCase().includes(q)||t.route?.toLowerCase().includes(q);
  });

  const saveProg=(prog)=>{
    if(editProg) onUpdate((tourPrograms||[]).map(t=>t.id===prog.id?prog:t));
    else onUpdate([prog,...(tourPrograms||[])]);
    pushNotif&&pushNotif(editProg?"Đã cập nhật chương trình":"Đã thêm chương trình");
    setShowForm(false); setEditProg(null);
  };

  const deleteProg=(id)=>{
    if(!window.confirm("Xóa chương trình này?")) return;
    onUpdate((tourPrograms||[]).filter(t=>t.id!==id));
    pushNotif&&pushNotif("Đã xóa");
  };

  if(detail) return(
    <div style={{padding:24,maxWidth:800,margin:"0 auto"}}>
      <button onClick={()=>setDetail(null)} style={{background:"none",border:"none",color:"var(--c-primary-mid)",cursor:"pointer",fontSize:14,marginBottom:16}}>← Danh sách</button>
      <div style={{background:"var(--c-surface)",borderRadius:16,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,.08)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"var(--c-purple)",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{detail.type}</div>
            <h2 style={{margin:0,fontSize:18,fontWeight:800}}>{detail.name}</h2>
            <div style={{fontSize:13,color:"var(--c-text-3)",marginTop:4}}>📍 {detail.route} · {detail.days}N{detail.nights}Đ · {detail.targetGroup}</div>
          </div>
          {canEdit&&<button onClick={()=>{setEditProg(detail);setShowForm(true);setDetail(null);}} style={{background:"var(--c-surface-3)",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:600}}>✏️ Sửa</button>}
        </div>
        {[["✨ Điểm nổi bật",detail.highlights],["✅ Bao gồm",detail.includes],["❌ Không bao gồm",detail.excludes],["📝 Ghi chú",detail.note]].map(([label,content])=>content&&(
          <div key={label} style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:6,color:"var(--c-text-2)"}}>{label}</div>
            <div style={{fontSize:13,color:"var(--c-text-2)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{content}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Chương trình Tour</h2>
          <div style={{fontSize:13,color:"var(--c-text-3)",marginTop:2}}>{(tourPrograms||[]).length} chương trình</div>
        </div>
        {canEdit&&!showForm&&<button onClick={()=>{setEditProg(null);setShowForm(true);}} style={{background:"var(--c-primary-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:9,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:14}}>+ Thêm chương trình</button>}
      </div>
      {showForm&&<div style={{marginBottom:20}}><TourProgramForm initial={editProg} onSave={saveProg} onCancel={()=>{setShowForm(false);setEditProg(null);}} pushNotif={pushNotif} tourPrograms={tourPrograms}/></div>}
      <div style={{position:"relative",marginBottom:16}}>
        <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--c-text-muted)"}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm tên chương trình, lộ trình..." style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:10,padding:"10px 12px 10px 32px",fontSize:13,boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {filtered.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:48,gridColumn:"1/-1"}}>Chưa có chương trình nào</div>}
        {filtered.map(t=>(
          <div key={t.id} style={{background:"var(--c-surface)",borderRadius:14,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.07)",cursor:"pointer",transition:"box-shadow .15s"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,.07)"}
            onClick={()=>setDetail(t)}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--c-purple)",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{t.type}</div>
            <div style={{fontWeight:800,fontSize:15,marginBottom:4,color:"var(--c-text-2)"}}>{t.name}</div>
            <div style={{fontSize:12,color:"var(--c-text-3)"}}>📍 {t.route||"—"}</div>
            <div style={{fontSize:12,color:"var(--c-text-3)",marginTop:2}}>🕐 {t.days}N{t.nights}Đ · {t.targetGroup||"Tất cả"}</div>
            {canEdit&&<div style={{display:"flex",gap:6,marginTop:12}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>{setEditProg(t);setShowForm(true);}} style={{background:"var(--c-primary-light)",color:"var(--c-primary-mid)",border:"none",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>Sửa</button>
              <button onClick={()=>deleteProg(t.id)} style={{background:"var(--c-danger-bg)",color:"var(--c-danger-mid)",border:"none",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>Xóa</button>
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}
