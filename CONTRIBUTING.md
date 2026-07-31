# Contributing

Thank you for considering contributing to ChameleonDIRT.AI.

## Ways to contribute

- Report bugs
- Improve documentation
- Add tests
- Suggest features
- Improve example prompts and workflows
- Review pull requests

## Development workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the checks below
5. Open a pull request

## Checks

```
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run build
```

CI runs the same three. Note that `npm run build` does not check types, so `npm run typecheck`
is not optional. There is no linter configured yet.

Tests use Vitest and live beside the code they cover, as `*.test.ts`.

## Environment setup

See [Run Locally](README.md#run-locally) in the README for the full first-run steps, including
the required Node version and troubleshooting.

## Understanding the codebase

Read [docs/architecture.md](docs/architecture.md) before your first pull request. It covers where
state lives, how the generation flow fans out across prompts, the error handling conventions, and
a few footguns that are easy to trip over.

## Maintainer notes

This project is maintained by DIRT.
