// Shared UI atoms — tất cả dùng CSS vars từ theme.css
// Import: import { Btn, Inp, Card, ... } from "../components/ui"

/* ──────────────────────────────────────────────────────────
   BADGE — status chip với dot
   cfg: object keyed by status value, each: {label,color,bg,dot?}
   ────────────────────────────────────────────────────────── */
export const SBadge = ({ status, cfg, size = "md" }) => {
  const c = cfg?.[status] ?? { label: status, color: "#64748b", bg: "#f1f5f9" };
  const pad = size === "sm" ? "2px 8px" : "4px 12px";
  const fs  = size === "sm" ? "var(--text-xs)" : "var(--text-sm)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: c.bg, color: c.color,
      border: `1px solid ${c.dot ?? c.color}33`,
      borderRadius: "var(--r-pill)",
      fontSize: fs, fontWeight: 600,
      padding: pad, whiteSpace: "nowrap",
      letterSpacing: "0.2px",
    }}>
      {"dot" in c && c.dot && (
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      )}
      {c.label}
    </span>
  );
};

/* ──────────────────────────────────────────────────────────
   TOAST
   ────────────────────────────────────────────────────────── */
const TOAST_CFG = {
  success: { bg: "var(--c-success-bg)",  border: "var(--c-success-border)", text: "var(--c-success)",  icon: "✓" },
  error:   { bg: "var(--c-danger-bg)",   border: "var(--c-danger-border)",  text: "var(--c-danger)",   icon: "✕" },
  warning: { bg: "var(--c-warning-bg)",  border: "var(--c-warning-border)", text: "var(--c-warning)",  icon: "⚠" },
  info:    { bg: "var(--c-primary-light)",border:"var(--c-primary-pale)",   text: "var(--c-primary)",  icon: "ℹ" },
};
export const Toast = ({ msg, type = "info" }) => {
  const c = TOAST_CFG[type] ?? TOAST_CFG.info;
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: "var(--r-md)", padding: "10px 16px",
      display: "flex", alignItems: "center", gap: 10,
      minWidth: 280, boxShadow: "var(--sh-md)",
      animation: "slideUp var(--t-base) both",
    }}>
      <span style={{ fontSize: 14, color: c.text, fontWeight: 700, lineHeight: 1 }}>{c.icon}</span>
      <span style={{ fontSize: "var(--text-base)", color: c.text, lineHeight: 1.4 }}>{msg}</span>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   CARD
   ────────────────────────────────────────────────────────── */
export const Card = ({ children, style = {}, className = "" }) => (
  <div
    className={className}
    style={{
      background: "var(--c-surface)",
      borderRadius: "var(--r-lg)",
      border: "1px solid var(--c-border)",
      padding: "var(--sp-5)",
      boxShadow: "var(--sh-xs)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, action, icon }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--sp-4)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      <div>
        <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--c-text)" }}>{title}</div>
        {subtitle && <div style={{ fontSize: "var(--text-xs)", color: "var(--c-text-muted)", marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

/* ──────────────────────────────────────────────────────────
   ROW — key/value row trong card
   ────────────────────────────────────────────────────────── */
export const Row = ({ label, value, hi, danger, mono }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "7px 0",
    borderBottom: "1px solid var(--c-border)",
    fontSize: "var(--text-base)",
  }}>
    <span style={{ color: "var(--c-text-muted)", fontSize: "var(--text-sm)" }}>{label}</span>
    <span style={{
      fontWeight: hi ? 700 : 500,
      color: danger ? "var(--c-danger)" : hi ? "var(--c-primary-mid)" : "var(--c-text)",
      fontVariantNumeric: "tabular-nums",
      fontFamily: mono ? "var(--font-mono)" : undefined,
    }}>
      {value}
    </span>
  </div>
);

/* ──────────────────────────────────────────────────────────
   INP — text input
   ────────────────────────────────────────────────────────── */
export const Inp = ({ err, style = {}, ...p }) => (
  <input
    {...p}
    style={{
      width: "100%",
      padding: "9px 12px",
      border: `1.5px solid ${err ? "var(--c-danger-border)" : "var(--c-border-mid)"}`,
      borderRadius: "var(--r-sm)",
      fontSize: "var(--text-base)",
      background: "var(--c-surface)",
      color: "var(--c-text)",
      outline: "none",
      transition: "border-color var(--t-fast), box-shadow var(--t-fast)",
      boxSizing: "border-box",
      ...style,
    }}
    onFocus={e => {
      e.target.style.borderColor = "var(--c-primary-mid)";
      e.target.style.boxShadow   = "0 0 0 3px rgba(37,99,235,.15)";
      p.onFocus?.(e);
    }}
    onBlur={e => {
      e.target.style.borderColor = err ? "var(--c-danger-border)" : "var(--c-border-mid)";
      e.target.style.boxShadow   = "none";
      p.onBlur?.(e);
    }}
  />
);

/* ──────────────────────────────────────────────────────────
   SEL — select dropdown
   ────────────────────────────────────────────────────────── */
export const Sel = ({ children, style = {}, ...p }) => (
  <select
    {...p}
    style={{
      width: "100%",
      padding: "9px 12px",
      border: "1.5px solid var(--c-border-mid)",
      borderRadius: "var(--r-sm)",
      fontSize: "var(--text-base)",
      background: "var(--c-surface)",
      color: "var(--c-text)",
      cursor: "pointer",
      outline: "none",
      transition: "border-color var(--t-fast)",
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 12px center",
      paddingRight: 34,
      boxSizing: "border-box",
      ...style,
    }}
    onFocus={e => { e.target.style.borderColor = "var(--c-primary-mid)"; }}
    onBlur={e  => { e.target.style.borderColor = "var(--c-border-mid)"; }}
  >
    {children}
  </select>
);

/* ──────────────────────────────────────────────────────────
   BTN — button variants
   ────────────────────────────────────────────────────────── */
const BTN_VARIANTS = {
  primary: {
    background: "linear-gradient(135deg, var(--c-primary), var(--c-primary-dark))",
    color: "#fff", border: "none",
    boxShadow: "0 1px 4px rgba(30,58,138,.35)",
  },
  secondary: {
    background: "var(--c-surface)", color: "var(--c-text-2)",
    border: "1.5px solid var(--c-border-mid)",
  },
  danger: {
    background: "var(--c-danger-bg)", color: "var(--c-danger)",
    border: "1.5px solid var(--c-danger-border)",
  },
  success: {
    background: "var(--c-success-bg)", color: "var(--c-success)",
    border: "1.5px solid var(--c-success-border)",
  },
  ghost: {
    background: "transparent", color: "var(--c-text-2)",
    border: "none",
  },
  warning: {
    background: "var(--c-warning-bg)", color: "var(--c-warning)",
    border: "1.5px solid var(--c-warning-border)",
  },
};

const BTN_SIZE = {
  xs: { padding: "4px 10px", fontSize: "var(--text-xs)" },
  sm: { padding: "6px 14px", fontSize: "var(--text-sm)" },
  md: { padding: "8px 18px", fontSize: "var(--text-base)" },
  lg: { padding: "11px 24px", fontSize: "var(--text-md)" },
};

export const Btn = ({ children, variant = "primary", size = "md", style = {}, ...p }) => {
  const v = BTN_VARIANTS[variant] ?? BTN_VARIANTS.secondary;
  const s = BTN_SIZE[size] ?? BTN_SIZE.md;
  return (
    <button
      {...p}
      style={{
        display: "inline-flex", alignItems: "center", gap: "var(--sp-2)",
        borderRadius: "var(--r-sm)",
        fontWeight: 600, cursor: "pointer",
        transition: "opacity var(--t-fast), transform var(--t-fast), box-shadow var(--t-fast)",
        whiteSpace: "nowrap",
        ...v, ...s,
        ...(p.disabled ? { opacity: 0.45, cursor: "not-allowed", pointerEvents: "none" } : {}),
        ...style,
      }}
      onMouseEnter={e => { if (!p.disabled) { e.currentTarget.style.opacity = ".87"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = ""; }}
    >
      {children}
    </button>
  );
};

/* ──────────────────────────────────────────────────────────
   FIELD WRAP — form field container with label + error
   ────────────────────────────────────────────────────────── */
export const FieldWrap = ({ label, req, err, hint, children }) => (
  <div style={{ marginBottom: "var(--sp-4)" }}>
    {label && (
      <label style={{
        display: "block", fontSize: "var(--text-xs)", fontWeight: 700,
        color: err ? "var(--c-danger)" : "var(--c-text-2)",
        marginBottom: "var(--sp-1)", textTransform: "uppercase", letterSpacing: "0.5px",
      }}>
        {label}
        {req && <span style={{ color: "var(--c-danger)", marginLeft: 2 }}>*</span>}
      </label>
    )}
    {children}
    {hint && !err && (
      <div style={{ fontSize: "var(--text-xs)", color: "var(--c-text-muted)", marginTop: 4 }}>{hint}</div>
    )}
    {err && (
      <div style={{ fontSize: "var(--text-xs)", color: "var(--c-danger)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
        <span>⚠</span> {err}
      </div>
    )}
  </div>
);

/* ──────────────────────────────────────────────────────────
   PROG BAR — progress bar
   ────────────────────────────────────────────────────────── */
export const ProgBar = ({ value, color, label, showPct = false }) => (
  <div>
    {label && (
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--c-text-muted)" }}>{label}</span>
        {showPct && <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: color ?? "var(--c-primary-mid)" }}>{value}%</span>}
      </div>
    )}
    <div style={{ height: 7, background: "var(--c-primary-pale)", borderRadius: "var(--r-pill)", overflow: "hidden" }}>
      <div style={{
        width: `${Math.min(100, value)}%`, height: "100%",
        background: color ?? "var(--c-primary-mid)",
        borderRadius: "var(--r-pill)",
        transition: "width 0.5s ease",
      }} />
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────
   DIVIDER — section divider with optional label
   ────────────────────────────────────────────────────────── */
export const Divider = ({ label, style = {} }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", margin: "var(--sp-4) 0", ...style }}>
    <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
    {label && (
      <span style={{ fontSize: "var(--text-xs)", color: "var(--c-text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", whiteSpace: "nowrap" }}>
        {label}
      </span>
    )}
    <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
  </div>
);

/* ──────────────────────────────────────────────────────────
   MODAL — overlay + dialog
   ────────────────────────────────────────────────────────── */
export const Modal = ({ open, onClose, title, children, width = 560, footer }) => {
  if (!open) return null;
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,.55)",
        backdropFilter: "blur(2px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "var(--sp-4)",
        animation: "fadeIn 150ms both",
      }}
    >
      <div
        style={{
          background: "var(--c-surface)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--sh-modal)",
          width: "100%", maxWidth: width,
          maxHeight: "92vh",
          display: "flex", flexDirection: "column",
          animation: "scaleIn var(--t-slow) both",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "var(--sp-4) var(--sp-5)",
          borderBottom: "1px solid var(--c-border)",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--c-text)" }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              background: "var(--c-surface-2)", border: "none", borderRadius: "var(--r-sm)",
              width: 28, height: 28, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: "var(--c-text-muted)",
              transition: "background var(--t-fast)",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--c-danger-bg)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--c-surface-2)"}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "var(--sp-5)", overflowY: "auto", flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: "var(--sp-4) var(--sp-5)",
            borderTop: "1px solid var(--c-border)",
            display: "flex", justifyContent: "flex-end", gap: "var(--sp-2)",
            flexShrink: 0, background: "var(--c-surface-2)",
            borderRadius: "0 0 var(--r-lg) var(--r-lg)",
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   STAT CARD — dashboard metric card
   ────────────────────────────────────────────────────────── */
export const StatCard = ({ label, value, sub, icon, color = "var(--c-primary)", trend, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: "var(--c-surface)",
      borderRadius: "var(--r-lg)",
      border: "1px solid var(--c-border)",
      padding: "var(--sp-4) var(--sp-5)",
      boxShadow: "var(--sh-xs)",
      cursor: onClick ? "pointer" : undefined,
      transition: "box-shadow var(--t-base), transform var(--t-base)",
      display: "flex", flexDirection: "column", gap: "var(--sp-2)",
    }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = "var(--sh-md)"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--sh-xs)"; e.currentTarget.style.transform = ""; }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--c-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
        {label}
      </span>
      {icon && (
        <span style={{
          fontSize: 18, background: `${color}18`,
          width: 36, height: 36, borderRadius: "var(--r-md)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </span>
      )}
    </div>
    <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>
      {value}
    </div>
    {(sub || trend !== undefined) && (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {sub && <span style={{ fontSize: "var(--text-xs)", color: "var(--c-text-muted)" }}>{sub}</span>}
        {trend !== undefined && (
          <span style={{
            fontSize: "var(--text-xs)", fontWeight: 700,
            color: trend >= 0 ? "var(--c-success)" : "var(--c-danger)",
          }}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
    )}
  </div>
);

/* ──────────────────────────────────────────────────────────
   TABLE — styled data table
   ────────────────────────────────────────────────────────── */
export const Table = ({ cols, rows, onRowClick, emptyMsg = "Không có dữ liệu", stickyHeader = false }) => (
  <div style={{ overflowX: "auto", borderRadius: "var(--r-md)", border: "1px solid var(--c-border)" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
      <thead>
        <tr>
          {cols.map(c => (
            <th
              key={c.key}
              style={{
                position: stickyHeader ? "sticky" : undefined,
                top: stickyHeader ? 0 : undefined,
                background: "var(--c-surface-2)",
                color: "var(--c-text-2)",
                fontWeight: 700,
                fontSize: "var(--text-xs)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                padding: "10px 14px",
                textAlign: c.align ?? "left",
                borderBottom: "1px solid var(--c-border)",
                whiteSpace: "nowrap",
                zIndex: stickyHeader ? 1 : undefined,
              }}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={cols.length} style={{ textAlign: "center", padding: "32px 16px", color: "var(--c-text-muted)" }}>
              {emptyMsg}
            </td>
          </tr>
        ) : rows.map((row, i) => (
          <tr
            key={row.id ?? i}
            onClick={() => onRowClick?.(row)}
            style={{
              cursor: onRowClick ? "pointer" : undefined,
              background: i % 2 === 0 ? "var(--c-surface)" : "var(--c-bg)",
              transition: "background var(--t-fast)",
            }}
            onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = "var(--c-primary-light)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? "var(--c-surface)" : "var(--c-bg)"; }}
          >
            {cols.map(c => (
              <td
                key={c.key}
                style={{
                  padding: "9px 14px",
                  borderBottom: "1px solid var(--c-border)",
                  textAlign: c.align ?? "left",
                  color: "var(--c-text)",
                  fontVariantNumeric: c.numeric ? "tabular-nums" : undefined,
                  whiteSpace: c.nowrap ? "nowrap" : undefined,
                }}
              >
                {c.render ? c.render(row) : row[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ──────────────────────────────────────────────────────────
   SEARCH INPUT — input với icon kính lúp
   ────────────────────────────────────────────────────────── */
export const SearchInp = ({ value, onChange, placeholder = "Tìm kiếm...", style = {} }) => (
  <div style={{ position: "relative", ...style }}>
    <span style={{
      position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
      color: "var(--c-text-muted)", fontSize: 14, pointerEvents: "none",
    }}>🔍</span>
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "8px 12px 8px 32px",
        border: "1.5px solid var(--c-border-mid)",
        borderRadius: "var(--r-pill)",
        fontSize: "var(--text-sm)", background: "var(--c-surface)",
        color: "var(--c-text)", outline: "none",
        transition: "border-color var(--t-fast), box-shadow var(--t-fast)",
        boxSizing: "border-box",
      }}
      onFocus={e => { e.target.style.borderColor = "var(--c-primary-mid)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,.12)"; }}
      onBlur={e  => { e.target.style.borderColor = "var(--c-border-mid)"; e.target.style.boxShadow = "none"; }}
    />
  </div>
);

/* ──────────────────────────────────────────────────────────
   EMPTY STATE
   ────────────────────────────────────────────────────────── */
export const EmptyState = ({ icon = "📭", title, desc, action }) => (
  <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--c-text-muted)" }}>
    <div style={{ fontSize: 40, marginBottom: "var(--sp-3)" }}>{icon}</div>
    <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--c-text-2)", marginBottom: "var(--sp-2)" }}>{title}</div>
    {desc && <div style={{ fontSize: "var(--text-sm)", marginBottom: "var(--sp-4)" }}>{desc}</div>}
    {action}
  </div>
);

/* ──────────────────────────────────────────────────────────
   LOADING SPINNER
   ────────────────────────────────────────────────────────── */
export const Spinner = ({ size = 20, color = "var(--c-primary-mid)" }) => (
  <span style={{
    display: "inline-block",
    width: size, height: size,
    border: `2px solid ${color}33`,
    borderTop: `2px solid ${color}`,
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    flexShrink: 0,
  }} />
);

/* ──────────────────────────────────────────────────────────
   TAB BAR
   ────────────────────────────────────────────────────────── */
export const TabBar = ({ tabs, active, onChange, style = {} }) => (
  <div style={{
    display: "flex", gap: 2,
    background: "var(--c-surface-2)",
    borderRadius: "var(--r-md)",
    padding: 4,
    ...style,
  }}>
    {tabs.map(t => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        style={{
          flex: 1, border: "none", borderRadius: "var(--r-sm)",
          padding: "6px 14px", fontSize: "var(--text-sm)", fontWeight: 600,
          cursor: "pointer", transition: "background var(--t-fast), color var(--t-fast), box-shadow var(--t-fast)",
          background: active === t.id ? "var(--c-surface)" : "transparent",
          color: active === t.id ? "var(--c-primary)" : "var(--c-text-muted)",
          boxShadow: active === t.id ? "var(--sh-xs)" : "none",
        }}
      >
        {t.icon && <span style={{ marginRight: 4 }}>{t.icon}</span>}
        {t.label}
        {t.count != null && (
          <span style={{
            marginLeft: 6, background: active === t.id ? "var(--c-primary-pale)" : "var(--c-border)",
            color: active === t.id ? "var(--c-primary)" : "var(--c-text-muted)",
            borderRadius: "var(--r-pill)", padding: "1px 7px", fontSize: "var(--text-xs)", fontWeight: 700,
          }}>
            {t.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

/* ──────────────────────────────────────────────────────────
   PAGE HEADER — title bar for each module view
   ────────────────────────────────────────────────────────── */
export const PageHeader = ({ title, subtitle, actions, back, onBack, badge }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: "var(--sp-6)",
    paddingBottom: "var(--sp-5)",
    borderBottom: "1px solid var(--c-border)",
  }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--sp-3)" }}>
      {back && (
        <button
          onClick={onBack}
          style={{
            background: "var(--c-surface-2)", border: "1px solid var(--c-border)",
            borderRadius: "var(--r-sm)", padding: "6px 10px",
            fontSize: 13, cursor: "pointer", color: "var(--c-text-3)",
            display: "flex", alignItems: "center", gap: 4,
            transition: "background var(--t-fast)",
            flexShrink: 0, marginTop: 2,
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--c-surface-3)"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--c-surface-2)"}
        >
          ← {back}
        </button>
      )}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <h1 style={{
            fontSize: "var(--text-2xl)", fontWeight: "var(--fw-bold)",
            color: "var(--c-text)", margin: 0, lineHeight: 1.2,
          }}>
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p style={{
            fontSize: "var(--text-sm)", color: "var(--c-text-muted)",
            margin: "4px 0 0", lineHeight: "var(--lh-base)",
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {actions && (
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexShrink: 0, paddingTop: 2 }}>
        {actions}
      </div>
    )}
  </div>
);

/* ──────────────────────────────────────────────────────────
   SECTION HEADER — smaller heading within a page
   ────────────────────────────────────────────────────────── */
export const SectionHeader = ({ title, action, style = {} }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: "var(--sp-3)", ...style,
  }}>
    <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--fw-semi)", color: "var(--c-text)" }}>{title}</div>
    {action && <div>{action}</div>}
  </div>
);

/* ──────────────────────────────────────────────────────────
   ALERT BOX — info / warning / danger banner
   ────────────────────────────────────────────────────────── */
export const Alert = ({ type = "info", children, style = {}, ...rest }) => {
  const cfg = {
    info:    { bg: "var(--c-primary-light)",  border: "var(--c-primary-pale)",   color: "var(--c-primary)",  icon: "ℹ" },
    warning: { bg: "var(--c-warning-bg)",      border: "var(--c-warning-border)", color: "var(--c-warning)",  icon: "⚠" },
    danger:  { bg: "var(--c-danger-bg)",       border: "var(--c-danger-border)",  color: "var(--c-danger)",   icon: "✕" },
    success: { bg: "var(--c-success-bg)",      border: "var(--c-success-border)", color: "var(--c-success)",  icon: "✓" },
  }[type];
  return (
    <div
      {...rest}
      style={{
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        borderRadius: "var(--r-md)", padding: "10px 14px",
        display: "flex", gap: "var(--sp-2)", alignItems: "flex-start",
        fontSize: "var(--text-sm)", color: cfg.color,
        lineHeight: 1.5,
        cursor: rest.onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      <span style={{ fontWeight: 700, flexShrink: 0 }}>{cfg.icon}</span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
};
