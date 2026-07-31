# Architecture

A high-level map of the codebase for contributors. It deliberately stays above the level of
individual functions — read the files for details.

## Shape of the app

ChameleonDIRT.AI is a single-page React app with no backend of its own. `index.tsx` mounts
`App.tsx`, and that is the whole tree:

```
index.tsx
└── App.tsx                    all application state lives here
    ├── Header.tsx
    ├── ControlsPanel.tsx      inputs: base image, prompts, style presets
    ├── ResultsGrid.tsx        output: skeletons, results, export actions
    │   └── ApiKeyInstructions.tsx
    └── PreviewModal.tsx       rename and download a single result
```

There is no store, router, or context. State is `useState` in `App.tsx` and flows down as props;
child components own only local UI state. If you are adding a feature that needs shared state,
it goes in `App.tsx`.

## The generation flow

This is the part worth understanding before changing anything.

1. **Upload.** `ControlsPanel` accepts a file from either a file input or a drop target. Both
   call `onImageUpload`, which is `handleImageUpload` in `App.tsx`. The `accept` attribute does
   not constrain drag-and-drop, so validation happens in code — `validateImageFile` in
   `utils/file.ts` checks MIME type, non-empty content, and a size ceiling.

2. **Prompt assembly.** `handleGenerate` in `App.tsx` builds the final prompt for each entry the
   user added, concatenating: the user's text, a brand color instruction, optional texture and
   transparent-background instructions, optional per-category color instructions, and a fixed
   trailing instruction to preserve existing text, logos, coupon codes, and layout proportions.

   **This is where generation behavior lives.** `services/gemini.ts` is a thin transport wrapper;
   changing what the model is asked to do almost always means editing this array, not the service.

3. **Fan-out.** One `generateImage` call per prompt, collected with `Promise.allSettled`. Partial
   failure is the normal case: successful images render, failures are counted and classified.

   `Promise.allSettled` never rejects, so per-prompt failures do **not** reach the surrounding
   `catch`. They must be inspected in the settled results — this is a live footgun, and it
   previously caused API key errors to be reported as generic failures.

4. **Cancellation and staleness.** An `AbortController` is passed to the SDK via
   `config.abortSignal`. A monotonically increasing run id guards state updates so a run that is
   still finishing cannot overwrite a newer one. On cancel, whatever finished is kept and no
   error is shown.

5. **Results.** Images come back as base64 data URLs held in React state. Nothing is persisted;
   a reload clears them.

## Error handling

User-facing errors are `AppError` objects from `utils/errors.ts`, not strings:

```ts
{ kind: 'apiKey' | 'validation' | 'generation', message: string }
```

UI branches on `kind`. Two rules:

- **Never branch on message text.** An earlier version matched the message prefix to decide
  whether to show the API key help screen, which coupled presentation to copy.
- **Never render raw exception text.** Gemini errors can embed the request URL, which carries the
  API key. Raw detail goes to `console.error` via `readErrorDetail`; only the curated `message`
  reaches the DOM.

## API key resolution

Two paths, checked on mount in `App.tsx`:

1. **Google AI Studio host.** `window.aistudio` (typed in `types.ts`) provides
   `hasSelectedApiKey()` and `openSelectKey()`, and the host owns the key.
2. **Self-hosted.** `process.env.API_KEY`, which `vite.config.ts` inlines from `GEMINI_API_KEY`
   at build time via `define`.

The second is a literal text substitution, so a production build contains the key. See
[privacy.md](privacy.md) before deploying anything.

## Dependencies that bypass npm

`index.html` pulls in three things from outside npm. They behave differently, and the difference
matters:

**Tailwind and JSZip are real CDN dependencies.** Both are plain `<script src>` tags.

- Tailwind works with no build step and no config file — there is no `tailwind.config.js`.
- `JSZip` is a **global**, used in `utils/file.ts` and hand-declared in `types.ts`. It is not in
  `package.json`. It has no fallback: if the CDN is unreachable, the page renders unstyled and
  the "すべてダウンロード (.zip)" and preset export buttons throw `ReferenceError`. This also
  means the app does not work offline or behind a network policy that blocks these hosts.

**The importmap is inert.** It maps `react`, `react-dom/`, and `@google/genai` to
`aistudiocdn.com`, but Vite resolves those bare specifiers itself — rewriting them to pre-bundled
deps in dev, and inlining them into `dist/assets/index-*.js` on build. The browser never sees a
bare specifier, so the importmap never resolves anything. The versions that actually ship are the
ones in `package.json`.

Editing the importmap therefore has no effect. It is left in place because the app also runs
inside Google AI Studio, which serves `index.html` without a Vite build.

## Client-side export

`utils/file.ts` handles everything after generation, with no server involved: `canvas`-based
resizing to the social presets defined in `ResultsGrid.tsx`, and ZIP packaging through JSZip.

## Conventions

- **UI strings and code comments are Japanese. Repository documentation is English.** Match the
  surrounding language.
- `tsconfig.json` does not enable `strict`. With `strictNullChecks` off, truthiness narrowing on
  a discriminated union does not work — write `if (result.valid === false)`, not
  `if (!result.valid)`.
- `vite build` does not type check. Run `npm run typecheck` before pushing.
- Tests are Vitest, in `*.test.ts` next to the code they cover. Logic worth testing belongs in
  `utils/`, where it can be tested without rendering.
