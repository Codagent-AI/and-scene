# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm ci
npm run dev
npm test            # Vitest unit + contract tests (jsdom)
npm run test:browser # Playwright-backed *.browser.test.ts files only
npm run lint
npm run build
```

## Scene kit contract

`src/presentation-kit/` is the reusable, **style-neutral** engine. It owns
motion, fixed-canvas (880 × 380) fit scaling, navigation, chrome behavior, and
stable `data-presentation-*` hooks. It ships no palette, fonts, borders,
shadows, or CSS framework; presentations (or the host app) own all styling.

- A presentation is an ordered `Step[]` (`id`, `era`, `title`, `caption`,
  `Scene`, optional `groupKey` + `payload`) passed to `<Presentation steps title initialMode />`.
- Adjacent steps with the same `groupKey` and `Scene` keep one scene instance;
  only `payload` changes. Other steps cross-fade; shared `layoutId`s morph.
- Hooks: `data-step-count` / `data-step-index` / `data-presentation-mode` on the
  chrome root, `data-presentation-progress-item`, `data-presentation-toc-item`
  (active: `aria-current="step"` + `data-presentation-active="true"`),
  `data-presentation-attribution`, `data-presentation-allow-overlap`.
- Keys: Right/Space/PageDown next, Left/PageUp previous, `P` toggles present/browse; swipe left/right on touch.

## Visual inspection

```bash
npm run inspect -- <slug> [--out <dir>] [--settle <ms>] [--viewport <WxH>] [--no-build]
```

Builds if `dist/` is missing, serves a production preview on `127.0.0.1`, steps through
the presentation with `ArrowRight`, waits the settle interval (default 1200 ms) after each
step change, and writes `.inspection/<slug>/step-01.png`, `step-02.png`, … (git-ignored).
Default viewport is 1280x800; use `--viewport 390x844` for a narrow check.

It also prints advisory warnings as `warn step NN [kind] ...`. They never change the exit
code (non-zero only for operational failures such as an unknown slug):

- `overlap`: visible text or chrome rects intersect without being nested. Mark intentional
  overlap with `data-presentation-allow-overlap` on a subtree root.
- `active-chrome`: the active progress item / TOC entry looks identical to its inactive
  siblings. Style `[data-presentation-active="true"]` / `[aria-current="step"]`.
- `attribution`: the attribution link is missing, too small, or browser-default. Style
  `[data-presentation-attribution]`.

## Presentation registry

`src/main.tsx` routes `/` to `Landing` and `/<slug>` to a lazily loaded
presentation. `src/presentations/index.ts` is an explicit array; to add a
presentation, create `src/presentations/<dir>/Talk.tsx` (default export) and
add one line:

```ts
{ slug: 'my-talk', title: 'My Talk', load: () => import('./my-talk/Talk') },
```
