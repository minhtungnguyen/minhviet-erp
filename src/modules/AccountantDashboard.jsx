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
  const kpiCard  = { background: "var(--c-surface-2)", borderRadius: 8, padding: "14px 16px", border: "0.5px solid var(--c-border)" };
  const kpiLabel = { fontSize: 12, color: "var(--c-text-3)", marginBottom: 6 };
  const kpiVal   = (color = "var(--c-text)") => ({ fontSize: 20, fontWeight: 500, color, lineHeight: 1 });
  const kpiSub   = { fontSize: 11, color: "var(--c-text-muted)", marginTop: 4 };
  const sectionHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 };
  const sectionTitle  = { fontSize: 13, fontWeight: 500, color: "var(--c-text)", display: "flex", alignItems: "center", gap: 6 };
  const alertCard  = { background: "var(--c-surface)", borderRadius: 12, border: "0.5px solid var(--c-border)", overflow: "hidden" };
  const alertRow   = { display: "flex", alignItems: "center", gap: 12, padding: "11px 14px" };
  const accent     = { width: 3, height: 36, flexShrink: 0 };
  const alertTitle = { fontSize: 13, fontWeight: 500, color: "var(--c-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
  const alertSub   = { fontSize: 11, color: "var(--c-text-3)", marginTop: 1 };
  const queueCard  = { borderRadius: 10, border: "0.5px solid var(--c-border)", padding: "16px", textAlign: "center" };
  const emptyGreen = { background: "var(--c-success-bg)", borderRadius: 10, padding: "16px", textAlign: "center", fontSize: 13, color: "var(--c-success)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };
  const badge = (type) => {
    const map = { danger:{background:"var(--c-danger-bg)",color:"var(--c-danger)"}, warn:{background:"var(--c-warning-bg)",color:"var(--c-warning)"}, info:{background:"var(--c-primary-light)",color:"var(--c-primary-hover)"}, ok:{background:"var(--c-success-bg)",color:"var(--c-success)"} };
    const c = map[type] || map.info;
    return { ...c, display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:20, height:20, padding:"0 6px", borderRadius:999, fontSize:11, fontWeight:500 };
  };
  const tagStyle = (type) => {
    const map = { danger:{background:"var(--c-danger-bg)",color:"var(--c-danger)"}, warn:{background:"var(--c-warning-bg)",color:"var(--c-warning)"}, ok:{background:"var(--c-success-bg)",color:"var(--c-success)"}, info:{background:"var(--c-primary-light)",color:"var(--c-primary-hover)"} };
    const c = map[type] || map.info;
    return { ...c, fontSize:11, padding:"2px 7px", borderRadius:999, display:"inline-block", marginTop:3, fontWeight:500 };
  };
  const btnPrimary = { display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:11, borderRadius:8, border:"none", background:"var(--c-success)", color:"var(--c-surface)", fontSize:13, fontWeight:500, cursor:"pointer", width:"100%" };
  const btnOutline = { display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:11, borderRadius:8, border:"0.5px solid var(--c-border)", background:"var(--c-surface)", fontSize:13, fontWeight:500, cursor:"pointer", width:"100%", color:"var(--c-text-2)" };

  return (
    <div style={{ padding: 24 }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "var(--c-text)" }}>Dashboard Kế toán</h2>
        <div style={{ fontSize: 13, color: "var(--c-text-3)", marginTop: 3 }}>
          Tình hình thu chi & phê duyệt ·{" "}
          {new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
          {totalPending > 0 && ` · ${totalPending} việc chờ xử lý`}
        </div>
      </div>

      {/* ── KPI ROW: 5 chỉ số ── */}
      <div className="resp-grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 10, marginBottom: 20 }}>
        <div style={kpiCard}>
          <div style={kpiLabel}>Doanh thu tháng</div>
          <div style={kpiVal("var(--c-primary-mid)")}>{fmtM(doanhThuThisMonth)}</div>
          <div style={kpiSub}>Luỹ kế: {fmtM(doanhThu)}</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiLabel}>Đã thu tháng</div>
          <div style={kpiVal("var(--c-success)")}>{fmtM(thuThisMonth)}</div>
          <div style={kpiSub}>Tổng: {fmtM(totalThu)}</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiLabel}>Đã chi tháng</div>
          <div style={kpiVal("var(--c-danger)")}>{fmtM(chiThisMonth)}</div>
          <div style={kpiSub}>Tổng: {fmtM(totalChi)}</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiLabel}>Tồn quỹ ước tính</div>
          <div style={kpiVal(tonQuy >= 0 ? "var(--c-primary-mid)" : "var(--c-danger)")}>{fmtM(tonQuy)}</div>
          <div style={kpiSub}>Thu - Chi toàn bộ</div>
        </div>
        <div
          style={{ ...kpiCard, cursor: totalPending > 0 ? "pointer" : "default",
                   borderColor: totalPending > 0 ? "var(--c-danger-mid)" : "var(--c-border)",
                   background: totalPending > 0 ? "var(--c-danger-bg)" : "var(--c-surface-2)" }}
          onClick={() => totalPending > 0 && setView?.("approvals")}
        >
          <div style={{ ...kpiLabel, color: totalPending > 0 ? "var(--c-danger)" : "var(--c-text-3)" }}>Chờ duyệt</div>
          <div style={kpiVal(totalPending > 0 ? "var(--c-danger)" : "var(--c-success)")}>{totalPending}</div>
          <div style={{ ...kpiSub, color: totalPending > 0 ? "var(--c-danger)" : "var(--c-text-muted)" }}>{totalPending > 0 ? "Bấm để xử lý" : "Không có việc"}</div>
        </div>
      </div>

      {/* ── CÔNG NỢ: 2 cột ── */}
      <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12, marginBottom: 18 }}>
        <div>
          <div style={sectionHeader}>
            <div style={sectionTitle}>
              <i className="ti ti-arrow-down-circle" style={{ color: "var(--c-success)", fontSize: 16 }} />
              Công nợ phải thu (KH)
              <span style={badge(totalKHDebt > 0 ? "warn" : "ok")}>{debtOrders.length}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: totalKHDebt > 0 ? "var(--c-danger)" : "var(--c-success)" }}>{fmtM(totalKHDebt)}</span>
          </div>
          {debtOrders.length === 0 ? (
            <div style={emptyGreen}>
              <i className="ti ti-circle-check" style={{ fontSize: 20, color: "var(--c-success-mid)" }} />
              Tất cả khách hàng đã thanh toán đủ
            </div>
          ) : (
            <div style={alertCard}>
              {debtOrders.slice(0, 5).map((o, idx) => {
                const days  = daysFrom(o.departDate);
                const isHot = days !== null && days <= 3;
                return (
                  <div key={o.id} onClick={()=>onViewOrder?.(orders.find(x=>x.id===o.id)||o)} style={{ ...alertRow, borderBottom: idx < Math.min(debtOrders.length, 5) - 1 ? "0.5px solid var(--c-surface-3)" : "none", cursor:"pointer" }}>
                    <div style={{ ...accent, background: isHot ? "var(--c-danger)" : "var(--c-warning)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={alertTitle}>{o.customerName}</div>
                      <div style={alertSub}>{o.id} · {o.tourName || o.service || ""}{days !== null && ` · KH ${days === 0 ? "đi hôm nay" : `đi sau ${days} ngày`}`}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: isHot ? "var(--c-danger)" : "var(--c-warning)" }}>{fmtM(o.debt)}</div>
                      {o.paymentDeadline && <span style={tagStyle(isHot ? "danger" : "warn")}>HH: {new Date(o.paymentDeadline).toLocaleDateString("vi-VN")}</span>}
                    </div>
                  </div>
                );
              })}
              {debtOrders.length > 5 && <div style={{ padding: "8px 14px", fontSize: 12, color: "var(--c-text-3)", textAlign: "center" }}>+{debtOrders.length - 5} khách hàng khác — tổng {fmtM(totalKHDebt)}</div>}
            </div>
          )}
        </div>

        <div>
          <div style={sectionHeader}>
            <div style={sectionTitle}>
              <i className="ti ti-arrow-up-circle" style={{ color: "var(--c-danger)", fontSize: 16 }} />
              Công nợ phải trả (NCC)
              <span style={badge(totalNCCDebt > 0 ? "danger" : "ok")}>{pendingExpenses.length}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: totalNCCDebt > 0 ? "var(--c-danger)" : "var(--c-success)" }}>{fmtM(totalNCCDebt)}</span>
          </div>
          {pendingExpenses.length === 0 ? (
            <div style={emptyGreen}>
              <i className="ti ti-circle-check" style={{ fontSize: 20, color: "var(--c-success-mid)" }} />
              Không có công nợ NCC đang chờ
            </div>
          ) : (
            <div style={alertCard}>
              {pendingExpenses.slice(0, 5).map((e, idx) => {
                const statusMap = { pending_kt:{label:"Chờ KT duyệt",level:"warn"}, pending_gd:{label:"Chờ GĐ duyệt",level:"warn"}, pending_pay:{label:"Chờ chuyển tiền",level:"danger"} };
                const st = statusMap[e.status] || { label: e.status, level: "warn" };
                return (
                  <div key={e.id} onClick={() => setView?.("approvals")} style={{ ...alertRow, cursor: "pointer", borderBottom: idx < Math.min(pendingExpenses.length, 5) - 1 ? "0.5px solid var(--c-surface-3)" : "none" }}>
                    <div style={{ ...accent, background: st.level === "danger" ? "var(--c-danger)" : "var(--c-warning)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={alertTitle}>{e.nccName || e.ncc || "NCC"}</div>
                      <div style={alertSub}>{e.id} · {e.orderName || e.orderId || ""}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--c-danger)" }}>{fmtM(e.amount)}</div>
                      <span style={tagStyle(st.level)}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
              {pendingExpenses.length > 5 && <div style={{ padding: "8px 14px", fontSize: 12, color: "var(--c-text-3)", textAlign: "center" }}>+{pendingExpenses.length - 5} phiếu khác</div>}
            </div>
          )}
        </div>
      </div>

      {/* ── HÀNG CHỜ DUYỆT — phân loại theo loại ── */}
      {totalPending > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={sectionHeader}>
            <div style={sectionTitle}>
              <i className="ti ti-clock-exclamation" style={{ color: "var(--c-danger)", fontSize: 16 }} />
              Hàng chờ xử lý theo loại
            </div>
            <span onClick={() => setView?.("approvals")} style={{ fontSize: 12, color: "var(--c-primary-mid)", cursor: "pointer" }}>
              Vào xử lý <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
            </span>
          </div>
          <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
            <div style={{ ...queueCard, boxShadow: pendingThu.length > 0 ? "0 2px 10px rgba(22,163,74,.18)" : queueCard.boxShadow, background: pendingThu.length > 0 ? "var(--c-success-bg)" : "var(--c-surface)", cursor: pendingThu.length > 0 ? "pointer" : "default" }} onClick={() => pendingThu.length > 0 && setView?.("approvals")}>
              <i className="ti ti-receipt" style={{ fontSize: 20, color: pendingThu.length > 0 ? "var(--c-success-mid)" : "var(--c-text-muted)" }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: pendingThu.length > 0 ? "var(--c-success-mid)" : "var(--c-text-muted)", margin: "6px 0 2px" }}>{pendingThu.length}</div>
              <div style={{ fontSize: 12, color: "var(--c-text-3)" }}>Phiếu thu</div>
              <div style={{ fontSize: 11, color: pendingThu.length > 0 ? "var(--c-success)" : "var(--c-text-muted)", marginTop: 2 }}>{pendingThu.length > 0 ? `${fmtM(pendingThu.reduce((s,v) => s+(v.amount||0),0))} chờ xác nhận` : "Không có"}</div>
            </div>
            <div style={{ ...queueCard, boxShadow: pendingChiKT.length > 0 ? "0 2px 10px rgba(217,119,6,.18)" : queueCard.boxShadow, background: pendingChiKT.length > 0 ? "var(--c-warning-bg)" : "var(--c-surface)", cursor: pendingChiKT.length > 0 ? "pointer" : "default" }} onClick={() => pendingChiKT.length > 0 && setView?.("approvals")}>
              <i className="ti ti-file-check" style={{ fontSize: 20, color: pendingChiKT.length > 0 ? "var(--c-warning-mid)" : "var(--c-text-muted)" }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: pendingChiKT.length > 0 ? "var(--c-warning-mid)" : "var(--c-text-muted)", margin: "6px 0 2px" }}>{pendingChiKT.length}</div>
              <div style={{ fontSize: 12, color: "var(--c-text-3)" }}>Chi chờ KT duyệt</div>
              <div style={{ fontSize: 11, color: pendingChiKT.length > 0 ? "var(--c-warning)" : "var(--c-text-muted)", marginTop: 2 }}>{pendingChiKT.length > 0 ? fmtM(pendingChiKT.reduce((s,e) => s+(e.amount||0),0)) : "Không có"}</div>
            </div>
            <div style={{ ...queueCard, boxShadow: pendingChiPay.length > 0 ? "0 2px 10px rgba(220,38,38,.18)" : queueCard.boxShadow, background: pendingChiPay.length > 0 ? "var(--c-danger-bg)" : "var(--c-surface)", cursor: pendingChiPay.length > 0 ? "pointer" : "default" }} onClick={() => pendingChiPay.length > 0 && setView?.("approvals")}>
              <i className="ti ti-send" style={{ fontSize: 20, color: pendingChiPay.length > 0 ? "var(--c-danger-mid)" : "var(--c-text-muted)" }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: pendingChiPay.length > 0 ? "var(--c-danger-mid)" : "var(--c-text-muted)", margin: "6px 0 2px" }}>{pendingChiPay.length}</div>
              <div style={{ fontSize: 12, color: "var(--c-text-3)" }}>Chờ chuyển tiền</div>
              <div style={{ fontSize: 11, color: pendingChiPay.length > 0 ? "var(--c-danger)" : "var(--c-text-muted)", marginTop: 2 }}>{pendingChiPay.length > 0 ? `${fmtM(pendingChiPay.reduce((s,e) => s+(e.amount||0),0))} cần CK` : "Không có"}</div>
            </div>
            <div style={{ ...queueCard, boxShadow: (pendingRefunds.length+expiringCredits.length) > 0 ? "0 2px 10px rgba(124,58,237,.18)" : queueCard.boxShadow, background: (pendingRefunds.length+expiringCredits.length) > 0 ? "var(--c-purple-bg)" : "var(--c-surface)", cursor: (pendingRefunds.length+expiringCredits.length) > 0 ? "pointer" : "default" }} onClick={() => pendingRefunds.length > 0 && setView?.("refunds")}>
              <i className="ti ti-rotate-clockwise" style={{ fontSize: 20, color: (pendingRefunds.length+expiringCredits.length) > 0 ? "var(--c-purple)" : "var(--c-text-muted)" }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: (pendingRefunds.length+expiringCredits.length) > 0 ? "var(--c-purple)" : "var(--c-text-muted)", margin: "6px 0 2px" }}>{pendingRefunds.length + expiringCredits.length}</div>
              <div style={{ fontSize: 12, color: "var(--c-text-3)" }}>Hoàn tiền / Bảo lưu</div>
              <div style={{ fontSize: 11, color: (pendingRefunds.length+expiringCredits.length) > 0 ? "var(--c-purple)" : "var(--c-text-muted)", marginTop: 2 }}>
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
            <i className="ti ti-building-bank" style={{ color: "var(--c-primary-mid)", fontSize: 16 }} />
            Tài khoản ngân hàng
          </div>
          <span style={{ fontSize: 12, color: "var(--c-text-3)" }}>Thu/chi tháng này</span>
        </div>
        {bankStats.length === 0 ? (
          <div style={emptyGreen}>Chưa có tài khoản ngân hàng nào</div>
        ) : (
          <div style={alertCard}>
            {bankStats.map((acc, idx) => (
              <div key={acc.id} style={{ ...alertRow, alignItems: "stretch", borderBottom: idx < bankStats.length - 1 ? "0.5px solid var(--c-surface-3)" : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, alignSelf: "center", background: acc.color ? acc.color + "18" : "var(--c-primary-pale)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="ti ti-credit-card" style={{ fontSize: 18, color: acc.color || "var(--c-primary-mid)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={alertTitle}>{acc.shortName || acc.bankName}</div>
                  <div style={{ ...alertSub, fontFamily: "monospace" }}>{acc.accountNo || acc.accountNumber}</div>
                  <div style={{ ...alertSub, marginTop: 1 }}>{acc.accountName}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, alignSelf: "center" }}>
                  {acc.thuVao > 0 && <div style={{ fontSize: 12, color: "var(--c-success-mid)", fontWeight: 700 }}><i className="ti ti-arrow-down" style={{ fontSize: 11 }} /> +{fmtM(acc.thuVao)}</div>}
                  {acc.chiRa > 0 && <div style={{ fontSize: 12, color: "var(--c-danger-mid)", fontWeight: 700, marginTop: 2 }}><i className="ti ti-arrow-up" style={{ fontSize: 11 }} /> -{fmtM(acc.chiRa)}</div>}
                  {acc.thuVao === 0 && acc.chiRa === 0 && <div style={{ fontSize: 11, color: "var(--c-text-muted)" }}>Chưa có GD tháng này</div>}
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
              <i className="ti ti-ticket" style={{ color: "var(--c-warning-mid)", fontSize: 16 }} />
              Bảo lưu vé sắp hết hạn
              <span style={badge("warn")}>{expiringCredits.length}</span>
            </div>
            <span onClick={() => setView?.("credits")} style={{ fontSize: 12, color: "var(--c-primary-mid)", cursor: "pointer" }}>
              Xem tất cả <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
            </span>
          </div>
          <div style={alertCard}>
            {expiringCredits.map((c, idx) => {
              const days = daysFrom(c.expiryDate);
              return (
                <div key={c.id} style={{ ...alertRow, borderBottom: idx < expiringCredits.length - 1 ? "0.5px solid var(--c-surface-3)" : "none" }}>
                  <div style={{ ...accent, background: days <= 7 ? "var(--c-danger-mid)" : "var(--c-warning-mid)" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={alertTitle}>{c.customerName} — {c.airline || c.airlineName || ""} {c.route || ""}</div>
                    <div style={alertSub}>{c.id} · HH: {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("vi-VN") : "—"}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-warning-mid)" }}>{fmtM(c.creditAmount || c.remainingAmount)}</div>
                    <span style={tagStyle(days <= 7 ? "danger" : "warn")}>{days === 0 ? "Hết hạn hôm nay" : `Còn ${days} ngày`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div className="resp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
        <button onClick={() => setView?.("approvals")} style={btnPrimary}>
          <i className="ti ti-check" style={{ fontSize: 16 }} /> Duyệt phiếu
          {totalPending > 0 && <span style={{ background: "var(--c-surface)", color: "var(--c-success)", borderRadius: 999, fontSize: 11, padding: "1px 6px", fontWeight: 500 }}>{totalPending}</span>}
        </button>
        <button onClick={() => setView?.("finance")} style={btnOutline}>
          <i className="ti ti-report-money" style={{ fontSize: 16 }} /> Sổ thu chi
        </button>
        <button onClick={() => setView?.("refunds")} style={btnOutline}>
          <i className="ti ti-rotate-clockwise" style={{ fontSize: 16 }} /> Hoàn tiền
          {pendingRefunds.length > 0 && <span style={{ background: "var(--c-danger-bg)", color: "var(--c-danger)", borderRadius: 999, fontSize: 11, padding: "1px 6px", fontWeight: 500 }}>{pendingRefunds.length}</span>}
        </button>
      </div>

    </div>
  );
}
