# Poker Control Room

This repository contains the **G-Barrio** operations console for private poker sessions. The static site ships with an admin dashboard, security monitors, and a live felt so you can rehearse oversight flows without backend wiring.

## Files
- `index.html` — Command surface with table creation, roster, queue intelligence, integrity monitors, live timeline, and the felt view.
- `styles.css` — Dark concierge aesthetic with neon accents, felt gradients, and responsive cards that mirror a production control room.
- `scripts.js` — Client-side logic for table/admin rendering, queue stats, animated integrity monitors, timeline pulses, and a playable Texas Hold'em hand (shuffle, deal, flop/turn/river, bet/call/fold controls).
- `g-barrio-logo.svg` — Local brand mark used in the console header.

## Running locally
Open `index.html` directly in your browser or serve the folder with any static file server:

```bash
python -m http.server 8000
```

Visit [http://localhost:8000](http://localhost:8000) to interact with the dashboard, integrity overlays, and live table controls.
