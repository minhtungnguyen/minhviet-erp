import React from "react";

export default function DeployPanel({ deploySteps=[], onUpdateSteps }){
  const DEFAULT_STEPS=[{label:"Cài đặt môi trường Vercel",note:"Thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vào Environment Variables",done:false},{label:"Kết nối Supabase",note:"Tạo project Supabase, copy URL và anon key",done:false},{label:"Migrate dữ liệu seed lên Supabase",note:"Chạy script seed data",done:false},{label:"Kiểm tra đăng nhập",note:"Test tất cả role: manager, accountant, sale, dieu_hanh",done:false},{label:"Test tạo đơn hàng",note:"Tạo đơn → ghi phiếu thu → duyệt → đóng đơn",done:false},{label:"Test CRM",note:"Thêm khách, chuyển stage, ghi tương tác",done:false},{label:"Test báo cáo",note:"Kiểm tra số liệu dashboard và report",done:false},{label:"Go live",note:"Thông báo cho toàn bộ nhân viên",done:false}];
  const steps=deploySteps.length>0?deploySteps:DEFAULT_STEPS;
  const done=steps.filter(s=>s.done).length;
  const pct=steps.length?Math.round(done/steps.length*100):0;
  return(
    <div style={{padding:24,maxWidth:640,margin:"0 auto"}}>
      <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:800}}>Tiến độ triển khai hệ thống</h2>
      <div style={{fontSize:13,color:"var(--c-text-3)",marginBottom:20}}>Hoàn thành {done}/{steps.length} bước · {pct}%</div>
      <div style={{background:"var(--c-border)",borderRadius:8,height:10,marginBottom:24}}>
        <div style={{background:"linear-gradient(90deg,var(--c-primary-mid),var(--c-purple))",height:10,borderRadius:8,width:pct+"%",transition:"width .5s"}}/>
      </div>
      <div style={{display:"grid",gap:8}}>
        {steps.map((s,i)=>(
          <div key={i} onClick={()=>onUpdateSteps&&onUpdateSteps(steps.map((x,j)=>j===i?{...x,done:!x.done}:x))} style={{background:"var(--c-surface)",borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 4px rgba(0,0,0,.07)",display:"flex",gap:12,alignItems:"flex-start",cursor:"pointer",opacity:s.done?.7:1,transition:"opacity .2s"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.07)"}>
            <div style={{width:22,height:22,borderRadius:"50%",border:"2px solid "+(s.done?"var(--c-success-mid)":"var(--c-border)"),background:s.done?"var(--c-success-mid)":"var(--c-surface)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .2s"}}>
              {s.done&&<span style={{color:"var(--c-text-inverse)",fontSize:13,fontWeight:800}}>✓</span>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,textDecoration:s.done?"line-through":"none",color:s.done?"var(--c-text-muted)":"var(--c-text-2)"}}>{i+1}. {s.label}</div>
              {s.note&&<div style={{fontSize:12,color:"var(--c-text-3)",marginTop:3}}>{s.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
