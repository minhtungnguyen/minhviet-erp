import { isBanGiamDoc } from "./permissions.js";

// Quyền quản lý công việc: đúng người tạo (đã giao việc) hoặc Ban Giám đốc
// (giải quyết tình huống người nhận vắng/nghỉ — BGĐ vẫn cần duyệt/trả lại/giao lại).
export const canManageTask = (task, currentUser, currentRole) =>
  task?.createdBy === currentUser?.name || isBanGiamDoc(currentRole);

export const isTaskAssignee = (task, currentUser) =>
  !!task?.assignee && task.assignee === currentUser?.name;

export const isSelfAssignedTask = (task) =>
  !!task?.assignee && task.assignee === task.createdBy;
