// Main app shell: Sidebar + TopBar layout
// Toàn bộ màu sắc/kích thước dùng design tokens từ src/styles/theme.css

// ── Vai trò: MỘT nguồn sự thật duy nhất cho label + màu, dùng chung
//    giữa Sidebar (badge dưới avatar) và TopBar (chip góc phải) ──
export const ROLE_META = {
  manager:      { label: "Giám đốc",       color: "#fbbf24" },
  pho_giam_doc: { label: "Phó Giám đốc",   color: "#a78bfa" },
  accountant:   { label: "Kế toán trưởng", color: "#34d399" },
  cashier:      { label: "Kế toán quỹ",    color: "#22d3ee" },
  sale:         { label: "Sale",           color: "#60a5fa" },
  dieu_hanh:    { label: "Điều hành",      color: "#fb923c" },
};
const roleMeta = (role) => ROLE_META[role] ?? { label: role ?? "—", color: "#94a3b8" };

// ── Điều hướng: MỘT nguồn sự thật duy nhất — sidebar render trực tiếp
//    từ mảng này, không còn khai báo JSX rời rạc trôi lệch theo thời gian ──
const NAV_GROUPS = [
  {
    section: null,
    items: [
      { k: "dashboard", label: "Dashboard", icon: "ti-layout-dashboard", always: true },
      { k: "tasks",     label: "Công việc",  icon: "ti-checklist",       always: true },
    ],
  },
  {
    section: "Kinh doanh",
    items: [
      { k: "crm",       label: "Khách hàng",   icon: "ti-users",             perm: "crm" },
      { k: "quotes",    label: "Báo giá",      icon: "ti-file-description",  perm: "quotes",
        badge: ctx => ctx.currentRole === "sale" ? ctx.expiringQuotes : 0, badgeColor: "var(--c-warning-mid)" },
      { k: "ncc",       label: "Nhà cung cấp", icon: "ti-building",          perm: "ncc" },
      { k: "orders",    label: "Đơn hàng",     icon: "ti-file-text",         perm: "orders",
        badge: ctx => ctx.currentRole === "sale" ? ctx.activeOrders : 0, badgeColor: "var(--c-success-mid)" },
      { k: "tourghep",  label: "Tour ghép",    icon: "ti-package",           perm: "tourghep",
        extraGate: ctx => ["manager", "accountant", "dieu_hanh"].includes(ctx.currentRole) || ctx.currentUser?.canViewTourGhep === true },
      { k: "aftercare", label: "Chăm sóc KH",  icon: "ti-heart-handshake",   perm: "aftercare",
        badge: ctx => ctx.pendingCare, badgeColor: "var(--c-warning-mid)" },
    ],
  },
  {
    section: "Vận hành",
    items: [
      { k: "tourops", label: "Vận hành tour",  icon: "ti-map-route",   perm: "tourops" },
      { k: "hdv",     label: "Hướng dẫn viên", icon: "ti-user-check",  perm: "hdv" },
    ],
  },
  {
    section: "Tài chính",
    items: [
      { k: "finance",     label: "Kế toán",       icon: "ti-report-money",     perm: "finance",
        badge: ctx => ctx.currentRole === "cashier" ? ctx.pendingThu : 0, badgeColor: "var(--c-danger-mid)" },
      { k: "approvals",   label: "Phê duyệt",     icon: "ti-checks",           perm: "approvals",
        badge: ctx => ctx.pendingApprovals, badgeColor: "var(--c-danger-mid)" },
      { k: "closeorders", label: "Đóng đơn",      icon: "ti-lock",             perm: "closeorders" },
      { k: "refunds",     label: "Hoàn tiền",     icon: "ti-rotate-clockwise", perm: "refunds",
        badge: ctx => ctx.pendingRefunds, badgeColor: "var(--c-warning-mid)" },
      { k: "credits",     label: "Bảo lưu vé",    icon: "ti-ticket",           perm: "credits" },
      { k: "banks",       label: "Tài khoản NH",  icon: "ti-building-bank",    perm: "banks" },
    ],
  },
  {
    section: "Phân tích & Hệ thống",
    items: [
      { k: "reports", label: "Báo cáo",   icon: "ti-chart-bar",    perm: "reports" },
      { k: "users",   label: "Nhân sự",   icon: "ti-users-group",  perm: "users" },
      { k: "deploy",  label: "Cấu hình",  icon: "ti-settings",     perm: "deploy" },
    ],
  },
];

export function Sidebar({
  view, setView, currentRole, currentUser,
  pendingApprovals=0, pendingRefunds=0, pendingCare=0,
  pendingThu=0, pendingPay=0, activeOrders=0, expiringQuotes=0,
  isOpen=false, onClose, perms=[],
}) {
  const can = (k)=>perms.includes(k);
  const ctx = { currentRole, currentUser, pendingApprovals, pendingRefunds, pendingCare, pendingThu, pendingPay, activeOrders, expiringQuotes };
  const role = roleMeta(currentRole);
  const handleNav = (toView) => { setView(toView); onClose?.(); };

  const NavItem = ({ item }) => {
    if (item.extraGate && !item.extraGate(ctx)) return null;
    if (!item.always && !can(item.perm)) return null;
    const isActive = view === item.k || (item.k === "orders" && ["detail", "create"].includes(view));
    const badge = item.badge ? item.badge(ctx) : 0;
    return (
      <div
        onClick={() => handleNav(item.k)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 14px", margin: "1px 10px", borderRadius: "var(--r-sm)",
          cursor: "pointer", fontSize: "var(--text-md)", fontWeight: isActive ? 700 : 500,
          background: isActive ? "var(--c-sidebar-activebg)" : "transparent",
          color: isActive ? "var(--c-sidebar-activetext)" : "var(--c-sidebar-text)",
          borderLeft: `2.5px solid ${isActive ? "var(--c-sidebar-active)" : "transparent"}`,
          transition: "background var(--t-fast), color var(--t-fast)",
        }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "var(--c-sidebar-hover)"; e.currentTarget.style.color = "var(--c-sidebar-text-hover)"; } }}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--c-sidebar-text)"; } }}
      >
        <i className={`ti ${item.icon}`} style={{ fontSize: 18, width: 20, textAlign: "center", flexShrink: 0, color: isActive ? "var(--c-sidebar-active)" : "inherit", opacity: isActive ? 1 : 0.85 }} />
        <span style={{ flex: 1, letterSpacing: "var(--ls-base)" }}>{item.label}</span>
        {badge > 0 && (
          <span style={{
            background: item.badgeColor ?? "var(--c-danger-mid)", color: "#fff",
            borderRadius: "var(--r-pill)", fontSize: 10, fontWeight: 700,
            padding: "2px 7px", minWidth: 18, textAlign: "center", lineHeight: 1.4,
          }}>
            {badge}
          </span>
        )}
      </div>
    );
  };

  const Sec = ({ label }) => (
    <div style={{
      fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
      color: "var(--c-sidebar-text)", opacity: 0.55, padding: "16px 20px 6px",
    }}>
      {label}
    </div>
  );

  return (
    <div
      className={`sidebar-root${isOpen ? " sidebar-open" : ""}`}
      style={{
        width: "var(--sidebar-w)", background: "var(--c-sidebar-bg)",
        display: "flex", flexDirection: "column", height: "100vh",
        position: "fixed", left: 0, top: 0, zIndex: "var(--z-sidebar)",
        borderRight: "1px solid var(--c-sidebar-border)",
        overflow: "hidden", transition: "transform .25s ease",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid var(--c-sidebar-border)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "var(--r-md)",
          background: "linear-gradient(135deg, var(--c-primary-mid), var(--c-accent))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0, boxShadow: "0 4px 14px rgba(37,99,235,.35)",
        }}>
          ✈️
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: ".4px" }}>MINH VIỆT</div>
          <div style={{ fontSize: 10, color: "var(--c-sidebar-text)", fontWeight: 500, marginTop: 1, letterSpacing: ".3px" }}>Travel ERP</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {NAV_GROUPS.map((group, gi) => {
          const visible = group.items.some(it => it.always || can(it.perm));
          if (!visible) return null;
          return (
            <div key={gi}>
              {group.section && <Sec label={group.section} />}
              {group.items.map(item => <NavItem key={item.k} item={item} />)}
            </div>
          );
        })}
      </nav>

      {/* User area */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid var(--c-sidebar-border)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,.08)", border: `1.5px solid ${role.color}66`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: role.color, flexShrink: 0, overflow: "hidden",
        }}>
          {currentUser?.photoUrl
            ? <img src={currentUser.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (currentUser?.avatar || currentUser?.name?.[0] || "?")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {currentUser?.name?.split("–").pop().trim() || currentUser?.name || "—"}
          </div>
          <div style={{ fontSize: 11, color: role.color, fontWeight: 600, marginTop: 1 }}>{role.label}</div>
        </div>
      </div>
    </div>
  );
}

export function TopBar({ currentUser, currentRole, unreadCount, onNotif, onSearch, onProfile, onLogout, onMenuToggle }) {
  const role = roleMeta(currentRole);

  const ChromeBtn = ({ children, onClick, style = {}, ...p }) => (
    <button
      onClick={onClick}
      {...p}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "rgba(255,255,255,.06)",
        border: "1px solid rgba(255,255,255,.10)",
        borderRadius: "var(--r-sm)", padding: "7px 12px",
        cursor: "pointer", color: "rgba(255,255,255,.72)", fontSize: "var(--text-sm)",
        transition: "background var(--t-fast)",
        ...style,
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.13)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.06)"}
    >
      {children}
    </button>
  );

  return (
    <header style={{
      height: "var(--topbar-h)", background: "var(--c-sidebar-bg)",
      borderBottom: "1px solid var(--c-sidebar-border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 var(--sp-4)", gap: "var(--sp-2)", flexShrink: 0,
      position: "sticky", top: 0, zIndex: "var(--z-topbar)",
    }}>
      {/* Hamburger — chỉ hiện trên mobile */}
      <button onClick={onMenuToggle} className="mobile-menu-btn" style={{
        display: "none", alignItems: "center", justifyContent: "center",
        width: 36, height: 36, borderRadius: "var(--r-sm)",
        background: "rgba(255,255,255,.08)", border: "none",
        color: "#fff", fontSize: 20, cursor: "pointer", flexShrink: 0,
      }}>☰</button>
      <div style={{ flex: 1 }} />

      <ChromeBtn onClick={onSearch}>
        <i className="ti ti-search" style={{ fontSize: 14 }} />
        <span className="topbar-search-label">Tìm kiếm</span>
        <kbd style={{ fontSize: 10, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 4, padding: "1px 5px", color: "rgba(255,255,255,.45)" }}>
          Ctrl K
        </kbd>
      </ChromeBtn>

      <ChromeBtn onClick={onNotif} style={{ position: "relative", padding: "7px 10px" }}>
        <i className="ti ti-bell" style={{ fontSize: 16 }} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -5, right: -5,
            background: "var(--c-danger-mid)", color: "#fff",
            borderRadius: "var(--r-pill)", fontSize: 10, fontWeight: 700,
            padding: "1px 5px", minWidth: 16, textAlign: "center", lineHeight: "15px",
          }}>
            {unreadCount}
          </span>
        )}
      </ChromeBtn>

      <div
        onClick={onProfile}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.10)",
          borderRadius: "var(--r-md)", padding: "5px 12px 5px 5px",
          cursor: "pointer", transition: "background var(--t-fast)",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.13)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.06)"}
      >
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(255,255,255,.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: role.color,
          flexShrink: 0, overflow: "hidden", border: `1.5px solid ${role.color}66`,
        }}>
          {currentUser?.photoUrl
            ? <img src={currentUser.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (currentUser?.avatar || currentUser?.name?.[0] || "?")}
        </div>
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {currentUser?.name?.split("–").pop().trim() ?? ""}
          </div>
          <div style={{ fontSize: 10, color: role.color, fontWeight: 600 }}>{role.label}</div>
        </div>
      </div>

      <ChromeBtn
        onClick={onLogout}
        style={{
          background: "rgba(239,68,68,.14)", border: "1px solid rgba(239,68,68,.3)",
          color: "#fca5a5", fontWeight: 600,
        }}
      >
        <i className="ti ti-logout" style={{ fontSize: 14 }} />
        <span>Đăng xuất</span>
      </ChromeBtn>
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
          zIndex: "var(--z-sidebar)",
        }} className="mobile-overlay" />
      )}
      {sidebar}
      <div className="main-content" style={{
        flex: 1, marginLeft: "var(--sidebar-w)",
        display: "flex", flexDirection: "column", minHeight: "100vh",
        background: "var(--c-bg-alt)",
      }}>
        {topbar}
        <main style={{ flex: 1, width: "100%", boxSizing: "border-box", minHeight: "calc(100vh - var(--topbar-h))" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
