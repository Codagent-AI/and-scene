# And Scene

And Scene builds browser presentations around one evolving diagram. Named
steps change the scene while continuing entities keep their identity. The
reference presentation lives at `/how-to-make-a-presentation`.

## Develop and verify

```bash
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
npm test
npm run lint
npm run build
npm run verify
npm run test:browser
```

Arrow Right, Space, and Page Down advance the presentation. Arrow Left and
Page Up go back. Swipe horizontally on touch devices. In browse mode, use the
step indicators or wide-screen table of contents to jump. Press P to switch
between browse and present modes.

Capture settled screenshots and print advisory layout diagnostics with:

```bash
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --width 390 --height 844
```

The helper writes screenshots under `.presentation-inspection/`.

## Author a presentation

Use the distributable [presentation skill](skills/presentation/SKILL.md).
Each presentation has a folder under `src/presentations/`. Register its slug,
title, and lazy entry component in `src/presentations/index.ts`. Keep the scene
state and stylesheet in the presentation and use `src/presentation-kit/` for
layout, navigation, and animation.
