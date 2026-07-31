# Privacy and data handling

This document describes what happens to the images, prompts, and API key you provide when you
run ChameleonDIRT.AI. It describes the behavior of the code in this repository only. It is not a
legal privacy policy, and it does not describe how Google handles data sent to the Gemini API —
for that, see Google's own terms for the API and the key you are using.

## Summary

ChameleonDIRT.AI has no backend of its own. There is no server, database, or account system in
this project. Everything runs in your browser, and the only network destination this project's
code sends your content to is the Google Gemini API.

## Your API key

You supply your own Gemini API key. There are two ways the app obtains it:

1. **Hosted in Google AI Studio.** The app calls `window.aistudio.hasSelectedApiKey()` and
   `openSelectKey()`, and the AI Studio host manages the key. The key is not stored by this
   project's code.
2. **Running it yourself.** You put `GEMINI_API_KEY` in `.env.local` (copied from
   [`.env.example`](../.env.example)). `.env.local` is excluded from git by the `*.local` rule in
   `.gitignore`.

### Important: the key is inlined into the build output

In the second case, `vite.config.ts` substitutes the key into the JavaScript bundle at build time:

```ts
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

This is a literal text substitution, not a runtime lookup. Consequences:

- The key appears in plain text in the files under `dist/` after `npm run build`.
- **Do not deploy a build made with your own key to a public URL.** Anyone who loads the page can
  read the key out of the bundle and spend against your quota.
- `dist/` is gitignored, but treat any build output you copy elsewhere as containing a secret.
- The key is also visible in the browser's devtools while the app runs, including in dev mode.

For local use with your own key this is fine — the key never leaves your machine except in the
API requests it authenticates. It is only a problem when you publish a build.

If you believe a key has been exposed, revoke it in Google AI Studio and issue a new one.

## Your images

- The image you upload is read in the browser. `URL.createObjectURL` produces the local preview,
  and `fileToBase64` in `utils/file.ts` reads the file with `FileReader` into a base64 string.
- That base64 image, together with the composed prompt, is sent to the Gemini API
  (`gemini-2.5-flash-image`) by `services/gemini.ts`. **Your image leaves your machine at this
  point, to Google.** One request is made per prompt you have added.
- Generated images come back as base64 and are held in React state in memory. They are not
  written to disk, `localStorage`, `sessionStorage`, or IndexedDB, and they are lost when you
  reload the page.
- Downloading, ZIP packaging, and resizing to the social export presets all happen locally in the
  browser using `canvas` and JSZip. No upload is involved in exporting.

## Your prompts

The prompt sent to Google is not only what you typed. `handleGenerate` in `App.tsx` appends your
brand color, any texture / transparent-background options, your per-category color template
settings, and a fixed instruction about preserving existing text and layout. All of that is part
of the request to the Gemini API.

## Third parties beyond the model provider

`index.html` loads Tailwind from `cdn.tailwindcss.com`. Loading a page therefore reveals your IP
address and request metadata to that CDN, as with any site that uses one. Your images and prompts
are not sent to it. When the app is served unbuilt inside Google AI Studio, the importmap also
resolves dependencies from `aistudiocdn.com`; a Vite build bundles them instead and does not
contact that host.

This project contains no analytics, telemetry, tracking, or error-reporting code.

## Related documents

- [`.env.example`](../.env.example) — configuration template; placeholder values only
- [`SECURITY.md`](../SECURITY.md) — secrets policy and how to report a vulnerability
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — development workflow
