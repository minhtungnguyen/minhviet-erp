// Modal backdrop chỉ nên đóng khi CẢ mousedown lẫn click đều rơi đúng vào chính lớp phủ.
// Bug thật gặp trên mobile: kéo/vuốt chọn text hoặc cuộn bên trong form, nhưng điểm nhả
// tay (mouseup/touchend) trượt ra ngoài rìa panel — landing đúng trên backdrop — khiến
// click event bắn ra với target = backdrop, tự đóng modal giữa lúc đang nhập liệu.
// Lưu cờ "mousedown có bắt đầu từ backdrop không" trực tiếp trên chính DOM node (dataset)
// thay vì dùng useRef/useState, để dùng được ở cả nơi không phải React component (hàm gọi
// trực tiếp như TaskForm() trong TaskModule) mà không vi phạm Rules of Hooks.
export function overlayCloseHandlers(onClose) {
  return {
    onMouseDown: (e) => {
      e.currentTarget.dataset.overlayMouseDown = e.target === e.currentTarget ? "1" : "0";
    },
    onClick: (e) => {
      const startedOnOverlay = e.currentTarget.dataset.overlayMouseDown === "1";
      e.currentTarget.dataset.overlayMouseDown = "0";
      if (startedOnOverlay && e.target === e.currentTarget) onClose();
    },
  };
}
