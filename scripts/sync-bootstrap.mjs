#!/usr/bin/env node
// Refreshes the skill's bootstrap template from the canonical sources in this repository,
// so the template kit and scripts stay byte-aligned. Run after changing the kit or scripts.
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dest = path.join(root, 'skills', 'presentation', 'templates', 'bootstrap')

/** Copied verbatim; the template must hold the same bytes as the canonical file. */
const MIRRORED = [
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'public/favicon.svg',
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'scripts/lib',
  'src/presentation-kit',
  'src/main.tsx',
  'src/index.css',
  'src/Router.tsx',
  'src/Landing.tsx',
  'src/presentations/registry.ts',
  'src/presentations/lazyPresentation.ts',
]

function files(rel) {
  const full = path.join(root, rel)
  if (fs.statSync(full).isFile()) return [rel]
  return fs
    .readdirSync(full, { recursive: true, encoding: 'utf8' })
    .filter((f) => fs.statSync(path.join(full, f)).isFile() && !/(^|[\\/])__tests__[\\/]/.test(f))
    .map((f) => path.join(rel, f))
}

// Remove stale mirrored kit/script files first, so deletions propagate.
for (const dir of ['src/presentation-kit', 'scripts/lib']) fs.rmSync(path.join(dest, dir), { recursive: true, force: true })
for (const rel of MIRRORED.flatMap(files)) {
  fs.mkdirSync(path.dirname(path.join(dest, rel)), { recursive: true })
  fs.copyFileSync(path.join(root, rel), path.join(dest, rel))
}
console.log(`synced ${MIRRORED.flatMap(files).length} files into ${path.relative(root, dest)}`)
