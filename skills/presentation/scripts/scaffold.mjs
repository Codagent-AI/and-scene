#!/usr/bin/env node
// Deterministic helpers for the presentation skill. Templates are resolved
// relative to this file (the skill directory), never the caller's cwd.
//
//   node scaffold.mjs detect <dir>
//   node scaffold.mjs bootstrap <dir> [--confirmed] [--no-install]
//   node scaffold.mjs new <appDir> <slug> <Title>
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BOOTSTRAP = path.join(skillDir, 'templates', 'bootstrap')
const PRESENTATION = path.join(skillDir, 'templates', 'presentation')
const IGNORED = new Set(['.git', 'node_modules', 'dist', '.DS_Store'])

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return undefined
  }
}
const anyExists = (dir, names) => names.map((n) => path.join(dir, n)).find((p) => existsSync(p))

/** Contract-level anchor detection: presence of the contract, not a byte-identical scaffold. */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const build = Boolean(pkg?.scripts?.build && deps.vite && deps.react && deps.typescript)
  const kitIndex = anyExists(path.join(dir, 'src', 'presentation-kit'), ['index.ts', 'index.tsx'])
  const kit = Boolean(kitIndex && /\bPresentation\b/.test(readFileSync(kitIndex, 'utf8')))
  const registry = anyExists(path.join(dir, 'src', 'presentations'), ['index.ts', 'index.tsx'])
  const index = Boolean(registry && /\bslug\b/.test(readFileSync(registry, 'utf8')))
  return { build, kit, index }
}

const complete = (a) => a.build && a.kit && a.index

function isMonorepo(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  return Boolean(
    pkg?.workspaces ||
      existsSync(path.join(dir, 'pnpm-workspace.yaml')) ||
      existsSync(path.join(dir, 'packages')) ||
      existsSync(path.join(dir, 'apps')),
  )
}

const isEmpty = (dir) => !existsSync(dir) || readdirSync(dir).filter((f) => !IGNORED.has(f)).length === 0

/** Resolve where the presentation app lives and what must be scaffolded there. */
export function detect(dir) {
  dir = path.resolve(dir)
  const here = detectAnchors(dir)
  const nested = path.join(dir, 'presentations')
  const nestedAnchors = detectAnchors(nested)
  const empty = isEmpty(dir)
  let target = dir
  let reason = 'standalone or empty project: scaffold at the root'
  let anchors = here
  if (complete(here)) {
    reason = 'already a presentation app: all anchors present'
  } else if (complete(nestedAnchors)) {
    target = nested
    anchors = nestedAnchors
    reason = 'monorepo: existing presentations/ app has all anchors'
  } else if (!empty && isMonorepo(dir)) {
    target = nested
    anchors = nestedAnchors
    reason = 'monorepo: scaffold a self-contained app under presentations/'
  } else if (!empty && !here.kit && !here.index) {
    reason = 'standalone project: scaffold missing anchors at the root'
  }
  const missing = Object.entries(anchors).filter(([, ok]) => !ok).map(([k]) => k)
  const nonEmpty = !isEmpty(dir)
  return {
    root: dir,
    target,
    reason,
    anchors,
    missing,
    monorepo: isMonorepo(dir),
    nonEmpty,
    needsScaffold: missing.length > 0,
    // Non-empty projects missing the kit or index need the user's confirmation first.
    confirmationRequired: missing.length > 0 && nonEmpty && (missing.includes('kit') || missing.includes('index')),
  }
}

const ANCHOR_FILES = {
  build: ['index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js', '.gitignore', 'public', 'scripts', 'package-lock.json', 'src/index.css'],
  kit: ['src/presentation-kit'],
  index: ['src/presentations', 'src/main.tsx', 'src/Router.tsx', 'src/Landing.tsx'],
}

function copyMissing(from, to) {
  if (statSync(from).isDirectory()) {
    mkdirSync(to, { recursive: true })
    for (const f of readdirSync(from)) copyMissing(path.join(from, f), path.join(to, f))
  } else if (!existsSync(to)) {
    mkdirSync(path.dirname(to), { recursive: true })
    cpSync(from, to)
  }
}

/** Merge template dependencies and scripts into an existing package.json without removing anything. */
function mergePackage(target) {
  const template = readJson(path.join(BOOTSTRAP, 'package.json'))
  const file = path.join(target, 'package.json')
  const pkg = readJson(file)
  if (!pkg) {
    writeFileSync(file, JSON.stringify(template, null, 2) + '\n')
    return
  }
  const present = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})])
  for (const section of ['dependencies', 'devDependencies']) {
    for (const [name, range] of Object.entries(template[section])) {
      if (!present.has(name)) (pkg[section] ??= {})[name] = range
    }
  }
  pkg.scripts ??= {}
  for (const [name, cmd] of Object.entries(template.scripts)) pkg.scripts[name] ??= cmd
  pkg.type ??= 'module'
  writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n')
}

export function bootstrap(dir, { confirmed = false, install = true } = {}) {
  const plan = detect(dir)
  if (!plan.needsScaffold) return { ...plan, wrote: [] }
  if (plan.confirmationRequired && !confirmed) {
    const err = new Error(`target ${plan.target} is non-empty; confirm with the user, then re-run with --confirmed`)
    err.code = 'CONFIRMATION_REQUIRED'
    err.plan = plan
    throw err
  }
  mkdirSync(plan.target, { recursive: true })
  const wrote = []
  for (const anchor of plan.missing) {
    for (const rel of ANCHOR_FILES[anchor]) {
      if (anchor === 'build' && rel === 'package-lock.json' && existsSync(path.join(plan.target, 'package.json'))) continue
      copyMissing(path.join(BOOTSTRAP, rel), path.join(plan.target, rel))
      wrote.push(rel)
    }
  }
  mergePackage(plan.target)
  if (install) {
    const res = spawnSync('npm', ['install'], { cwd: plan.target, stdio: 'inherit' })
    if (res.status !== 0) throw new Error('npm install failed')
  }
  return { ...plan, wrote }
}

const fill = (text, vars) => text.replace(/__([A-Z]+)__/g, (_, k) => vars[k] ?? `__${k}__`)

/** Create src/presentations/<slug>/ from the presentation templates and register it. */
export function newPresentation(appDir, slug, title) {
  if (!/^[a-z][a-z0-9-]*$/.test(slug)) throw new Error(`slug must be lowercase kebab-case starting with a letter: ${slug}`)
  const registry = anyExists(path.join(appDir, 'src', 'presentations'), ['index.ts'])
  if (!registry) throw new Error(`no presentation index in ${appDir}; run bootstrap first`)
  const folder = path.join(path.dirname(registry), slug)
  if (existsSync(folder)) throw new Error(`presentation "${slug}" already exists`)
  const source = readFileSync(registry, 'utf8')
  if (new RegExp(`slug:\\s*['"]${slug}['"]`).test(source)) throw new Error(`slug "${slug}" is already registered`)
  const vars = { SLUG: slug, TITLE: title.replace(/\s+/g, ' ').replace(/\*\//g, '* /'), TITLEJS: JSON.stringify(title), PREFIX: slug }
  const walk = (dir, rel = '') =>
    readdirSync(dir).flatMap((f) => {
      const p = path.join(dir, f)
      return statSync(p).isDirectory() ? walk(p, path.join(rel, f)) : [path.join(rel, f)]
    })
  const files = []
  for (const rel of walk(PRESENTATION)) {
    if (rel === 'registry-entry.txt.tmpl') continue
    const out = path.join(folder, rel.replace(/\.tmpl$/, ''))
    mkdirSync(path.dirname(out), { recursive: true })
    writeFileSync(out, fill(readFileSync(path.join(PRESENTATION, rel), 'utf8'), vars))
    files.push(path.relative(appDir, out))
  }
  const entry = fill(readFileSync(path.join(PRESENTATION, 'registry-entry.txt.tmpl'), 'utf8'), vars)
  const close = source.lastIndexOf('\n]')
  if (close === -1) throw new Error('could not find the end of the PRESENTATIONS array in the registry')
  writeFileSync(registry, source.slice(0, close + 1) + entry + source.slice(close + 1))
  return { folder: path.relative(appDir, folder), files, route: `/${slug}` }
}

function main(argv) {
  const [cmd, ...rest] = argv
  const flags = new Set(rest.filter((a) => a.startsWith('--')))
  const args = rest.filter((a) => !a.startsWith('--'))
  try {
    if (cmd === 'detect') console.log(JSON.stringify(detect(args[0] ?? '.'), null, 2))
    else if (cmd === 'bootstrap') {
      console.log(JSON.stringify(bootstrap(args[0] ?? '.', { confirmed: flags.has('--confirmed'), install: !flags.has('--no-install') }), null, 2))
    } else if (cmd === 'new') {
      if (args.length < 3) throw new Error('usage: scaffold.mjs new <appDir> <slug> <Title>')
      console.log(JSON.stringify(newPresentation(args[0], args[1], args.slice(2).join(' ')), null, 2))
    } else throw new Error('usage: scaffold.mjs detect|bootstrap|new ...')
  } catch (err) {
    console.error(`[scaffold] ${err.message}`)
    process.exitCode = err.code === 'CONFIRMATION_REQUIRED' ? 2 : 1
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2))
