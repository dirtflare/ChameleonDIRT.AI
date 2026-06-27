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
