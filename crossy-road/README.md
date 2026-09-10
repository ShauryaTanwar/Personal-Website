# Shaurya's Crossing

This game is based on the classic game - Crossy Road. However, it differs because it is centered around my interests in electrical/computer 
engineering, software, embedded systems, hardware, and tennis.

The project is intentionally build-free: the game lives in a standalone `index.html` file and can be opened directly in a browser or uploaded to GitHub Pages as-is.

## Controls

- `W` / `Arrow Up`: forward
- `S` / `Arrow Down`: backward
- `A` / `Arrow Left`: left
- `D` / `Arrow Right`: right
- Mobile: swipe, tap forward, or use the on-screen directional controls

## Theme

The original Crossy Road-inspired base has been redesigned into a personal world:

- **Shaurya's Crossing** retro/terminal identity and a more spread-out arcade HUD
- Campus-red, PCB-green, gold, navy, and lab-inspired visual palette
- Engineering chicken with a campus-red jacket band and PCB backpack
- Campus benches, lamps, brick paths, trees, and milestone signage
- Embedded-system lab lanes with PCB traces, prototype boards, and oscilloscope props
- Tennis court safe lanes with rackets and tennis balls
- Rivers that alternate between detailed logs and moving circuit-board rafts
- Personalized milestone signs including CMU ECE, C0VM, I2C Lab, Systems, Hardware, Scout, and Tennis references
- Red/cream engineering-campus themed train treatment
- Progress zones that change as the run advances: The Quad, ECE Lab, Systems, Embedded, Tennis Break, and Night Build

## Gameplay retained

- Endless procedural lane generation
- Grass, road, river, rail, lab, and tennis-court lanes
- Cars and trucks
- Moving logs / PCB rafts
- Trains with warning signals and audio cues
- Camera rush / pressure system
- Desktop keyboard controls
- Mobile swipe and touch controls
- Local high score
- Spinning engineering-themed data-chip collectibles worth +10 bonus points
- Total score combines forward progress with collectible bonuses
- Toggleable sound effects
- No background music

## Scoring

Scoring points is done by collecting chips scattered across the map. Progressing forward also adds points to the score.

## Running

Open `index.html` in a modern browser. No npm installation or build command is required.

The game loads Three.js from a CDN, so an internet connection is required when the page is loaded. GitHub Pages works normally with this setup.

## AI Models

The AI Model used to complete this project was ChatGPT Sol 6.0. My overall strategy was to initially make a functional copy of the game, and then 
personalize it after.

Testing was only conducted up to 200 points with everything working fully functionally. 
