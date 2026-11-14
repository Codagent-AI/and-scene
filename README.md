# And Scene

A small React presentation app: one diagram evolves through named beats rather
than replacing disconnected slides. Start with the registered **How to Use This
Skill to Make a Presentation** example at `/how-to-make-a-presentation`.

```sh
npm ci
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

Right / Space / PageDown advances; Left / PageUp goes back. Swipe horizontally,
choose a progress number, or choose a section. P switches browse/present mode.
Interactive controls retain their own keys. Navigation clamps at the ends.

```sh
npm test                    # fast Vitest unit/component/contract tests
npm run test:types          # includes the typed payload boundary fixture
npm run test:integration    # named bootstrap/inspection and production E2E tests
npm run lint
npm run build
npm run verify              # whole app build, canonical sample and every step
npm run verify -- --slug=my-presentation
npm run inspect -- how-to-make-a-presentation
npm run inspect -- how-to-make-a-presentation --width=390
```

Production browser scripts bind/probe/navigate using `127.0.0.1`, allocate an
available port, and close preview/browser resources on success and failure.
Inspection saves settled screenshots and an advisory report under
`artifacts/inspection/<slug>/<width>x<height>/`; these artifacts are ignored by git.
Warnings identify overlapping text/chrome, indistinct active navigation, and
unpolished attribution. Review them; they are not an automated visual-quality
score. Mark only intentional readable overlapping subtrees with
`data-presentation-allow-overlap="true"`.

The public agent workflow is [skills/presentation/SKILL.md](skills/presentation/SKILL.md).
It gathers one detail at a time, accepts explicit partial detail, resolves the
correct standalone/monorepo target, preserves existing anchors, and verifies the
result. Its bootstrap snapshot is self-contained and style-neutral. The sample's
CSS is an example, not a required theme.

Create a folder under `src/presentations/` and add an explicit registry entry in
`src/presentations/index.ts`. Use typed `Step<Payload>[]`, stable entity IDs,
a shared Scene/groupKey for adjacent diagram states, and presentation-owned CSS.
The kit owns only motion, geometry, navigation and semantic hooks. Kit sources
and bootstrap copies, and root/bootstrap browser scripts, must remain byte-equal.
Run the integration suite after changing either snapshot.
