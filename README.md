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

## Presentation registry

`src/main.tsx` routes `/` to `Landing` and `/<slug>` to a lazily loaded
presentation. `src/presentations/index.ts` is an explicit array; to add a
presentation, create `src/presentations/<dir>/Talk.tsx` (default export) and
add one line:

```ts
{ slug: 'my-talk', title: 'My Talk', load: () => import('./my-talk/Talk') },
```
