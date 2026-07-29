# stamps-test

Interactive rubber stamp visual effect built with Next.js.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click anywhere to add stamps.

## Project structure

- `app/` — Next.js App Router pages and global styles
- `components/` — `StampCanvas`, `Stamp`, and SVG grain filter
- `lib/stamp.ts` — colors, randomization, and stamp instance helpers
- `public/assets/` — stamp source image and processed mask

## Replace the stamp artwork

1. Replace `public/assets/stamp.png` with your image (red ink on white works best)
2. Run `python3 scripts/regenerate_mask.py`
3. Reload the page
