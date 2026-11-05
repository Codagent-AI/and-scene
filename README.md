# And Scene

And Scene builds browser presentations as one evolving diagram. The reusable React scene kit lives in `src/presentation-kit`, and the `skills/presentation` skill contains the authoring procedure and bootstrap templates. The reference presentation is available at `/how-to-make-a-presentation`.

## Development

```bash
npm ci
npm run dev
npm test
npm run lint
npm run build
npm run verify
npm run inspect -- how-to-make-a-presentation
```

`npm test` runs fast unit and component checks; `npm run test:integration` runs the filesystem and browser-backed integration and end-to-end tests. Verification and inspection use Playwright Chromium; install the matching browser with `npx playwright install chromium` when necessary. Inspection screenshots are written under `artifacts/presentations/` and are not committed.
