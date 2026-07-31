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

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` to your Gemini API key
3. Run the app:
   `npm run dev`

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
