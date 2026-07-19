import React from "react";

export default function CloseOrderModule({orders,vouchers,expenses,refunds,onCloseOrder,pushNotif,currentRole,currentUser}){
  const [search,setSearch]=React.useState("");
  const [selected,setSelected]=React.useState(null);
  const [confirm,setConfirm]=React.useState(false);

  const closeable=orders.filter(o=>["confirmed","in_progress"].includes(o.status));
  const filtered=closeable.filter(o=>{
    const q=search.toLowerCase();
    return !q||o.id?.toLowerCase().includes(q)||o.customerName?.toLowerCase().includes(q)||o.tourName?.toLowerCase().includes(q);
  });

  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";

  const getFinancials=(o)=>{
    const ovs=(vouchers||[]).filter(v=>v.orderId===o.id);
    const totalPaid=ovs.filter(v=>v.type==="thu"&&["approved","confirmed"].includes(v.status)).reduce((s,v)=>s+(v.amount||0),0);
    const totalChi=ovs.filter(v=>v.type==="chi"&&["approved","confirmed"].includes(v.status)).reduce((s,v)=>s+(v.amount||0),0);
    const debt=(o.totalPrice||0)-totalPaid;
    const profit=(o.totalPrice||0)-totalChi-(o.costPrice||0);
    return {totalPaid,totalChi,debt,profit};
  };

  const doClose=()=>{
    if(!selected) return;
    onCloseOrder({...selected,status:"closed",closedBy:currentUser?.name,closedAt:new Date().toISOString()});
    pushNotif&&pushNotif("Đã đóng đơn "+selected.id+" — quyết toán xong","success");
    setSelected(null); setConfirm(false);
  };

  if(selected){
    const fin=getFinancials(selected);
    return(
      <div style={{padding:24,maxWidth:640,margin:"0 auto"}}>
        <button onClick={()=>{setSelected(null);setConfirm(false);}} style={{background:"none",border:"none",color:"var(--c-primary-mid)",cursor:"pointer",fontSize:14,marginBottom:16}}>← Quay lại</button>
        <div style={{background:"var(--c-surface)",borderRadius:16,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,.08)"}}>
          <h3 style={{margin:"0 0 4px"}}>{selected.id}</h3>
          <div style={{fontSize:13,color:"var(--c-text-3)",marginBottom:20}}>{selected.customerName} · {selected.tourName||selected.service}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
            {[["Giá bán",fmtMoney(selected.totalPrice),"var(--c-text-2)"],["Đã thu",fmtMoney(fin.totalPaid),"var(--c-success-mid)"],["Còn nợ",fmtMoney(fin.debt),fin.debt>0?"var(--c-danger-mid)":"var(--c-success-mid)"],["Chi phí NCC",fmtMoney(fin.totalChi),"var(--c-warning-mid)"],["Lợi nhuận ước tính",fmtMoney(fin.profit),fin.profit>=0?"var(--c-purple)":"var(--c-danger-mid)"]].map(([k,v,c])=>(
              <div key={k} style={{background:"var(--c-surface-2)",borderRadius:10,padding:14}}>
                <div style={{fontSize:12,color:"var(--c-text-3)"}}>{k}</div>
                <div style={{fontSize:16,fontWeight:800,color:c,marginTop:2}}>{v}</div>
              </div>
            ))}
          </div>
          {fin.debt>0&&<div style={{background:"var(--c-warning-bg)",borderRadius:10,padding:12,marginBottom:16,fontSize:13,color:"var(--c-warning)"}}>⚠️ Khách còn nợ {fmtMoney(fin.debt)} — nên thu nốt trước khi đóng</div>}
          {!confirm
            ? <button onClick={()=>setConfirm(true)} style={{width:"100%",background:"var(--c-primary-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:10,padding:13,cursor:"pointer",fontWeight:700,fontSize:15}}>Quyết toán & Đóng đơn</button>
            : <div style={{background:"var(--c-danger-bg)",borderRadius:10,padding:16}}>
                <div style={{fontWeight:700,marginBottom:12,color:"var(--c-danger-mid)"}}>Xác nhận đóng đơn {selected.id}?</div>
                <div style={{fontSize:13,color:"var(--c-text-3)",marginBottom:16}}>Sau khi đóng sẽ không thể chỉnh sửa phiếu thu/chi. Hành động này không thể hoàn tác.</div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={doClose} style={{flex:1,background:"var(--c-danger-mid)",color:"var(--c-text-inverse)",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:700}}>Đồng ý đóng</button>
                  <button onClick={()=>setConfirm(false)} style={{flex:1,background:"var(--c-surface-3)",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:600}}>Hủy</button>
                </div>
              </div>}
        </div>
      </div>
    );
  }

  return(
    <div style={{padding:24}}>
      <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:800}}>Quyết toán & Đóng đơn</h2>
      <div style={{fontSize:13,color:"var(--c-text-3)",marginBottom:20}}>{closeable.length} đơn sẵn sàng đóng</div>
      <div style={{position:"relative",marginBottom:16}}>
        <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--c-text-muted)"}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm đơn hàng..." style={{width:"100%",border:"1px solid var(--c-border)",borderRadius:10,padding:"10px 12px 10px 32px",fontSize:13,boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"grid",gap:10}}>
        {filtered.length===0&&<div style={{textAlign:"center",color:"var(--c-text-muted)",padding:48}}>Không có đơn nào cần quyết toán</div>}
        {filtered.map(o=>{
          const fin=getFinancials(o);
          return(
            <div key={o.id} onClick={()=>setSelected(o)} style={{background:"var(--c-surface)",borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,.07)",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"box-shadow .15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.07)"}>
              <div>
                <div style={{fontWeight:700}}>{o.id} <span style={{fontSize:12,color:"var(--c-text-3)",fontWeight:400}}>· {o.customerName}</span></div>
                <div style={{fontSize:12,color:"var(--c-text-3)",marginTop:3}}>{o.tourName||o.service} · {o.departDate?new Date(o.departDate).toLocaleDateString("vi-VN"):"—"}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:700,fontSize:14}}>{fmtMoney(o.totalPrice)}</div>
                {fin.debt>0&&<div style={{fontSize:12,color:"var(--c-danger-mid)"}}>Nợ: {fmtMoney(fin.debt)}</div>}
                {fin.debt<=0&&<div style={{fontSize:12,color:"var(--c-success-mid)"}}>✓ Đã thu đủ</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
