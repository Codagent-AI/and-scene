#!/usr/bin/env node
// Mirror canonical kit and scaffolded scripts into the bootstrap template (`npm run sync:templates`).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const B = 'skills/presentation/templates/bootstrap'
// Directories mirrored canonical -> bootstrap template (test files excluded).
export const TEMPLATE_DIRS = [{ from: 'src/presentation-kit', to: `${B}/src/presentation-kit` }]
// Single files mirrored canonical -> bootstrap template.
export const TEMPLATE_FILES = [
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'scripts/lib/diagnostics.mjs',
  'scripts/lib/preview.mjs',
]

const isTest = (f) => /\.test\.[cm]?[jt]sx?$/.test(f)

export function listSyncedFiles(root, dir) {
  const out = []
  const walk = (d) => {
    for (const e of fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }) : []) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (!isTest(e.name)) out.push(path.relative(path.join(root, dir), p))
    }
  }
  walk(path.join(root, dir))
  return out.sort()
}

/** Returns differing/missing/extra files as repo-relative template paths. */
export function findDrift(root) {
  const drift = []
  const same = (a, b) => fs.existsSync(a) && fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b))
  for (const { from, to } of TEMPLATE_DIRS) {
    for (const rel of new Set([...listSyncedFiles(root, from), ...listSyncedFiles(root, to)])) {
      if (!same(path.join(root, from, rel), path.join(root, to, rel))) drift.push(path.join(to, rel))
    }
  }
  for (const f of TEMPLATE_FILES) {
    if (!same(path.join(root, f), path.join(root, B, f))) drift.push(path.join(B, f))
  }
  return drift
}

/** Copy canonical -> template. */
export function syncTemplates(root) {
  for (const { from, to } of TEMPLATE_DIRS) {
    fs.rmSync(path.join(root, to), { recursive: true, force: true })
    for (const rel of listSyncedFiles(root, from)) {
      fs.mkdirSync(path.dirname(path.join(root, to, rel)), { recursive: true })
      fs.copyFileSync(path.join(root, from, rel), path.join(root, to, rel))
    }
  }
  for (const f of TEMPLATE_FILES) {
    fs.mkdirSync(path.dirname(path.join(root, B, f)), { recursive: true })
    fs.copyFileSync(path.join(root, f), path.join(root, B, f))
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  syncTemplates(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'))
  console.log('templates synced')
}
