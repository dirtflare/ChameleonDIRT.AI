# Agentic Development Workflow

This project is set up so AI coding agents can work in it effectively. The approach follows the agent feedback loop Anthropic's engineers describe for building agents with the Claude Agent SDK: **gather context → take action → verify work → repeat**.

Reference: [Building agents with the Claude Agent SDK](https://claude.com/blog/building-agents-with-the-claude-agent-sdk) (Anthropic engineering).

## How this repo applies each step

### 1. Gather context

- `CLAUDE.md` at the repo root gives agents the project overview, structure, commands, and conventions up front, so they don't have to rediscover them each session.
- The codebase keeps a predictable layout (`components/`, `services/`, `utils/`, `types.ts`) so agentic search (grep/glob) finds the right file quickly.

### 2. Take action

- All Gemini API access is isolated in `services/gemini.ts`, so behavior changes have a single obvious target.
- Shared types in `types.ts` let the compiler propagate the impact of a change.

### 3. Verify work

Rules-based feedback catches mistakes without a human in the loop:

- `npm run typecheck` (`tsc --noEmit`) — strict TypeScript gives agents immediate, precise error feedback.
- `npm run build` — confirms the app still bundles.
- CI runs lint, typecheck, and build on every pull request, so unverified changes can't merge silently.

For UI changes, visual verification (running `npm run dev` and checking the affected flow) is still expected — see the verification loop in `CLAUDE.md`.

## Guidelines for agent-driven contributions

- Small, verifiable changes over large refactors.
- Every PR must pass the CI verification loop; run it locally first.
- If an agent repeatedly fails at a task, treat it as a signal to improve this repo's context (docs, types, structure) rather than to retry harder.
