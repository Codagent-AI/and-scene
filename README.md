# And Scene

A presentation is one evolving diagram, with stable entities and named beats.
The reference presentation is **How to Use This Skill to Make a Presentation** at
`/how-to-make-a-presentation`.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
npm test                    # fast Vitest unit/component/contract checks
npm run test:integration     # disposable bootstrap, diagnostics, production/fault checks
npm run lint
npm run build
npm run verify              # whole app build and all reference steps in Chromium
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --narrow --skip-build
```

Inspection writes settled per-step screenshots and advisory diagnostics to
`.inspection/<slug>/`. It does not decide visual quality. Review first, last,
dense/key steps and narrow layouts; use chrome-devtools-axi for interactive
browser inspection. Do not commit build/dependency/inspection output.

Use [the presentation skill](skills/presentation/SKILL.md) for creation and scoped
modification. Copy the whole `skills/presentation/` directory to distribute it.
Templates resolve from that directory. Full empty-target bootstrap:

```sh
node /absolute/path/to/skills/presentation/materialize.mjs /absolute/empty/target
```

The agent procedure handles contract-level detection and partial scaffolding,
including preserving existing anchors and resolving monorepo targets. The copy
helper deliberately refuses a non-empty target. Fresh bootstrap output has no
visual theme; authored presentations supply their own CSS.

`src/presentation-kit/` owns types, canvas geometry, motion, navigation, and stable
`data-presentation-*` hooks. A generic `Step<T>[]` passes typed payloads through
`Presentation` without casts. Share both `groupKey` and Scene to update a Scene
instance in place. Namespace entity identities per presentation. Keep keyed
Appear wrappers around individual newcomers while they persist; an
AnimatePresence parent enables departures. Do not fade/remount continuing groups.

The kit has no palette, font, border, card, or control defaults. Presentation or
host CSS styles the hooks, including active navigation and attribution. Local
styles must keep intentional overlap readable. Mark only the intentional
subtree with `data-presentation-allow-overlap="true"`.

When the kit or browser scripts change, update their byte-identical copies in
`skills/presentation/templates/bootstrap/`. INT-001 checks drift by materializing
and exercising the distributable app outside this repository. Integration and
end-to-end tests share setup within cases and never run as part of `npm test`.
The package scripts are the verification gate; there is no hosted CI setup.
