import { describe, it, expect, vi } from 'vitest';
import { overlayCloseHandlers } from '../modalOverlay.js';

function makeFakeOverlay() {
  const dataset = {};
  return { dataset };
}

describe('overlayCloseHandlers', () => {
  it('đóng khi mousedown và click đều rơi đúng vào overlay (click nền thật sự)', () => {
    const onClose = vi.fn();
    const overlay = makeFakeOverlay();
    const { onMouseDown, onClick } = overlayCloseHandlers(onClose);

    onMouseDown({ target: overlay, currentTarget: overlay });
    onClick({ target: overlay, currentTarget: overlay });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('KHÔNG đóng khi mousedown bắt đầu bên trong panel nhưng click (mouseup) trượt ra overlay — bug kéo/vuốt', () => {
    const onClose = vi.fn();
    const overlay = makeFakeOverlay();
    const inner = { dataset: {} };
    const { onMouseDown, onClick } = overlayCloseHandlers(onClose);

    onMouseDown({ target: inner, currentTarget: overlay }); // mousedown trong panel
    onClick({ target: overlay, currentTarget: overlay }); // nhả tay ngoài overlay

    expect(onClose).not.toHaveBeenCalled();
  });

  it('KHÔNG đóng khi click bình thường vào nội dung panel (target khác currentTarget)', () => {
    const onClose = vi.fn();
    const overlay = makeFakeOverlay();
    const inner = { dataset: {} };
    const { onMouseDown, onClick } = overlayCloseHandlers(onClose);

    onMouseDown({ target: inner, currentTarget: overlay });
    onClick({ target: inner, currentTarget: overlay });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('reset cờ sau mỗi lần click — click nền 2 lần liên tiếp đều đóng được', () => {
    const onClose = vi.fn();
    const overlay = makeFakeOverlay();
    const { onMouseDown, onClick } = overlayCloseHandlers(onClose);

    onMouseDown({ target: overlay, currentTarget: overlay });
    onClick({ target: overlay, currentTarget: overlay });
    onMouseDown({ target: overlay, currentTarget: overlay });
    onClick({ target: overlay, currentTarget: overlay });

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('không tự đóng nếu click nền nhưng chưa từng có mousedown trước đó (vd: synthetic click)', () => {
    const onClose = vi.fn();
    const overlay = makeFakeOverlay();
    const { onClick } = overlayCloseHandlers(onClose);

    onClick({ target: overlay, currentTarget: overlay });

    expect(onClose).not.toHaveBeenCalled();
  });
});
