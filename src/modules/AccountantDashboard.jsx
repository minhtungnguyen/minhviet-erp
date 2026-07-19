export default function AccountantDashboard({ orders=[], vouchers=[], expenses=[], refunds=[], credits=[], bankAccounts=[], setView, onViewOrder }){
  // ── Helpers ──────────────────────────────────────────────
  const fmt  = (n) => (n || 0).toLocaleString("vi-VN") + "đ";
  const fmtM = (n) => {
    const a=Math.abs(n||0),s=(n||0)<0?"-":"";
    if(a>=1e9) return s+(a/1e9).toFixed(1).replace(/\.0$/,"")+" tỷ";
    return s+Math.round(a).toLocaleString("vi-VN")+"đ";
  };
  const today    = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const thisMonth = (d) => {
    if (!d) return false;
    const x = new Date(d);
    return x.getMonth() === today.getMonth() && x.getFullYear() === today.getFullYear();
  };
  const daysFrom = (d) => d ? Math.ceil((new Date(d) - today) / 86400000) : null;

  // ── THU ──────────────────────────────────────────────────
  const approvedThu = vouchers.filter(v => v.type === "thu" && ["approved","confirmed"].includes(v.status));
  const totalThu     = approvedThu.reduce((s, v) => s + (v.amount || 0), 0);
  const thuThisMonth = approvedThu.filter(v => thisMonth(v.date || v.createdAt)).reduce((s, v) => s + (v.amount || 0), 0);

  // ── CHI ──────────────────────────────────────────────────
  const approvedChi  = vouchers.filter(v => v.type === "chi" && ["approved","confirmed"].includes(v.status));
  const paidExpenses = expenses.filter(e => e.status === "paid");
  const totalChi     = approvedChi.reduce((s, v) => s + (v.amount || 0), 0) + paidExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const chiThisMonth = approvedChi.filter(v => thisMonth(v.date || v.createdAt)).reduce((s, v) => s + (v.amount || 0), 0)
                     + paidExpenses.filter(e => thisMonth(e.createdAt)).reduce((s, e) => s + (e.amount || 0), 0);

  // ── TỒN QUỸ ─────────────────────────────────────────────
  const tonQuy = totalThu - totalChi;

  // ── DOANH THU thực tế ────────────────────────────────────
  const closedOrders      = orders.filter(o => o.status === "closed");
  const doanhThu          = closedOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const doanhThuThisMonth = closedOrders
    .filter(o => thisMonth(o.closedAt || o.departDate || o.createdAt))
    .reduce((s, o) => s + (o.totalPrice || 0), 0);

  // ── CÔNG NỢ PHẢI THU ────────────────────────────────────
  const debtOrders = orders
    .filter(o => !["closed","cancelled"].includes(o.status))
    .map(o => ({ ...o, debt: Math.max(0, (o.totalPrice || 0) - (o.totalPaid || 0)) }))
    .filter(o => o.debt > 0)
    .sort((a, b) => {
      const aD = daysFrom(a.departDate), bD = daysFrom(b.departDate);
      if (aD !== null && bD !== null) return aD - bD;
      return b.debt - a.debt;
    });
  const totalKHDebt = debtOrders.reduce((s, o) => s + o.debt, 0);

  // ── CÔNG NỢ PHẢI TRẢ ────────────────────────────────────
  const pendingExpenses = expenses.filter(e => ["pending_kt","pending_gd","pending_pay"].includes(e.status));
  const totalNCCDebt    = pendingExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  // ── HÀNG CHỜ DUYỆT ──────────────────────────────────────
  const pendingThu    = vouchers.filter(v => v.type === "thu" && v.status === "pending").sort((a, b) => (b.amount||0) - (a.amount||0));
  const pendingChiKT  = expenses.filter(e => e.status === "pending_kt").sort((a, b) => (b.amount||0) - (a.amount||0));
  const pendingChiPay = expenses.filter(e => e.status === "pending_pay").sort((a, b) => (b.amount||0) - (a.amount||0));
  const pendingRefunds = (refunds || []).filter(r => r.status === "pending");
  const expiringCredits = (credits || []).filter(c => {
    if (c.status !== "active" && c._status !== "active" && c._status !== "partial") return false;
    const days = daysFrom(c.expiryDate);
    return days !== null && days >= 0 && days <= 30;
  }).sort((a, b) => daysFrom(a.expiryDate) - daysFrom(b.expiryDate));

  // ── THU/CHI THEO TK NGÂN HÀNG (tháng này) ───────────────
  const bankStats = (bankAccounts || []).map(acc => {
    const thuVao = approvedThu.filter(v => thisMonth(v.date || v.createdAt) && (v.bankId === acc.id || v.bankAccountId === acc.id)).reduce((s, v) => s + (v.amount || 0), 0);
    const chiRa  = approvedChi.filter(v => thisMonth(v.date || v.createdAt) && (v.bankId === acc.id || v.bankAccountId === acc.id)).reduce((s, v) => s + (v.amount || 0), 0)
                 + paidExpenses.filter(e => thisMonth(e.createdAt) && (e.bankId === acc.id || e.bankAccountId === acc.id)).reduce((s, e) => s + (e.amount || 0), 0);
    return { ...acc, thuVao, chiRa, net: thuVao - chiRa };
  });

  const totalPending = pendingThu.length + pendingChiKT.length + pendingChiPay.length + pendingRefunds.length;

  // ── Style objects ─────────────────────────────────────────
  const kpiCard  = { background: "#f8fafc", borderRadius: 8, padding: "14px 16px", border: "0.5px solid #e2e8f0" };
  const kpiLabel = { fontSize: 12, color: "#64748b", marginBottom: 6 };
  const kpiVal   = (color = "#1e293b") => ({ fontSize: 20, fontWeight: 500, color, lineHeight: 1 });
  const kpiSub   = { fontSize: 11, color: "#94a3b8", marginTop: 4 };
  const sectionHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 };
  const sectionTitle  = { fontSize: 13, fontWeight: 500, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 };
  const alertCard  = { background: "#fff", borderRadius: 12, border: "0.5px solid #e2e8f0", overflow: "hidden" };
  const alertRow   = { display: "flex", alignItems: "center", gap: 12, padding: "11px 14px" };
  const accent     = { width: 3, height: 36, flexShrink: 0 };
  const alertTitle = { fontSize: 13, fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
  const alertSub   = { fontSize: 11, color: "#64748b", marginTop: 1 };
  const queueCard  = { borderRadius: 10, border: "0.5px solid #e2e8f0", padding: "16px", textAlign: "center" };
  const emptyGreen = { background: "#E1F5EE", borderRadius: 10, padding: "16px", textAlign: "center", fontSize: 13, color: "#085041", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };
  const badge = (type) => {
    const map = { danger:{background:"#FCEBEB",color:"#791F1F"}, warn:{background:"#FAEEDA",color:"#633806"}, info:{background:"#E6F1FB",color:"#0C447C"}, ok:{background:"#E1F5EE",color:"#085041"} };
    const c = map[type] || map.info;
    return { ...c, display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:20, height:20, padding:"0 6px", borderRadius:999, fontSize:11, fontWeight:500 };
  };
  const tagStyle = (type) => {
    const map = { danger:{background:"#FCEBEB",color:"#791F1F"}, warn:{background:"#FAEEDA",color:"#633806"}, ok:{background:"#E1F5EE",color:"#085041"}, info:{background:"#E6F1FB",color:"#0C447C"} };
    const c = map[type] || map.info;
    return { ...c, fontSize:11, padding:"2px 7px", borderRadius:999, display:"inline-block", marginTop:3, fontWeight:500 };
  };
  const btnPrimary = { display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:11, borderRadius:8, border:"none", background:"#0F6E56", color:"#fff", fontSize:13, fontWeight:500, cursor:"pointer", width:"100%" };
  const btnOutline = { display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:11, borderRadius:8, border:"0.5px solid #e2e8f0", background:"#fff", fontSize:13, fontWeight:500, cursor:"pointer", width:"100%", color:"#374151" };

  return (
    <div style={{ padding: 24 }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "#1e293b" }}>Dashboard Kế toán</h2>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
          Tình hình thu chi & phê duyệt ·{" "}
          {new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
          {totalPending > 0 && ` · ${totalPending} việc chờ xử lý`}
        </div>
      </div>

      {/* ── KPI ROW: 5 chỉ số ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 10, marginBottom: 20 }}>
        <div style={kpiCard}>
          <div style={kpiLabel}>Doanh thu tháng</div>
          <div style={kpiVal("#185FA5")}>{fmtM(doanhThuThisMonth)}</div>
          <div style={kpiSub}>Luỹ kế: {fmtM(doanhThu)}</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiLabel}>Đã thu tháng</div>
          <div style={kpiVal("#0F6E56")}>{fmtM(thuThisMonth)}</div>
          <div style={kpiSub}>Tổng: {fmtM(totalThu)}</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiLabel}>Đã chi tháng</div>
          <div style={kpiVal("#A32D2D")}>{fmtM(chiThisMonth)}</div>
          <div style={kpiSub}>Tổng: {fmtM(totalChi)}</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiLabel}>Tồn quỹ ước tính</div>
          <div style={kpiVal(tonQuy >= 0 ? "#185FA5" : "#A32D2D")}>{fmtM(tonQuy)}</div>
          <div style={kpiSub}>Thu - Chi toàn bộ</div>
        </div>
        <div
          style={{ ...kpiCard, cursor: totalPending > 0 ? "pointer" : "default",
                   borderColor: totalPending > 0 ? "#E24B4A" : "#e2e8f0",
                   background: totalPending > 0 ? "#FCEBEB" : "#f8fafc" }}
          onClick={() => totalPending > 0 && setView?.("approvals")}
        >
          <div style={{ ...kpiLabel, color: totalPending > 0 ? "#791F1F" : "#64748b" }}>Chờ duyệt</div>
          <div style={kpiVal(totalPending > 0 ? "#A32D2D" : "#0F6E56")}>{totalPending}</div>
          <div style={{ ...kpiSub, color: totalPending > 0 ? "#A32D2D" : "#94a3b8" }}>{totalPending > 0 ? "Bấm để xử lý" : "Không có việc"}</div>
        </div>
      </div>

      {/* ── CÔNG NỢ: 2 cột ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12, marginBottom: 18 }}>
        <div>
          <div style={sectionHeader}>
            <div style={sectionTitle}>
              <i className="ti ti-arrow-down-circle" style={{ color: "#0F6E56", fontSize: 16 }} />
              Công nợ phải thu (KH)
              <span style={badge(totalKHDebt > 0 ? "warn" : "ok")}>{debtOrders.length}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: totalKHDebt > 0 ? "#A32D2D" : "#0F6E56" }}>{fmtM(totalKHDebt)}</span>
          </div>
          {debtOrders.length === 0 ? (
            <div style={emptyGreen}>
              <i className="ti ti-circle-check" style={{ fontSize: 20, color: "#16a34a" }} />
              Tất cả khách hàng đã thanh toán đủ
            </div>
          ) : (
            <div style={alertCard}>
              {debtOrders.slice(0, 5).map((o, idx) => {
                const days  = daysFrom(o.departDate);
                const isHot = days !== null && days <= 3;
                return (
                  <div key={o.id} onClick={()=>onViewOrder?.(orders.find(x=>x.id===o.id)||o)} style={{ ...alertRow, borderBottom: idx < Math.min(debtOrders.length, 5) - 1 ? "0.5px solid #f1f5f9" : "none", cursor:"pointer" }}>
                    <div style={{ ...accent, background: isHot ? "#A32D2D" : "#854F0B" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={alertTitle}>{o.customerName}</div>
                      <div style={alertSub}>{o.id} · {o.tourName || o.service || ""}{days !== null && ` · KH ${days === 0 ? "đi hôm nay" : `đi sau ${days} ngày`}`}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: isHot ? "#A32D2D" : "#854F0B" }}>{fmtM(o.debt)}</div>
                      {o.paymentDeadline && <span style={tagStyle(isHot ? "danger" : "warn")}>HH: {new Date(o.paymentDeadline).toLocaleDateString("vi-VN")}</span>}
                    </div>
                  </div>
                );
              })}
              {debtOrders.length > 5 && <div style={{ padding: "8px 14px", fontSize: 12, color: "#64748b", textAlign: "center" }}>+{debtOrders.length - 5} khách hàng khác — tổng {fmtM(totalKHDebt)}</div>}
            </div>
          )}
        </div>

        <div>
          <div style={sectionHeader}>
            <div style={sectionTitle}>
              <i className="ti ti-arrow-up-circle" style={{ color: "#A32D2D", fontSize: 16 }} />
              Công nợ phải trả (NCC)
              <span style={badge(totalNCCDebt > 0 ? "danger" : "ok")}>{pendingExpenses.length}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: totalNCCDebt > 0 ? "#A32D2D" : "#0F6E56" }}>{fmtM(totalNCCDebt)}</span>
          </div>
          {pendingExpenses.length === 0 ? (
            <div style={emptyGreen}>
              <i className="ti ti-circle-check" style={{ fontSize: 20, color: "#16a34a" }} />
              Không có công nợ NCC đang chờ
            </div>
          ) : (
            <div style={alertCard}>
              {pendingExpenses.slice(0, 5).map((e, idx) => {
                const statusMap = { pending_kt:{label:"Chờ KT duyệt",level:"warn"}, pending_gd:{label:"Chờ GĐ duyệt",level:"warn"}, pending_pay:{label:"Chờ chuyển tiền",level:"danger"} };
                const st = statusMap[e.status] || { label: e.status, level: "warn" };
                return (
                  <div key={e.id} onClick={() => setView?.("approvals")} style={{ ...alertRow, cursor: "pointer", borderBottom: idx < Math.min(pendingExpenses.length, 5) - 1 ? "0.5px solid #f1f5f9" : "none" }}>
                    <div style={{ ...accent, background: st.level === "danger" ? "#A32D2D" : "#854F0B" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={alertTitle}>{e.nccName || e.ncc || "NCC"}</div>
                      <div style={alertSub}>{e.id} · {e.orderName || e.orderId || ""}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#A32D2D" }}>{fmtM(e.amount)}</div>
                      <span style={tagStyle(st.level)}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
              {pendingExpenses.length > 5 && <div style={{ padding: "8px 14px", fontSize: 12, color: "#64748b", textAlign: "center" }}>+{pendingExpenses.length - 5} phiếu khác</div>}
            </div>
          )}
        </div>
      </div>

      {/* ── HÀNG CHỜ DUYỆT — phân loại theo loại ── */}
      {totalPending > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={sectionHeader}>
            <div style={sectionTitle}>
              <i className="ti ti-clock-exclamation" style={{ color: "#A32D2D", fontSize: 16 }} />
              Hàng chờ xử lý theo loại
            </div>
            <span onClick={() => setView?.("approvals")} style={{ fontSize: 12, color: "#185FA5", cursor: "pointer" }}>
              Vào xử lý <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
            <div style={{ ...queueCard, boxShadow: pendingThu.length > 0 ? "0 2px 10px rgba(22,163,74,.18)" : queueCard.boxShadow, background: pendingThu.length > 0 ? "#dcfce7" : "#fff", cursor: pendingThu.length > 0 ? "pointer" : "default" }} onClick={() => pendingThu.length > 0 && setView?.("approvals")}>
              <i className="ti ti-receipt" style={{ fontSize: 20, color: pendingThu.length > 0 ? "#16a34a" : "#94a3b8" }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: pendingThu.length > 0 ? "#16a34a" : "#94a3b8", margin: "6px 0 2px" }}>{pendingThu.length}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Phiếu thu</div>
              <div style={{ fontSize: 11, color: pendingThu.length > 0 ? "#15803d" : "#94a3b8", marginTop: 2 }}>{pendingThu.length > 0 ? `${fmtM(pendingThu.reduce((s,v) => s+(v.amount||0),0))} chờ xác nhận` : "Không có"}</div>
            </div>
            <div style={{ ...queueCard, boxShadow: pendingChiKT.length > 0 ? "0 2px 10px rgba(217,119,6,.18)" : queueCard.boxShadow, background: pendingChiKT.length > 0 ? "#fef3c7" : "#fff", cursor: pendingChiKT.length > 0 ? "pointer" : "default" }} onClick={() => pendingChiKT.length > 0 && setView?.("approvals")}>
              <i className="ti ti-file-check" style={{ fontSize: 20, color: pendingChiKT.length > 0 ? "#d97706" : "#94a3b8" }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: pendingChiKT.length > 0 ? "#d97706" : "#94a3b8", margin: "6px 0 2px" }}>{pendingChiKT.length}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Chi chờ KT duyệt</div>
              <div style={{ fontSize: 11, color: pendingChiKT.length > 0 ? "#b45309" : "#94a3b8", marginTop: 2 }}>{pendingChiKT.length > 0 ? fmtM(pendingChiKT.reduce((s,e) => s+(e.amount||0),0)) : "Không có"}</div>
            </div>
            <div style={{ ...queueCard, boxShadow: pendingChiPay.length > 0 ? "0 2px 10px rgba(220,38,38,.18)" : queueCard.boxShadow, background: pendingChiPay.length > 0 ? "#fee2e2" : "#fff", cursor: pendingChiPay.length > 0 ? "pointer" : "default" }} onClick={() => pendingChiPay.length > 0 && setView?.("approvals")}>
              <i className="ti ti-send" style={{ fontSize: 20, color: pendingChiPay.length > 0 ? "#dc2626" : "#94a3b8" }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: pendingChiPay.length > 0 ? "#dc2626" : "#94a3b8", margin: "6px 0 2px" }}>{pendingChiPay.length}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Chờ chuyển tiền</div>
              <div style={{ fontSize: 11, color: pendingChiPay.length > 0 ? "#b91c1c" : "#94a3b8", marginTop: 2 }}>{pendingChiPay.length > 0 ? `${fmtM(pendingChiPay.reduce((s,e) => s+(e.amount||0),0))} cần CK` : "Không có"}</div>
            </div>
            <div style={{ ...queueCard, boxShadow: (pendingRefunds.length+expiringCredits.length) > 0 ? "0 2px 10px rgba(124,58,237,.18)" : queueCard.boxShadow, background: (pendingRefunds.length+expiringCredits.length) > 0 ? "#ede9fe" : "#fff", cursor: (pendingRefunds.length+expiringCredits.length) > 0 ? "pointer" : "default" }} onClick={() => pendingRefunds.length > 0 && setView?.("refunds")}>
              <i className="ti ti-rotate-clockwise" style={{ fontSize: 20, color: (pendingRefunds.length+expiringCredits.length) > 0 ? "#7c3aed" : "#94a3b8" }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: (pendingRefunds.length+expiringCredits.length) > 0 ? "#7c3aed" : "#94a3b8", margin: "6px 0 2px" }}>{pendingRefunds.length + expiringCredits.length}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Hoàn tiền / Bảo lưu</div>
              <div style={{ fontSize: 11, color: (pendingRefunds.length+expiringCredits.length) > 0 ? "#6d28d9" : "#94a3b8", marginTop: 2 }}>
                {pendingRefunds.length > 0 && `${pendingRefunds.length} hoàn chờ duyệt`}
                {expiringCredits.length > 0 && ` · ${expiringCredits.length} BL sắp hết hạn`}
                {pendingRefunds.length === 0 && expiringCredits.length === 0 && "Không có"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TÀI KHOẢN NGÂN HÀNG ── */}
      <div style={{ marginBottom: 18 }}>
        <div style={sectionHeader}>
          <div style={sectionTitle}>
            <i className="ti ti-building-bank" style={{ color: "#2563eb", fontSize: 16 }} />
            Tài khoản ngân hàng
          </div>
          <span style={{ fontSize: 12, color: "#64748b" }}>Thu/chi tháng này</span>
        </div>
        {bankStats.length === 0 ? (
          <div style={emptyGreen}>Chưa có tài khoản ngân hàng nào</div>
        ) : (
          <div style={alertCard}>
            {bankStats.map((acc, idx) => (
              <div key={acc.id} style={{ ...alertRow, alignItems: "stretch", borderBottom: idx < bankStats.length - 1 ? "0.5px solid #f1f5f9" : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, alignSelf: "center", background: acc.color ? acc.color + "18" : "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="ti ti-credit-card" style={{ fontSize: 18, color: acc.color || "#2563eb" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={alertTitle}>{acc.shortName || acc.bankName}</div>
                  <div style={{ ...alertSub, fontFamily: "monospace" }}>{acc.accountNo || acc.accountNumber}</div>
                  <div style={{ ...alertSub, marginTop: 1 }}>{acc.accountName}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, alignSelf: "center" }}>
                  {acc.thuVao > 0 && <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}><i className="ti ti-arrow-down" style={{ fontSize: 11 }} /> +{fmtM(acc.thuVao)}</div>}
                  {acc.chiRa > 0 && <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, marginTop: 2 }}><i className="ti ti-arrow-up" style={{ fontSize: 11 }} /> -{fmtM(acc.chiRa)}</div>}
                  {acc.thuVao === 0 && acc.chiRa === 0 && <div style={{ fontSize: 11, color: "#94a3b8" }}>Chưa có GD tháng này</div>}
                  {!acc.active && <span style={tagStyle("warn")}>Chưa kích hoạt</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── BẢO LƯU VÉ SẮP HẾT HẠN ── */}
      {expiringCredits.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={sectionHeader}>
            <div style={sectionTitle}>
              <i className="ti ti-ticket" style={{ color: "#d97706", fontSize: 16 }} />
              Bảo lưu vé sắp hết hạn
              <span style={badge("warn")}>{expiringCredits.length}</span>
            </div>
            <span onClick={() => setView?.("credits")} style={{ fontSize: 12, color: "#2563eb", cursor: "pointer" }}>
              Xem tất cả <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
            </span>
          </div>
          <div style={alertCard}>
            {expiringCredits.map((c, idx) => {
              const days = daysFrom(c.expiryDate);
              return (
                <div key={c.id} style={{ ...alertRow, borderBottom: idx < expiringCredits.length - 1 ? "0.5px solid #f1f5f9" : "none" }}>
                  <div style={{ ...accent, background: days <= 7 ? "#dc2626" : "#d97706" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={alertTitle}>{c.customerName} — {c.airline || c.airlineName || ""} {c.route || ""}</div>
                    <div style={alertSub}>{c.id} · HH: {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("vi-VN") : "—"}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#d97706" }}>{fmtM(c.creditAmount || c.remainingAmount)}</div>
                    <span style={tagStyle(days <= 7 ? "danger" : "warn")}>{days === 0 ? "Hết hạn hôm nay" : `Còn ${days} ngày`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
        <button onClick={() => setView?.("approvals")} style={btnPrimary}>
          <i className="ti ti-check" style={{ fontSize: 16 }} /> Duyệt phiếu
          {totalPending > 0 && <span style={{ background: "#fff", color: "#0F6E56", borderRadius: 999, fontSize: 11, padding: "1px 6px", fontWeight: 500 }}>{totalPending}</span>}
        </button>
        <button onClick={() => setView?.("finance")} style={btnOutline}>
          <i className="ti ti-report-money" style={{ fontSize: 16 }} /> Sổ thu chi
        </button>
        <button onClick={() => setView?.("refunds")} style={btnOutline}>
          <i className="ti ti-rotate-clockwise" style={{ fontSize: 16 }} /> Hoàn tiền
          {pendingRefunds.length > 0 && <span style={{ background: "#FCEBEB", color: "#791F1F", borderRadius: 999, fontSize: 11, padding: "1px 6px", fontWeight: 500 }}>{pendingRefunds.length}</span>}
        </button>
      </div>

    </div>
  );
}
