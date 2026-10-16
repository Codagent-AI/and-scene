#!/usr/bin/env node
// Presentation skill helper: detect scaffold anchors, scaffold what is missing, add presentations.
// Zero dependencies. Templates resolve relative to this file's skill directory, never the caller's cwd.
//
//   node scaffold.mjs detect   [dir]                        -> JSON report (writes nothing)
//   node scaffold.mjs scaffold [dir] [--confirm] [--install] -> scaffold missing anchors
//   node scaffold.mjs new <slug> "<title>" [dir]            -> create and register a presentation
//   node scaffold.mjs list     [dir]                        -> registered presentations (JSON)
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BOOTSTRAP = join(SKILL_DIR, 'templates', 'bootstrap')
const PRESENTATION_TEMPLATE = join(SKILL_DIR, 'templates', 'presentation')

const readText = (p) => readFileSync(p, 'utf8')
const readPkg = (dir) => (existsSync(join(dir, 'package.json')) ? JSON.parse(readText(join(dir, 'package.json'))) : null)

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const SOURCE_FILE = /\.(ts|tsx)$/
const sourceFiles = (app) => (existsSync(join(app, 'src')) ? walk(join(app, 'src')).filter((f) => SOURCE_FILE.test(f) && !/\.test\./.test(f)) : [])

/** Registry contract: a module mapping `slug` + `title` to a lazy `load: () => import(...)`, whatever it is named. */
const isRegistry = (text) =>
  /\bexport\s+(const|let)\s+PRESENTATIONS\b/.test(text) || (/\bslug\s*:/.test(text) && /\bload\s*:/.test(text) && /\bimport\s*\(/.test(text))
/** Kit contract: a module that exports a `Presentation` host. */
const isKitHost = (text) => /\bexport\s+(function|const)\s+Presentation\b|\bexport\s*\{[^}]*\bPresentation\b[^}]*\}/.test(text)

const registryPath = (app) => sourceFiles(app).find((f) => isRegistry(readText(f)))

/** The module a presentation imports the kit from: the kit directory's index when there is one. */
function kitEntry(app) {
  const host = sourceFiles(app).find((f) => isKitHost(readText(f)))
  if (!host) return undefined
  const index = ['index.ts', 'index.tsx'].map((n) => join(dirname(host), n)).find(existsSync)
  return index ?? host
}

const appEntryResolves = (app) => {
  const html = existsSync(join(app, 'index.html')) ? readText(join(app, 'index.html')) : ''
  const entry = /<script[^>]*\bsrc="([^"]+)"/.exec(html)?.[1]
  return Boolean(entry) && existsSync(join(app, entry.replace(/^\//, '')))
}

/** Contract-level anchor detection: keyed on what the files provide, not on file names or formatting. */
export function detectAnchors(app) {
  const pkg = readPkg(app)
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  return {
    build: Boolean(pkg?.scripts?.build && deps.vite && deps.react && deps.typescript && existsSync(join(app, 'tsconfig.json')) && appEntryResolves(app)),
    kit: Boolean(kitEntry(app)),
    index: Boolean(registryPath(app)),
  }
}

const isMonorepo = (dir) => {
  const pkg = readPkg(dir)
  return Boolean(pkg?.workspaces) || existsSync(join(dir, 'pnpm-workspace.yaml')) || ['packages', 'apps'].some((d) => existsSync(join(dir, d)))
}

const isEmpty = (dir) => !existsSync(dir) || readdirSync(dir).every((n) => n === '.git')

/** Resolves where the presentation app belongs: an existing app, `presentations/` in a monorepo, or the root. */
export function resolveTarget(dir) {
  const here = detectAnchors(dir)
  if (here.kit || here.index) return dir
  const nested = join(dir, 'presentations')
  const inNested = existsSync(nested) ? detectAnchors(nested) : null
  if (inNested && (inNested.build || inNested.kit || inNested.index)) return nested
  return isMonorepo(dir) ? nested : dir
}

export function detect(dir) {
  const target = resolveTarget(dir)
  const anchors = detectAnchors(target)
  const missing = Object.keys(anchors).filter((k) => !anchors[k])
  const monorepo = isMonorepo(dir)
  const nonEmpty = !isEmpty(dir)
  return {
    projectDir: dir,
    target,
    monorepo,
    empty: !nonEmpty,
    anchors,
    missing,
    needsScaffold: missing.length > 0,
    // A non-empty project missing the kit or index must be confirmed with the user before any write.
    needsConfirmation: nonEmpty && (!anchors.kit || !anchors.index),
  }
}

const TOOLING = ['scripts/lib.mjs', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs']
// The app entry (and the shell it imports) belongs to the build anchor: index.html cannot build without it.
const ENTRY_FILES = ['src/main.tsx', 'src/App.tsx', 'src/Landing.tsx', 'src/routes.ts', 'src/index.css']
const BUILD_FILES = ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js', 'index.html', '.npmrc', 'public/favicon.svg']
const INDEX_FILES = ['scripts/verify.config.json']

function filesFor(anchor) {
  const all = walk(BOOTSTRAP).map((f) => relative(BOOTSTRAP, f))
  if (anchor === 'build') return [...BUILD_FILES, ...ENTRY_FILES]
  if (anchor === 'kit') return all.filter((f) => f.startsWith('src/presentation-kit/'))
  return [...INDEX_FILES, ...(anchor === 'index' ? ENTRY_FILES : []), ...all.filter((f) => f.startsWith('src/presentations/'))]
}

function copyIfMissing(rel, app, report) {
  const to = join(app, rel)
  if (report.created.includes(rel)) return
  if (existsSync(to)) return report.skipped.push(rel)
  mkdirSync(dirname(to), { recursive: true })
  writeFileSync(to, readText(join(BOOTSTRAP, rel)))
  report.created.push(rel)
}

function mergePackage(app, report) {
  const template = readPkg(BOOTSTRAP)
  const path = join(app, 'package.json')
  const pkg = readPkg(app) ?? { name: 'presentations', private: true, version: '0.0.0', type: 'module' }
  pkg.scripts ??= {}
  pkg.dependencies ??= {}
  pkg.devDependencies ??= {}
  const added = []
  for (const [name, cmd] of Object.entries(template.scripts)) {
    if (!(name in pkg.scripts)) (pkg.scripts[name] = cmd), added.push(`script:${name}`)
  }
  for (const section of ['dependencies', 'devDependencies']) {
    for (const [name, version] of Object.entries(template[section])) {
      if (!(name in pkg.dependencies) && !(name in pkg.devDependencies)) (pkg[section][name] = version), added.push(name)
    }
  }
  if (added.length || !existsSync(path)) {
    writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`)
    report.merged.push(`package.json (+${added.join(', ') || 'created'})`)
  }
}

function mergeGitignore(app, report) {
  const path = join(app, '.gitignore')
  const have = existsSync(path) ? readText(path).split('\n') : []
  const missing = readText(join(BOOTSTRAP, '.gitignore')).split('\n').filter((l) => l && !have.includes(l))
  if (!missing.length) return
  writeFileSync(path, `${have.join('\n').replace(/\n*$/, '\n')}${missing.join('\n')}\n`)
  report.merged.push(`.gitignore (+${missing.join(', ')})`)
}

export function scaffold(dir, { install = false, confirm = false } = {}) {
  const info = detect(dir)
  const report = { ...info, created: [], skipped: [], merged: [], installed: false }
  if (!info.needsScaffold) return report
  if (info.needsConfirmation && !confirm) return { ...report, written: false }
  const app = info.target
  mkdirSync(app, { recursive: true })
  mergePackage(app, report)
  mergeGitignore(app, report)
  if (!existsSync(join(app, 'package-lock.json')) && !info.anchors.build) copyIfMissing('package-lock.json', app, report)
  for (const anchor of info.missing) filesFor(anchor).forEach((rel) => copyIfMissing(rel, app, report))
  TOOLING.forEach((rel) => copyIfMissing(rel, app, report))
  if (install) {
    const res = spawnSync('npm', ['install'], { cwd: app, stdio: 'inherit' })
    report.installed = res.status === 0
    if (!report.installed) report.installError = `npm install exited with ${res.status}`
  }
  return { ...report, written: true }
}

const render = (text, values) => text.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in values ? values[k] : m))

const stringProp = (block, name) => {
  const m = new RegExp(`\\b${name}\\s*:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`, 's').exec(block)
  return m?.[2].replace(/\\(['"`])/g, '$1')
}

export function listPresentations(dir) {
  const path = registryPath(resolveTarget(dir))
  if (!path) return []
  return [...readText(path).matchAll(/\{[^{}]*\bslug\s*:[^{}]*\}/g)]
    .map((m) => ({ slug: stringProp(m[0], 'slug'), title: stringProp(m[0], 'title') ?? '' }))
    .filter((p) => p.slug)
}

export function newPresentation(dir, slug, title) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`slug must be lowercase kebab-case, got "${slug}"`)
  const app = resolveTarget(dir)
  const anchors = detectAnchors(app)
  if (!anchors.kit || !anchors.index) throw new Error(`scaffold first: missing anchors at ${app}: ${Object.keys(anchors).filter((k) => !anchors[k]).join(', ')}`)
  const path = registryPath(app)
  const folder = join(dirname(path), slug)
  if (existsSync(folder) || listPresentations(dir).some((p) => p.slug === slug)) throw new Error(`presentation "${slug}" already exists`)
  const safeTitle = title.replace(/[\\'"<>&{}`]/g, '')
  const values = { slug, title: safeTitle }
  ;[1, 2, 3].forEach((n) => Object.assign(values, { [`era${n}`]: 'start', [`title${n}`]: `Step ${n}`, [`caption${n}`]: 'Describe this step.' }))
  // Templates import the kit as `../../presentation-kit/index.ts`; point that at wherever this project keeps it.
  const kit = kitEntry(app)
  let kitImport = relative(folder, kit).split(sep).join('/')
  if (!kitImport.startsWith('.')) kitImport = `./${kitImport}`
  for (const file of walk(PRESENTATION_TEMPLATE)) {
    const to = join(folder, relative(PRESENTATION_TEMPLATE, file))
    mkdirSync(dirname(to), { recursive: true })
    writeFileSync(to, render(readText(file), values).replaceAll('../../presentation-kit/index.ts', kitImport))
  }
  const source = readText(path)
  const entry = `  {\n    slug: '${slug}',\n    title: '${safeTitle}',\n    load: () => import('./${slug}/Talk.tsx'),\n  },\n`
  const end = source.lastIndexOf('\n]')
  if (!/PRESENTATIONS[^=]*=\s*\[/.test(source) || end < 0) throw new Error(`could not register "${slug}": add it to ${relative(app, path)} by hand`)
  writeFileSync(path, `${source.slice(0, end + 1)}${entry}${source.slice(end + 1)}`)
  return { app, folder, registry: path, slug }
}

function main(argv) {
  const [cmd, ...rest] = argv
  const flags = rest.filter((a) => a.startsWith('--'))
  const args = rest.filter((a) => !a.startsWith('--'))
  const out = (value) => console.log(JSON.stringify(value, null, 2))
  if (cmd === 'detect') return out(detect(resolve(args[0] ?? '.')))
  if (cmd === 'scaffold') {
    const report = scaffold(resolve(args[0] ?? '.'), { install: flags.includes('--install'), confirm: flags.includes('--confirm') })
    out(report)
    if (report.needsScaffold && report.written === false) process.exitCode = 2
    return
  }
  if (cmd === 'new' && args[0] && args[1]) return out(newPresentation(resolve(args[2] ?? '.'), args[0], args[1]))
  if (cmd === 'list') return out(listPresentations(resolve(args[0] ?? '.')))
  console.error('usage: scaffold.mjs detect|scaffold|new|list (see header comment)')
  process.exitCode = 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2))
  } catch (e) {
    console.error(`error: ${e.message}`)
    process.exitCode = 1
  }
}
