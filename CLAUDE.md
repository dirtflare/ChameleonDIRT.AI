# CLAUDE.md

Context for AI coding agents (Claude Code, Codex, etc.) working in this repository.

## Project overview

ChameleonDIRT.AI is a browser-based AI image editing toolkit. Users upload an image, describe a transformation in natural language, and generate edited results via the Gemini image generation API. The API key stays local in `.env.local` and is never committed.

Stack: React 19 + TypeScript + Vite. No backend — everything runs in the browser.

## Repository structure

- `App.tsx` — top-level application state and layout
- `components/` — UI components (`ControlsPanel`, `ResultsGrid`, `PreviewModal`, `Header`, `ApiKeyInstructions`, `icons`)
- `services/gemini.ts` — Gemini API integration (the only place that talks to the API)
- `utils/file.ts` — file/image helpers (upload, base64 conversion)
- `types.ts` — shared TypeScript types
- `docs/` — project documentation

## Commands

- `npm install` — install dependencies
- `npm run dev` — start the Vite dev server
- `npm run typecheck` — TypeScript check (`tsc --noEmit`)
- `npm run build` — production build (also type-checks via Vite)

## Verification loop

Before considering any change done:

1. Run `npm run typecheck` — must pass with zero errors.
2. Run `npm run build` — must succeed.
3. For UI changes, run `npm run dev` and verify the affected flow in the browser.

CI (`.github/workflows/ci.yml`) runs lint (if present), typecheck, and build on every PR.

## Conventions

- TypeScript strict mode; keep new code fully typed (no `any` unless unavoidable).
- Never commit API keys or secrets. Secrets live in `.env.local` (gitignored); `.env.example` documents required variables.
- Keep Gemini API calls confined to `services/`; components should stay presentation-focused.
- Follow existing component style: function components, hooks, Tailwind-style utility classes in JSX.
- See `CONTRIBUTING.md` for the contributor workflow and `SECURITY.md` for reporting issues.
