#!/usr/bin/env node
// Scaffold helper for the presentation skill. Templates are located relative to this file, so the
// helper works from any working directory.
//
//   node scaffold.mjs detect   <dir>                       report anchors and the resolved target
//   node scaffold.mjs scaffold <dir> [--confirm] [--install]   add whatever anchors are missing
//   node scaffold.mjs new      <target> <slug> <title>     create and register a presentation
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates/bootstrap')
export const PRESENTATION_TEMPLATE_DIR = path.join(SKILL_DIR, 'templates/presentation')
export const REGISTRY_MARKER = '// presentations:end'
export const REGISTRY_SKELETON = `import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: adding a presentation is a new folder plus one line here. */
export const presentations: PresentationEntry[] = [
  ${REGISTRY_MARKER}
]
`

/** Template files (relative to templates/bootstrap) each contract anchor is responsible for. */
const ANCHOR_FILES = {
  build: [
    'package.json',
    'package-lock.json',
    '.gitignore',
    'index.html',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'eslint.config.js',
    'scripts',
  ],
  kit: ['src/presentation-kit', 'scripts'],
  index: [
    'scripts',
    'src/main.tsx',
    'src/AppRouter.tsx',
    'src/Landing.tsx',
    'src/route.ts',
    'src/index.css',
    'src/presentations',
  ],
}

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

/** Every file under `target` (or `target` itself when it is a file). */
function sourceFiles(target) {
  if (!existsSync(target)) return []
  if (statSync(target).isFile()) return [target]
  return readdirSync(target, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => path.join(e.parentPath, e.name))
}

/** True when the directory has no entries other than `.git`. */
export function isEmptyDir(dir) {
  return !existsSync(dir) || readdirSync(dir).every((name) => name === '.git')
}

function codeFiles(dir) {
  return sourceFiles(path.join(dir, 'src')).filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))
}

/**
 * Where the working kit and registry live. Detection is by capability, not file names:
 * - kit: a module exporting a `Presentation` component that renders a stage (not a placeholder),
 *   a `Step` contract carrying a `Scene`, and, in the same directory tree, AnimatePresence-based
 *   hosting, keyboard navigation and a fit scale.
 * - index: a module whose entries pair a `slug` with a dynamic `import()` loader.
 */
export function locateAnchors(dir) {
  const files = codeFiles(dir)
  const text = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]))
  const presentationFile = files.find(
    (f) => /export (default )?(function|const) Presentation\b/.test(text.get(f)) && /<Stage|<AnimatePresence/.test(text.get(f)),
  )
  let kitDir = null
  if (presentationFile) {
    const candidate = path.dirname(presentationFile)
    const inKit = files.filter((f) => f.startsWith(candidate + path.sep) || f === presentationFile)
    const all = inKit.map((f) => text.get(f)).join('\n')
    const capable =
      /(interface|type)\s+Step\b[^;]*?\bScene\b/s.test(all) &&
      /<AnimatePresence/.test(all) &&
      /addEventListener\(\s*['"]keydown['"]/.test(all) &&
      /scale\(\$\{|scale\(/.test(all)
    if (capable) kitDir = candidate
  }
  const registry = files.find((f) => /slug\s*:/.test(text.get(f)) && /load\s*:\s*\(\)\s*=>\s*import\(/.test(text.get(f))) ?? null
  return { kitDir, registry }
}

/** The three contract anchors, detected by capability rather than by exact file names. */
export function detectAnchors(dir) {
  const pkgFile = path.join(dir, 'package.json')
  let build = false
  if (existsSync(pkgFile)) {
    const pkg = readJson(pkgFile)
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    build = Boolean(pkg.scripts?.build && deps.vite && deps.react && deps.typescript)
  }
  const { kitDir, registry } = locateAnchors(dir)
  return { build, kit: kitDir !== null, index: registry !== null }
}

/** A monorepo has package.json workspaces, pnpm-workspace.yaml, or a packages/ or apps/ directory. */
export function isMonorepo(dir) {
  const pkgFile = path.join(dir, 'package.json')
  if (existsSync(pkgFile) && readJson(pkgFile).workspaces) return true
  if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return true
  return ['packages', 'apps'].some((d) => existsSync(path.join(dir, d)) && statSync(path.join(dir, d)).isDirectory())
}

/**
 * Where the presentation app lives. An existing presentation app (any anchor besides the build
 * setup) wins; then a monorepo gets a self-contained `presentations/` app; otherwise the root.
 */
export function resolveTarget(dir) {
  const here = detectAnchors(dir)
  if (here.kit || here.index) return { target: dir, reason: 'existing presentation app' }
  const nested = path.join(dir, 'presentations')
  if (existsSync(nested)) {
    const found = detectAnchors(nested)
    if (found.build || found.kit || found.index) return { target: nested, reason: 'existing presentation app' }
  }
  if (isMonorepo(dir)) return { target: nested, reason: 'monorepo: self-contained app under presentations/' }
  return { target: dir, reason: isEmptyDir(dir) ? 'empty directory' : 'standalone project' }
}

/** What scaffolding would do in `target`: missing anchors, files to create, and files kept. */
export function planScaffold(target) {
  const anchors = detectAnchors(target)
  const missing = Object.keys(anchors).filter((name) => !anchors[name])
  const create = []
  const keep = []
  const hasPackage = existsSync(path.join(target, 'package.json'))
  for (const name of missing) {
    for (const entry of ANCHOR_FILES[name]) {
      for (const file of sourceFiles(path.join(BOOTSTRAP_DIR, entry))) {
        const rel = path.relative(BOOTSTRAP_DIR, file)
        // A project that already has a package.json keeps it and gets its dependencies merged.
        if (rel === 'package-lock.json' && hasPackage) continue
        if (existsSync(path.join(target, rel))) keep.push(rel)
        else create.push(rel)
      }
    }
  }
  return { anchors, missing, create: [...new Set(create)].sort(), keep: [...new Set(keep)].sort() }
}

/** Add missing dependencies and scripts from the bootstrap package.json without touching existing ones. */
export function mergePackage(target) {
  const file = path.join(target, 'package.json')
  const wanted = readJson(path.join(BOOTSTRAP_DIR, 'package.json'))
  const pkg = readJson(file)
  const added = []
  for (const field of ['dependencies', 'devDependencies', 'scripts']) {
    pkg[field] ??= {}
    for (const [name, value] of Object.entries(wanted[field] ?? {})) {
      const present = field === 'scripts' ? name in pkg[field] : name in { ...pkg.dependencies, ...pkg.devDependencies }
      if (!present) {
        pkg[field][name] = value
        added.push(`${field}.${name}`)
      }
    }
  }
  if (added.length) writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
  return added
}

/** Copy missing template files into the target; existing files are never overwritten. */
export function applyScaffold(target, plan = planScaffold(target)) {
  mkdirSync(target, { recursive: true })
  const hadPackage = existsSync(path.join(target, 'package.json'))
  for (const rel of plan.create) {
    const dest = path.join(target, rel)
    mkdirSync(path.dirname(dest), { recursive: true })
    cpSync(path.join(BOOTSTRAP_DIR, rel), dest, { errorOnExist: true, force: false })
  }
  const merged = hadPackage && plan.missing.length ? mergePackage(target) : []
  return { created: plan.create, kept: plan.keep, merged }
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Escape text for a JS/TS string literal in either quote style (also safe inside a CSS comment). */
export function escapeTitle(title) {
  return title
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ')
    .replace(/\*\//g, '* /')
}

const posix = (p) => p.split(path.sep).join('/')
const relativeImport = (from, to) => {
  const rel = posix(path.relative(from, to))
  return rel.startsWith('.') ? rel : `./${rel}`
}

/**
 * Create <registry dir>/<slug> from the presentation templates and append one registry line.
 * The registry and kit are located by capability, so renamed layouts get correct import paths.
 */
export function createPresentation(target, { slug, title }, { neutralStyle = false } = {}) {
  if (!SLUG.test(slug)) throw new Error(`invalid slug "${slug}": use lowercase words joined by hyphens`)
  const located = locateAnchors(target)
  const registry = located.registry ?? path.join(target, 'src/presentations/index.ts')
  const kitDir = located.kitDir ?? path.join(target, 'src/presentation-kit')
  const folder = path.join(path.dirname(registry), slug)
  if (existsSync(folder)) throw new Error(`presentation "${slug}" already exists`)
  mkdirSync(path.dirname(registry), { recursive: true })
  if (!existsSync(registry)) writeFileSync(registry, REGISTRY_SKELETON)
  const source = readFileSync(registry, 'utf8')
  if (!source.includes(REGISTRY_MARKER)) {
    throw new Error(`registry ${path.relative(target, registry)} has no "${REGISTRY_MARKER}" marker; add the entry for "${slug}" by hand`)
  }
  const kitImport = relativeImport(folder, kitDir)
  const steps = relativeImport(path.join(folder, 'steps'), kitDir)
  const fill = (text, file) =>
    text
      .replaceAll('__KIT__', file.includes(`steps${path.sep}`) ? steps : kitImport)
      .replaceAll('__SLUG__', slug)
      .replaceAll('__TITLE__', escapeTitle(title))
  for (const file of sourceFiles(PRESENTATION_TEMPLATE_DIR)) {
    const rel = path.relative(PRESENTATION_TEMPLATE_DIR, file).replace(/\.tmpl$/, '')
    const dest = path.join(folder, rel)
    mkdirSync(path.dirname(dest), { recursive: true })
    const content = neutralStyle && rel === 'talk.css' ? '/* Presentation styles go here; the scaffold ships none. */\n' : fill(readFileSync(file, 'utf8'), rel)
    writeFileSync(dest, content)
  }
  const entry = `  {\n    slug: '${slug}',\n    title: ${JSON.stringify(title)},\n    load: () => import('./${slug}/Talk'),\n  },\n  ${REGISTRY_MARKER}`
  writeFileSync(registry, source.replace(REGISTRY_MARKER, entry))
  return folder
}

/**
 * `npm ci` only when the lock file came from the template and package.json was not merged;
 * a merged or pre-existing package.json needs `npm install` to refresh its lock data.
 */
export function installCommand(result) {
  return result.created.includes('package-lock.json') && !result.merged.length ? 'ci' : 'install'
}

function main(argv) {
  const [command, dir, ...rest] = argv
  if (command === 'detect' && dir) {
    const root = path.resolve(dir)
    const { target, reason } = resolveTarget(root)
    const plan = planScaffold(target)
    console.log(JSON.stringify({ target, reason, anchors: plan.anchors, missing: plan.missing, empty: isEmptyDir(root) }, null, 2))
    return 0
  }
  if (command === 'scaffold' && dir) {
    const root = path.resolve(dir)
    const { target, reason } = resolveTarget(root)
    const plan = planScaffold(target)
    if (!plan.missing.length) {
      console.log(`scaffold: ${target} already has every anchor; nothing to do`)
      return 0
    }
    if (!isEmptyDir(root) && !rest.includes('--confirm')) {
      console.log(`scaffold: would add [${plan.missing.join(', ')}] to ${target} (${reason}).`)
      console.log(`  create: ${plan.create.length} file(s); keep existing: ${plan.keep.join(', ') || 'none'}`)
      console.log('scaffold: nothing written. Ask the user to confirm this target, then re-run with --confirm.')
      return 3
    }
    const result = applyScaffold(target, plan)
    console.log(`scaffold: wrote ${result.created.length} file(s) to ${target}; merged ${result.merged.join(', ') || 'no package entries'}`)
    if (rest.includes('--install')) {
      const install = spawnSync('npm', [installCommand(result)], { cwd: target, stdio: 'inherit' })
      return install.status ?? 1
    }
    return 0
  }
  if (command === 'new' && dir && rest.length >= 2) {
    console.log(`created ${createPresentation(path.resolve(dir), { slug: rest[0], title: rest.slice(1).join(' ') })}`)
    return 0
  }
  console.error('usage: scaffold.mjs detect <dir> | scaffold <dir> [--confirm] [--install] | new <target> <slug> <title>')
  return 2
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2))
}
