[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/iwan0494/gilded-shadows-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/iwan0494/gilded-shadows-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# GILDED SHADOWS — Steal the Midnight Sunflower

A night-time museum heist. Top-down, candle-lit marble halls: slip past
patrolling guards and their vision cones, dodge sweeping wall cameras, and
steal **The Midnight Sunflower** — then get out through the service exit
before dawn, without raising the alarm.

You are **SABLE**, infiltrator. **WREN** talks in your ear on the radio.
**JINX** waits outside with the engine running.

Three rooms, one getaway:

1. **The Marble Atrium** — wide, legible patrols, long pauses, generous gaps.
   The Emerald Scarab waits in a glass case by the west wall.
2. **The Gilded Gallery** — paintings, cases, and Officer Dara's long
   rectangular route. The Ruby Idol and the Brass Crown are here.
3. **The Vault Below** — the Sunflower sits on a pedestal in the middle,
   bobbing in gold light, ringed by red lasers. Curator Voss walks the
   vault. Take the Sunflower, then run — the exit pad only opens for the
   one who carries it.

## How to play

- **WASD / arrows** — move. **SHIFT** — sneak (slow, silent on marble).
- **Mouse aim + CLICK** — throw a pebble; the nearest guard leaves his
  route to investigate the noise. Watch the noise ring.
- **E (hold)** — pick a locked display case, or lift the Sunflower.
  Slow, and it can rattle.
- **Q** — smoke pellet: blinds cameras and guards nearby for a few seconds.
- **H** — field notes. **M** — mute. **ESC** — pause. **R** — restart room.

Every guard shows what he knows: a **detection pie** fills above his head,
a **"?"** means he heard something, a **"!"** means he sees you. Detection
builds gradually — distance, light, and speed all matter — and a guard who
loses you searches, then gives up, jumpier than before. **SHADOW** hides
you; running on the red carpet is loud; sneaking on marble is silent.
If a guard touches you or the alarm fills, you are caught — and you retry
the room.

The mission ends at dawn: **DAWN IN 05:00**. When it hits zero, the museum
wakes up and the alarm jumps to ALARMED. Win clean and the getaway screen
rates you **GHOST** if you were never spotted.

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
