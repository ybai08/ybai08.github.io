# ybai08.github.io

Personal site for Yang Bai, served by GitHub Pages at https://ybai08.github.io.

Plain HTML/CSS/JS, no build step. Layout inspired by the "Portfolio – Tomasz Gajda" Figma community template.

## Run locally

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.

## Files

- `index.html`: hero, Spartan / Docket / Kaggriculture showcases, Open Source, Skills
- `styles.css`: styles; motion rules sit inside `prefers-reduced-motion: no-preference`
- `script.js`: skill icons, terminal typing loop, scroll reveals and scroll-linked motion, demo autoplay
- `assets/`: photo, app screenshots, Docket demo video, Kaggriculture game frame

## Deploy

Run `./deploy.sh "message"`. It bumps the `?v=` on `styles.css` and `script.js` (GitHub Pages lets browsers cache them for 10 minutes, so a stale copy can mix with a new `index.html`), commits and pushes to `main`. GitHub Pages publishes the repository root.
