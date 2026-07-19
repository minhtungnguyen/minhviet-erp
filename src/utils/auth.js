// auth.js — Session management utilities
// Phase 4 sẽ thay bằng Supabase Auth

const SESSION_KEY   = "mv_erp_session";
const ACTIVITY_KEY  = "mv_erp_last_active";
const TIMEOUT_MS    = 30 * 60 * 1000; // 30 phút

// Fields được lưu vào session (KHÔNG lưu password)
const SAFE_FIELDS = ["id","username","name","role","avatar","dept","jobTitle","email","phone","photoUrl"];

export function saveSession(user) {
  const safe = {};
  SAFE_FIELDS.forEach(k => { if (user[k] !== undefined) safe[k] = user[k]; });
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(safe));
  touchActivity();
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (!user?.id || !user?.role) return null;
    // Kiểm tra timeout
    const lastActive = parseInt(sessionStorage.getItem(ACTIVITY_KEY) || "0");
    if (Date.now() - lastActive > TIMEOUT_MS) {
      clearSession();
      return null;
    }
    touchActivity();
    return user;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(ACTIVITY_KEY);
}

export function touchActivity() {
  sessionStorage.setItem(ACTIVITY_KEY, String(Date.now()));
}

// Hook: tự đăng xuất sau TIMEOUT_MS không hoạt động
export function useSessionTimeout(onTimeout, enabled = true) {
  // Import được gọi từ App.jsx nên useEffect cần import từ react
  // Trả về handler để App.jsx tự gắn vào window events
  return {
    resetTimer: touchActivity,
    TIMEOUT_MS,
  };
}
