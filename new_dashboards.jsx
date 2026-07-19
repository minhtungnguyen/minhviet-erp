function SaleDashboard({ currentUser, orders=[], vouchers=[], personalTargets=[], careTasks=[], setView, setSelected }){
  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";
  const fmtDate=(d)=>d?new Date(d).toLocaleDateString("vi-VN"):"—";
  const myOrders = orders.filter(o=>o.sale===currentUser?.name);
  const closedOrders = myOrders.filter(o=>o.status==="closed");
  const revenue = closedOrders.reduce((s,o)=>s+(o.totalPrice||0),0);
  const myTarget = personalTargets.find(t=>t.name===currentUser?.name||t.staff===currentUser?.name);
  const targetPct = myTarget?.target?Math.min(100,Math.round(revenue/myTarget.target*100)):null;

  const upcoming = myOrders.filter(o=>["confirmed","in_progress"].includes(o.status)&&o.departDate)
    .map(o=>({...o,_days:Math.ceil((new Date(o.departDate)-new Date())/86400000)}))
    .filter(o=>o._days>=0&&o._days<=14).sort((a,b)=>a._days-b._days).slice(0,5);

  const pendingDebt = myOrders.filter(o=>o.status!=="closed"&&o.status!=="cancelled").reduce((s,o)=>s+Math.max(0,(o.totalPrice||0)-(o.totalPaid||0)),0);
  const myTasks = careTasks.filter(t=>t.assignee===currentUser?.name&&!t.done);
  const overdueTasks = myTasks.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date(new Date().toDateString()));

  const hour=new Date().getHours();
  const greeting=hour<11?"Chào buổi sáng":hour<14?"Chào buổi trưa":hour<18?"Chào buổi chiều":"Chào buổi tối";

  return (
    <div style={{padding:24}}>
      <div style={{marginBottom:20}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:800}}>{greeting}, {currentUser?.name}! 👋</h2>
        <div style={{fontSize:13,color:"#64748b",marginTop:4}}>Đây là tổng quan công việc của bạn hôm nay</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {[["Đơn của tôi",myOrders.length,"#2563eb"],["Đã chốt",closedOrders.length,"#16a34a"],["Doanh thu",fmtMoney(revenue),"#7c3aed"],["Khách còn nợ",fmtMoney(pendingDebt),pendingDebt>0?"#dc2626":"#16a34a"]].map(([label,val,color])=>(
          <div key={label} style={{background:"#fff",borderRadius:14,padding:"16px 18px",boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
            <div style={{fontSize:12,color:"#64748b",fontWeight:600}}>{label}</div>
            <div style={{fontSize:18,fontWeight:800,color,marginTop:6}}>{val}</div>
          </div>
        ))}
      </div>

      {myTarget&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontWeight:700,fontSize:14}}>🎯 Chỉ tiêu tháng này</span>
            <span style={{fontWeight:700,color:"#2563eb"}}>{fmtMoney(revenue)} / {fmtMoney(myTarget.target)}</span>
          </div>
          <div style={{background:"#f1f5f9",borderRadius:8,height:12}}>
            <div style={{background:targetPct>=100?"#16a34a":"linear-gradient(90deg,#2563eb,#7c3aed)",height:12,borderRadius:8,width:targetPct+"%",transition:"width .5s"}}/>
          </div>
          <div style={{fontSize:12,color:"#64748b",marginTop:6}}>{targetPct}% hoàn thành {targetPct>=100&&"🎉"}</div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>🚌 Tour sắp khởi hành (14 ngày)</div>
          {upcoming.length===0&&<div style={{color:"#94a3b8",fontSize:13,textAlign:"center",padding:20}}>Không có tour nào sắp khởi hành</div>}
          {upcoming.map(o=>(
            <div key={o.id} onClick={()=>{setSelected&&setSelected(o);setView&&setView("detail");}} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f1f5f9",cursor:"pointer"}}>
              <div>
                <div style={{fontWeight:600,fontSize:13}}>{o.customerName}</div>
                <div style={{fontSize:11,color:"#94a3b8"}}>{o.id} · {o.tourName||o.service}</div>
              </div>
              <span style={{fontSize:12,fontWeight:700,color:o._days<=2?"#dc2626":"#d97706"}}>{o._days===0?"Hôm nay":"Còn "+o._days+" ngày"}</span>
            </div>
          ))}
        </div>

        <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>📋 Việc cần làm ({myTasks.length})</div>
          {overdueTasks.length>0&&<div style={{background:"#fee2e2",borderRadius:8,padding:"6px 10px",marginBottom:10,fontSize:12,color:"#dc2626",fontWeight:600}}>⚠️ {overdueTasks.length} việc đã quá hạn</div>}
          {myTasks.length===0&&<div style={{color:"#94a3b8",fontSize:13,textAlign:"center",padding:20}}>Không có việc cần làm</div>}
          {myTasks.slice(0,5).map(t=>(
            <div key={t.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f1f5f9"}}>
              <span style={{fontSize:13}}>{t.orderId} — {t.type==="call"?"Gọi điện":t.type==="review"?"Xin review":t.type==="birthday"?"Sinh nhật":t.type==="pre_trip"?"Nhắc trước tour":"Khác"}</span>
              <span style={{fontSize:11,color:"#94a3b8"}}>{fmtDate(t.dueDate)}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={()=>setView&&setView("create")} style={{marginTop:20,background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:"12px 24px",cursor:"pointer",fontWeight:700,fontSize:14}}>+ Tạo đơn hàng mới</button>
    </div>
  );
}

function DirectorDashboard({ orders=[], vouchers=[], expenses=[], personalTargets=[], userAccounts=[], customers=[], setView }){
  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";
  const fmtM=(n)=>n>=1e9?(n/1e9).toFixed(2)+"T":n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(0)+"K":String(n||0);
  const closedOrders=orders.filter(o=>o.status==="closed");
  const totalRevenue=closedOrders.reduce((s,o)=>s+(o.totalPrice||0),0);
  const totalPaid=vouchers.filter(v=>v.type==="thu"&&["approved","confirmed"].includes(v.status)).reduce((s,v)=>s+(v.amount||0),0);
  const totalChi=vouchers.filter(v=>v.type==="chi"&&["approved","confirmed"].includes(v.status)).reduce((s,v)=>s+(v.amount||0),0);
  const totalExp=expenses.filter(e=>e.status==="approved").reduce((s,e)=>s+(e.amount||0),0);
  const profit=totalRevenue-totalChi-totalExp;

  // Doanh thu theo nhân viên (top 5)
  const bySale={};
  closedOrders.forEach(o=>{const s=o.sale||"Khác";bySale[s]=(bySale[s]||0)+(o.totalPrice||0);});
  const topSales=Object.entries(bySale).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxSale=topSales[0]?.[1]||1;

  // Cảnh báo: đơn lợi nhuận thấp
  const lowProfitOrders=orders.filter(o=>{
    if(o.status==="cancelled") return false;
    const cost=o.costPrice||0;
    const pct=o.totalPrice?((o.totalPrice-cost)/o.totalPrice*100):0;
    return o.totalPrice>0&&pct<10;
  });

  const pendingApprovalAmt=[...vouchers.filter(v=>v.status==="pending"),...expenses.filter(e=>e.status==="pending")].reduce((s,x)=>s+(x.amount||0),0);
  const totalDebt=orders.filter(o=>o.status!=="closed"&&o.status!=="cancelled").reduce((s,o)=>s+Math.max(0,(o.totalPrice||0)-(o.totalPaid||0)),0);

  return (
    <div style={{padding:24}}>
      <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:800}}>Dashboard Giám đốc</h2>
      <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>Tổng quan toàn hệ thống Minh Việt Travel</div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:14}}>
        {[["Doanh thu",fmtM(totalRevenue)+"₫","#2563eb"],["Đã thu",fmtM(totalPaid)+"₫","#16a34a"],["Chi phí",fmtM(totalChi+totalExp)+"₫","#dc2626"],["Lợi nhuận",fmtM(profit)+"₫",profit>=0?"#7c3aed":"#dc2626"]].map(([label,val,color])=>(
          <div key={label} style={{background:"#fff",borderRadius:14,padding:"16px 18px",boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
            <div style={{fontSize:12,color:"#64748b",fontWeight:600}}>{label}</div>
            <div style={{fontSize:18,fontWeight:800,color,marginTop:6}}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        {[["Tổng đơn",orders.length,"#1e293b"],["Khách hàng",customers.length,"#0891b2"],["Công nợ KH",fmtM(totalDebt)+"₫",totalDebt>0?"#dc2626":"#16a34a"]].map(([label,val,color])=>(
          <div key={label} style={{background:"#fff",borderRadius:14,padding:"14px 18px",boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
            <div style={{fontSize:12,color:"#64748b",fontWeight:600}}>{label}</div>
            <div style={{fontSize:22,fontWeight:800,color,marginTop:4}}>{val}</div>
          </div>
        ))}
      </div>

      {(lowProfitOrders.length>0||pendingApprovalAmt>0)&&(
        <div style={{display:"grid",gridTemplateColumns:lowProfitOrders.length>0&&pendingApprovalAmt>0?"1fr 1fr":"1fr",gap:14,marginBottom:20}}>
          {lowProfitOrders.length>0&&(
            <div onClick={()=>setView&&setView("orders")} style={{background:"#fef9c3",borderRadius:12,padding:16,cursor:"pointer"}}>
              <div style={{fontWeight:700,color:"#92400e",fontSize:13}}>⚠️ {lowProfitOrders.length} đơn lợi nhuận thấp (&lt;10%)</div>
              <div style={{fontSize:12,color:"#92400e",marginTop:4}}>Cần xem lại giá bán hoặc chi phí NCC</div>
            </div>
          )}
          {pendingApprovalAmt>0&&(
            <div onClick={()=>setView&&setView("approvals")} style={{background:"#dbeafe",borderRadius:12,padding:16,cursor:"pointer"}}>
              <div style={{fontWeight:700,color:"#1d4ed8",fontSize:13}}>🔔 {fmtMoney(pendingApprovalAmt)} đang chờ phê duyệt</div>
              <div style={{fontSize:12,color:"#1d4ed8",marginTop:4}}>Bấm để xem và duyệt ngay</div>
            </div>
          )}
        </div>
      )}

      <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
        <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>🏆 Top nhân viên doanh thu</div>
        {topSales.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:20,fontSize:13}}>Chưa có dữ liệu</div>}
        {topSales.map(([name,rev],i)=>(
          <div key={name} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontWeight:600,fontSize:13}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":(i+1)+"."} {name}</span>
              <span style={{fontWeight:700,color:"#2563eb",fontSize:13}}>{fmtMoney(rev)}</span>
            </div>
            <div style={{background:"#f1f5f9",borderRadius:6,height:7}}>
              <div style={{background:"linear-gradient(90deg,#2563eb,#7c3aed)",height:7,borderRadius:6,width:(rev/maxSale*100)+"%",transition:"width .4s"}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountantDashboard({ orders=[], vouchers=[], expenses=[], refunds=[], bankAccounts=[], setView }){
  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";
  const fmtM=(n)=>n>=1e9?(n/1e9).toFixed(2)+"T":n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(0)+"K":String(n||0);
  const totalRevenue=orders.filter(o=>o.status==="closed").reduce((s,o)=>s+(o.totalPrice||0),0);
  const totalPaid=vouchers.filter(v=>v.type==="thu"&&["approved","confirmed"].includes(v.status)).reduce((s,v)=>s+(v.amount||0),0);
  const totalChi=vouchers.filter(v=>v.type==="chi"&&["approved","confirmed"].includes(v.status)).reduce((s,v)=>s+(v.amount||0),0);
  const totalExp=expenses.filter(e=>e.status==="approved").reduce((s,e)=>s+(e.amount||0),0);

  const pendingVouchers=vouchers.filter(v=>v.status==="pending");
  const pendingExpenses=expenses.filter(e=>e.status==="pending");
  const pendingAmt=[...pendingVouchers,...pendingExpenses].reduce((s,x)=>s+(x.amount||0),0);
  const pendingRefunds=(refunds||[]).filter(r=>r.status==="pending");

  return (
    <div style={{padding:24}}>
      <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:800}}>Dashboard Kế toán</h2>
      <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>Tình hình thu chi & phê duyệt</div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {[["Doanh thu",fmtM(totalRevenue)+"₫","#2563eb"],["Đã thu",fmtM(totalPaid)+"₫","#16a34a"],["Đã chi",fmtM(totalChi+totalExp)+"₫","#dc2626"],["Tồn quỹ ước tính",fmtM(totalPaid-totalChi-totalExp)+"₫","#7c3aed"]].map(([label,val,color])=>(
          <div key={label} style={{background:"#fff",borderRadius:14,padding:"16px 18px",boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
            <div style={{fontSize:12,color:"#64748b",fontWeight:600}}>{label}</div>
            <div style={{fontSize:18,fontWeight:800,color,marginTop:6}}>{val}</div>
          </div>
        ))}
      </div>

      {(pendingVouchers.length+pendingExpenses.length+pendingRefunds.length)>0&&(
        <div onClick={()=>setView&&setView("approvals")} style={{background:"#fef9c3",borderRadius:14,padding:18,marginBottom:20,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:700,color:"#92400e"}}>🔔 {pendingVouchers.length+pendingExpenses.length} phiếu chờ duyệt {pendingRefunds.length>0&&"· "+pendingRefunds.length+" hoàn tiền chờ xử lý"}</div>
            <div style={{fontSize:12,color:"#92400e",marginTop:4}}>Tổng giá trị: {fmtMoney(pendingAmt)} — bấm để xử lý ngay</div>
          </div>
          <span style={{fontSize:20}}>→</span>
        </div>
      )}

      <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
        <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>🏦 Tài khoản ngân hàng</div>
        {(bankAccounts||[]).length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:20,fontSize:13}}>Chưa có tài khoản nào</div>}
        {(bankAccounts||[]).map(a=>(
          <div key={a.id} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #f1f5f9"}}>
            <div>
              <div style={{fontWeight:600,fontSize:13}}>{a.bankName}</div>
              <div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace"}}>{a.accountNumber}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
