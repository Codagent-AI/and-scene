# Presentation app bootstrap

This self-contained app uses Vite, React, TypeScript, Motion, Lucide, and the
style-neutral scene kit. Run from this directory:

```sh
npm ci
npx playwright install chromium
npm run dev
npm run build
npm run verify -- /sample
npm run inspect -- sample
```

`verify` builds and opens the selected route in Chromium, failing on runtime or
console errors. `inspect` captures each settled step under
`artifacts/inspection/` and prints advisory warnings for likely scene/chrome
overlap, indistinct active navigation, and attribution issues. Review screenshots
and warnings manually; visual diagnostics are advisory rather than a taste score.

The reusable kit provides structure and behavior only. Put palette, type, and
other visual treatments in each presentation's own CSS.
