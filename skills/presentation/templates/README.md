# Templates

Resolve this directory relative to the `SKILL.md` that links to it (never the caller's working directory).

- `bootstrap/` — a complete, style-neutral app that builds on its own (`npm ci && npm run build && npm run verify`).
  Copy it with `cp -r SKILL_DIR/templates/bootstrap/. <target>/` (note the trailing `/.` so dotfiles such as
  `.gitignore` and `.npmrc` come along).
- `presentation/` — per-presentation `*.tmpl` files; see its README for substitution tokens.

## Partial scaffold

| Anchor | Files |
| --- | --- |
| Build setup | `package.json`, `package-lock.json`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.gitignore`, `.npmrc`, `src/main.tsx`, `src/Router.tsx`, `src/route.ts`, `src/Landing.tsx`, `src/index.css`, `verify.config.json`, `scripts/**` |
| Scene kit | `src/presentation-kit/**` |
| Presentation index | `src/presentations/index.ts` (and optionally `src/presentations/starter/**`) |

Rules: copy only files belonging to missing anchors; never overwrite an existing file or presentation; **merge**
`package.json` (add missing scripts/dependencies, never replace or downgrade existing ones); the kit must stay
style-neutral. If the host already has a router or entry point, wire the registry into it rather than replacing it.
`node SKILL_DIR/scripts/scaffold-lib.mjs detect <dir>` reports anchors and the resolved target.

The kit and `scripts/` in `bootstrap/` are byte-aligned copies of the source repository's canonical files; do not edit
them here (use `npm run sync:templates` in the source repo).
