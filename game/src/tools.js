// tools.js — the thief's kit, each with a price: pebbles are finite, smoke is
// finite, lockpicking is slow and loud. Noise is a visible, expanding ring.
export function makeTools() {
  return { pebbles: 3, smoke: 2, rings: [], clouds: [] };
}

export function throwPebble(tools, fx, fy, tx, ty) {
  if (tools.pebbles <= 0) return null;
  tools.pebbles -= 1;
  const noise = { x: tx, y: ty, r: 340 };
  tools.rings.push({ x: tx, y: ty, r: 8, maxR: 90, a: 0.9 });
  return noise;
}

export function dropSmoke(tools, x, y) {
  if (tools.smoke <= 0) return false;
  tools.smoke -= 1;
  tools.clouds.push({ x, y, r: 78, ttl: 6 });
  return true;
}

export function updateTools(tools, dt) {
  for (const ring of tools.rings) {
    ring.r += 130 * dt;
    ring.a -= 0.55 * dt;
  }
  tools.rings = tools.rings.filter((r) => r.a > 0 && r.r < r.maxR);
  for (const c of tools.clouds) c.ttl -= dt;
  tools.clouds = tools.clouds.filter((c) => c.ttl > 0);
}
