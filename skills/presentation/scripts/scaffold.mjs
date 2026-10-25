#!/usr/bin/env node
// Scaffolds the missing presentation anchors (build setup, scene kit, presentation index).
// Usage: node scaffold.mjs [--cwd dir] [--dry-run] [--install]
// Never overwrites an existing file; merges missing dependencies and scripts into package.json.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { ANCHOR_PATHS, BOOTSTRAP_DIR, filesIn, requiredDependencies, resolveTarget } from './lib.mjs'

function mergePackageJson(file) {
  const required = requiredDependencies()
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'))
  const added = []
  for (const section of ['dependencies', 'devDependencies']) {
    const have = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const [name, range] of Object.entries(required[section])) {
      if (have[name]) continue
      pkg[section] = { ...pkg[section], [name]: range }
      added.push(name)
    }
  }
  for (const [name, command] of Object.entries(required.scripts)) {
    if (pkg.scripts?.[name]) continue
    pkg.scripts = { ...pkg.scripts, [name]: command }
    added.push(`script:${name}`)
  }
  if (added.length) fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
  return added
}

export function scaffold({ cwd, dryRun = false }) {
  const plan = resolveTarget(cwd)
  const written = []
  const skipped = []
  const wire = []
  const { target } = plan
  const packageJsonExisted = fs.existsSync(path.join(target, 'package.json'))

  for (const anchor of plan.missing) {
    for (const entry of ANCHOR_PATHS[anchor]) {
      const src = path.join(BOOTSTRAP_DIR, entry)
      if (!fs.existsSync(src)) continue
      const files = fs.statSync(src).isDirectory() ? filesIn(src) : [src]
      for (const file of files) {
        const rel = path.relative(BOOTSTRAP_DIR, file)
        const dest = path.join(target, rel)
        // A host that already has its own lockfile or entry point keeps it.
        if (fs.existsSync(dest) || (rel === 'package-lock.json' && packageJsonExisted)) {
          skipped.push(rel)
          if (rel === 'src/main.tsx') wire.push('src/main.tsx already exists: render <App pathname={window.location.pathname} /> from src/App.tsx')
          continue
        }
        written.push(rel)
        if (dryRun) continue
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.copyFileSync(file, dest)
      }
    }
  }

  let dependenciesAdded = []
  const pkgFile = path.join(target, 'package.json')
  if (!dryRun && fs.existsSync(pkgFile) && plan.missing.length > 0) dependenciesAdded = mergePackageJson(pkgFile)
  return { ...plan, written, skipped, wire, dependenciesAdded, dryRun }
}

function main() {
  const args = process.argv.slice(2)
  const flag = (name) => args.includes(name)
  const cwd = args.includes('--cwd') ? args[args.indexOf('--cwd') + 1] : process.cwd()
  const report = scaffold({ cwd, dryRun: flag('--dry-run') })
  if (flag('--install') && !report.dryRun && report.missing.length > 0) {
    for (const cmd of [['npm', ['install']], ['npx', ['playwright', 'install', 'chromium']]]) {
      const res = spawnSync(cmd[0], cmd[1], { cwd: report.target, stdio: 'inherit' })
      if (res.status !== 0) process.exit(res.status ?? 1)
    }
  }
  console.log(JSON.stringify(report, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) main()
