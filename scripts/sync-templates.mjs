// Keeps the bootstrap template byte-aligned with the canonical kit and scripts.
//   node scripts/sync-templates.mjs          copy canonical files into the template
//   node scripts/sync-templates.mjs --check  exit non-zero if they have drifted
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const BOOTSTRAP = path.join('skills', 'presentation', 'templates', 'bootstrap')

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p, base) : [path.relative(base, p)]
  })
}

const isTest = (f) => /\.test\.[cm]?[jt]sx?$/.test(f)

/** Canonical -> template file pairs (repo-relative) that must stay identical. */
export function alignedPairs(root) {
  const pairs = []
  const tree = (from, to, keep = () => true) => {
    for (const f of walk(path.join(root, from))) {
      if (keep(f)) pairs.push([path.join(from, f), path.join(to, f)])
    }
  }
  tree(path.join('src', 'presentation-kit'), path.join(BOOTSTRAP, 'src', 'presentation-kit'), (f) => !isTest(f))
  tree(path.join('scripts', 'lib'), path.join(BOOTSTRAP, 'scripts', 'lib'))
  for (const f of ['verify.mjs', 'inspect-presentation.mjs']) {
    pairs.push([path.join('scripts', f), path.join(BOOTSTRAP, 'scripts', f)])
  }
  for (const f of ['main.tsx', 'Landing.tsx']) {
    pairs.push([path.join('src', f), path.join(BOOTSTRAP, 'src', f)])
  }
  return pairs
}

/** Template files under aligned directories that no longer exist canonically. */
export function strayTemplateFiles(root) {
  const expected = new Set(alignedPairs(root).map(([, to]) => to))
  return [
    path.join(BOOTSTRAP, 'src', 'presentation-kit'),
    path.join(BOOTSTRAP, 'scripts'),
  ].flatMap((d) => walk(path.join(root, d)).map((f) => path.join(d, f))).filter((f) => !expected.has(f))
}

export function driftedPairs(root) {
  return alignedPairs(root).filter(([from, to]) => {
    const dest = path.join(root, to)
    return !fs.existsSync(dest) || !fs.readFileSync(path.join(root, from)).equals(fs.readFileSync(dest))
  })
}

function main() {
  const root = path.resolve(import.meta.dirname, '..')
  const check = process.argv.includes('--check')
  const drifted = driftedPairs(root)
  const stray = strayTemplateFiles(root)
  if (check) {
    for (const [, to] of drifted) console.error(`[sync] out of date: ${to}`)
    for (const f of stray) console.error(`[sync] stray template file: ${f}`)
    if (drifted.length || stray.length) process.exitCode = 1
    else console.log('[sync] templates are aligned')
    return
  }
  for (const [from, to] of drifted) {
    fs.mkdirSync(path.dirname(path.join(root, to)), { recursive: true })
    fs.copyFileSync(path.join(root, from), path.join(root, to))
    console.log(`[sync] ${to}`)
  }
  for (const f of stray) {
    fs.rmSync(path.join(root, f))
    console.log(`[sync] removed ${f}`)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
