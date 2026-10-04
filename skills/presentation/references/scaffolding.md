# Scaffold contracts

## Contract anchors

Inspect behavior, not filenames:

- **Build setup:** Vite + React + TypeScript with a working `npm run build`.
- **Scene kit:** generic `Step`/`Scene` types, fixed-canvas active-step host and entity morphs, present/browse navigation, caption/contents chrome, and fit scaling.
- **Presentation index:** explicit or equivalent registry from unique slugs to separately loadable routes.

Scaffold only missing anchors. In a monorepo, resolve a self-contained `presentations/` app first; root build files do not satisfy that app's build anchor. Preserve unrelated files and existing presentations. If the target is non-empty and unscaffolded, state the target and wait for confirmation before writes.

## Bootstrap dependencies

When scaffolding, install the whole set rather than assuming packages are globally available.

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Build and types: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`.
- Lint: `eslint`, `@eslint/js`, `globals`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`.
- Browser verification: `playwright`.

Use the host package manager. For the supplied bootstrap, run `npm install`. If Playwright cannot find Chromium, run `npx playwright install chromium` from the app directory. Do not add Tailwind or another framework unless the host already uses it or the user asks for it.

## Template locations and styling

Resolve the skill directory from this skill's `SKILL.md`, then copy its `templates/` content from there. Never build template paths from the shell's current working directory.

The kit owns behavior, stable hooks, and canvas/chrome geometry. It has no visual defaults: no colors, fonts, spacing scale, borders, shadows, card/button treatments, theme tokens, or styling-framework dependency. Presentation-owned plain CSS is the default. Scaffold host landing/layout CSS may provide structural positioning, but visual choices for a presentation belong in that presentation or its host.

The bootstrap includes `npm run verify -- <slug>` for production build and all-step Chromium rendering, and `npm run inspect -- <slug>` for settled screenshots and advisory visual diagnostics. Inspection writes beneath `artifacts/presentation-inspection/<slug>/`. Keep kit files in `templates/bootstrap/src/presentation-kit/` byte-aligned with the canonical kit when updating either copy.
