#!/usr/bin/env node
// Deterministic helper for the presentation skill: detect scaffold anchors, resolve the
// scaffold target, materialize missing anchors, and create/register a presentation.
// Templates are resolved relative to this file, never the caller's working directory.
//
//   node scaffold.mjs detect <dir>
//   node scaffold.mjs bootstrap <dir> [--confirmed] [--install]
//   node scaffold.mjs create <dir> <slug> "<Title>"
import { spawnSync } from 'node:child_process'
import {
  cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP = path.join(SKILL_DIR, 'templates', 'bootstrap')
export const PRESENTATION = path.join(SKILL_DIR, 'templates', 'presentation')

/** Files each contract anchor owns inside the bootstrap template (copied only when absent). */
const ANCHOR_FILES = {
  build: [
    'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json',
    'vite.config.ts', 'eslint.config.js', 'index.html', 'gitignore', 'public', 'src/index.css',
  ],
  kit: ['src/presentation-kit'],
  // main.tsx is only created when absent; an existing entry point must be wired by hand.
  index: ['src/presentations/index.ts', 'src/router.ts', 'src/Landing.tsx', 'src/main.tsx'],
}

/** The npm scripts we add (verify, inspect) run these, so they ship with any scaffolding. */
const TOOLING = ['scripts']

const KIT_EXPORT = /export\s+(?:default\s+)?(?:function|const|class)\s+Presentation\b/
const REGISTRY_EXPORT = /export\s+(?:const|let)\s+presentations\b/

export class ConfirmationRequired extends Error {
  constructor(target, missing) {
    super(
      `"${target}" is not empty and is missing: ${missing.join(', ')}. ` +
        'State this target to the user and re-run with --confirmed once they agree.',
    )
    this.target = target
    this.missing = missing
  }
}

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

/** Source files under dir/src (depth <= 3) whose text matches `pattern`. */
function findSource(dir, pattern, depth = 3) {
  const out = []
  const visit = (d, level) => {
    if (!existsSync(d) || level > depth) return
    for (const name of readdirSync(d)) {
      const p = path.join(d, name)
      if (statSync(p).isDirectory()) {
        if (name !== 'node_modules') visit(p, level + 1)
      } else if (/\.(ts|tsx|js|jsx)$/.test(name) && pattern.test(readFileSync(p, 'utf8'))) out.push(p)
    }
  }
  visit(path.join(dir, 'src'), 0)
  return out
}

/** Directory holding the scene kit: any source exporting a `Presentation` component. */
export function findKit(dir) {
  const known = path.join(dir, 'src', 'presentation-kit')
  const files = findSource(dir, KIT_EXPORT)
  return files.map((f) => path.dirname(f)).find((d) => d === known) ?? (files[0] ? path.dirname(files[0]) : null)
}

/** The registry file: src/presentations/index.* or any source exporting `presentations`. */
export function findIndex(dir) {
  const known = ['index.ts', 'index.tsx'].map((f) => path.join(dir, 'src', 'presentations', f)).find(existsSync)
  return known ?? findSource(dir, REGISTRY_EXPORT)[0] ?? null
}

/** Contract-level detection: what the file does matters, not what it is called or how it is formatted. */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  return {
    build: Boolean(pkg?.scripts?.build && deps.vite && deps.react && deps.typescript),
    kit: findKit(dir) !== null,
    index: findIndex(dir) !== null,
  }
}

/** True when the app entry point does not mention the registry (it needs wiring by hand). */
export function needsRouting(dir) {
  const entry = ['main.tsx', 'main.jsx', 'main.ts', 'index.tsx'].map((f) => path.join(dir, 'src', f)).find(existsSync)
  if (!entry) return true
  return !/presentations|resolveRoute/.test(readFileSync(entry, 'utf8'))
}

export function isMonorepo(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  return Boolean(
    pkg?.workspaces ||
      existsSync(path.join(dir, 'pnpm-workspace.yaml')) ||
      ['packages', 'apps'].some((d) => existsSync(path.join(dir, d)) && statSync(path.join(dir, d)).isDirectory()),
  )
}

export function isEmpty(dir) {
  return !existsSync(dir) || readdirSync(dir).filter((n) => n !== '.git').length === 0
}

const missingOf = (anchors) => Object.keys(anchors).filter((k) => !anchors[k])

/** Where the presentation app lives: this dir, an existing presentations/ app, or a new presentations/ in a monorepo. */
export function resolveTarget(dir) {
  const here = detectAnchors(dir)
  if (here.kit || here.index) return { target: dir, reason: 'already a presentation app' }
  const nested = path.join(dir, 'presentations')
  const inner = detectAnchors(nested)
  if (inner.kit || inner.index) return { target: nested, reason: 'existing presentations/ app' }
  if (isMonorepo(dir)) return { target: nested, reason: 'monorepo: self-contained app under presentations/' }
  return { target: dir, reason: isEmpty(dir) ? 'empty directory' : 'standalone project' }
}

export function detect(dir) {
  const { target, reason } = resolveTarget(dir)
  const anchors = detectAnchors(target)
  return {
    target,
    reason,
    anchors,
    missing: missingOf(anchors),
    kit: findKit(target),
    index: findIndex(target),
    needsRouting: needsRouting(target),
    empty: isEmpty(dir),
  }
}

function copyMissing(rel, target, tokens) {
  const from = path.join(BOOTSTRAP, rel)
  const to = path.join(target, rel === 'gitignore' ? '.gitignore' : rel)
  if (!existsSync(from)) return []
  const created = []
  const visit = (src, dst) => {
    if (statSync(src).isDirectory()) {
      for (const name of readdirSync(src)) visit(path.join(src, name), path.join(dst, name))
    } else if (!existsSync(dst)) {
      mkdirSync(path.dirname(dst), { recursive: true })
      if (/\.(json|ts|tsx|js|mjs|html|css|svg)$/.test(src) || path.basename(src) === 'gitignore') {
        let text = readFileSync(src, 'utf8')
        for (const [k, v] of Object.entries(tokens)) text = text.replaceAll(k, v)
        writeFileSync(dst, text)
      } else cpSync(src, dst)
      created.push(path.relative(target, dst))
    }
  }
  visit(from, to)
  return created
}

/** Adds required dependencies and scripts that an existing package.json lacks. */
function mergePackage(target) {
  const file = path.join(target, 'package.json')
  const pkg = readJson(file)
  const tpl = readJson(path.join(BOOTSTRAP, 'package.json'))
  if (!pkg) return []
  const added = []
  for (const field of ['dependencies', 'devDependencies']) {
    pkg[field] ??= {}
    for (const [name, version] of Object.entries(tpl[field])) {
      const present = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]
      if (!present) {
        pkg[field][name] = version
        added.push(name)
      }
    }
  }
  pkg.scripts ??= {}
  for (const [name, cmd] of Object.entries(tpl.scripts)) {
    if (!pkg.scripts[name]) {
      pkg.scripts[name] = cmd
      added.push(`script:${name}`)
    }
  }
  if (added.length) writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n')
  return added
}

export function bootstrap(dir, { confirmed = false, install = false, runner = spawnSync } = {}) {
  const { target } = resolveTarget(dir)
  const found = detectAnchors(target)
  const missing = missingOf(found)
  if (!missing.length) return { target, created: [], missing, installed: false, needsRouting: needsRouting(target) }
  if (!isEmpty(dir) && !confirmed) throw new ConfirmationRequired(target, missing)
  const hadPackage = existsSync(path.join(target, 'package.json'))
  const tokens = { __NAME__: path.basename(path.resolve(target)).toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'presentations' }
  mkdirSync(target, { recursive: true })
  const created = []
  const files = missing.flatMap((anchor) =>
    anchor === 'build' && hadPackage ? ANCHOR_FILES.build.filter((f) => !f.startsWith('package')) : ANCHOR_FILES[anchor],
  )
  for (const rel of [...files, ...TOOLING]) created.push(...copyMissing(rel, target, tokens))
  // An existing package.json keeps its content; only missing dependencies and scripts are added.
  const added = hadPackage ? mergePackage(target) : []
  let installed = false
  if (install) {
    // Never assume dependencies are present: an existing node_modules may be incomplete.
    const cmd = hadPackage ? ['install'] : ['ci']
    const res = runner('npm', cmd, { cwd: target, stdio: 'inherit' })
    if (res.status !== 0) throw new Error(`npm ${cmd[0]} failed in ${target}`)
    installed = true
  }
  return { target, created, missing, addedDependencies: added, installed, needsRouting: needsRouting(target) }
}

/** Inserts a registry entry before the closing bracket of the `presentations` array, whatever its formatting. */
export function registerEntry(source, entry) {
  const decl = /\bpresentations\b[^=;]*=\s*\[/.exec(source)
  if (!decl) throw new Error('could not find the `presentations` array in the registry')
  let depth = 0
  let close = -1
  for (let i = decl.index + decl[0].length - 1; i < source.length; i++) {
    if (source[i] === '[') depth++
    else if (source[i] === ']' && --depth === 0) {
      close = i
      break
    }
  }
  if (close < 0) throw new Error('the `presentations` array in the registry is not closed')
  const before = source.slice(0, close).replace(/\s+$/, '')
  const comma = /[[,]$/.test(before) ? '' : ','
  return `${before}${comma}\n${entry}\n${source.slice(close)}`
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function createPresentation(appDir, slug, title) {
  if (!SLUG.test(slug)) throw new Error(`invalid slug "${slug}": use lowercase letters, digits and hyphens`)
  const indexFile = findIndex(appDir)
  const kitDir = findKit(appDir)
  if (!indexFile || !kitDir) throw new Error('no presentation index or scene kit found; run bootstrap first')
  const dest = path.join(path.dirname(indexFile), slug)
  const registry = readFileSync(indexFile, 'utf8')
  if (existsSync(dest) || registry.includes(`slug: '${slug}'`)) throw new Error(`presentation "${slug}" already exists`)
  const entry = `  {\n    slug: '${slug}',\n    title: ${JSON.stringify(title)},\n    load: () => import('./${slug}/Talk.tsx'),\n  },`
  // Compute the registration first so a malformed registry fails before anything is written.
  const updated = registerEntry(registry, entry)
  const created = []
  const visit = (src, dst) => {
    if (statSync(src).isDirectory()) {
      for (const name of readdirSync(src)) visit(path.join(src, name), path.join(dst, name))
      return
    }
    const kit = path.relative(path.dirname(dst), kitDir).split(path.sep).join('/') + '/index.ts'
    const tokens = { __SLUG__: slug, __TITLE_JSON__: JSON.stringify(title), __KIT__: kit }
    let text = readFileSync(src, 'utf8')
    for (const [k, v] of Object.entries(tokens)) text = text.replaceAll(k, v)
    mkdirSync(path.dirname(dst), { recursive: true })
    writeFileSync(dst, text)
    created.push(path.relative(appDir, dst))
  }
  visit(PRESENTATION, dest)
  writeFileSync(indexFile, updated)
  return { slug, created, registered: path.relative(appDir, indexFile) }
}

function cli(argv) {
  const [cmd, dir, ...rest] = argv
  const flags = new Set(rest.filter((a) => a.startsWith('--')))
  const args = rest.filter((a) => !a.startsWith('--'))
  const target = path.resolve(dir ?? '.')
  try {
    let out
    if (cmd === 'detect') out = detect(target)
    else if (cmd === 'bootstrap') out = bootstrap(target, { confirmed: flags.has('--confirmed'), install: flags.has('--install') })
    else if (cmd === 'create') out = createPresentation(target, args[0], args[1] ?? args[0])
    else throw new Error('usage: scaffold.mjs detect|bootstrap|create <dir> [...]')
    console.log(JSON.stringify(out, null, 2))
  } catch (err) {
    console.error(err.message)
    process.exit(err instanceof ConfirmationRequired ? 2 : 1)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli(process.argv.slice(2))
