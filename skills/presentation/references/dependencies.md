# Scaffold dependency contract

When scaffolding or completing a presentation app, ensure it declares and
installs the following packages with the project's package manager. Do not add a
different styling framework unless the host already uses it or the user requests
it.

## Runtime dependencies

- `react`
- `react-dom`
- `motion`
- `lucide-react`

## Build, lint, and browser verification dependencies

- `vite`
- `@vitejs/plugin-react`
- `typescript`
- `@types/react`
- `@types/react-dom`
- `@types/node`
- `eslint`
- `@eslint/js`
- `typescript-eslint`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `globals`
- `@playwright/test`

Playwright render verification requires Chromium to be installed and available
in the environment. Reuse an existing local browser cache when possible.
