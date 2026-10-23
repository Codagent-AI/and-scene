#!/usr/bin/env node
// Keep the skill's bootstrap template byte-aligned with the canonical scene kit
// and the shared app shell and scripts.
//
//   npm run sync:templates            copy canonical files into the template
//   npm run sync:templates -- --check list differences and exit non-zero
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const template = path.join(root, 'skills', 'presentation', 'templates', 'bootstrap')

/** Canonical paths that the bootstrap template copies verbatim (dirs are mirrored). */
export const SHARED = [
  'src/presentation-kit',
  'src/main.tsx',
  'src/AppRouter.tsx',
  'src/Landing.tsx',
  'src/route.ts',
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'scripts/lib',
]

function files(dir, rel = '') {
  const abs = path.join(dir, rel)
  if (!fs.existsSync(abs)) return []
  if (!fs.statSync(abs).isDirectory()) return [rel]
  return fs.readdirSync(abs).flatMap((n) => files(dir, path.join(rel, n)))
}

const check = process.argv.includes('--check')
const problems = []
for (const item of SHARED) {
  const from = files(root, item)
  const to = files(template, item)
  for (const rel of from) {
    const a = path.join(root, rel)
    const b = path.join(template, rel)
    if (!fs.existsSync(b) || !fs.readFileSync(a).equals(fs.readFileSync(b))) {
      problems.push(`differs: ${rel}`)
      if (!check) {
        fs.mkdirSync(path.dirname(b), { recursive: true })
        fs.copyFileSync(a, b)
      }
    }
  }
  for (const rel of to.filter((r) => !from.includes(r))) {
    problems.push(`extra in template: ${rel}`)
    if (!check) fs.rmSync(path.join(template, rel))
  }
}
if (check && problems.length > 0) {
  console.error(problems.join('\n'))
  process.exitCode = 1
} else {
  console.log(check ? 'template is in sync' : `synced ${problems.length} file(s)`)
}
