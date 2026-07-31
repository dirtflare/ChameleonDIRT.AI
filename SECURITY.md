# Security Policy

## Supported versions

This project is in early public development. Security fixes will target the latest public version.

## Reporting a vulnerability

Please do not open a public issue for sensitive security reports.

Instead, contact the maintainer privately via GitHub.

Include:

- Description of the issue
- Steps to reproduce
- Potential impact
- Suggested fix, if available

## Secrets policy

Never commit real API keys, tokens, passwords, or private credentials.

Use `.env.example` for placeholder configuration only.

Your `.env.local` file is excluded from git by default via `.gitignore`.

## Build output contains your API key

`vite.config.ts` inlines `GEMINI_API_KEY` into the JavaScript bundle at build time. The key is
therefore present in plain text in `dist/` after `npm run build`, and is readable by anyone who
can load the page.

Do not deploy a build made with your own key to a publicly reachable URL, and treat build output
you copy elsewhere as a secret. If a key may have been exposed, revoke it and issue a new one.

See [docs/privacy.md](docs/privacy.md) for the full data flow.
