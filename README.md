# CyberVidya Attendance Viewer

A fast, installable web dashboard for KIET students to check **CyberVidya** attendance without fighting the official ERP UI — overall and per-course percentages, a calendar view, today's/weekly schedule, and "what if I skip class" projections.

> **Personal project, not affiliated with CyberVidya or KIET.** Credentials go to the official CyberVidya API — directly in live mode, or through this project's stateless relay in proxy mode — and are never logged or stored. See [Privacy & Disclaimer](#privacy--disclaimer).

## Features

- **Login** — username/password + OTP, "remember me", optional browser-extension auth bridge for live mode.
- **Dashboard** — profile header, overall attendance ring, adjustable target %, miss/attend projections.
- **Courses** — card and calendar views, per-lecture daywise history, search.
- **Planning** — today's classes, and a weekly "what-if" planner to simulate skipping upcoming classes.
- PWA-installable, responsive, dark mode, toasts + skeleton loading states.

## How it works

No backend sees or stores your data — just a static frontend plus a stateless relay. Two paths to CyberVidya:

1. **Proxy mode (default)** — `vercel.json` rewrites `/api/*` to this app's own serverless function (`api/proxy.ts`), which forwards requests unmodified to `kiet.cybervidya.net` (the ERP blocks direct cross-origin browser requests).
2. **Live mode (extension)** — the optional *Kiet Auth Bridge* browser extension grabs your session token and rewrites headers so the browser can call `kiet.cybervidya.net` directly, no relay involved.

Your password is AES-encrypted client-side before it ever reaches CyberVidya's login endpoint.

## Tech stack

React 19 + TypeScript + Vite, TanStack Query, React Hook Form + Zod, Sass, axios, Biome, Bun.

## Project structure

```
api/        # Vercel serverless proxy function
src/        # app code (api/, components/, hooks/, lib/, queries/, styles/, types/)
extension/  # "Kiet Auth Bridge" browser extension (chrome/, firefox/)
```

## Getting started

Requires [Bun](https://bun.sh).

```sh
git clone git@github.com:dev-himanshu-x/Attendance-cybervidya.git
cd Attendance-cybervidya
bun install
bun run dev      # dev server
bun run build    # type-check + build
bun run lint     # lint and format
```

## Privacy & Disclaimer

- Personal, non-commercial project — not an official CyberVidya product, not endorsed by KIET or CyberVidya.
- No server-side storage: in live mode credentials go straight from your browser to CyberVidya; in proxy mode they pass through this project's stateless relay, but nothing is logged or stored.
- Anything persisted locally (session token, saved credentials, target %) lives only in your browser's cookies.
- Full terms: in-app Terms of Service & Privacy Policy page.

## License

For personal/educational use.
