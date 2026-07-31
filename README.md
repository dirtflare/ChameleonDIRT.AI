![CI](https://github.com/dirtflare/ChameleonDIRT.AI/actions/workflows/ci.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ChameleonDIRT.AI

A browser-based AI image editing toolkit built with React, TypeScript, Vite, and Gemini image generation. Upload a base image, add one or more edit prompts, and generate variations you can compare, resize for social, and download.

## Features

- Apply several edit prompts to one base image in a single run and compare the results
- Steer output with a brand color, texture and transparent-background options, and per-category color templates
- Export all results as a ZIP, or resized to Instagram post and story dimensions
- Run it yourself with your own Gemini API key — the project has no backend of its own

## Project status

ChameleonDIRT.AI is in an initial public OSS release. The current roadmap focuses on contributor-friendly setup docs, validation, accessibility, testing, and privacy notes. See the open issues for scoped first contributions.

## Run Locally

**Prerequisites:** Node.js 20 or newer (CI runs 22). Check with `node -v`.

1. **Get a Gemini API key.** Create one at
   [Google AI Studio](https://aistudio.google.com/apikey). The app calls the Gemini Developer API
   directly — you do not need a Google Cloud or Vertex AI project.

2. **Install dependencies:**

   ```bash
   npm ci
   ```

   Use `npm install` instead if you are intentionally changing dependency versions.

3. **Configure your key.** Copy the template and fill in the value:

   ```bash
   cp .env.example .env.local
   ```

   Then set `GEMINI_API_KEY=your-key-here` in `.env.local`. Use `.env.local`, not `.env` —
   only `.env.local` is covered by `.gitignore`.

4. **Start the dev server:**

   ```bash
   npm run dev
   ```

   The app runs at http://localhost:3000.

### First run

Upload a base image (PNG, JPEG, or WebP, up to 10 MB), add one or more edit prompts, then click
**バリエーションを生成**. One API request is made per prompt, and each result can be previewed,
renamed, and downloaded. See [docs/prompt-examples.md](docs/prompt-examples.md) for prompts to
start from.

### Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Changes to `.env.local` have no effect | The key is read when the dev server starts and is baked into the bundle. Restart `npm run dev` after editing it. |
| "APIキーエラーが発生しました" | The key is missing, invalid, or out of quota. Confirm the variable is named `GEMINI_API_KEY` in `.env.local`, then check the key at [AI Studio](https://aistudio.google.com/apikey). Full error text is in the browser console. |
| Console warns `window.aistudioが見つかりません` | Expected when running outside Google AI Studio. The app falls back to your `.env.local` key. |
| The app opens on a port other than 3000 | Port 3000 was in use, so Vite picked the next free one. Use the URL printed in the terminal. |
| `npm ci` fails on engine versions | Node is older than 20. Upgrade Node. |

## Prompt examples

See [docs/prompt-examples.md](docs/prompt-examples.md).

## Documentation

- [docs/architecture.md](docs/architecture.md) — how the code fits together
- [docs/prompt-examples.md](docs/prompt-examples.md) — prompts to start from
- [docs/privacy.md](docs/privacy.md) — what happens to your images, prompts, and key
- [docs/release-checklist.md](docs/release-checklist.md) — maintainer release process

## Contributing

Contributions, bug reports, documentation improvements, and accessibility feedback are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Privacy

Your images and prompts are sent to the Google Gemini API to generate results; everything else,
including export and resizing, happens in your browser. See [docs/privacy.md](docs/privacy.md)
for the full data flow.

## Security

Do not commit real API keys or secrets. If you find a security issue, please follow [SECURITY.md](SECURITY.md).

Note that `npm run build` inlines `GEMINI_API_KEY` into the bundle, so a build made with your own
key must not be deployed to a public URL. See
[docs/privacy.md](docs/privacy.md#important-the-key-is-inlined-into-the-build-output).
