// Main app shell: Sidebar + TopBar layout
// Thay thế inline nav bar kiểu topbar ngang bằng sidebar dọc hiện đại

const NAV_ITEMS = [
  { k: "dashboard",   label: "Dashboard",     icon: "📊", roles: ["sale","accountant","manager","dieu_hanh"] },
  { k: "orders",      label: "Đơn hàng",      icon: "📋", roles: ["sale","accountant","manager","dieu_hanh"] },
  { k: "crm",         label: "CRM",            icon: "👥", roles: ["sale","manager","dieu_hanh"] },
  { k: "tourops",     label: "Vận hành tour",  icon: "🚌", roles: ["sale","accountant","manager","dieu_hanh"] },
  { k: "tourprogram", label: "Chương trình",   icon: "🗺", roles: ["manager","dieu_hanh"] },
  { k: "hdv",         label: "HDV",             icon: "🧑‍🦯", roles: ["sale","manager","dieu_hanh"] },
  { k: "quotes",      label: "Chào giá",       icon: "📄", roles: ["sale","manager","dieu_hanh"] },
  { k: "accounting",  label: "Kế toán",        icon: "💰", roles: ["accountant","manager"] },
  { k: "ncc",         label: "Nhà cung cấp",   icon: "🏢", roles: ["sale","accountant","manager","dieu_hanh"] },
  { k: "approvals",   label: "Phê duyệt",      icon: "✅", roles: ["accountant","manager"] },
  { k: "refunds",     label: "Hoàn tiền",      icon: "↩", roles: ["sale","accountant","manager"] },
  { k: "credits",     label: "Bảo lưu vé",     icon: "✈", roles: ["sale","accountant","manager"] },
  { k: "closeorders", label: "Đóng đơn",       icon: "🔒", roles: ["accountant","manager"] },
  { k: "users",       label: "Nhân sự",        icon: "👤", roles: ["accountant","manager"] },
  { k: "reports",     label: "Báo cáo",         icon: "📊", roles: ["accountant","manager"] },
  { k: "tourghep",    label: "Tour ghép",        icon: "🌏", roles: ["sale","manager","dieu_hanh"] },
  { k: "aftercare",   label: "Chăm sóc KH",     icon: "💝", roles: ["sale","manager","dieu_hanh"] },
  { k: "deploy",      label: "Deploy",          icon: "🚀", roles: ["manager"] },
];

const ROLE_LABEL = {
  sale:         { label: "Sale",           color: "#3b82f6", bg: "rgba(59,130,246,.18)" },
  accountant:   { label: "Kế toán",        color: "#34d399", bg: "rgba(52,211,153,.18)" },
  cashier:      { label: "Kế toán quỹ",   color: "#0891b2", bg: "rgba(8,145,178,.18)"  },
  manager:      { label: "Giám đốc",       color: "#fbbf24", bg: "rgba(251,191,36,.18)"  },
  pho_giam_doc: { label: "Phó Giám đốc",  color: "#818cf8", bg: "rgba(129,140,248,.18)" },
  dieu_hanh:    { label: "Điều hành",      color: "#a78bfa", bg: "rgba(167,139,250,.18)" },
};

export function Sidebar({
  view, setView, currentRole, currentUser,
  pendingApprovals=0, pendingRefunds=0, pendingCare=0,
  pendingThu=0, pendingPay=0, activeOrders=0, expiringQuotes=0,
  isOpen=false, onClose, perms=[],
}) {
  const can = (k)=>perms.includes(k);
  const canSeeTourGhep = can("tourghep") && (["manager","accountant","dieu_hanh"].includes(currentRole) || currentUser?.canViewTourGhep===true);

  // Màu accent theo role
  const accent = { manager:"#2563eb", pho_giam_doc:"#1d4ed8", accountant:"#7c3aed", cashier:"#0891b2", sale:"#059669", dieu_hanh:"#d97706" }[currentRole] || "#2563eb";
  const accentLight = { manager:"#eff6ff", accountant:"#f5f3ff", cashier:"#ecfeff", sale:"#ecfdf5", dieu_hanh:"#fffbeb" }[currentRole] || "#eff6ff";
  const roleLabel = { manager:"Giám đốc", pho_giam_doc:"Phó Giám đốc", accountant:"Kế toán trưởng", cashier:"Kế toán quỹ", sale:"Sale", dieu_hanh:"Điều hành" }[currentRole] || currentRole;

  const NavItem = ({ icon, label, toView, badge, badgeColor="#dc2626", hidden=false }) => {
    if (hidden) return null;
    const isActive = view===toView || (toView==="orders" && ["detail","create"].includes(view));
    return (
      <div onClick={()=>handleNav(toView)} style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"11px 16px", margin:"2px 8px", borderRadius:10,
        cursor:"pointer", fontSize:14, fontWeight: isActive?700:500,
        background: isActive ? accentLight : "transparent",
        color: isActive ? accent : "#1e40af",
        borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent",
        transition:"all .15s",
      }}
        onMouseEnter={e=>{ if(!isActive){ e.currentTarget.style.background="#eff6ff"; e.currentTarget.style.color=accent; }}}
        onMouseLeave={e=>{ if(!isActive){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#1e40af"; }}}
      >
        <i className={`ti ${icon}`} style={{ fontSize:20, width:24, textAlign:"center", flexShrink:0, color: isActive?accent:"#3b82f6" }} />
        <span style={{flex:1}}>{label}</span>
        {badge>0 && (
          <span style={{ background:badgeColor, color:"#fff", borderRadius:99, fontSize:10, fontWeight:700, padding:"2px 8px", minWidth:20, textAlign:"center" }}>
            {badge}
          </span>
        )}
      </div>
    );
  };

  const Sec = ({label}) => (
    <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", color:"#94a3b8", padding:"14px 22px 4px" }}>
      {label}
    </div>
  );

  const Div = () => <div style={{ height:1, background:"#f1f5f9", margin:"6px 16px" }}/>;

  const handleNav = (toView) => { setView(toView); onClose?.(); };

  return (
    <div className={`sidebar-root${isOpen?" sidebar-open":""}`} style={{ width:280, background:"#fff", display:"flex", flexDirection:"column", height:"100vh", position:"fixed", left:0, top:0, zIndex:200, boxShadow:"2px 0 12px rgba(0,0,0,.08)", overflow:"hidden", transition:"transform .25s ease" }}>

      {/* Logo */}
      <div style={{ padding:"20px 18px 16px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:`linear-gradient(135deg,${accent},${accent}cc)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0, boxShadow:`0 4px 12px ${accent}40` }}>
          ✈️
        </div>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:"#0f172a", letterSpacing:".3px" }}>MINH VIỆT</div>
          <div style={{ fontSize:10, color:"#94a3b8", fontWeight:500, marginTop:1 }}>Travel ERP</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
        <NavItem icon="ti-layout-dashboard" label="Dashboard" toView="dashboard" />
        <NavItem icon="ti-checklist"        label="Công việc"  toView="tasks" />
        <Div/>

        {/* ── KINH DOANH ── */}
        {(can("orders")||can("quotes")||can("crm")||can("aftercare")||canSeeTourGhep||can("ncc"))&&<Sec label="Kinh doanh"/>}
        {can("orders")&&<NavItem icon="ti-file-text"        label="Đơn hàng"        toView="orders"    badge={currentRole==="sale"?activeOrders:0} badgeColor="#059669"/>}
        {can("quotes")&&<NavItem icon="ti-file-description" label="Báo giá"         toView="quotes"    badge={currentRole==="sale"?expiringQuotes:0} badgeColor="#d97706"/>}
        {can("crm")&&<NavItem icon="ti-users"            label="Khách hàng"      toView="crm"/>}
        {can("aftercare")&&<NavItem icon="ti-heart-handshake"  label="Chăm sóc KH"    toView="aftercare" badge={pendingCare} badgeColor="#d97706"/>}
        {canSeeTourGhep&&<NavItem icon="ti-package"          label="Tour ghép"       toView="tourghep"/>}
        {can("ncc")&&<NavItem icon="ti-building"         label="Nhà cung cấp"    toView="ncc"/>}

        {/* ── VẬN HÀNH ── */}
        {(can("tourops")||can("hdv"))&&<Sec label="Vận hành"/>}
        {can("tourops")&&<NavItem icon="ti-map-route"        label="Vận hành tour"   toView="tourops"/>}
        {can("hdv")&&<NavItem icon="ti-user-check"       label="Hướng dẫn viên"  toView="hdv"/>}

        {/* ── TÀI CHÍNH ── */}
        {(can("finance")||can("approvals")||can("refunds")||can("credits")||can("closeorders")||can("banks"))&&<Sec label="Tài chính"/>}
        {can("finance")&&<NavItem icon="ti-receipt"          label="Sổ thu chi"      toView="finance"   badge={currentRole==="cashier"?pendingThu:0} badgeColor="#dc2626"/>}
        {can("approvals")&&<NavItem icon="ti-checks"           label="Phê duyệt"       toView="approvals"   badge={pendingApprovals} badgeColor="#dc2626"/>}
        {can("refunds")&&<NavItem icon="ti-rotate-clockwise" label="Hoàn tiền"       toView="refunds"     badge={pendingRefunds}   badgeColor="#d97706"/>}
        {can("credits")&&<NavItem icon="ti-ticket"           label="Bảo lưu vé"      toView="credits"/>}
        {can("closeorders")&&<NavItem icon="ti-lock"             label="Đóng đơn"        toView="closeorders"/>}
        {can("banks")&&<NavItem icon="ti-building-bank"    label="Tài khoản NH"    toView="banks"/>}

        {/* ── PHÂN TÍCH & HỆ THỐNG ── */}
        {(can("reports")||can("users")||can("deploy"))&&<Sec label="Phân tích & Hệ thống"/>}
        {can("reports")&&<NavItem icon="ti-chart-bar"        label="Báo cáo"         toView="reports"/>}
        {can("users")&&<NavItem icon="ti-users-group"      label="Nhân sự"         toView="users"/>}
        {can("deploy")&&<NavItem icon="ti-settings"         label="Cấu hình"        toView="deploy"/>}
      </div>

      {/* User area */}
      <div style={{ padding:"12px 16px", borderTop:"1px solid #f1f5f9", display:"flex", alignItems:"center", gap:10, background:"#fafafa", flexShrink:0 }}>
        <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,${accent},${accent}aa)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#fff", flexShrink:0, boxShadow:`0 2px 8px ${accent}40` }}>
          {currentUser?.avatar || currentUser?.name?.[0] || "?"}
        </div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:13, fontWeight:700, color:"#0f172a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
            {currentUser?.name?.split("–").pop().trim() || currentUser?.name || "—"}
          </div>
          <div style={{fontSize:11, color:accent, fontWeight:600}}>{roleLabel}</div>
        </div>
      </div>
    </div>
  );
}

export function TopBar({ currentUser, currentRole, unreadCount, onNotif, onSearch, onProfile, onLogout, onMenuToggle }) {
  const role = ROLE_LABEL[currentRole] ?? { label: currentRole, color: "#94a3b8", bg: "rgba(148,163,184,.18)" };

  return (
    <header style={{
      height: "56px",
      background: "#0f172a",
      borderBottom: "1px solid rgba(255,255,255,.07)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      gap: "8px",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* Hamburger — chỉ hiện trên mobile */}
      <button onClick={onMenuToggle} className="mobile-menu-btn" style={{
        display: "none", alignItems: "center", justifyContent: "center",
        width: 36, height: 36, borderRadius: 9,
        background: "rgba(255,255,255,.08)", border: "none",
        color: "#fff", fontSize: 20, cursor: "pointer", flexShrink: 0,
      }}>☰</button>
      <div style={{ flex: 1 }}/>
      {/* Search */}
      <button
        onClick={onSearch}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,.07)",
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 8, padding: "5px 12px",
          cursor: "pointer", color: "rgba(255,255,255,.6)", fontSize: 12,
          transition: "background 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.13)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.07)"}
      >
        <span>🔍</span>
        <span>Tìm kiếm</span>
        <kbd style={{ fontSize: 10, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 4, padding: "1px 5px", color: "rgba(255,255,255,.45)" }}>
          Ctrl K
        </kbd>
      </button>

      {/* Notification bell */}
      <button
        onClick={onNotif}
        style={{
          position: "relative",
          background: "rgba(255,255,255,.07)",
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 8, padding: "6px 10px",
          cursor: "pointer", color: "#fff", fontSize: 16,
          display: "flex", alignItems: "center",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.13)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.07)"}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -5, right: -5,
            background: "#ef4444", color: "#fff",
            borderRadius: 10, fontSize: 10, fontWeight: 700,
            padding: "1px 5px", minWidth: 16, textAlign: "center",
            lineHeight: "15px",
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* User chip */}
      <div
        onClick={onProfile}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,.07)",
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 10, padding: "5px 12px",
          cursor: "pointer", transition: "background 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.13)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.07)"}
      >
        {/* Avatar */}
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: role.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: role.color,
          flexShrink: 0, overflow: "hidden",
          border: `1.5px solid ${role.color}55`,
        }}>
          {currentUser?.photoUrl
            ? <img src={currentUser.photoUrl} alt="av" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (currentUser?.avatar || currentUser?.name?.[0] || "?")}
        </div>

        <div style={{ lineHeight: 1.25 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {currentUser?.name?.split("–").pop().trim() ?? ""}
          </div>
          <div style={{ fontSize: 10, color: role.color, fontWeight: 600 }}>
            {role.label}
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "6px 12px",
          background: "rgba(239,68,68,.2)",
          border: "1px solid rgba(239,68,68,.4)",
          borderRadius: 8, color: "#fca5a5",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
          transition: "all 0.15s", whiteSpace: "nowrap",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,.45)"; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,.2)";  e.currentTarget.style.color = "#fca5a5"; }}
      >
        🚪 Đăng xuất
      </button>
    </header>
  );
}

// App shell: sidebar cố định trái + vùng content phải
export function AppShell({ sidebar, topbar, children, sidebarOpen, onCloseSidebar }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Overlay backdrop — mobile only */}
      {sidebarOpen && (
        <div onClick={onCloseSidebar} style={{
          display: "none",
          position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
          zIndex: 199,
        }} className="mobile-overlay"/>
      )}
      {sidebar}
      <div className="main-content" style={{
        flex: 1,
        marginLeft: 280,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#f1f5f9",
      }}>
        {topbar}
        <main style={{
          flex: 1,
          padding: "0",
          width: "100%",
          boxSizing: "border-box",
          minHeight: "calc(100vh - 56px)",
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
