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
    'vite.config.ts', 'eslint.config.js', 'index.html', 'gitignore', 'public', 'src/main.tsx',
    'src/index.css', 'scripts',
  ],
  kit: ['src/presentation-kit'],
  index: ['src/presentations/index.ts', 'src/router.ts', 'src/Landing.tsx'],
}

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

export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  return {
    build: Boolean(pkg?.scripts?.build && deps.vite && deps.react && deps.typescript),
    kit: existsSync(path.join(dir, 'src', 'presentation-kit', 'Presentation.tsx')),
    index: ['index.ts', 'index.tsx'].some((f) => existsSync(path.join(dir, 'src', 'presentations', f))),
  }
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
  return { target, reason, anchors, missing: missingOf(anchors), empty: isEmpty(dir) }
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

export function bootstrap(dir, { confirmed = false, install = false } = {}) {
  const { target } = resolveTarget(dir)
  const found = detectAnchors(target)
  const missing = missingOf(found)
  if (!missing.length) return { target, created: [], missing, installed: false }
  if (!isEmpty(dir) && !confirmed) throw new ConfirmationRequired(target, missing)
  const hadPackage = existsSync(path.join(target, 'package.json'))
  const tokens = { __NAME__: path.basename(path.resolve(target)).toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'presentations' }
  mkdirSync(target, { recursive: true })
  const created = []
  for (const anchor of missing) {
    const files = anchor === 'build' && hadPackage ? ANCHOR_FILES.build.filter((f) => !f.startsWith('package')) : ANCHOR_FILES[anchor]
    for (const rel of files) created.push(...copyMissing(rel, target, tokens))
  }
  // An existing package.json keeps its content; only missing dependencies are added.
  const added = hadPackage ? mergePackage(target) : []
  let installed = false
  if (install && (!hadPackage || added.length || !existsSync(path.join(target, 'node_modules')))) {
    const cmd = hadPackage ? ['install'] : ['ci']
    const res = spawnSync('npm', cmd, { cwd: target, stdio: 'inherit' })
    if (res.status !== 0) throw new Error(`npm ${cmd[0]} failed in ${target}`)
    installed = true
  }
  return { target, created, missing, addedDependencies: added, installed }
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function createPresentation(appDir, slug, title) {
  if (!SLUG.test(slug)) throw new Error(`invalid slug "${slug}": use lowercase letters, digits and hyphens`)
  const indexFile = ['index.ts', 'index.tsx'].map((f) => path.join(appDir, 'src', 'presentations', f)).find(existsSync)
  if (!indexFile) throw new Error('no presentation index found; run bootstrap first')
  const dest = path.join(appDir, 'src', 'presentations', slug)
  const registry = readFileSync(indexFile, 'utf8')
  if (existsSync(dest) || registry.includes(`slug: '${slug}'`)) throw new Error(`presentation "${slug}" already exists`)
  const tokens = { __SLUG__: slug, __TITLE_JSON__: JSON.stringify(title) }
  const created = []
  const visit = (src, dst) => {
    if (statSync(src).isDirectory()) {
      for (const name of readdirSync(src)) visit(path.join(src, name), path.join(dst, name))
      return
    }
    let text = readFileSync(src, 'utf8')
    for (const [k, v] of Object.entries(tokens)) text = text.replaceAll(k, v)
    mkdirSync(path.dirname(dst), { recursive: true })
    writeFileSync(dst, text)
    created.push(path.relative(appDir, dst))
  }
  visit(PRESENTATION, dest)
  const entry = `  {\n    slug: '${slug}',\n    title: ${JSON.stringify(title)},\n    load: () => import('./${slug}/Talk.tsx'),\n  },\n`
  const close = registry.lastIndexOf('\n]')
  if (close < 0) throw new Error(`could not find the end of the registry array in ${indexFile}`)
  writeFileSync(indexFile, registry.slice(0, close + 1) + entry + registry.slice(close + 1))
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
