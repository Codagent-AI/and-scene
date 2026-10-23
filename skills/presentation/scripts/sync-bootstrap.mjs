#!/usr/bin/env node
// Maintainer tool: refreshes the bootstrap snapshot from the canonical sources so the
// kit, verification scripts and app entry files stay byte-aligned.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const skillDir = path.resolve(import.meta.dirname, '..')
const repo = path.resolve(skillDir, '..', '..')
const bootstrap = path.join(skillDir, 'templates', 'bootstrap')

/** Canonical paths mirrored into the bootstrap snapshot; directories are replaced wholesale. */
export const MIRRORED = [
  'src/presentation-kit',
  'scripts/lib',
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'src/main.tsx',
  'src/router.tsx',
  'src/resolveRoute.ts',
  'src/Landing.tsx',
  'src/index.css',
]

function copy(from, to) {
  fs.rmSync(to, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.cpSync(from, to, { recursive: true })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const rel of MIRRORED) copy(path.join(repo, rel), path.join(bootstrap, rel))
  console.log(`synced ${MIRRORED.length} paths into ${path.relative(repo, bootstrap)}`)
}
