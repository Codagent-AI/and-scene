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

const SOURCE = /\.(ts|tsx|js|jsx)$/

function sourceFiles(dir, depth = 5) {
  if (depth < 0 || !existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return IGNORED.has(e.name) ? [] : sourceFiles(p, depth - 1)
    return SOURCE.test(e.name) ? [p] : []
  })
}

const stem = (file) => file.replace(SOURCE, '')

/**
 * Contract-level inspection: anchors are recognized by what the code exports and does,
 * not by prescribed file names, so cosmetic renames and formatting do not trigger re-scaffolding.
 */
export function inspectApp(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const build = Boolean(pkg?.scripts?.build && deps.vite && deps.react && deps.typescript)
  const files = sourceFiles(path.join(dir, 'src')).map((file) => ({ file, text: readFileSync(file, 'utf8') }))
  // Scene kit: a directory whose index exports Presentation plus the navigation/stage engine.
  const kitIndex = files.find(
    ({ file, text }) => /^index\./.test(path.basename(file)) && /\bPresentation\b/.test(text) && /\b(usePresentationNav|Stage)\b/.test(text),
  )
  const kitDir = kitIndex && path.dirname(kitIndex.file)
  const outside = files.filter(({ file }) => !kitDir || !file.startsWith(kitDir + path.sep))
  // Presentation index: a registry of { slug, load: () => import(...) } entries ...
  const registry = outside.find(({ text }) => /\bslug\s*:/.test(text) && /\bimport\(/.test(text))
  // ... plus a router that resolves the location pathname to a registered presentation ...
  const routing = outside.find(({ file, text }) => file !== registry?.file && /location\.pathname/.test(text) && /\.load\b|lazy\(/.test(text))
  // ... that the app entry actually mounts.
  const entry = files.find(({ file }) => /^main\.(tsx|ts|jsx|js)$/.test(path.basename(file)) && path.dirname(file) === path.join(dir, 'src'))
  const entryWired = Boolean(entry && routing && entry.text.includes(path.basename(stem(routing.file))))
  return {
    anchors: { build, kit: Boolean(kitDir), index: Boolean(registry && routing) },
    kitDir,
    registry: registry?.file,
    routing: routing?.file,
    entry: entry?.file,
    entryWired,
  }
}

export const detectAnchors = (dir) => inspectApp(dir).anchors

const complete = (a) => a.build && a.kit && a.index
const missing_ = (a) => Object.values(a).filter((ok) => !ok).length

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
  const inspected = inspectApp(target)
  const needsWiring = missing_(anchors) === 0 && Boolean(inspected.entry) && !inspected.entryWired
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
    registry: inspected.registry,
    kitDir: inspected.kitDir,
    entryWired: inspected.entryWired,
    needsWiring,
    needsScaffold: missing.length > 0 || needsWiring,
    // Non-empty projects missing the kit or index (or needing the entry wired) need the user's confirmation first.
    confirmationRequired: nonEmpty && (missing.includes('kit') || missing.includes('index') || needsWiring),
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

const ENTRY_IMPORT = /^import .*$/gm

/** Mount the router in an existing app entry, keeping the host app as the fallback route. */
function wireEntry(plan) {
  const { entry, routing } = inspectApp(plan.target)
  const text = readFileSync(entry, 'utf8')
  const spec = posixRelative(path.dirname(entry), routing)
  const hostElement = /(\.render\(\s*(?:<StrictMode>\s*)?)(<([A-Z]\w*)\b[^>]*?\/>)/.exec(text)
  const routerText = readFileSync(routing, 'utf8')
  if (!hostElement || !/\bfallback\b/.test(routerText)) {
    const err = new Error(`could not wire ${entry} to ${routing} automatically; render the router there (host app as its fallback) and re-run detect`)
    err.code = 'WIRING_REQUIRED'
    throw err
  }
  const imports = [...text.matchAll(ENTRY_IMPORT)]
  const last = imports[imports.length - 1]
  const at = last ? last.index + last[0].length : 0
  const withImport = `${text.slice(0, at)}\nimport Router from '${spec}'${text.slice(at)}`
  const patched = withImport.replace(hostElement[2], `<Router fallback={${hostElement[2]}} />`)
  writeFileSync(entry, patched)
}

export function bootstrap(dir, { confirmed = false, install = true } = {}) {
  const plan = detect(dir)
  if (!plan.needsScaffold) return { ...plan, wrote: [] }
  if (plan.confirmationRequired && !confirmed) {
    const err = new Error(`target ${plan.target} needs the user's confirmation before writing into a non-empty project; confirm, then re-run with --confirmed`)
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
  // package.json scripts point at scripts/, so make sure those files exist in every scaffold.
  copyMissing(path.join(BOOTSTRAP, 'scripts'), path.join(plan.target, 'scripts'))
  const after = inspectApp(plan.target)
  if (after.registry && path.relative(plan.target, after.registry) !== path.join('src', 'presentations', 'index.ts')) {
    const configFile = path.join(plan.target, 'scripts', 'verify.config.json')
    const config = readJson(configFile) ?? { required: [] }
    config.registry ??= path.relative(plan.target, after.registry).split(path.sep).join('/')
    writeFileSync(configFile, JSON.stringify(config, null, 2) + '\n')
  }
  mergePackage(plan.target)
  if (after.entry && !after.entryWired) {
    wireEntry(plan)
    wrote.push(path.relative(plan.target, after.entry))
  }
  if (install) {
    const res = spawnSync('npm', ['install'], { cwd: plan.target, stdio: 'inherit' })
    if (res.status !== 0) throw new Error('npm install failed')
  }
  return { ...plan, wrote }
}

const fill = (text, vars) => text.replace(/__([A-Z0-9]+)__/g, (_, k) => vars[k] ?? `__${k}__`)

const posixRelative = (from, to) => {
  const rel = path.relative(from, to).split(path.sep).join('/')
  return rel.startsWith('.') ? rel : `./${rel}`
}

/** Insert `entry` before the `]` closing the array that holds the registry's `slug:` entries. */
export function insertRegistryEntry(source, entry) {
  const first = source.search(/\bslug\s*:\s*['"`]/)
  if (first === -1) throw new Error('registry has no entries to anchor the insertion on')
  let depth = 0
  let open = -1
  for (let i = first; i >= 0 && open === -1; i--) {
    if (source[i] === ']') depth++
    else if (source[i] === '[') {
      if (depth === 0) open = i
      else depth--
    }
  }
  if (open === -1) throw new Error('could not find the registry array')
  depth = 0
  let close = -1
  for (let i = open; i < source.length && close === -1; i++) {
    if (source[i] === '[') depth++
    else if (source[i] === ']' && --depth === 0) close = i
  }
  if (close === -1) throw new Error('could not find the end of the registry array')
  const head = source.slice(0, close).replace(/\s+$/, '')
  const comma = /[},]$/.test(head) && !head.endsWith(',') ? ',' : ''
  return `${head}${comma}\n${entry.replace(/\s+$/, '')}\n${source.slice(close)}`
}

/** Create <presentations dir>/<slug>/ from the presentation templates and register it. */
export function newPresentation(appDir, slug, title) {
  if (!/^[a-z][a-z0-9-]*$/.test(slug)) throw new Error(`slug must be lowercase kebab-case starting with a letter: ${slug}`)
  const { registry, kitDir } = inspectApp(appDir)
  if (!registry || !kitDir) throw new Error(`no presentation index or scene kit in ${appDir}; run bootstrap first`)
  const folder = path.join(path.dirname(registry), slug)
  if (existsSync(folder)) throw new Error(`presentation "${slug}" already exists`)
  const source = readFileSync(registry, 'utf8')
  if (new RegExp(`slug:\\s*['"]${slug}['"]`).test(source)) throw new Error(`slug "${slug}" is already registered`)
  const vars = {
    SLUG: slug,
    TITLE: title.replace(/\s+/g, ' ').replace(/\*\//g, '* /'),
    TITLEJS: JSON.stringify(title),
    PREFIX: slug,
    KIT: posixRelative(folder, kitDir),
    KIT2: posixRelative(path.join(folder, 'steps'), kitDir),
  }
  // Compute the registry edit first so a failure leaves nothing behind. The folder sits next to the registry.
  const updated = insertRegistryEntry(source, fill(readFileSync(path.join(PRESENTATION, 'registry-entry.txt.tmpl'), 'utf8'), vars))
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
  writeFileSync(registry, updated)
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
    process.exitCode = err.code === 'CONFIRMATION_REQUIRED' ? 2 : err.code === 'WIRING_REQUIRED' ? 3 : 1
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2))
