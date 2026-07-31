# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm ci               # install from the committed lockfile (what CI runs)
npm run dev          # Vite dev server on port 3000, bound to 0.0.0.0
npm run build        # production build
npm run preview      # serve the production build
npm run typecheck    # tsc --noEmit
npm test             # vitest run
npm run test:watch   # vitest in watch mode

npx vitest run utils/file.test.ts        # a single test file
npx vitest run -t 'rejects an empty file' # a single test by name
```

Tests are Vitest with the `jsdom` environment (configured under `test` in `vite.config.ts`), and
live next to the code as `*.test.ts`. CI runs typecheck, tests, and build.

**There is still no linter.** `vite build` transpiles without type checking, so `npm run typecheck`
is the only thing that catches type errors — run it before pushing.

`tsconfig.json` does not enable `strict`. With `strictNullChecks` off, truthiness narrowing on a
discriminated union does not work: use `if (result.valid === false)`, not `if (!result.valid)`.

Requires `.env.local` with `GEMINI_API_KEY` (copy from `.env.example`).

## Architecture

Single-page React app: `index.tsx` → `App.tsx`. All application state lives in `App.tsx`
as `useState` hooks and is passed down as props — there is no store, router, or context.

### Prompt assembly is in App.tsx, not in the service layer

`handleGenerate` in `App.tsx` is the core of the app. It composes each final prompt by
concatenating, in order: the user's prompt, a brand-color instruction, optional texture and
transparent-background instructions, optional per-category color-template instructions, and a
fixed trailing instruction that tells the model to preserve existing text/logos/coupon codes and
the layout ratio. `services/gemini.ts` is a thin wrapper that just forwards image + prompt to
`gemini-2.5-flash-image` and extracts the first `inlineData` part. **Changing generation behavior
almost always means editing the prompt array in `App.tsx`, not the service.**

Generation fans out one API call per prompt via `Promise.allSettled`, so partial failure is
normal: successful images render and the rejected count becomes a user-facing error message.

### Two API-key paths

1. `window.aistudio` (present when hosted in Google AI Studio) — `hasSelectedApiKey()` /
   `openSelectKey()` drive the in-app key picker. Typed in `types.ts` via `declare global`.
2. Fallback: `process.env.API_KEY`, which `vite.config.ts` **inlines at build time** from
   `GEMINI_API_KEY` using `define`. This means a production build embeds the key in the bundle —
   relevant to the privacy/security docs in issues #3 and #10. Do not describe the built app as
   keeping the key private without accounting for this.

### CDN dependencies that bypass npm

`index.html` loads Tailwind and JSZip from CDNs and declares an importmap pointing React and
`@google/genai` at `aistudiocdn.com`. Consequences:

- Tailwind classes work with no build step and no config file; there is no `tailwind.config.js` to edit.
- `JSZip` is used as a **global** in `utils/file.ts` and is hand-declared as a global `class` in
  `types.ts`. It is not an npm dependency, so it will not appear in `package.json`.
- The importmap can shadow the npm-installed React/genai versions at runtime; when versions look
  inconsistent, check `index.html` as well as `package.json`.

### Image handling

Images never touch a backend of this project's own — upload is read to base64 in the browser
(`utils/file.ts:fileToBase64`), sent directly to the Gemini API, and returned as base64 data URLs
held in memory. Export helpers in `utils/file.ts` do canvas-based resizing and client-side ZIP
packaging; social export presets (Instagram post/story dimensions) are defined inline in
`components/ResultsGrid.tsx`.

## Conventions

- **UI strings and code comments are Japanese; repository docs (README, CONTRIBUTING, SECURITY,
  issues) are English.** Match the surrounding language when editing.
- The `@/*` path alias maps to the repository root (configured in both `tsconfig.json` and `vite.config.ts`).
- Uploads must go through `validateImageFile` in `utils/file.ts`. The `accept="image/*"` attribute
  on the file input does not constrain the drag-and-drop path in `ControlsPanel`, so both entry
  points funnel into `handleImageUpload` in `App.tsx`, which validates before setting state.
- `types.ts` holds both shared interfaces and the global ambient declarations; the `// FIX:` comments
  there document past TypeScript conflicts — leave them in place unless resolving the underlying issue.
