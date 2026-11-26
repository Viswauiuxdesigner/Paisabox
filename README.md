# PaisaBox — Offline-First Expense Tracker PWA

A fast, minimal, mobile-first Progressive Web App (PWA) for tracking daily expenses completely offline using IndexedDB.

## Features

- **Fast Expense Entry**: Home screen quick-add form + floating `+` button, numeric keypad on mobile, currency `₹` (configurable), category chips, optional payment method (`UPI`, `Cash`, `Card`, `Net Banking`), date/time, and notes.
- **Custom Categories**: 12 built-in Indian-friendly categories (Food, Transport, Tea & Coffee, Recharge, DTH Recharge, Groceries, Bills, Rent, Shopping, Health, Entertainment, Other) plus custom labels for "Other" and full add/rename/icon/color/delete management.
- **Swipe & Desktop Actions**: Swipe left on mobile to edit or delete expenses; hover action buttons on desktop.
- **Reports & Analytics**: `Today`, `Weekly`, `Monthly`, and `Yearly` tabs with period navigation, previous-period comparison (`+12% vs last month`), category filter, Recharts donut breakdown, trend bar charts, and date-grouped transaction lists.
- **Offline-First & Installable**: Powered by `Dexie.js` (IndexedDB) and `vite-plugin-pwa` (Workbox service worker, 192/512/maskable icons, standalone display).
- **Backup & Restore**: Export to CSV or JSON, restore from JSON, Light/Dark mode, and dev-mode sample data seeding.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Dexie.js + `dexie-react-hooks`
- `vite-plugin-pwa`
- Recharts
- `date-fns` + `lucide-react`

## Local Development

```bash
npm install
npm run dev
```

In development mode (`npm run dev`), sample expenses are automatically seeded if your local database is empty so you can test all report views right away.

## Production Build & Preview

```bash
npm run build
npm run preview
```

The production output is generated in `dist/` with a precached Workbox service worker (`dist/sw.js`) and `dist/manifest.webmanifest`.

## Deployment

### Vercel
1. Push the repository to GitHub/GitLab/Bitbucket.
2. Import the project in [Vercel](https://vercel.com).
3. Build command: `npm run build` · Output directory: `dist`.

### Netlify
1. Connect your repository in [Netlify](https://www.netlify.com) or drag-and-drop `dist/`.
2. Build command: `npm run build` · Publish directory: `dist`.

### GitHub Pages
1. Set `base: '/<repo-name>/'` in `vite.config.ts` if deploying to a project subpath.
2. Run `npm run build` and publish `dist/` using `gh-pages` or GitHub Actions.
