function HDVModule({ hdvList=[], onUpdate, orders=[], pushNotif, currentRole }) {
  const [showForm, setShowForm] = React.useState(false);
  const [editHdv, setEditHdv] = React.useState(null);
  const [filterLang, setFilterLang] = React.useState("all");
  const [form, setForm] = React.useState({ name:'', phone:'', speciality:'', lang:[], available:true });

  const LANG_LABEL={vi:"Tiếng Việt",en:"English",fr:"Français",zh:"中文",ko:"한국어",ja:"日本語"};
  const allLangs=[...new Set(hdvList.flatMap(h=>h.lang||[]))];

  const canEdit=currentRole==='manager'||currentRole==='dieu_hanh';

  const activeAssignments=React.useMemo(()=>{
    const m={};
    orders.filter(o=>["confirmed","in_progress"].includes(o.status)&&o.hdvId).forEach(o=>{
      if(!m[o.hdvId]) m[o.hdvId]=[];
      m[o.hdvId].push(o);
    });
    return m;
  },[orders]);

  const toggleLang=(l)=>{
    setForm(f=>({...f,lang:(f.lang||[]).includes(l)?f.lang.filter(x=>x!==l):[...(f.lang||[]),l]}));
  };

  const save = () => {
    if (!form.name.trim()) return pushNotif('Nhập tên HDV','error');
    if (editHdv) {
      onUpdate(hdvList.map(h=>h.id===editHdv.id?{...h,...form}:h));
      pushNotif('Đã cập nhật HDV');
    } else {
      onUpdate([...hdvList, {...form, id:'HDV'+Date.now()}]);
      pushNotif('Đã thêm HDV mới');
    }
    setShowForm(false); setForm({name:'',phone:'',speciality:'',lang:[],available:true});
  };

  const toggleAvailable=(h)=>{
    onUpdate(hdvList.map(x=>x.id===h.id?{...x,available:!x.available}:x));
    pushNotif&&pushNotif(h.available?"Đã chuyển "+h.name+" sang Bận":"Đã chuyển "+h.name+" sang Rảnh");
  };

  const filtered=filterLang==="all"?hdvList:hdvList.filter(h=>(h.lang||[]).includes(filterLang));

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Hướng dẫn viên ({hdvList.length})</h2>
          <div style={{fontSize:13,color:"#64748b",marginTop:2}}>{hdvList.filter(h=>h.available).length} đang rảnh · {hdvList.filter(h=>!h.available).length} đang bận</div>
        </div>
        {canEdit && <button onClick={()=>{setEditHdv(null);setForm({name:'',phone:'',speciality:'',lang:[],available:true});setShowForm(true)}}
            style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:9,padding:'9px 18px',cursor:'pointer',fontWeight:700,fontSize:14}}>
            + Thêm HDV
          </button>}
      </div>

      {showForm && (
        <div style={{background:'#fff',borderRadius:14,padding:20,marginBottom:20,boxShadow:'0 1px 6px rgba(0,0,0,.07)'}}>
          <h3 style={{marginTop:0,marginBottom:16}}>{editHdv?'Sửa HDV':'Thêm HDV mới'}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:12,fontWeight:600,color:"#374151"}}>Họ tên *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 12px',fontSize:13,boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:12,fontWeight:600,color:"#374151"}}>SĐT</label>
              <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 12px',fontSize:13,boxSizing:'border-box'}}/>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <label style={{display:'block',marginBottom:4,fontSize:12,fontWeight:600,color:"#374151"}}>Chuyên môn vùng miền / loại tour</label>
              <input value={form.speciality} onChange={e=>setForm(f=>({...f,speciality:e.target.value}))} placeholder="VD: Miền Nam, Phú Quốc" style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 12px',fontSize:13,boxSizing:'border-box'}}/>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <label style={{display:'block',marginBottom:6,fontSize:12,fontWeight:600,color:"#374151"}}>Ngôn ngữ</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {Object.entries(LANG_LABEL).map(([k,v])=>(
                  <button key={k} onClick={()=>toggleLang(k)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:(form.lang||[]).includes(k)?"#2563eb":"#f1f5f9",color:(form.lang||[]).includes(k)?"#fff":"#64748b"}}>{v}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:16}}>
            <button onClick={save} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontWeight:700}}>Lưu</button>
            <button onClick={()=>setShowForm(false)} style={{background:'#6b7280',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontWeight:600}}>Hủy</button>
          </div>
        </div>
      )}

      {allLangs.length>0&&(
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          <button onClick={()=>setFilterLang("all")} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filterLang==="all"?"#1e293b":"#f1f5f9",color:filterLang==="all"?"#fff":"#64748b"}}>Tất cả ngôn ngữ</button>
          {allLangs.map(l=>(
            <button key={l} onClick={()=>setFilterLang(l)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filterLang===l?"#1e293b":"#f1f5f9",color:filterLang===l?"#fff":"#64748b"}}>{LANG_LABEL[l]||l}</button>
          ))}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:12}}>
        {filtered.length===0 && <div style={{textAlign:'center',color:'#9ca3af',padding:40,gridColumn:"1/-1"}}>Chưa có HDV nào</div>}
        {filtered.map(h=>{
          const assignments=activeAssignments[h.id]||[];
          return(
            <div key={h.id} style={{background:'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.07)'}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{fontWeight:700,fontSize:15}}>{h.name}</div>
                <span onClick={()=>canEdit&&toggleAvailable(h)} style={{background:h.available?"#dcfce7":"#fee2e2",color:h.available?"#15803d":"#dc2626",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,cursor:canEdit?"pointer":"default",whiteSpace:"nowrap"}}>{h.available?"● Rảnh":"● Bận"}</span>
              </div>
              <div style={{fontSize:13,color:'#64748b',marginTop:4}}>📞 {h.phone||"—"}</div>
              {h.speciality&&<div style={{fontSize:12,color:'#64748b',marginTop:2}}>🗺 {h.speciality}</div>}
              {(h.lang||[]).length>0&&(
                <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}}>
                  {h.lang.map(l=><span key={l} style={{fontSize:10,background:"#eff6ff",color:"#1d4ed8",borderRadius:5,padding:"2px 7px",fontWeight:600}}>{LANG_LABEL[l]||l}</span>)}
                </div>
              )}
              {assignments.length>0&&(
                <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #f1f5f9"}}>
                  <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,marginBottom:4}}>ĐANG PHỤ TRÁCH</div>
                  {assignments.map(o=>(
                    <div key={o.id} style={{fontSize:12,color:"#374151"}}>{o.id} — {o.tourName||o.service} ({o.departDate?new Date(o.departDate).toLocaleDateString("vi-VN"):"—"})</div>
                  ))}
                </div>
              )}
              {canEdit&&<button onClick={()=>{setEditHdv(h);setForm({name:h.name,phone:h.phone||'',speciality:h.speciality||'',lang:h.lang||[],available:h.available!==false});setShowForm(true)}}
                style={{marginTop:10,background:'#f1f5f9',border:'none',borderRadius:7,padding:'5px 12px',cursor:'pointer',fontSize:12,fontWeight:600}}>
                Sửa
              </button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
