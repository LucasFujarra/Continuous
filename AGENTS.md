# Repository Guidelines

## Project Structure & Module Organization

Continuous is a responsive React + TypeScript web app for looping ambient pads. `src/main.tsx` mounts the application; `src/App.tsx` contains the interface and application state. Keep playback behavior in `src/audio/PadPlayer.ts`, musical naming and ordering in `src/lib/library.ts`, and bundled audio discovery in `src/lib/catalog.ts`. Global styles live in `src/styles.css`.

Brand images belong in `assets/`. Optional bundled audio belongs in `assets/PAD/<folder>/<note>.<extension>`, for example `assets/PAD/Ambient/C.mp3`. Production output is generated in `dist/`; edit source files instead.

## Build, Test, and Development Commands

Use Node.js 22.18 or newer.

- `npm install`: install dependencies.
- `npm run dev`: start Vite, accessible on the local network.
- `npm run check`: check TypeScript without emitting files.
- `npm test`: run musical-library tests using Node's built-in test runner.
- `npm run build`: check types and generate `dist/`.
- `npm run preview`: serve the production build locally.
- `npm run deploy`: build and publish `dist/` to the `gh-pages` branch; requires a configured `origin` remote.

## Coding Style & Naming Conventions

Follow existing TypeScript conventions: two-space indentation, single-quoted strings, and semicolons. Use PascalCase for components and classes, camelCase for functions and variables, and explicit types where they clarify interfaces. Keep TypeScript strict checks passing, including unused-variable and unused-parameter checks. No formatter or linter is configured. Preserve Portuguese user-facing copy.

## Testing Guidelines

Tests use `node:test` and `node:assert/strict`; the current suite is `src/lib/library.test.ts`. Use descriptive test names and the `*.test.ts` suffix. The test command targets this file explicitly, so update it when adding suites. Cover note normalization, relative-key display, ordering, and deduplication when changing library logic. No coverage threshold is configured. Manually verify playback, stopping, volume, folder import, and mobile layout for relevant changes.

## Commit & Pull Request Guidelines

Git history is unavailable in this checkout. Use concise, imperative commit subjects such as `Fix duplicate tonal tracks`. Pull requests should describe the change, link relevant issues, and report validation commands. Include screenshots for visual changes and browser details for playback issues. Run `npm test` and `npm run build` before requesting review.
