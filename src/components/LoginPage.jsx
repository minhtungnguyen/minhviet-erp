import { useState } from "react";
import { Alert, Spinner } from "./ui";

// Tài khoản thử — xóa trước khi go-live
const DEMO_ACCOUNTS = [
  { u: "hoa.sale",  p: "mv2025",   role: "Sale",     color: "#2563eb", bg: "#eff6ff" },
  { u: "lien.kt",   p: "mv2025",   role: "Kế toán",  color: "#1d6b4f", bg: "#e8f5ef" },
  { u: "tung.gd",   p: "mv@admin", role: "Giám đốc", color: "#7a5a00", bg: "#fef9e7" },
  { u: "van.dh",    p: "mv2025",   role: "Điều hành",color: "#5c2eb0", bg: "#f3f0ff" },
];

export default function LoginPage({ onLogin, userAccounts = [] }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setLoading(true);
    setError("");
    setTimeout(() => {
      const user = userAccounts.find(
        u => u.username === username.trim().toLowerCase() && u.password === password
      );
      if (user) {
        if (user.active === false) {
          setError("Tài khoản đã bị khóa. Liên hệ Giám đốc để mở lại.");
          setLoading(false);
          return;
        }
        onLogin(user);
      } else {
        setError("Tên đăng nhập hoặc mật khẩu không đúng");
        setLoading(false);
      }
    }, 600);
  };

  const inputStyle = (focused) => ({
    width: "100%",
    padding: "11px 14px",
    border: `1.5px solid ${focused ? "#3b82f6" : "#e2e8f0"}`,
    borderRadius: 10,
    fontSize: 14,
    background: "#f8fafc",
    outline: "none",
    color: "#1e293b",
    boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxShadow: focused ? "0 0 0 3px rgba(59,130,246,.15)" : "none",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0f172a 0%, #1e3a8a 45%, #1d4ed8 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      fontFamily: "var(--font-sans, 'Be Vietnam Pro', -apple-system, sans-serif)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative blobs */}
      <div style={{ position: "absolute", top: "-15%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "rgba(37,99,235,.12)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-10%", left: "-8%",  width: 380, height: 380, borderRadius: "50%", background: "rgba(255,255,255,.05)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "38%",  left: "12%",  width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.03)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src="/LogoMV.png" alt="Minh Việt Travel" style={{ width: 176, height: "auto", marginBottom: 10 }} />
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", letterSpacing: 2, textTransform: "uppercase" }}>
            Hệ thống Quản lý ERP nội bộ
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: "#fff",
          borderRadius: 20,
          padding: "32px 36px",
          boxShadow: "0 32px 80px rgba(0,0,0,.4)",
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>Đăng nhập</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Tài khoản được cấp bởi Minh Việt Travel</div>
          </div>

          {error && (
            <div style={{ marginBottom: 16 }}>
              <Alert type="danger">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
                Tên đăng nhập
              </label>
              <FocusInput
                value={username}
                onChange={e => { setUsername(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="VD: hoa.sale"
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
                Mật khẩu
              </label>
              <div style={{ position: "relative" }}>
                <FocusInput
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  extraStyle={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "#94a3b8", lineHeight: 1, padding: 2 }}
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "13px",
                background: loading ? "#e2e8f0" : "linear-gradient(135deg, #1e3a8a, #2563eb)",
                color: loading ? "#94a3b8" : "#fff",
                border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: loading ? "none" : "0 4px 20px rgba(37,99,235,.4)",
                transition: "all 0.2s",
              }}
            >
              {loading ? <><Spinner size={16} color="#94a3b8" /> Đang đăng nhập...</> : "Đăng nhập →"}
            </button>
          </form>

          {/* Demo accounts */}
          <div style={{ marginTop: 24, padding: "14px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
              Tài khoản thử nghiệm
            </div>
            {DEMO_ACCOUNTS.map(a => (
              <div
                key={a.u}
                onClick={() => { setUsername(a.u); setPassword(a.p); setError(""); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "6px 8px", borderRadius: 8, cursor: "pointer",
                  marginBottom: 2, transition: "background 0.1s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontSize: 12, color: "#475569", fontFamily: "monospace", fontWeight: 500 }}>{a.u}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 9px",
                  borderRadius: 20, background: a.bg, color: a.color,
                }}>
                  {a.role}
                </span>
              </div>
            ))}
            <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 6 }}>
              Click để điền nhanh · Xóa khối này trước khi go-live
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "rgba(255,255,255,.3)" }}>
          © 2025 Minh Việt Travel · ERP nội bộ v1.0
        </div>
      </div>
    </div>
  );
}

// Input con có focus state nội bộ
function FocusInput({ extraStyle = {}, ...p }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...p}
      onFocus={e => { setFocused(true); p.onFocus?.(e); }}
      onBlur={e  => { setFocused(false); p.onBlur?.(e); }}
      style={{
        width: "100%", padding: "11px 14px",
        border: `1.5px solid ${focused ? "#3b82f6" : "#e2e8f0"}`,
        borderRadius: 10, fontSize: 14,
        background: "#f8fafc", outline: "none", color: "#1e293b",
        boxSizing: "border-box",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: focused ? "0 0 0 3px rgba(59,130,246,.14)" : "none",
        ...extraStyle,
      }}
    />
  );
}
