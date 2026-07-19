import React from "react";

export default function GlobalSearch({orders=[],customers=[],suppliers=[],hdvList=[],onClose,onSelectOrder,onSelectCustomer,onSelectSupplier,setView}){
  const [q,setQ]=React.useState("");
  const inputRef=React.useRef(null);
  React.useEffect(()=>{inputRef.current?.focus();},[]);
  React.useEffect(()=>{
    const onKey=(e)=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[onClose]);

  const ql=q.trim().toLowerCase();
  const orderResults=ql?orders.filter(o=>o.id?.toLowerCase().includes(ql)||o.customerName?.toLowerCase().includes(ql)||o.customerPhone?.includes(ql)||o.tourName?.toLowerCase().includes(ql)).slice(0,6):[];
  const custResults=ql?customers.filter(c=>c.name?.toLowerCase().includes(ql)||c.phone?.includes(ql)).slice(0,6):[];
  const suppResults=ql?(suppliers||[]).filter(s=>(s.name||s.ten)?.toLowerCase().includes(ql)).slice(0,3):[];
  const hdvResults=ql?(hdvList||[]).filter(h=>h.name?.toLowerCase().includes(ql)||h.phone?.includes(ql)).slice(0,2):[];

  return(
    <div className="modal-overlay" style={{alignItems:"flex-start",paddingTop:"10vh"}} onClick={onClose}>
      <div className="anim-scale" onClick={e=>e.stopPropagation()} style={{background:"var(--c-surface)",borderRadius:16,width:560,maxWidth:"90vw",maxHeight:"70vh",overflow:"hidden",boxShadow:"0 16px 48px rgba(0,0,0,.3)"}}>
        <div style={{padding:16,borderBottom:"1px solid var(--c-surface-3)"}}>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm đơn hàng, khách hàng, SĐT..." style={{width:"100%",border:"none",outline:"none",fontSize:16,padding:"6px 4px"}}/>
        </div>
        <div style={{maxHeight:"55vh",overflowY:"auto"}}>
          {ql&&orderResults.length===0&&custResults.length===0&&suppResults.length===0&&hdvResults.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:32,fontSize:13}}>Không tìm thấy kết quả</div>}
          {orderResults.length>0&&(
            <div>
              <div style={{padding:"8px 16px",fontSize:11,fontWeight:700,color:"var(--c-text-muted)",textTransform:"uppercase"}}>Đơn hàng</div>
              {orderResults.map(o=>(
                <div key={o.id} onClick={()=>onSelectOrder(o)} style={{padding:"10px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--c-surface-2)"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <div><span style={{fontWeight:700,fontSize:13,color:"var(--c-primary-mid)"}}>{o.id}</span><span style={{fontSize:13,marginLeft:8}}>{o.customerName}</span></div>
                  <span style={{fontSize:12,color:"var(--c-text-3)"}}>{o.tourName||o.service}</span>
                </div>
              ))}
            </div>
          )}
          {custResults.length>0&&(
            <div>
              <div style={{padding:"8px 16px",fontSize:11,fontWeight:700,color:"var(--c-text-muted)",textTransform:"uppercase"}}>Khách hàng</div>
              {custResults.map(c=>(
                <div key={c.id} onClick={()=>onSelectCustomer(c)} style={{padding:"10px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--c-surface-2)"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <span style={{fontWeight:700,fontSize:13}}>{c.name}</span>
                  <span style={{fontSize:12,color:"var(--c-text-3)"}}>{c.phone}</span>
                </div>
              ))}
            </div>
          )}
          {suppResults.length>0&&(
            <div>
              <div style={{padding:"8px 16px",fontSize:11,fontWeight:700,color:"var(--c-text-muted)",textTransform:"uppercase"}}>Nhà cung cấp</div>
              {suppResults.map(s=>(
                <div key={s.id} onClick={()=>{if(setView)setView("ncc");onClose();}} style={{padding:"10px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--c-surface-2)"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <span style={{fontWeight:700,fontSize:13}}>{s.name||s.ten}</span>
                  <span style={{fontSize:12,color:"var(--c-text-3)"}}>{s.phone||s.sdt||""}</span>
                </div>
              ))}
            </div>
          )}
          {hdvResults.length>0&&(
            <div>
              <div style={{padding:"8px 16px",fontSize:11,fontWeight:700,color:"var(--c-text-muted)",textTransform:"uppercase"}}>Hướng dẫn viên</div>
              {hdvResults.map(h=>(
                <div key={h.id} onClick={()=>{if(setView)setView("hdv");onClose();}} style={{padding:"10px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--c-surface-2)"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <span style={{fontWeight:700,fontSize:13}}>{h.name}</span>
                  <span style={{fontSize:12,color:"var(--c-text-3)"}}>{h.phone||""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
