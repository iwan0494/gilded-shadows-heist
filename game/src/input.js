// GILDED SHADOWS — input. One job: keys + mouse, normalized.
// Click = throw a pebble toward the mouse. Shift = sneak. E held = pick.
export const input = {
  keys: new Set(),
  mouse: { x: 0, y: 0 },
  clicked: false,
  clickX: 0,
  clickY: 0,
};

export function initInput(canvas) {
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    input.keys.add(k);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => input.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => input.keys.clear());
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    input.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  });
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    input.clickX = (e.clientX - r.left) * (canvas.width / r.width);
    input.clickY = (e.clientY - r.top) * (canvas.height / r.height);
    input.clicked = true;
  });
}

export function consumeClick() {
  const c = input.clicked;
  input.clicked = false;
  return c;
}
