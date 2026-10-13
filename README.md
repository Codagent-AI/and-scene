# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
npm test
npm run lint
npm run build
npm run verify
npm run test:e2e
```

Open `/how-to-make-a-presentation` for the nine-step reference presentation,
“How to Use This Skill to Make a Presentation”. It keeps one grouped scene alive
as the conversation, step cards, shared kit, verification, and final reveal
accumulate. Use Right/Space/PageDown and Left/PageUp, swipe horizontally, or use
browse controls to navigate. Press P to switch between browse and present modes.

Each presentation owns its plain CSS; the reusable scene kit supplies behavior
and geometry without a visual theme. Add a presentation folder and an explicit
entry in `src/presentations/index.ts` to register another route.

`npm run verify` builds the whole application, checks configured reference
presentations, and renders every route exposed by the landing page in production
Chromium. `verify.config.json` defines reference slugs and their ordered titles
and captions; an empty `referencePresentations` array supports apps without the
canonical sample. Verification requires at least one reachable presentation and
landing links for every registered route; add the first presentation before
verifying an empty scaffold. The distributable verifier and its empty config live in
`skills/presentation/templates/bootstrap/`.

Verification probes an available port on `127.0.0.1`; set `VERIFY_PORT` to reserve
a particular port. Success prints `PASS`; failures exit nonzero with the phase
(`build`, `sample`, `render`, or `transition`), route, and zero-based step index
where applicable. The preview and browser are stopped on success and failure.

The separate `test:e2e` suite runs production verification in disposable copies
under ignored `.artifacts/`, injecting build, sample, browser, and navigation
faults and checking that each preview port is released. It is excluded from
`npm test`. Browser installation is required for both suites and verification.
