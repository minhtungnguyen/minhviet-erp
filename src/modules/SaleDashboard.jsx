import React from "react";
import { Btn } from "../components/ui.jsx";

export default function SaleDashboard({ currentUser, orders=[], vouchers=[], quotes=[], personalTargets=[], careTasks=[], bookings=[], setView, setSelected }){
  // ── Helpers ──────────────────────────────────────────────
  const fmt  = (n) => (n || 0).toLocaleString("vi-VN") + "đ";
  const fmtM = (n) => {
    const a=Math.abs(n||0),s=(n||0)<0?"-":"";
    if(a>=1e9) return s+(a/1e9).toFixed(1).replace(/\.0$/,"")+" tỷ";
    return s+Math.round(a).toLocaleString("vi-VN")+"đ";
  };
  const today     = new Date();
  const todayStr  = today.toISOString().slice(0, 10);
  const daysFrom  = (d) => d ? Math.ceil((new Date(d) - today) / 86400000) : null;
  const thisMonthStr = `${String(today.getMonth() + 1).padStart(2,"0")}/${today.getFullYear()}`;

  // ── Lọc đơn của sale hiện tại ────────────────────────────
  const myOrders = orders.filter(o => o.sale === currentUser?.name);
  const activeOrders = myOrders.filter(o => !["closed","cancelled"].includes(o.status));

  // ── KPI tháng ────────────────────────────────────────────
  const closedThisMonth = myOrders.filter(o => {
    if (o.status !== "closed") return false;
    const d = new Date(o.closedAt || o.departDate || o.createdAt);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const revenue = closedThisMonth.reduce((s, o) => s + (o.totalPrice || 0), 0);

  const myTarget = personalTargets.find(
    t => t.name === currentUser?.name || t.staff === currentUser?.name || t.username === currentUser?.username
  );
  const targetAmt = myTarget?.target || 0;
  const targetPct = targetAmt > 0 ? Math.min(100, Math.round(revenue / targetAmt * 100)) : 0;

  // ── Công nợ KH: chi tiết từng đơn ───────────────────────
  const debtOrders = activeOrders
    .map(o => ({
      ...o,
      debt: Math.max(0, (o.totalPrice || 0) - (o.totalPaid || 0)),
      _daysToDepart: daysFrom(o.departDate),
    }))
    .filter(o => o.debt > 0)
    .sort((a, b) => {
      const aUrgent = (a._daysToDepart !== null && a._daysToDepart <= 7) ? 0 : 1;
      const bUrgent = (b._daysToDepart !== null && b._daysToDepart <= 7) ? 0 : 1;
      if (aUrgent !== bUrgent) return aUrgent - bUrgent;
      return (a.paymentDeadline || "9999") > (b.paymentDeadline || "9999") ? 1 : -1;
    });
  const totalDebt = debtOrders.reduce((s, o) => s + o.debt, 0);

  // ── Tour sắp khởi hành (14 ngày) — có phân loại urgency ─
  const upcoming = activeOrders
    .filter(o => o.departDate)
    .map(o => {
      const days  = daysFrom(o.departDate);
      const debt  = Math.max(0, (o.totalPrice || 0) - (o.totalPaid || 0));
      const missingCccd = !o.customerCccd && !o.cccd;
      let urgency = "ok";
      let issues  = [];
      if (debt > 0)         { urgency = "warn"; issues.push("Còn nợ " + fmtM(debt)); }
      if (missingCccd)      { urgency = "warn"; issues.push("Thiếu CCCD"); }
      if (days !== null && days <= 3 && (debt > 0 || missingCccd)) { urgency = "danger"; }
      return { ...o, _days: days, _debt: debt, _urgency: urgency, _issues: issues };
    })
    .filter(o => o._days !== null && o._days >= 0 && o._days <= 14)
    .sort((a, b) => a._days - b._days)
    .slice(0, 6);

  // ── Cần xử lý ngay ───────────────────────────────────────
  const urgentItems = [];

  upcoming
    .filter(o => o._urgency === "danger")
    .forEach(o => urgentItems.push({
      type:    "depart_danger",
      icon:    "ti-clock-exclamation",
      level:   "danger",
      title:   `${o.customerName} — ${o.tourName || o.serviceName || o.service}`,
      sub:     `Khởi hành ${new Date(o.departDate).toLocaleDateString("vi-VN")} (còn ${o._days} ngày) · ${o._issues.join(" · ")}`,
      amount:  o._debt > 0 ? -o._debt : null,
      tag:     o._days === 0 ? "Hôm nay" : `${o._days} ngày nữa`,
      orderId: o.id,
      order:   o,
    }));

  (quotes || [])
    .filter(q => q.sale === currentUser?.name &&
                 ["draft","sent","negotiating"].includes(q.status) &&
                 q.validUntil && q.validUntil <= todayStr)
    .forEach(q => urgentItems.push({
      type:   "quote_expired",
      icon:   "ti-file-alert",
      level:  "danger",
      title:  `${q.customerName} — ${q.id}`,
      sub:    `Báo giá ${q.tourName || q.service || ""} · Hết hạn ${q.validUntil === todayStr ? "hôm nay" : new Date(q.validUntil).toLocaleDateString("vi-VN")}`,
      amount: q.pricing?.totalPrice || q.totalPrice || null,
      tag:    q.validUntil === todayStr ? "Hết hạn hôm nay" : "Đã hết hạn",
      quoteId: q.id,
    }));

  debtOrders
    .filter(o => {
      const dl = daysFrom(o.paymentDeadline);
      return dl !== null && dl >= 0 && dl <= 3 && o.debt > 0;
    })
    .filter(o => !urgentItems.find(u => u.orderId === o.id))
    .forEach(o => urgentItems.push({
      type:    "payment_deadline",
      icon:    "ti-cash",
      level:   "warn",
      title:   `${o.customerName} — ${o.tourName || o.serviceName || o.service}`,
      sub:     `Hạn thanh toán: ${new Date(o.paymentDeadline).toLocaleDateString("vi-VN")} · Còn ${daysFrom(o.paymentDeadline)} ngày`,
      amount:  -o.debt,
      tag:     `Hạn ${daysFrom(o.paymentDeadline) === 0 ? "hôm nay" : daysFrom(o.paymentDeadline) + " ngày"}`,
      orderId: o.id,
      order:   o,
    }));

  // ── Đơn sắp đi mà chưa có booking NCC ───────────────────
  activeOrders
    .filter(o=>{
      const days=daysFrom(o.departDate);
      if(days===null||days>7) return false;
      return !(bookings||[]).some(b=>b.orderId===o.id);
    })
    .filter(o=>!urgentItems.find(u=>u.orderId===o.id))
    .forEach(o=>urgentItems.push({
      type:"missing_ncc_booking",
      icon:"ti-building-off",
      level:"warn",
      title:`${o.customerName} — ${o.tourName||o.service}`,
      sub:`Khởi hành ${daysFrom(o.departDate)} ngày nữa · Chưa booking NCC`,
      tag:"Chưa đặt NCC",
      orderId:o.id,
      order:o,
    }));

  // ── Đơn có dịch vụ bổ sung chưa tạo phiếu thu ───────────
  activeOrders
    .filter(o=>{const unpaid=(o.additionalItems||[]).filter(i=>!i.voucherId);return unpaid.length>0;})
    .filter(o=>!urgentItems.find(u=>u.orderId===o.id))
    .slice(0,3)
    .forEach(o=>{
      const unpaid=(o.additionalItems||[]).filter(i=>!i.voucherId);
      const total=unpaid.reduce((s,i)=>s+(i.totalPrice||0),0);
      urgentItems.push({type:"unpaid_addon",icon:"ti-plus-circle",level:"warn",title:`${o.customerName} — ${o.tourName||o.service}`,sub:`${unpaid.length} dịch vụ bổ sung chưa tạo phiếu thu`,amount:total,tag:"Chưa thu",tagLevel:"warn",orderId:o.id,order:o});
    });

  // ── Báo giá đang chờ phản hồi ────────────────────────────
  const pendingQuotes = (quotes || [])
    .filter(q => q.sale === currentUser?.name &&
                 ["draft","sent","negotiating"].includes(q.status))
    .map(q => ({ ...q, _daysLeft: daysFrom(q.validUntil) }))
    .sort((a, b) => (a._daysLeft ?? 999) - (b._daysLeft ?? 999))
    .slice(0, 5);

  // ── Việc cần làm ─────────────────────────────────────────
  const myTasks = careTasks.filter(t => t.assignee === currentUser?.name && !t.done);
  const overdueTasks = myTasks.filter(t => t.dueDate && t.dueDate < todayStr);

  // ── Realtime clock ───────────────────────────────────────
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hour = now.getHours();
  const greeting = hour < 11 ? "Chào buổi sáng"
                 : hour < 14 ? "Chào buổi trưa"
                 : hour < 18 ? "Chào buổi chiều"
                 : "Chào buổi tối";
  const timeStr = now.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", second:"2-digit" });

  const totalUrgent = urgentItems.length + overdueTasks.length;

  // ── Style objects ─────────────────────────────────────────
  const kpiCard  = { background: "var(--c-surface-2)", borderRadius: "var(--r-sm)", padding: "14px 16px", border: "1px solid var(--c-border)" };
  const kpiLabel = { fontSize: "var(--text-sm)", color: "var(--c-text-3)", marginBottom: 6 };
  const kpiVal   = (color = "var(--c-text-2)") => ({ fontSize: "var(--text-xl)", fontWeight: 500, color, lineHeight: 1 });
  const kpiSub   = { fontSize: "var(--text-xs)", color: "var(--c-text-muted)", marginTop: 4 };
  const sectionHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 };
  const sectionTitle  = { fontSize: "var(--text-base)", fontWeight: 500, color: "var(--c-text-2)", display: "flex", alignItems: "center", gap: 6 };
  const alertCard = { background: "var(--c-surface)", borderRadius: "var(--r-md)", border: "1px solid var(--c-border)", overflow: "hidden", marginBottom: 0 };
  const alertRow  = { display: "flex", alignItems: "center", gap: 12, padding: "11px 14px" };
  const accent    = { width: 3, height: 36, flexShrink: 0, borderRadius: 0 };
  const alertTitle = { fontSize: "var(--text-base)", fontWeight: 500, color: "var(--c-text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
  const alertSub   = { fontSize: "var(--text-xs)", color: "var(--c-text-3)", marginTop: 1 };
  const emptyState = { textAlign: "center", padding: 20, color: "var(--c-text-muted)", fontSize: "var(--text-base)" };
  const badge = (type) => {
    const map = { danger:{background:"var(--c-danger-bg)",color:"var(--c-danger)"}, warn:{background:"var(--c-warning-bg)",color:"var(--c-warning)"}, info:{background:"var(--c-primary-light)",color:"var(--c-primary)"}, ok:{background:"var(--c-success-bg)",color:"var(--c-success)"} };
    const c = map[type] || map.info;
    return { ...c, display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:20, height:20, padding:"0 6px", borderRadius:"var(--r-pill)", fontSize:"var(--text-xs)", fontWeight:500 };
  };
  const tagStyle = (type) => {
    const map = { danger:{background:"var(--c-danger-bg)",color:"var(--c-danger)"}, warn:{background:"var(--c-warning-bg)",color:"var(--c-warning)"}, ok:{background:"var(--c-success-bg)",color:"var(--c-success)"}, info:{background:"var(--c-primary-light)",color:"var(--c-primary)"} };
    const c = map[type] || map.info;
    return { ...c, fontSize:"var(--text-xs)", padding:"2px 7px", borderRadius:"var(--r-pill)", display:"inline-block", marginTop:3, fontWeight:500 };
  };
  const btnPrimary = { display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:11, borderRadius:"var(--r-sm)", border:"none", background:"var(--c-success)", color:"#fff", fontSize:"var(--text-base)", fontWeight:500, cursor:"pointer", width:"100%" };
  const btnOutline = { display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:11, borderRadius:"var(--r-sm)", border:"1px solid var(--c-border)", background:"var(--c-surface)", fontSize:"var(--text-base)", fontWeight:500, cursor:"pointer", width:"100%", color:"var(--c-text-2)" };

  return (
    <div style={{ padding:24, background:"var(--c-bg)", minHeight:"100vh" }}>

      {/* HEADER */}
      <div style={{ marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", rowGap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:"var(--text-2xl)", fontWeight:800, color:"var(--c-text)" }}>
            {greeting}, {currentUser?.name?.split("–").pop().trim()||currentUser?.name} 👋
          </h2>
          <div style={{ fontSize:"var(--text-md)", color:"var(--c-text-3)", marginTop:4, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <span>{now.toLocaleDateString("vi-VN",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"})}</span>
            <span style={{ background:"var(--c-primary)", color:"#fff", borderRadius:"var(--r-sm)", padding:"2px 10px", fontWeight:700, fontSize:"var(--text-base)", fontVariantNumeric:"tabular-nums" }}>{timeStr}</span>
            {totalUrgent>0 && <span style={{ background:"var(--c-danger-bg)", color:"var(--c-danger-mid)", padding:"2px 10px", borderRadius:"var(--r-pill)", fontWeight:600, fontSize:"var(--text-base)" }}>⚠ {totalUrgent} việc cần xử lý</span>}
          </div>
        </div>
        <Btn size="lg" variant="success" style={{background:"linear-gradient(135deg,var(--c-success-mid),#047857)",color:"#fff",border:"none",boxShadow:"0 4px 12px rgba(5,150,105,.4)"}} onClick={()=>setView?.("create")}>
          + Tạo đơn hàng mới
        </Btn>
      </div>

      {/* KPI GRADIENT CARDS */}
      <div className="resp-grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        {[
          { bg:"linear-gradient(135deg,var(--c-primary-mid),var(--c-primary-hover))", icon:"📋", label:"Đơn đang theo dõi", val:myOrders.length, sub:activeOrders.length+" đang xử lý" },
          { bg: targetPct>=100 ? "linear-gradient(135deg,var(--c-success-mid),#047857)" : "linear-gradient(135deg,var(--c-purple),#5b21b6)", icon:"💰", label:`Doanh thu ${thisMonthStr}`, val:fmtM(revenue), sub: targetAmt>0 ? `Chỉ tiêu: ${fmtM(targetAmt)} · ${targetPct}%` : "Chưa set chỉ tiêu" },
          { bg: debtOrders.length>0 ? "linear-gradient(135deg,var(--c-danger-mid),#b91c1c)" : "linear-gradient(135deg,var(--c-success-mid),#047857)", icon:"👥", label:"KH còn nợ", val:debtOrders.length+" KH", sub:fmtM(totalDebt) },
          { bg: pendingQuotes.some(q=>q._daysLeft<=1) ? "linear-gradient(135deg,var(--c-danger-mid),#b91c1c)" : "linear-gradient(135deg,var(--c-warning-mid),#b45309)", icon:"📄", label:"Báo giá chờ phản hồi", val:pendingQuotes.length, sub: pendingQuotes.filter(q=>q._daysLeft!==null&&q._daysLeft<=2).length>0 ? pendingQuotes.filter(q=>q._daysLeft!==null&&q._daysLeft<=2).length+" sắp hết hạn" : "Chờ phản hồi" },
        ].map(k=>(
          <div key={k.label} style={{ background:k.bg, borderRadius:"var(--r-xl)", padding:"20px 22px", boxShadow:"var(--sh-md)", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", right:16, top:14, fontSize:30, opacity:.22 }}>{k.icon}</div>
            <div style={{ fontSize:"var(--text-sm)", color:"rgba(255,255,255,.75)", fontWeight:500, marginBottom:6 }}>{k.label}</div>
            <div style={{ fontSize:"var(--text-3xl)", fontWeight:800, color:"#fff", lineHeight:1, marginBottom:4 }}>{k.val}</div>
            <div style={{ fontSize:"var(--text-sm)", color:"rgba(255,255,255,.65)" }}>{k.sub}</div>
            {k.label.includes("Doanh thu") && targetAmt>0 && (
              <div style={{ background:"rgba(255,255,255,.2)", borderRadius:"var(--r-pill)", height:5, marginTop:10 }}>
                <div style={{ background:"#fff", height:5, borderRadius:"var(--r-pill)", width:Math.min(100,targetPct)+"%" }}/>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MAIN GRID 2 cột */}
      <div className="resp-grid-split" style={{ display:"grid", gridTemplateColumns:"minmax(0,3fr) minmax(0,2fr)", gap:16, alignItems:"start" }}>

        {/* CỘT TRÁI */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Cần xử lý ngay */}
          {urgentItems.length>0&&(
            <div style={{ background:"var(--c-surface)", borderRadius:"var(--r-lg)", padding:20, boxShadow:"var(--sh-sm)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <span style={{ fontSize:18 }}>⚠️</span>
                <span style={{ fontWeight:700, fontSize:"var(--text-lg)", color:"var(--c-text)" }}>Cần xử lý ngay</span>
                <span style={{ background:"var(--c-danger-bg)", color:"var(--c-danger-mid)", borderRadius:"var(--r-pill)", fontSize:"var(--text-sm)", fontWeight:700, padding:"2px 9px", marginLeft:"auto" }}>{urgentItems.length}</span>
              </div>
              {urgentItems.map((item,idx)=>(
                <div key={idx} onClick={()=>{ if(item.order){const orig=orders.find(x=>x.id===item.order.id)||item.order;setSelected?.(orig);setView?.("detail");}}}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:idx<urgentItems.length-1?"1px solid var(--c-border)":"none", cursor:item.order?"pointer":"default" }}>
                  <div style={{ width:4, height:36, background:item.level==="danger"?"var(--c-danger-mid)":"var(--c-warning-mid)", borderRadius:2, flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"var(--text-md)", fontWeight:600, color:"var(--c-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.title}</div>
                    <div style={{ fontSize:"var(--text-sm)", color:"var(--c-text-3)", marginTop:2 }}>{item.sub}</div>
                  </div>
                  <span style={{ background:item.level==="danger"?"var(--c-danger-bg)":"var(--c-warning-bg)", color:item.level==="danger"?"var(--c-danger-mid)":"var(--c-warning-mid)", fontSize:"var(--text-sm)", padding:"4px 10px", borderRadius:"var(--r-pill)", fontWeight:700, flexShrink:0 }}>{item.tag}</span>
                </div>
              ))}
            </div>
          )}

          {/* Sắp khởi hành */}
          <div style={{ background:"var(--c-surface)", borderRadius:"var(--r-lg)", padding:20, boxShadow:"var(--sh-sm)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <span style={{ fontSize:18 }}>✈️</span>
              <span style={{ fontWeight:700, fontSize:"var(--text-lg)", color:"var(--c-text)" }}>Sắp khởi hành (14 ngày tới)</span>
              <span style={{ background:"var(--c-primary-light)", color:"var(--c-primary-mid)", borderRadius:"var(--r-pill)", fontSize:"var(--text-sm)", fontWeight:700, padding:"2px 9px", marginLeft:"auto" }}>{upcoming.length} đoàn</span>
            </div>
            {upcoming.length===0?(
              <div style={{ textAlign:"center", padding:"24px 0", color:"var(--c-text-muted)" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📅</div>
                <div style={{ fontSize:"var(--text-md)" }}>Không có tour nào sắp khởi hành</div>
              </div>
            ):upcoming.map((o,idx)=>(
              <div key={o.id} onClick={()=>{const orig=orders.find(x=>x.id===o.id)||o;setSelected?.(orig);setView?.("detail");}}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:idx<upcoming.length-1?"1px solid var(--c-border)":"none", cursor:"pointer" }}>
                <div style={{ width:4, height:40, background:o._urgency==="danger"?"var(--c-danger-mid)":o._urgency==="warn"?"var(--c-warning-mid)":"var(--c-success-mid)", borderRadius:2, flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"var(--text-md)", fontWeight:600, color:"var(--c-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {o.id} · {o.tourName||o.serviceName||o.service}
                  </div>
                  <div style={{ fontSize:"var(--text-sm)", color:"var(--c-text-3)", marginTop:2 }}>
                    {new Date(o.departDate).toLocaleDateString("vi-VN")} · {o.customerName}
                    {o._issues.length>0&&<span style={{ color:"var(--c-danger-mid)" }}> · {o._issues.join(" · ")}</span>}
                  </div>
                </div>
                <span style={{ background:o._urgency==="danger"?"var(--c-danger-bg)":o._urgency==="warn"?"var(--c-warning-bg)":"var(--c-success-bg)", color:o._urgency==="danger"?"var(--c-danger-mid)":o._urgency==="warn"?"var(--c-warning-mid)":"var(--c-success-mid)", fontSize:"var(--text-base)", padding:"4px 12px", borderRadius:"var(--r-pill)", fontWeight:700, flexShrink:0 }}>
                  {o._days===0?"Hôm nay":`${o._days} ngày nữa`}
                </span>
              </div>
            ))}
          </div>

          {/* KH còn nợ */}
          <div style={{ background:"var(--c-surface)", borderRadius:"var(--r-lg)", padding:20, boxShadow:"var(--sh-sm)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <span style={{ fontSize:18 }}>💳</span>
              <span style={{ fontWeight:700, fontSize:"var(--text-lg)", color:"var(--c-text)" }}>Khách hàng còn nợ</span>
              {debtOrders.length>0&&<span style={{ background:"var(--c-warning-bg)", color:"var(--c-warning-mid)", borderRadius:"var(--r-pill)", fontSize:"var(--text-sm)", fontWeight:700, padding:"2px 9px", marginLeft:"auto" }}>{debtOrders.length} KH · {fmtM(totalDebt)}</span>}
            </div>
            {debtOrders.length===0?(
              <div style={{ background:"var(--c-success-bg)", borderRadius:"var(--r-md)", padding:"14px", textAlign:"center", fontSize:"var(--text-md)", color:"var(--c-success-mid)", fontWeight:600 }}>✓ Tất cả khách đã thanh toán đủ</div>
            ):debtOrders.slice(0,5).map((o,idx)=>{
              const dl=daysFrom(o.paymentDeadline);
              const isUrgent=dl!==null&&dl<=3;
              return(
                <div key={o.id} onClick={()=>{const orig=orders.find(x=>x.id===o.id)||o;setSelected?.(orig);setView?.("detail");}}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:idx<Math.min(debtOrders.length,5)-1?"1px solid var(--c-border)":"none", cursor:"pointer" }}>
                  <div style={{ width:4, height:36, background:isUrgent?"var(--c-danger-mid)":"var(--c-warning-mid)", borderRadius:2, flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"var(--text-md)", fontWeight:600, color:"var(--c-text)" }}>{o.customerName}</div>
                    <div style={{ fontSize:"var(--text-sm)", color:"var(--c-text-3)", marginTop:2 }}>{o.id}{o.paymentDeadline&&` · HH: ${new Date(o.paymentDeadline).toLocaleDateString("vi-VN")}`}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:"var(--text-md)", fontWeight:700, color:isUrgent?"var(--c-danger-mid)":"var(--c-warning-mid)" }}>{fmtM(o.debt)}</div>
                    {o.paymentDeadline&&<span style={{ fontSize:"var(--text-xs)", background:isUrgent?"var(--c-danger-bg)":"var(--c-warning-bg)", color:isUrgent?"var(--c-danger-mid)":"var(--c-warning-mid)", padding:"2px 7px", borderRadius:"var(--r-pill)", fontWeight:600 }}>{dl===0?"Hôm nay":dl!==null?`${dl} ngày`:""}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Chỉ tiêu tháng */}
          <div style={{ background:"linear-gradient(135deg,var(--c-primary),var(--c-primary-hover))", borderRadius:"var(--r-lg)", padding:22, boxShadow:"0 4px 14px rgba(30,58,138,.3)" }}>
            <div style={{ fontSize:"var(--text-base)", color:"rgba(255,255,255,.7)", marginBottom:6 }}>Chỉ tiêu {thisMonthStr}</div>
            <div style={{ fontSize:"var(--text-3xl)", fontWeight:800, color:"#fff", marginBottom:4 }}>{fmtM(revenue)}</div>
            <div style={{ fontSize:"var(--text-base)", color:"rgba(255,255,255,.6)", marginBottom:14 }}>/ {targetAmt>0?fmtM(targetAmt):"Chưa set chỉ tiêu"}</div>
            <div style={{ background:"rgba(255,255,255,.2)", borderRadius:"var(--r-pill)", height:10 }}>
              <div style={{ background:"#fff", height:10, borderRadius:"var(--r-pill)", width:Math.min(100,targetPct)+"%", transition:"width .5s" }}/>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, fontSize:"var(--text-base)" }}>
              <span style={{ color:"rgba(255,255,255,.7)" }}>
                {targetPct>=100?`🎉 Vượt ${fmtM(revenue-targetAmt)}`:targetAmt>0?`Còn ${fmtM(targetAmt-revenue)}`:""}
              </span>
              <span style={{ color:"#fff", fontWeight:800, fontSize:"var(--text-lg)" }}>{targetPct}%</span>
            </div>
          </div>

          {/* Báo giá chờ */}
          <div style={{ background:"var(--c-surface)", borderRadius:"var(--r-lg)", padding:20, boxShadow:"var(--sh-sm)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <span style={{ fontSize:18 }}>📄</span>
              <span style={{ fontWeight:700, fontSize:"var(--text-lg)", color:"var(--c-text)" }}>Báo giá đang chờ</span>
              <span style={{ background:"var(--c-purple-bg)", color:"var(--c-purple)", borderRadius:"var(--r-pill)", fontSize:"var(--text-sm)", fontWeight:700, padding:"2px 9px", marginLeft:"auto" }}>{pendingQuotes.length}</span>
            </div>
            {pendingQuotes.length===0?(
              <div style={{ textAlign:"center", padding:"20px 0", color:"var(--c-text-muted)", fontSize:"var(--text-md)" }}>📭 Không có báo giá đang chờ</div>
            ):pendingQuotes.map((q,idx)=>{
              const level=q._daysLeft!==null&&q._daysLeft<=1?"danger":q._daysLeft!==null&&q._daysLeft<=3?"warn":"ok";
              return(
                <div key={q.id} onClick={()=>setView?.("quotes")}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:idx<pendingQuotes.length-1?"1px solid var(--c-border)":"none", cursor:"pointer" }}>
                  <div style={{ width:4, height:36, background:level==="danger"?"var(--c-danger-mid)":level==="warn"?"var(--c-warning-mid)":"var(--c-success-mid)", borderRadius:2, flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"var(--text-sm)", fontWeight:600, color:"var(--c-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{q.customerName} · {q.id}</div>
                    <div style={{ fontSize:"var(--text-sm)", color:"var(--c-text-3)", marginTop:2 }}>{q.tourName||q.service||""}{q.validUntil?` · HH: ${new Date(q.validUntil).toLocaleDateString("vi-VN")}`:""}</div>
                  </div>
                  <span style={{ fontSize:"var(--text-sm)", background:level==="danger"?"var(--c-danger-bg)":level==="warn"?"var(--c-warning-bg)":"var(--c-success-bg)", color:level==="danger"?"var(--c-danger-mid)":level==="warn"?"var(--c-warning-mid)":"var(--c-success-mid)", padding:"3px 8px", borderRadius:"var(--r-pill)", fontWeight:700, flexShrink:0 }}>
                    {q._daysLeft===null?"—":q._daysLeft<0?"Hết hạn":q._daysLeft===0?"Hôm nay":`${q._daysLeft} ngày`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Btn variant="success" style={{background:"linear-gradient(135deg,var(--c-success-mid),#047857)",color:"#fff",border:"none",boxShadow:"0 4px 12px rgba(5,150,105,.3)",justifyContent:"center",padding:"14px"}} onClick={()=>setView?.("create")}>
              <i className="ti ti-plus" style={{ fontSize:18 }}/> Tạo đơn hàng mới
            </Btn>
            <Btn variant="secondary" style={{color:"var(--c-primary)",border:"2px solid var(--c-primary-pale)",justifyContent:"center",padding:"13px"}} onClick={()=>setView?.("quotes")}>
              <i className="ti ti-file-plus" style={{ fontSize:18 }}/> Tạo báo giá mới
            </Btn>
            <Btn variant="secondary" style={{justifyContent:"center",padding:"13px"}} onClick={()=>setView?.("orders")}>
              <i className="ti ti-list" style={{ fontSize:18 }}/> Xem tất cả đơn hàng
            </Btn>
          </div>
        </div>
      </div>

    </div>
  );
}
