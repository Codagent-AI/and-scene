// Keep the canonical kit and shared scripts byte-aligned with the bootstrap template snapshot.
//   node scripts/sync-templates.mjs           copy canonical files into the template
//   node scripts/sync-templates.mjs --check   exit 1 if any copy differs
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const TEMPLATE = join(ROOT, 'skills', 'presentation', 'templates', 'bootstrap')

/** Paths (relative to the project root) that exist in both the repo and the bootstrap template. */
export const SHARED = [
  'src/presentation-kit',
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'scripts/lib/preview.mjs',
]

function filesUnder(path) {
  if (!existsSync(path)) return []
  if (!statSync(path).isDirectory()) return ['']
  return readdirSync(path, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => relative(path, join(e.parentPath, e.name)))
}

export function findDrift(root = ROOT, template = TEMPLATE) {
  const drift = []
  for (const shared of SHARED) {
    const a = join(root, shared)
    const b = join(template, shared)
    const names = new Set([...filesUnder(a), ...filesUnder(b)])
    for (const name of names) {
      const fa = join(a, name)
      const fb = join(b, name)
      if (!existsSync(fa) || !existsSync(fb) || !readFileSync(fa).equals(readFileSync(fb))) {
        drift.push(join(shared, name))
      }
    }
  }
  return drift
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const drift = findDrift()
    if (drift.length) {
      console.error(`template drift:\n${drift.map((d) => `  ${d}`).join('\n')}`)
      process.exit(1)
    }
    console.log('templates are in sync')
  } else {
    for (const shared of SHARED) {
      rmSync(join(TEMPLATE, shared), { recursive: true, force: true })
      mkdirSync(dirname(join(TEMPLATE, shared)), { recursive: true })
      cpSync(join(ROOT, shared), join(TEMPLATE, shared), { recursive: true })
    }
    console.log('templates synced')
  }
}
