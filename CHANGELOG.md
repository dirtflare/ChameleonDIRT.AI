# Changelog

## [Unreleased]

### Added

- Image upload validation for file type, size, and empty files, covering the drag-and-drop path
- Cancel button and a completed/total counter during generation
- Vitest test suite, `npm run typecheck`, and CI checks for both
- Documentation: architecture notes, prompt examples, privacy and data handling, release checklist

### Changed

- API key failures now show the dedicated help screen instead of a generic error
- Error messages no longer include raw API error text, which can contain the request URL
- Setup instructions expanded with prerequisites, first-run steps, and troubleshooting
- CI installs from the committed lockfile with `npm ci`

### Fixed

- Per-prompt failures were swallowed by `Promise.allSettled`, so API key errors were never
  reported as such
- Loading placeholders showed three tiles regardless of how many prompts were queued
- Toggles, the upload area, and result cards were not reachable or operable by keyboard
- The preview modal did not trap or restore focus
- Preview object URLs leaked when the base image was replaced
- Duplicate React keys when the same prompt was added twice

## [0.1.0] - 2026-06-26

### Added

- Initial public repository structure
- README with setup and usage instructions
- MIT License
- CONTRIBUTING guide
- SECURITY policy
- Issue and PR templates
- GitHub Actions CI
- .env.example for safe API key configuration
- Initial roadmap
