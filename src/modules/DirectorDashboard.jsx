import React from "react";

// FIX: setSelected giờ nhận qua props (trước đây bị thiếu — click "Chờ duyệt"/"Sắp
// khởi hành" gọi setSelected() không tồn tại trong scope, ném ReferenceError; đã thêm
// prop này ở call site trong App.jsx, giống cách SaleDashboard đã nhận đúng từ trước).
export default function DirectorDashboard({ orders=[], vouchers=[], expenses=[], personalTargets=[], userAccounts=[], customers=[], setView, setSelected, bankAccounts=[], bookings=[], quotes=[] }){
  // ── Helpers ──────────────────────────────────────────────
  const fmt  = (n) => (n || 0).toLocaleString("vi-VN") + "đ";
  const fmtM = (n) => {
    const a=Math.abs(n||0),s=(n||0)<0?"-":"";
    if(a>=1e9) return s+(a/1e9).toFixed(1).replace(/\.0$/,"")+" tỷ";
    return s+Math.round(a).toLocaleString("vi-VN")+"đ";
  };
  const now      = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const thisMonth = (d) => {
    if (!d) return false;
    const x = new Date(d);
    return x.getMonth() === now.getMonth() && x.getFullYear() === now.getFullYear();
  };
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = (d) => {
    if (!d) return false;
    const x = new Date(d);
    return x.getMonth() === lastMonthDate.getMonth() && x.getFullYear() === lastMonthDate.getFullYear();
  };
  const daysFrom = (d) => d ? Math.ceil((new Date(d) - now) / 86400000) : null;
  const thisMonthStr = `${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;

  // ── Doanh thu ────────────────────────────────────────────
  const closedThis  = orders.filter(o => o.status === "closed" && thisMonth(o.closedAt || o.departDate));
  const closedLast  = orders.filter(o => o.status === "closed" && lastMonth(o.closedAt || o.departDate));
  const revThis     = closedThis.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const revLast     = closedLast.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const revGrowth   = revLast > 0 ? Math.round((revThis - revLast) / revLast * 100) : null;

  // ── Chi phí & Lợi nhuận ─────────────────────────────────
  const chiThis = vouchers
    .filter(v => v.type === "chi" && ["approved","confirmed"].includes(v.status) && thisMonth(v.date || v.createdAt))
    .reduce((s, v) => s + (v.amount || 0), 0);
  const expThis = expenses
    .filter(e => e.status === "paid" && thisMonth(e.createdAt))
    .reduce((s, e) => s + (e.amount || 0), 0);
  const profitThis   = revThis - chiThis - expThis;
  const marginPct    = revThis > 0 ? (profitThis / revThis * 100) : 0;

  // ── Thu tiền ─────────────────────────────────────────────
  const paidThis = vouchers
    .filter(v => v.type === "thu" && ["approved","confirmed"].includes(v.status) && thisMonth(v.date || v.createdAt))
    .reduce((s, v) => s + (v.amount || 0), 0);
  const paidPct = revThis > 0 ? Math.round(paidThis / revThis * 100) : 0;

  // ── Tồn quỹ ─────────────────────────────────────────────
  const totalThu = vouchers.filter(v => v.type === "thu" && ["approved","confirmed"].includes(v.status))
    .reduce((s, v) => s + (v.amount || 0), 0);
  const totalChi = vouchers.filter(v => v.type === "chi" && ["approved","confirmed"].includes(v.status))
    .reduce((s, v) => s + (v.amount || 0), 0)
    + expenses.filter(e => e.status === "paid").reduce((s, e) => s + (e.amount || 0), 0);
  const tonQuy = totalThu - totalChi;

  // ── Công nợ KH ───────────────────────────────────────────
  const debtOrders = orders
    .filter(o => !["closed","cancelled"].includes(o.status))
    .map(o => ({ ...o, debt: Math.max(0, (o.totalPrice || 0) - (o.totalPaid || 0)) }))
    .filter(o => o.debt > 0);
  const totalKHDebt = debtOrders.reduce((s, o) => s + o.debt, 0);
  const debtBuckets = [
    { label:"Trên 20 tr", min:20e6, max:Infinity, color:"#A32D2D" },
    { label:"5–20 tr",    min:5e6,  max:20e6,     color:"#854F0B" },
    { label:"Dưới 5 tr",  min:0,    max:5e6,      color:"#0F6E56" },
  ].map(b => ({
    ...b,
    count: debtOrders.filter(o => o.debt >= b.min && o.debt < b.max).length,
    total: debtOrders.filter(o => o.debt >= b.min && o.debt < b.max).reduce((s,o) => s + o.debt, 0),
  }));
  const maxBucket = Math.max(...debtBuckets.map(b => b.count), 1);

  // ── Công nợ NCC (phiếu chi chờ duyệt) ───────────────────
  const pendingExpenses = expenses.filter(e =>
    ["pending_kt","pending_gd","pending_pay"].includes(e.status)
  );
  const totalNCCDebt = pendingExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  // ── Chờ GĐ duyệt ─────────────────────────────────────────
  const approvalThreshold = 20000000;
  const pendingApproval = expenses.filter(e =>
    e.status === "pending_gd" || (e.status === "pending_kt" && (e.amount || 0) > approvalThreshold)
  ).sort((a, b) => (b.amount || 0) - (a.amount || 0));
  const pendingRefunds = [];

  // ── Vận hành ─────────────────────────────────────────────
  const upcomingDepartures = orders
    .filter(o => ["confirmed","in_progress"].includes(o.status) && o.departDate)
    .map(o => ({ ...o, _days: daysFrom(o.departDate), _debt: Math.max(0, (o.totalPrice||0) - (o.totalPaid||0)) }))
    .filter(o => o._days !== null && o._days >= 0 && o._days <= 7)
    .sort((a, b) => a._days - b._days);

  const newCustomersThis = customers.filter(c => thisMonth(c.createdAt || c.firstOrderDate)).length;
  const inactiveCustomers = customers.filter(c => {
    const last = (c.interactions || []).map(i => new Date(i.ts)).sort((a,b) => b-a)[0]
               || (c.lastOrderDate ? new Date(c.lastOrderDate) : null);
    return last && (now - last) / 86400000 > 90;
  }).length;
  const cancelledThis = orders.filter(o => o.status === "cancelled" && thisMonth(o.cancelledAt || o.createdAt));
  const cancelRate = orders.length ? Math.round(cancelledThis.length / orders.length * 100) : 0;

  // ── Chỉ tiêu — mọi nhân viên có target hoặc role sale ────
  const saleStats = (userAccounts || [])
    .filter(u => u.active !== false && (
      u.role === "sale" ||
      (personalTargets || []).some(t => (t.username === u.username || t.name === u.name) && t.month === thisMonthStr && t.target > 0)
    ))
    .map(u => {
      const target = (personalTargets || []).find(
        t => (t.username === u.username || t.name === u.name) && t.month === thisMonthStr
      );
      const myRevenue = orders
        .filter(o => o.sale === u.name && o.status === "closed" && thisMonth(o.closedAt || o.departDate))
        .reduce((s, o) => s + (o.totalPrice || 0), 0);
      const pct = target?.target > 0 ? Math.min(150, Math.round(myRevenue / target.target * 100)) : 0;
      return { ...u, revenue: myRevenue, target: target?.target || 0, pct };
    })
    .sort((a, b) => b.pct - a.pct);

  const teamRevenue = saleStats.reduce((s, u) => s + u.revenue, 0);
  const teamTarget  = saleStats.reduce((s, u) => s + u.target, 0);
  const teamPct     = teamTarget > 0 ? Math.min(150, Math.round(teamRevenue / teamTarget * 100)) : 0;

  // ── Doanh thu theo dịch vụ ───────────────────────────────
  const SVC_MAP = {
    // new IDs (spec v1)
    flight:"Vé máy bay", tour_package:"Tour trọn gói", tour_ghep:"Tour ghép",
    cruise:"Du thuyền", hotel:"Khách sạn", ticket:"Vé tham quan", combo:"Combo",
    // legacy IDs (backward compat)
    ve_may_bay:"Vé máy bay", tour:"Tour trọn gói", du_thuyen:"Du thuyền",
    hotel_flight:"Combo KS+Vé", ve_tham_quan:"Vé tham quan", khach_san:"Khách sạn",
    tour_tron_goi:"Tour trọn gói", combo_ks_ve:"Combo",
  };
  const svcThis = {}, svcLast = {};
  closedThis.forEach(o => { const k = SVC_MAP[o.service] || o.service || "Khác"; svcThis[k] = (svcThis[k] || 0) + (o.totalPrice || 0); });
  closedLast.forEach(o => { const k = SVC_MAP[o.service] || o.service || "Khác"; svcLast[k] = (svcLast[k] || 0) + (o.totalPrice || 0); });
  const allSvc = [...new Set([...Object.keys(svcThis), ...Object.keys(svcLast)])]
    .sort((a, b) => (svcThis[b] || 0) - (svcThis[a] || 0)).slice(0, 5);
  const maxSvc = Math.max(...allSvc.map(s => Math.max(svcThis[s]||0, svcLast[s]||0)), 1);

  const totalNeedApproval = pendingApproval.length + pendingRefunds.length;

  // ── 6-tháng sparkline ────────────────────────────────────
  const sparkMonths = React.useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth(), y = d.getFullYear();
      const rev = orders
        .filter(o => o.status === "closed" && o.closedAt && new Date(o.closedAt).getMonth()===m && new Date(o.closedAt).getFullYear()===y)
        .reduce((s,o) => s+(o.totalPrice||0), 0);
      const chi = vouchers
        .filter(v => v.type==="chi" && ["approved","confirmed"].includes(v.status) && v.date && new Date(v.date).getMonth()===m && new Date(v.date).getFullYear()===y)
        .reduce((s,v) => s+(v.amount||0), 0);
      months.push({ label: `T${m+1}`, rev, profit: rev - chi });
    }
    return months;
  }, [orders, vouchers]);
  const sparkMaxRev = Math.max(...sparkMonths.map(m=>m.rev), 1);

  // ── Style objects ─────────────────────────────────────────
  const card      = { background:"#fff", borderRadius:12, border:"0.5px solid #e2e8f0", padding:"14px 16px" };
  const cardTitle = { fontSize:13, fontWeight:500, color:"#1e293b", marginBottom:12, display:"flex", alignItems:"center", gap:6 };
  const alertRow  = { display:"flex", alignItems:"center", gap:10, padding:"9px 0" };
  const accent    = { width:3, height:32, flexShrink:0 };
  const aTitle    = { fontSize:13, fontWeight:500, color:"#1e293b", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" };
  const aSub      = { fontSize:11, color:"#64748b", marginTop:1 };
  const badgeStyle = (type) => {
    const m = { danger:{background:"#FCEBEB",color:"#791F1F"}, warn:{background:"#FAEEDA",color:"#633806"},
                ok:{background:"#E1F5EE",color:"#085041"}, info:{background:"#E6F1FB",color:"#0C447C"} };
    return { ...(m[type]||m.info), display:"inline-flex", alignItems:"center", justifyContent:"center",
             minWidth:20, height:20, padding:"0 6px", borderRadius:999, fontSize:11, fontWeight:500 };
  };
  const tagStyle = (type) => {
    const m = { danger:{background:"#FCEBEB",color:"#791F1F"}, warn:{background:"#FAEEDA",color:"#633806"},
                ok:{background:"#E1F5EE",color:"#085041"}, info:{background:"#E6F1FB",color:"#0C447C"} };
    return { ...(m[type]||m.info), fontSize:11, padding:"2px 7px", borderRadius:999,
             display:"inline-block", marginTop:3, fontWeight:500 };
  };
  const btnPrimary = { display:"flex", alignItems:"center", justifyContent:"center", gap:8,
    padding:"9px 16px", borderRadius:8, border:"none", background:"#0F6E56", color:"#fff",
    fontSize:13, fontWeight:500, cursor:"pointer" };

  const D = {
    kpiGrad: [
      { bg:"linear-gradient(135deg,#1d6fc4,#0e4a96)", icon:"💰", label:"Doanh thu tháng", val:fmtM(revThis), sub:`Tháng trước: ${fmtM(revLast)}`, growth:revGrowth },
      { bg:"linear-gradient(135deg,#0ea868,#076b41)", icon:"📈", label:"Lợi nhuận tháng", val:fmtM(profitThis), sub:`Biên LN: ${marginPct.toFixed(1)}%`, growth:null },
      { bg:"linear-gradient(135deg,#7c5fe6,#4f35b3)", icon:"✅", label:"Đã thu tháng", val:fmtM(paidThis), sub:`${paidPct}% doanh thu`, growth:null },
      { bg: totalKHDebt>0?"linear-gradient(135deg,#e05c5c,#a32d2d)":"linear-gradient(135deg,#0ea868,#076b41)", icon:"👥", label:"Công nợ phải thu", val:fmtM(totalKHDebt), sub:`${debtOrders.length} khách`, growth:null, onClick:()=>setView?.("orders") },
      { bg: totalNCCDebt>0?"linear-gradient(135deg,#e07b2a,#854f0b)":"linear-gradient(135deg,#0ea868,#076b41)", icon:"🏢", label:"Công nợ phải trả", val:fmtM(totalNCCDebt), sub:`${pendingExpenses.length} phiếu`, growth:null, onClick:()=>setView?.("approvals") },
      { bg:"linear-gradient(135deg,#374151,#1e293b)", icon:"🏦", label:"Tồn quỹ", val:fmtM(tonQuy), sub:"Thu − Chi toàn bộ", growth:null },
    ],
  };

  return (
    <div style={{padding:24,background:"#f1f5f9",minHeight:"100vh"}}>

      {/* HEADER */}
      <div style={{marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:700,color:"#0f172a"}}>Tổng quan kinh doanh</h2>
          <div style={{fontSize:13,color:"#64748b",marginTop:2}}>
            {new Date().toLocaleDateString("vi-VN",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"})}
            {totalNeedApproval>0&&<span style={{marginLeft:8,background:"#fee2e2",color:"#dc2626",padding:"2px 10px",borderRadius:99,fontSize:12,fontWeight:600}}>{totalNeedApproval} việc cần duyệt</span>}
          </div>
        </div>
        <button onClick={()=>setView?.("orders")} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          + Tạo đơn mới
        </button>
      </div>

      {/* KPI CARDS — gradient */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
        {D.kpiGrad.slice(0,3).map(k=>(
          <div key={k.label} onClick={k.onClick} style={{background:k.bg,borderRadius:14,padding:"20px 22px",cursor:k.onClick?"pointer":"default",boxShadow:"0 4px 14px rgba(0,0,0,.13)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:16,top:16,fontSize:28,opacity:.25}}>{k.icon}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.75)",fontWeight:500,marginBottom:6}}>{k.label}</div>
            <div style={{fontSize:26,fontWeight:800,color:"#fff",lineHeight:1,marginBottom:4}}>{k.val}</div>
            {k.growth!==null&&k.growth!==undefined&&(
              <span style={{fontSize:11,fontWeight:700,background:k.growth>=0?"rgba(255,255,255,.2)":"rgba(0,0,0,.2)",color:"#fff",padding:"2px 8px",borderRadius:99,marginRight:6}}>
                {k.growth>=0?"▲":"▼"}{Math.abs(k.growth)}%
              </span>
            )}
            <div style={{fontSize:11,color:"rgba(255,255,255,.6)",marginTop:4}}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        {D.kpiGrad.slice(3).map(k=>(
          <div key={k.label} onClick={k.onClick} style={{background:k.bg,borderRadius:14,padding:"20px 22px",cursor:k.onClick?"pointer":"default",boxShadow:"0 4px 14px rgba(0,0,0,.13)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:16,top:16,fontSize:28,opacity:.25}}>{k.icon}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.75)",fontWeight:500,marginBottom:6}}>{k.label}</div>
            <div style={{fontSize:26,fontWeight:800,color:"#fff",lineHeight:1,marginBottom:4}}>{k.val}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.6)",marginTop:4}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* KPI VẬN HÀNH */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:20}}>
        {[
          {label:"Đơn tháng này",val:closedThis.length,sub:orders.filter(o=>thisMonth(o.createdAt)).length+" tổng tạo",color:"#2563eb",bg:"#eff6ff"},
          {label:"Sắp khởi hành",val:upcomingDepartures.length,sub:"Trong 7 ngày",color:"#7c3aed",bg:"#f5f3ff",onClick:()=>setView?.("tourops")},
          {label:"Khách mới",val:newCustomersThis,sub:"Tháng này",color:"#059669",bg:"#ecfdf5",onClick:()=>setView?.("crm")},
          {label:"Không HĐ >3T",val:inactiveCustomers,sub:"Cần chăm sóc",color:"#d97706",bg:"#fffbeb",onClick:()=>setView?.("crm")},
          {label:"Đơn hủy",val:cancelledThis.length,sub:"Tỷ lệ "+cancelRate+"%",color:cancelledThis.length>0?"#dc2626":"#059669",bg:cancelledThis.length>0?"#fef2f2":"#ecfdf5"},
          {label:"Chờ phê duyệt",val:totalNeedApproval,sub:totalNeedApproval>0?"Cần xử lý ngay":"Không có",color:totalNeedApproval>0?"#dc2626":"#059669",bg:totalNeedApproval>0?"#fef2f2":"#ecfdf5",onClick:()=>totalNeedApproval>0&&setView?.("approvals")},
        ].map(k=>(
          <div key={k.label} onClick={k.onClick} style={{background:k.bg,borderRadius:12,padding:"14px 16px",cursor:k.onClick?"pointer":"default",border:"1px solid rgba(0,0,0,.05)"}}>
            <div style={{fontSize:11,color:"#64748b",fontWeight:500,marginBottom:6}}>{k.label}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.color,lineHeight:1,marginBottom:4}}>{k.val}</div>
            <div style={{fontSize:11,color:"#94a3b8"}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* MAIN GRID 2:1 */}
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,2fr) minmax(0,1fr)",gap:16,alignItems:"start"}}>

        {/* CỘT TRÁI */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>

          {/* Chờ duyệt */}
          {totalNeedApproval>0&&(
            <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 8px rgba(0,0,0,.07)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#dc2626"}}/>
                <span style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>Chờ giám đốc phê duyệt</span>
                <span style={{background:"#fee2e2",color:"#dc2626",borderRadius:99,fontSize:11,fontWeight:700,padding:"2px 8px",marginLeft:"auto"}}>{totalNeedApproval}</span>
              </div>
              {pendingApproval.slice(0,4).map((e,idx)=>(
                <div key={e.id} onClick={()=>{const o=orders.find(x=>x.id===(e.orderId||e.orderName));if(o){setSelected?.(o);setView?.("detail");}else setView?.("approvals");}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:idx<Math.min(pendingApproval.length,4)-1?"1px solid #f1f5f9":"none",cursor:"pointer"}}>
                  <div style={{width:4,height:36,background:"#dc2626",borderRadius:2,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.ncc||e.nccName||"NCC"} — {e.orderName||e.orderId||""}</div>
                    <div style={{fontSize:11,color:"#64748b",marginTop:1}}>{e.id} · {e.note||""}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#dc2626"}}>{fmtM(e.amount)}</div>
                    <span style={{background:"#fee2e2",color:"#dc2626",fontSize:10,padding:"2px 6px",borderRadius:99,fontWeight:600}}>Vượt ngưỡng</span>
                  </div>
                </div>
              ))}
              <button onClick={()=>setView?.("approvals")} style={{marginTop:14,width:"100%",background:"#dc2626",color:"#fff",border:"none",borderRadius:9,padding:"10px",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                Vào duyệt ngay →
              </button>
            </div>
          )}

          {/* Sắp khởi hành */}
          {upcomingDepartures.length>0&&(
            <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 8px rgba(0,0,0,.07)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <span style={{fontSize:16}}>✈️</span>
                <span style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>Sắp khởi hành (7 ngày tới)</span>
                <span style={{background:"#eff6ff",color:"#2563eb",borderRadius:99,fontSize:11,fontWeight:700,padding:"2px 8px",marginLeft:"auto"}}>{upcomingDepartures.length} đoàn</span>
              </div>
              {upcomingDepartures.map((o,idx)=>{
                const hasIssue=o._debt>0||!o.customerCccd;
                return(
                  <div key={o.id} onClick={()=>{const orig=orders.find(x=>x.id===o.id)||o;setSelected?.(orig);setView?.("detail");}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:idx<upcomingDepartures.length-1?"1px solid #f1f5f9":"none",cursor:"pointer"}}>
                    <div style={{width:4,height:36,background:hasIssue?"#dc2626":"#059669",borderRadius:2,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.id} · {o.tourName||o.serviceName||o.service}</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:1}}>
                        {new Date(o.departDate).toLocaleDateString("vi-VN")} · {o.customerName}
                        {o._debt>0&&<span style={{color:"#dc2626"}}> · Nợ {fmtM(o._debt)}</span>}
                      </div>
                    </div>
                    <span style={{background:hasIssue?"#fee2e2":"#ecfdf5",color:hasIssue?"#dc2626":"#059669",fontSize:12,padding:"4px 10px",borderRadius:99,fontWeight:700,flexShrink:0}}>
                      {o._days===0?"Hôm nay":`${o._days} ngày`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Doanh thu theo dịch vụ */}
          <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 8px rgba(0,0,0,.07)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <span style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>Doanh thu theo dịch vụ — {thisMonthStr}</span>
              <div style={{display:"flex",gap:12,fontSize:11,color:"#64748b"}}>
                <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:"#2563eb",display:"inline-block"}}/>Tháng này</span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:"#e2e8f0",display:"inline-block"}}/>Tháng trước</span>
              </div>
            </div>
            {allSvc.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:24,fontSize:13}}>Chưa có dữ liệu</div>}
            {allSvc.map(s=>(
              <div key={s} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:500,color:"#374151"}}>{s}</span>
                  <span style={{fontSize:12,color:"#2563eb",fontWeight:700}}>{fmtM(svcThis[s]||0)}</span>
                </div>
                <div style={{background:"#f1f5f9",borderRadius:4,height:8,marginBottom:2}}>
                  <div style={{background:"linear-gradient(90deg,#2563eb,#60a5fa)",height:8,borderRadius:4,width:((svcThis[s]||0)/maxSvc*100)+"%",transition:"width .4s"}}/>
                </div>
                <div style={{background:"#f1f5f9",borderRadius:4,height:4}}>
                  <div style={{background:"#cbd5e1",height:4,borderRadius:4,width:((svcLast[s]||0)/maxSvc*100)+"%"}}/>
                </div>
              </div>
            ))}
          </div>

          {/* Xu hướng 6 tháng */}
          <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 8px rgba(0,0,0,.07)"}}>
            <div style={{fontWeight:700,fontSize:14,color:"#0f172a",marginBottom:16}}>Xu hướng doanh thu 6 tháng</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:8,height:80,paddingBottom:4}}>
              {sparkMonths.map((m,i)=>{
                const isNow=i===5;
                const h=sparkMaxRev>0?Math.max(6,Math.round((m.rev/sparkMaxRev)*72)):6;
                return(
                  <div key={m.label} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{fontSize:10,fontWeight:isNow?700:400,color:isNow?"#2563eb":"#94a3b8"}}>{fmtM(m.rev)}</div>
                    <div style={{width:"100%",height:h,borderRadius:"4px 4px 0 0",background:isNow?"linear-gradient(180deg,#3b82f6,#1d4ed8)":"#dbeafe",transition:"height .3s",position:"relative"}}>
                      {m.profit>0&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:Math.round(h*m.profit/Math.max(m.rev,1)),background:isNow?"#059669":"#bbf7d0",borderRadius:"4px 4px 0 0"}}/>}
                    </div>
                    <div style={{fontSize:10,color:isNow?"#2563eb":"#94a3b8",fontWeight:isNow?700:400}}>{m.label}</div>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:16,marginTop:12,fontSize:11,color:"#64748b"}}>
              <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:"#3b82f6",display:"inline-block"}}/>Doanh thu</span>
              <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:"#059669",display:"inline-block"}}/>Lợi nhuận</span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>

          {/* Chỉ tiêu sale */}
          <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 8px rgba(0,0,0,.07)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <span style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>Chỉ tiêu nhân viên — {thisMonthStr}</span>
              {teamPct>0&&<span style={{fontSize:12,fontWeight:700,color:teamPct>=100?"#059669":"#2563eb"}}>{teamPct}%</span>}
            </div>
            {saleStats.map((u,idx)=>(
              <div key={u.id||u.username} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:idx<saleStats.length-1?"1px solid #f8fafc":"none"}}>
                <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:u.pct>=100?"#059669":u.pct>=50?"#2563eb":"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:u.pct>=50?"#fff":"#94a3b8"}}>
                  {(u.name||u.username||"?")[0].toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:12,fontWeight:600,color:"#0f172a"}}>{u.name?.split("–").pop().trim()||u.name}</span>
                    <span style={{fontSize:12,fontWeight:700,color:u.pct>=100?"#059669":"#2563eb"}}>{u.pct}%</span>
                  </div>
                  <div style={{background:"#f1f5f9",borderRadius:99,height:6,overflow:"hidden"}}>
                    <div style={{width:Math.min(100,u.pct)+"%",height:6,borderRadius:99,background:u.pct>=100?"linear-gradient(90deg,#059669,#34d399)":"linear-gradient(90deg,#2563eb,#60a5fa)",transition:"width .5s"}}/>
                  </div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:3}}>{fmtM(u.revenue)} / {fmtM(u.target)}</div>
                </div>
              </div>
            ))}
            {saleStats.length>0&&(
              <div style={{marginTop:12,padding:"10px 14px",background:"#f8fafc",borderRadius:9,display:"flex",justifyContent:"space-between",fontSize:12}}>
                <span style={{color:"#64748b",fontWeight:500}}>Tổng team</span>
                <span style={{fontWeight:700,color:teamPct>=100?"#059669":"#2563eb"}}>{fmtM(teamRevenue)} · {teamPct}%</span>
              </div>
            )}
            {saleStats.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:16,fontSize:13}}>Chưa có dữ liệu</div>}
          </div>

          {/* Công nợ KH */}
          <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 8px rgba(0,0,0,.07)"}}>
            <div style={{fontWeight:700,fontSize:14,color:"#0f172a",marginBottom:14}}>Công nợ KH theo mức độ</div>
            {debtOrders.length===0?(
              <div style={{background:"#ecfdf5",borderRadius:9,padding:"14px",textAlign:"center",fontSize:13,color:"#059669",fontWeight:600}}>✓ Không có công nợ</div>
            ):debtBuckets.map((b,idx)=>(
              <div key={b.label} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:idx<debtBuckets.length-1?"1px solid #f8fafc":"none"}}>
                <div style={{width:4,height:36,background:b.color,borderRadius:2,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:12,fontWeight:500,color:"#374151"}}>{b.label}</span>
                    <span style={{fontSize:12,fontWeight:700,color:b.color}}>{b.count} đơn</span>
                  </div>
                  <div style={{background:"#f1f5f9",borderRadius:99,height:5}}>
                    <div style={{background:b.color,height:5,borderRadius:99,width:(b.count/maxBucket*100)+"%",transition:"width .4s"}}/>
                  </div>
                  {b.count>0&&<div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{fmtM(b.total)}</div>}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
