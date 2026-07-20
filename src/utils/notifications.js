export const isNotifRead = (n) => !!n.read;

// targetUser (báo đúng 1 người) ưu tiên hơn targetRole (báo broadcast theo vai trò).
export const isNotifVisible = (n, currentUser, currentRole) =>
  n.targetUser ? n.targetUser === currentUser?.name
    : (!n.targetRole || n.targetRole === currentRole ||
       (n.targetRole === "manager" && currentRole === "pho_giam_doc"));
