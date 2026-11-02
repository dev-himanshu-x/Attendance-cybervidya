# CyberVidya Attendance Viewer

A fast, installable web dashboard for KIET students to check **CyberVidya** attendance without fighting the official ERP UI — overall and per-course percentages, a calendar view, today's/weekly schedule, and "what if I skip class" projections.

> **Personal project, not affiliated with CyberVidya or KIET.** Credentials go to the official CyberVidya API — through this project's stateless relay — and are never logged or stored. See [Privacy & Disclaimer](#privacy--disclaimer).

## Features

- **Login** — username/password + OTP, "remember me".
- **Dashboard** — profile header, overall attendance ring, adjustable target %, miss/attend projections.
- **Courses** — card and calendar views, per-lecture daywise history, search.
- **Planning** — today's classes, and a weekly "what-if" planner to simulate skipping upcoming classes.
- PWA-installable, responsive, dark mode, toasts + skeleton loading states.

## How it works

No backend sees or stores your data — just a static frontend plus a stateless relay. Every `/api/*` call is served by this app's own route handler (`src/app/api/[...path]/route.ts`), which forwards requests unmodified to `kiet.cybervidya.net` (the ERP blocks direct cross-origin browser requests).

Your password is AES-encrypted client-side before it ever reaches CyberVidya's login endpoint.

## Tech stack

Next.js 16 (App Router) + React 19 + TypeScript, TanStack Query, React Hook Form + Zod, Sass, axios, Biome, Bun.

## Project structure

```
src/app/    # Next.js App Router: layout, page, and the /api relay route handler
src/        # app code (api/, components/, hooks/, lib/, queries/, styles/, types/)
```

## Getting started

Requires [Bun](https://bun.sh).

```sh
git clone git@github.com:dev-himanshu-x/Attendance-cybervidya.git
cd Attendance-cybervidya
bun install
bun run dev        # dev server
bun run build      # production build (type-checks too)
bun run start      # serve the production build
bun run typecheck  # type-check only
bun run lint     # lint and format
```

## Privacy & Disclaimer

- Personal, non-commercial project — not an official CyberVidya product, not endorsed by KIET or CyberVidya.
- No server-side storage: credentials pass through this project's stateless relay to CyberVidya, but nothing is logged or stored.
- Anything persisted locally (session token, saved credentials, target %) lives only in your browser's cookies.
- Full terms: in-app Terms of Service & Privacy Policy page.

## License

For personal/educational use.
