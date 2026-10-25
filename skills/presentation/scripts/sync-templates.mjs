#!/usr/bin/env node
// Keeps the bootstrap template byte-aligned with the canonical sources in this repo.
//   node skills/presentation/scripts/sync-templates.mjs          copy canonical files into the template
//   node skills/presentation/scripts/sync-templates.mjs --check  exit 1 when the template drifted
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP = path.join(SKILL_DIR, 'templates/bootstrap')
export const REPO = path.resolve(SKILL_DIR, '../..')

/** Canonical path (relative to the repo) -> path inside the bootstrap template. */
export const SYNCED = [
  ['src/presentation-kit', 'src/presentation-kit'],
  ['src/main.tsx', 'src/main.tsx'],
  ['src/Landing.tsx', 'src/Landing.tsx'],
  ['src/router.ts', 'src/router.ts'],
  ['src/presentations/types.ts', 'src/presentations/types.ts'],
  ['scripts/lib.mjs', 'scripts/lib.mjs'],
  ['scripts/verify.mjs', 'scripts/verify.mjs'],
  ['scripts/inspect-lib.mjs', 'scripts/inspect-lib.mjs'],
  ['scripts/inspect-presentation.mjs', 'scripts/inspect-presentation.mjs'],
]

const isTestPath = (p) => /(^|\/)__tests__(\/|$)|\.test\.[mc]?[jt]sx?$/.test(p)

function listFiles(abs, rel = '') {
  if (!existsSync(abs)) return []
  if (!statSync(abs).isDirectory()) return [rel]
  return readdirSync(abs).flatMap((n) => listFiles(path.join(abs, n), path.join(rel, n)))
}

/** Every non-test file the template must mirror, as [canonicalAbs, templateAbs]. */
export function syncedFiles() {
  return SYNCED.flatMap(([from, to]) => {
    const src = path.join(REPO, from)
    return listFiles(src)
      .filter((f) => !isTestPath(path.join(from, f)))
      .map((f) => [path.join(src, f), path.join(BOOTSTRAP, to, f)])
  })
}

/** Template files that differ from, are missing relative to, or are extra beside the canonical ones. */
export function findDrift() {
  const drift = []
  for (const [src, dest] of syncedFiles()) {
    if (!existsSync(dest)) drift.push(`missing: ${path.relative(BOOTSTRAP, dest)}`)
    else if (!readFileSync(src).equals(readFileSync(dest))) drift.push(`differs: ${path.relative(BOOTSTRAP, dest)}`)
  }
  for (const [from, to] of SYNCED) {
    const canonical = new Set(listFiles(path.join(REPO, from)).filter((f) => !isTestPath(path.join(from, f))))
    for (const f of listFiles(path.join(BOOTSTRAP, to))) {
      if (!canonical.has(f)) drift.push(`extra: ${path.join(to, f)}`)
    }
  }
  return drift
}

export function sync() {
  for (const [from, to] of SYNCED) {
    const dest = path.join(BOOTSTRAP, to)
    if (statSync(path.join(REPO, from)).isDirectory()) rmSync(dest, { recursive: true, force: true })
  }
  for (const [src, dest] of syncedFiles()) {
    mkdirSync(path.dirname(dest), { recursive: true })
    cpSync(src, dest)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const drift = findDrift()
    drift.forEach((d) => console.error(`[sync-templates] ${d}`))
    process.exitCode = drift.length ? 1 : 0
  } else {
    sync()
    console.log('[sync-templates] bootstrap template synced')
  }
}
