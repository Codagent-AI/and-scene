import fs from 'node:fs'
import path from 'node:path'

const B = 'skills/presentation/templates/bootstrap'
// Directories mirrored canonical -> bootstrap template (test files excluded).
export const TEMPLATE_PAIRS = [
  { from: 'src/presentation-kit', to: `${B}/src/presentation-kit` },
  { from: 'scripts/lib', to: `${B}/scripts/lib` },
]
// Single files mirrored canonical -> bootstrap template.
export const TEMPLATE_FILES = ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']

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

/** Returns the list of differing/missing/extra files (repo-relative template paths). */
export function findDrift(root) {
  const drift = []
  const same = (a, b) => fs.existsSync(a) && fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b))
  for (const { from, to } of TEMPLATE_PAIRS) {
    const canon = listSyncedFiles(root, from)
    const tmpl = listSyncedFiles(root, to)
    for (const rel of new Set([...canon, ...tmpl])) {
      if (!same(path.join(root, from, rel), path.join(root, to, rel))) drift.push(path.join(to, rel))
    }
  }
  for (const f of TEMPLATE_FILES) {
    if (!same(path.join(root, f), path.join(root, B, f))) drift.push(path.join(B, f))
  }
  return drift
}
