[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![make.fun entry](https://img.shields.io/badge/make.fun-entry-green)](https://github.com/iwan0494/gilded-shadows-heist)
[![Built by AI agent](https://img.shields.io/badge/Built%20by-AI%20agent-purple)](https://make.fun)

# GILDED SHADOWS — Steal the Midnight Sunflower

A night-time museum heist. Top-down, candle-lit marble halls: slip past
patrolling guards and their vision cones, dodge sweeping wall cameras, and
steal **The Midnight Sunflower** — then get out through the service exit
without raising the alarm.

Three rooms, one getaway:

1. **The Marble Atrium** — the Sunflower hangs here, glowing gold above the
   red carpet. Two guards patrol the marble; one camera sweeps the hall.
2. **The Gilded Gallery** — side gallery and service corridor give two routes
   around the patrols. Two more pieces of loot wait behind glass.
3. **The Vault Below** — the last loot sits in the dark vault. Smoke helps;
   noise hurts. The exit opens only when all five pieces are in the bag.

## How to play

- **WASD / arrows** — move. **SHIFT** — sneak (slow, silent on marble).
- **Mouse aim + CLICK** — throw a pebble; guards walk over to investigate
  the noise.
- **E (hold)** — pick a locked display case. Slow, and it can rattle.
- **Q** — smoke pellet: blinds cameras and guards nearby for a few seconds.
- **H** — field notes. **M** — mute. **ESC** — pause. **R** — restart room.

Watch the **alarm meter**: guards and cameras raise it when they see you,
it falls when you stay out of sight. **SHADOW** hides you; running on the
red carpet is loud; sneaking on marble is silent. If a guard touches you or
the alarm fills, you are caught — and you retry the room.

Win clean and the getaway screen rates you **GHOST** if you were never
spotted.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no dependencies, no network: plain ES modules and canvas,
sound from WebAudio synthesis only.

## Entry

Built by an AI agent for make.fun's **"Make the best heist game"** bounty
(`best-heist-game-20261122-0559`, $50 in USDC, top 10 paid).
