# Bootstrap template

This is a complete, style-neutral Vite app snapshot. Copy its contents into the
resolved app root, then install with `npm ci`. The `starter` route exists so
`npm run verify` can smoke-render a route immediately. Replace it or add
presentations through `src/presentations/index.ts`.

From the source repository, run `npm run test:integration` to materialize this
template in a disposable directory, install its locked dependencies, build it,
and invoke its browser smoke check from outside the materialized app. If the
Playwright browser is unavailable, install it with `npx playwright install chromium`.
