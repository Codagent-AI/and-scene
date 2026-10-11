# Scaffold contracts

Inspect contracts, not a byte match: build means React + Vite + TypeScript and a
build script; kit means an exported `Presentation` and `Step`/`Scene` contract;
index means an explicit slug-to-loader registry used by the pathname router.
Follow local imports and reexports when checking a differently named module.

The deterministic script finds templates relative to its own URL. It fills absent
files and adds required dependency/script entries without replacing existing ones.
It snapshots the neutral kit and project-local verification/inspection tools.
Existing build config and presentation folders stay intact. For build-only hosts,
it adds `AndSceneHost.tsx` and wraps the existing entry-point render argument;
registered slugs use the new router, all other paths retain the original host.
If an entry point cannot be safely wrapped, perform the narrowly scoped wiring
instruction printed by the script and report the exact edit. A present but
incompatible file is preserved: inspect and adapt only the missing contract with
an additive change rather than replacing the host configuration.

Run installation in the resolved target (printed by the script). Existing package
entries win even if their versions differ; resolve demonstrated incompatibilities
without unrequested upgrades. A fresh bootstrap carries a committed lockfile and
supports `npm ci`. After existing-manifest additions use `npm install` to update
its lock. Never copy the reference expectations, sample, tests or Vitest into a
new app. Bootstrap `src/index.css` contains only host geometry, not visual defaults.
