# G-Barrio Poker Lounge

Welcome to the **G-Barrio** player lounge — a front-end prototype that shows how a seated player experiences private poker sessions. The page ships with a live felt, immersive HUD panels, and quick table hopping between curated private games.

## Files
- `index.html` — Player-facing layout with a branded top bar, live felt, session HUD, and lobby panels.
- `styles.css` — Neon felt aesthetic, responsive table shell, player plaques, and cushioned control panels tailored for seated players.
- `scripts.js` — Client-side logic for table selection, seating/leave flows, a simulated Texas Hold'em hand loop, and live action feed updates.
- `g-barrio-logo.svg` — Brand mark used in the lounge header.

## Running locally
Open `index.html` directly in your browser or serve the folder with any static file server:

```bash
python -m http.server 8000
```

Visit [http://localhost:8000](http://localhost:8000) to interact with the dashboard, integrity overlays, and live table controls.
