import React from "react";

export default function NotifPanel({notifs=[],onClose,onMarkRead,onNav,currentRole,currentUser}){
  const fmtTime=(t)=>{
    const d=new Date(t); const diff=(Date.now()-d.getTime())/60000;
    if(diff<1) return "Vừa xong";
    if(diff<60) return Math.floor(diff)+" phút trước";
    if(diff<1440) return Math.floor(diff/60)+" giờ trước";
    return d.toLocaleDateString("vi-VN");
  };
  const ICON={success:"✅",error:"❌",warning:"⚠️",info:"ℹ️"};
  const canViewOrder=(n)=>{
    if(!n.orderId) return false;
    if(["manager","accountant","dieu_hanh"].includes(currentRole)) return true;
    if(currentRole==="sale"&&(n.sale===currentUser?.name||n.createdBy===currentUser?.name)) return true;
    return false;
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:1500}} onClick={onClose}>
      <div className="anim-scale" onClick={e=>e.stopPropagation()} style={{position:"absolute",top:64,right:16,width:380,maxHeight:500,background:"#fff",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,.18)",overflow:"hidden",display:"flex",flexDirection:"column",transformOrigin:"top right"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:700,fontSize:14}}>Thông báo</div>
          {notifs.some(n=>!n.read)&&<button onClick={onMarkRead} style={{background:"none",border:"none",color:"#185FA5",fontSize:12,cursor:"pointer",fontWeight:600}}>Đánh dấu đã đọc</button>}
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {notifs.filter(n=>!n.targetRole||n.targetRole===currentRole||(n.targetRole==="manager"&&currentRole==="pho_giam_doc")).length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:40,fontSize:13}}>Không có thông báo nào</div>}
          {notifs.filter(n=>!n.targetRole||n.targetRole===currentRole||(n.targetRole==="manager"&&currentRole==="pho_giam_doc")).slice(0,30).map(n=>{
            const canView=canViewOrder(n);
            return(
              <div key={n.id}
                style={{display:"flex",gap:10,padding:"12px 18px",borderBottom:"1px solid #f8fafc",background:n.read?"#fff":"#E6F1FB",cursor:canView?"pointer":"default",transition:"background .15s"}}
                onClick={()=>{ if(canView&&onNav) onNav(n.orderId); }}
                onMouseEnter={e=>{if(canView) e.currentTarget.style.background=n.read?"#f8fafc":"#dbeafe";}}
                onMouseLeave={e=>{e.currentTarget.style.background=n.read?"#fff":"#E6F1FB";}}>
                <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{ICON[n.type]||"📌"}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:n.read?400:600,color:"#1e293b"}}>{n.msg}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                    <span style={{fontSize:11,color:"#94a3b8"}}>{fmtTime(n.time)}</span>
                    {n.createdBy&&<span style={{fontSize:11,color:"#94a3b8"}}>· {n.createdBy}</span>}
                  </div>
                  {canView&&<div style={{fontSize:11,color:"#185FA5",fontWeight:600,marginTop:3}}>Xem đơn hàng →</div>}
                  {n.orderId&&!canView&&<div style={{fontSize:11,color:"#94a3b8",marginTop:3}}>Chỉ sale phụ trách và kế toán / điều hành có thể xem</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
