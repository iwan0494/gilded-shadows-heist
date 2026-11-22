// GILDED SHADOWS — tools at a cost. One job: pebble, smoke, lockpick.
// Pebbles distract (a visible noise ring pulls guards off route). Smoke
// blinds cameras and guards. Lockpicking is slow and can rattle.
export function throwPebble(state, tx, ty) {
  if (state.pebbles <= 0) return false;
  state.pebbles -= 1;
  state.noises.push({ x: tx, y: ty, r: 8, maxR: 190, age: 0 });
  state.lastNoise = { x: tx, y: ty };
  return true;
}

export function useSmoke(state) {
  if (state.smokeLeft <= 0) return false;
  state.smokeLeft -= 1;
  state.smokes.push({ x: state.player.x, y: state.player.y, r: 95, age: 0, life: 5 });
  return true;
}

export function updateTools(dt, state) {
  for (const n of state.noises) {
    n.age += dt;
    n.r = Math.min(n.maxR, n.r + 260 * dt);
  }
  state.noises = state.noises.filter((n) => n.age < 1.4);
  for (const s of state.smokes) s.age += dt;
  state.smokes = state.smokes.filter((s) => s.age < s.life);
}
