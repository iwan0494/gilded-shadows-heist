// input.js — keyboard + mouse state, with edge detection for one-shot actions.
export function makeInput(canvas) {
  const keys = new Set();
  const mouse = { x: 0, y: 0, click: null };
  const pressed = new Set();

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (!keys.has(e.key)) pressed.add(e.key);
    keys.add(e.key);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key));
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  });
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.click = {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    keys, mouse, pressed,
    read() {
      return {
        up: keys.has('w') || keys.has('W') || keys.has('ArrowUp'),
        down: keys.has('s') || keys.has('S') || keys.has('ArrowDown'),
        left: keys.has('a') || keys.has('A') || keys.has('ArrowLeft'),
        right: keys.has('d') || keys.has('D') || keys.has('ArrowRight'),
        sneak: keys.has('Shift'),
        interact: keys.has('e') || keys.has('E'),
      };
    },
    // One-shot key: true once per physical press.
    wasPressed(k) {
      if (pressed.has(k)) { pressed.delete(k); return true; }
      return false;
    },
    takeClick() {
      const c = mouse.click;
      mouse.click = null;
      return c;
    },
  };
}
