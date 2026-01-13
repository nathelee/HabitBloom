# Repository Guidelines

## Project Structure & Module Organization

This repository is currently empty. As you add code, keep the layout predictable and minimal.

- `src/` for production code.
- `tests/` for automated tests.
- `scripts/` for developer tooling.
- `assets/` for static files (if needed).

If the structure diverges (monorepo, multiple services, etc.), add a short `README.md` at the root and update this guide.

## Build, Test, and Development Commands

No build or test system is configured yet. When you add one, document the exact commands in `README.md` and update this section. Example patterns:

- `npm run dev`: start a local dev server.
- `npm test`: run unit tests.
- `make build`: generate production artifacts.

Keep commands runnable from the repository root and avoid environment-specific defaults.

## Coding Style & Naming Conventions

Establish style rules early and automate them.

- Indentation: choose 2 or 4 spaces and enforce it with `.editorconfig` or a formatter.
- Names: use `kebab-case` for directories; keep file naming consistent within the chosen language.
- Add a formatter/linter (e.g., `prettier`, `eslint`, `black`, `gofmt`) and run it in CI once introduced.

## Testing Guidelines

No testing framework is configured yet. When one is added:

- Place tests in `tests/` or next to code (e.g., `src/foo.test.ts`).
- Use a consistent naming pattern such as `*.test.*` or `*_test.*`.
- Keep unit tests deterministic and avoid network calls.

## Commit & Pull Request Guidelines

There is no Git history yet. After initialization:

- Use concise, imperative commit messages (e.g., "Add config loader").
- PRs should include a summary, testing notes, and linked issues when applicable.
- Include screenshots for UI changes.

## Security & Configuration Tips

- Store secrets in environment variables; do not commit credentials.
- Provide `.env.example` files when configuration is required.

## Agent-Specific Instructions

Keep this file current as tooling and structure evolve, especially when adding new commands or directories.
