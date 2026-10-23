# and-scene

And Scene is a presentation-generation agent skill plus the small React scene
kit it generates against. A presentation is **one diagrammatic scene that
evolves through named steps**: entities keep a stable identity and morph in
place, new ones enter after the others settle, and the viewer can present it
live or browse it at their own pace.

## Layout

| Path | What it is |
| --- | --- |
| `skills/presentation/` | The distributable agent skill (`SKILL.md`), its scaffold helper, and the bootstrap and presentation templates |
| `src/presentation-kit/` | The canonical, style-neutral scene kit (motion, fixed-canvas fit, navigation, chrome, node primitives) |
| `src/presentations/` | The presentation registry and the committed sample, `how-to-make-a-presentation` |
| `scripts/verify.mjs` | Build plus browser-render verification |
| `scripts/inspect-presentation.mjs` | Per-step screenshots and advisory visual diagnostics |

`skills/presentation/templates/bootstrap/` is a snapshot of the kit, scripts and
app files used to scaffold a fresh project. Run `npm run sync:templates` after
changing a mirrored file; `npm test` fails if the snapshot drifts.

## Development

```bash
npm ci
npm run dev                      # http://127.0.0.1:5173/
npm test                         # fast unit and contract tests (Vitest)
npm run test:integration         # bootstrap, screenshot helper and verify end-to-end suites (Chromium)
npm run lint
npm run build
npm run verify                   # build, check the sample outline, render every step in Chromium
npm run inspect -- how-to-make-a-presentation   # screenshots under inspection/ (gitignored)
```

Playwright needs Chromium: `npx playwright install chromium`.

## Making a presentation

Ask an agent to use the `presentation` skill. It asks about the topic, the look
and each step, scaffolds whatever the project lacks, writes the presentation as
its own folder under `src/presentations/`, registers it, and verifies it.

The kit ships **no styling**. Each presentation styles itself in plain CSS
through the stable `data-presentation-*` hooks.
