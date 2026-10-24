#!/usr/bin/env node
// Scaffolds the missing anchors of a presentation app from templates/bootstrap/ (resolved
// relative to this skill), without overwriting anything that already exists.
//
//   node scaffold.mjs <project-dir>    -> detects the target, scaffolds it, prints JSON
//
// Run it only after the user has confirmed the target when `confirmRequired` is true.
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectTarget } from './detect-target.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
export const BOOTSTRAP = join(HERE, '..', 'templates', 'bootstrap')

const BUILD_FILES = [
  'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js',
  'index.html', 'public', 'src/index.css', '.gitignore', '.npmrc', 'verify.config.json',
]
const SCRIPT_FILES = ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/preview.mjs']
const KIT_FILES = ['src/presentation-kit']
const INDEX_FILES = ['src/presentations/index.ts', 'src/router.ts', 'src/Landing.tsx']

/** Copies a file or directory from the template, skipping any file that already exists. */
function copyMissing(name, target, report) {
  const from = join(BOOTSTRAP, name)
  const to = join(target, name)
  if (statSync(from).isDirectory()) {
    cpSync(from, to, {
      recursive: true,
      force: false,
      errorOnExist: false,
      filter: (src) => {
        const dest = join(to, src.slice(from.length))
        if (statSync(src).isDirectory() || !existsSync(dest)) return true
        report.skipped.push(join(name, src.slice(from.length + 1)))
        return false
      },
    })
    report.copied.push(name)
  } else if (existsSync(to)) {
    report.skipped.push(name)
  } else {
    mkdirSync(dirname(to), { recursive: true })
    cpSync(from, to)
    report.copied.push(name)
  }
}

/** Adds template dependencies and scripts that are absent; existing entries are never changed. */
function mergePackage(target, report) {
  const file = join(target, 'package.json')
  const template = JSON.parse(readFileSync(join(BOOTSTRAP, 'package.json'), 'utf8'))
  if (!existsSync(file)) {
    cpSync(join(BOOTSTRAP, 'package.json'), file)
    cpSync(join(BOOTSTRAP, 'package-lock.json'), join(target, 'package-lock.json'))
    report.copied.push('package.json', 'package-lock.json')
    return
  }
  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  const present = new Set(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }))
  for (const section of ['dependencies', 'devDependencies']) {
    for (const [name, version] of Object.entries(template[section] ?? {})) {
      if (present.has(name)) continue
      pkg[section] = { ...pkg[section], [name]: version }
      report.addedDependencies.push(name)
    }
  }
  for (const [name, command] of Object.entries(template.scripts)) {
    if (pkg.scripts?.[name]) continue
    pkg.scripts = { ...pkg.scripts, [name]: command }
    report.addedScripts.push(name)
  }
  if (pkg.type !== template.type) {
    report.wiring.push(`package.json: "type" is ${JSON.stringify(pkg.type ?? 'commonjs')}, the app is ESM; left unchanged, so scaffold into a self-contained directory or resolve it`)
  }
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
  report.copied.push('package.json (merged)')
}

/**
 * Scaffolds `missing` anchors into `target`. An existing `src/main.tsx` that does not use the
 * route registry cannot be rewritten safely, so it is reported in `wiring` for a scoped edit.
 */
export function scaffold(target, missing) {
  const report = { copied: [], skipped: [], addedDependencies: [], addedScripts: [], wiring: [] }
  if (missing.length === 0) return report
  mkdirSync(target, { recursive: true })
  if (missing.includes('build')) BUILD_FILES.forEach((f) => copyMissing(f, target, report))
  if (missing.includes('kit')) KIT_FILES.forEach((f) => copyMissing(f, target, report))
  if (missing.includes('index')) INDEX_FILES.forEach((f) => copyMissing(f, target, report))
  SCRIPT_FILES.forEach((f) => copyMissing(f, target, report))
  mergePackage(target, report)

  const main = join(target, 'src', 'main.tsx')
  if (!existsSync(main)) copyMissing('src/main.tsx', target, report)
  else if (!/resolveRoute/.test(readFileSync(main, 'utf8'))) {
    report.wiring.push('src/main.tsx: route "/<slug>" to the lazy presentation from src/presentations (see templates/bootstrap/src/main.tsx)')
  }
  return report
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const detected = detectTarget(process.argv[2] ?? process.cwd())
  const report = scaffold(detected.target, detected.missing)
  console.log(JSON.stringify({ target: detected.target, missing: detected.missing, ...report }, null, 2))
}
