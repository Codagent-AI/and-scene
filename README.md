# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm install
npm run dev
npm run build
```

## Verification and inspection

Browser checks use Playwright with Chromium. Install the browser once:

```bash
npx playwright install chromium
```

- `npm run verify` builds the whole app, checks the presentations listed in
  `scripts/verification.config.json` (the reference sample also has its nine
  titles/captions checked in order), serves a production `vite preview` on
  `127.0.0.1`, and steps through every step in Chromium. It prints a `PASS`
  line, or a `FAIL` line naming the phase (and step) and exits non-zero.
  `npm run verify -- --slug <slug>` renders only that configured presentation.
- `npm run inspect -- how-to-make-a-presentation` writes settled screenshots to
  `.inspection/<slug>/step-NN.png` (git-ignored) and prints advisory warnings
  for text/chrome overlap, indistinct active navigation, and unpolished
  attribution. Options: `--settle <ms>` (default 1200), `--out <dir>`,
  `--viewport 390x844`, `--no-build`. Mark intentional overlap with
  `data-presentation-allow-overlap`; style attribution via
  `data-presentation-attribution`.

## Current State

This repository currently contains a minimal Vite, React, and TypeScript
scaffold plus an OpenSpec proposal for the future skill implementation.
