# Project guidelines

## About

Personal portfolio website for Sebastiano Girotto, a full stack developer.

## Stack

- **Svelte 5 with runes** (`$state`, `$derived`, `$effect`, `$props`). No legacy syntax (`export let`, `$:`, stores for local state).
- **SvelteKit**, rendered to **static** output via `@sveltejs/adapter-static`. Everything must be prerenderable: no server-only features (`+server.ts` endpoints that need runtime, form actions, runtime-only `load` on the server).
- **Tailwind CSS** v4 for all styling (configured in `src/routes/layout.css`). Prefer utility classes over custom CSS.
- **Bun** is the package manager and runner. Use `bun add`, `bun install`, `bun run <script>`. Do not use npm, yarn, or pnpm.

## Design

- **Font:** Geist, via `@fontsource-variable/geist` (family `Geist Variable`, exposed as `--font-sans`).
- **Theme:**
  - background: `#171414` (`bg-background`)
  - primary: `#F9F6EE` (`text-primary`)
- **Responsive:** the site must be responsive and fully usable on mobile, but design desktop-first. Build the desktop layout as the default and adapt it for smaller screens with Tailwind's `max-*` breakpoint variants (e.g. `max-md:`).
- Colors are defined in the `@theme` block in `src/routes/layout.css`; use those tokens instead of hardcoding hex values.

## Commands

- `bun run dev` — dev server
- `bun run build` — static build
- `bun run check` — type/svelte check
- `bun run format` — prettier
