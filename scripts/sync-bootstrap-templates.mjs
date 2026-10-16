#!/usr/bin/env node
// Regenerates the bootstrap snapshot's copies of canonical sources.
// Usage: npm run sync:templates   (add --check to fail on drift without writing)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP = path.join(ROOT, 'skills', 'presentation', 'templates', 'bootstrap')

/** Canonical files (relative to the repo root) that the bootstrap copies byte-for-byte. */
export const SYNCED_FILES = [
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'src/main.tsx',
  'src/Landing.tsx',
  'src/routes.ts',
]
export const KIT_DIR = 'src/presentation-kit'

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : [p]
  })
}

const isTest = (f) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(f)

/** Map of relative path -> canonical absolute source for everything the snapshot mirrors. */
export function plan(root = ROOT) {
  const files = new Map()
  for (const rel of SYNCED_FILES) files.set(rel, path.join(root, rel))
  const kit = path.join(root, KIT_DIR)
  for (const abs of walk(kit)) {
    if (!isTest(abs)) files.set(path.relative(root, abs).split(path.sep).join('/'), abs)
  }
  return files
}

/** Returns the list of drifted relative paths (missing, different, or stale extra kit files). */
export function drift(root = ROOT, bootstrap = BOOTSTRAP) {
  const out = []
  const files = plan(root)
  for (const [rel, src] of files) {
    const dest = path.join(bootstrap, rel)
    if (!fs.existsSync(dest) || !fs.readFileSync(dest).equals(fs.readFileSync(src))) out.push(rel)
  }
  const kitCopy = path.join(bootstrap, KIT_DIR)
  if (fs.existsSync(kitCopy)) {
    for (const abs of walk(kitCopy)) {
      const rel = path.relative(bootstrap, abs).split(path.sep).join('/')
      if (!files.has(rel)) out.push(rel)
    }
  }
  return out.sort()
}

export function sync(root = ROOT, bootstrap = BOOTSTRAP) {
  fs.rmSync(path.join(bootstrap, KIT_DIR), { recursive: true, force: true })
  for (const [rel, src] of plan(root)) {
    const dest = path.join(bootstrap, rel)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--check')) {
    const d = drift()
    if (d.length) {
      console.error(`bootstrap templates drifted:\n  ${d.join('\n  ')}\nrun: npm run sync:templates`)
      process.exit(1)
    }
    console.log('bootstrap templates are aligned')
  } else {
    sync()
    console.log('bootstrap templates synced')
  }
}
