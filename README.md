![CI](https://github.com/dirtflare/ChameleonDIRT.AI/actions/workflows/ci.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ChameleonDIRT.AI

A browser-based AI image editing toolkit built with React, TypeScript, Vite, and Gemini image generation. Upload an image, describe the transformation you want, and generate edited results while keeping your API key local.

## Features

- Upload an image and edit it through natural-language prompts
- Run locally with your own Gemini API key
- Keep secrets out of the repository through `.env.local`
- Use a lightweight React + TypeScript + Vite application structure

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

## Security

Do not commit real API keys or secrets. If you find a security issue, please follow [SECURITY.md](SECURITY.md).
