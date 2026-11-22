// GILDED SHADOWS — keyboard and mouse state, read fresh each frame.
// WASD/arrows move, SHIFT sneaks, E (hold) steals, Q smoke, H notes,
// M mute, ESC pause, R restart. Click throws a pebble toward the mouse.

export function makeInput(canvas) {
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    interact: false,
    mouseX: 0,
    mouseY: 0,
    click: null, // {x, y} in canvas pixels, consumed by the loop
    pressed: {}, // edge-triggered keys, consumed by the loop
  };

  const KEYMAP = {
    KeyW: 'up',
    ArrowUp: 'up',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
    ShiftLeft: 'sneak',
    ShiftRight: 'sneak',
    KeyE: 'interact',
  };

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    const field = KEYMAP[e.code];
    if (field) input[field] = true;
    if (!e.repeat) input.pressed[e.code] = true;
  });

  window.addEventListener('keyup', (e) => {
    const field = KEYMAP[e.code];
    if (field) input[field] = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
    input.mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
  });

  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    input.click = {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  });

  return input;
}
