[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/iwan0494/gilded-shadows-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/iwan0494/gilded-shadows-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# GILDED SHADOWS — Steal the Midnight Sunflower

A top-down stealth heist in a night museum. Plan the job on the blueprint,
slip past named guards with readable patrol routes and vision cones, grab
The Midnight Sunflower from behind its red lasers, and get out before dawn.

You are **SABLE**, infiltrator. **WREN** talks in your ear. **JINX** waits
outside with the engine running. Three rooms — the Marble Atrium, the Gilded
Gallery, the Vault Below — five named pieces worth $1,200,000, one getaway.

## What makes it a heist

- **Guards show what they know.** Every guard has a name, a dashed patrol
  route, a timer ring, and a detection pie that fills clockwise. `?` means
  suspicious, `!` means seen. Detection is gradual (0–100%), driven by
  distance, light and speed — never a binary switch.
- **Guards investigate.** A thrown pebble pulls a guard off his route to
  check the noise. Break line of sight and he searches, gives up, and goes
  back — jumpier than before.
- **Two palettes.** Stealth is deep navy and gold; the alarm flips the whole
  room red.
- **Two steps to win.** Secure the Sunflower (the HUD objective changes),
  then reach the glowing teal exit pad carrying it. The pad opens for no one
  else.
- **One deadline.** Dawn comes in 05:00. After that, the whole house wakes.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| SHIFT | Sneak (slow, quiet, harder to spot) |
| Click | Throw a pebble (3) — pulls guards to the noise |
| E (hold) | Steal / lockpick — hold the ring to fill it |
| Q | Smoke pellet (2) — blinds cameras and guards |
| H | Field notes |
| M | Mute |
| ESC | Pause |
| R | Retry after being caught, or play again after the getaway |

## Run it

```sh
node serve.ts
# open http://localhost:8080/game/index.html
```

Build the submission bundle:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Node 22+, standard library only, no network, no build step.
