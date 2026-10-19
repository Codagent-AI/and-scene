#!/usr/bin/env node
// Keeps the bootstrap template's copies of the canonical kit and verification scripts byte-identical.
//   node scripts/sync-templates.mjs           copy canonical files into the template
//   node scripts/sync-templates.mjs --check   exit 1 if the template has drifted
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const templateRoot = join(repoRoot, 'skills', 'presentation', 'templates', 'bootstrap')

/** Files and trees mirrored byte-for-byte. `scripts/verify.reference.json` is deliberately absent. */
export const MIRRORS = [
  { path: 'src/presentation-kit', tree: true },
  { path: 'scripts/verify.mjs', tree: false },
  { path: 'scripts/inspect-presentation.mjs', tree: false },
  { path: 'scripts/lib', tree: true },
]

function listFiles(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listFiles(full))
    else if (entry.isFile()) out.push(full)
  }
  return out
}

/** Relative (posix) path -> absolute path for every file a mirror covers under `base`. */
function collect(base, mirror) {
  const abs = join(base, mirror.path)
  const files = mirror.tree ? listFiles(abs) : existsSync(abs) ? [abs] : []
  return new Map(files.map((f) => [relative(base, f).split('\\').join('/'), f]))
}

export function planSync(source = repoRoot, target = templateRoot) {
  const copy = []
  const remove = []
  const drift = []
  for (const mirror of MIRRORS) {
    const src = collect(source, mirror)
    const dst = collect(target, mirror)
    for (const [rel, abs] of src) {
      if (!dst.has(rel)) {
        copy.push({ rel, from: abs })
        drift.push(`missing in template: ${rel}`)
      } else if (!readFileSync(abs).equals(readFileSync(dst.get(rel)))) {
        copy.push({ rel, from: abs })
        drift.push(`differs: ${rel}`)
      }
    }
    for (const [rel, abs] of dst) {
      if (!src.has(rel)) {
        remove.push({ rel, path: abs })
        drift.push(`extra in template: ${rel}`)
      }
    }
  }
  return { copy, remove, drift }
}

export function syncTemplates({ check = false, source = repoRoot, target = templateRoot } = {}) {
  const plan = planSync(source, target)
  if (!check) {
    for (const { rel, from } of plan.copy) {
      const to = join(target, rel)
      mkdirSync(dirname(to), { recursive: true })
      writeFileSync(to, readFileSync(from))
    }
    for (const { path } of plan.remove) rmSync(path)
  }
  return plan
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check')
  const plan = syncTemplates({ check })
  if (check) {
    if (plan.drift.length > 0) {
      console.error(`template drift (run \`npm run sync:templates\`):\n  ${plan.drift.join('\n  ')}`)
      process.exit(1)
    }
    console.log('templates are in sync')
  } else {
    console.log(`synced ${plan.copy.length} file(s), removed ${plan.remove.length}`)
  }
}
