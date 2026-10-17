#!/usr/bin/env node
// Scaffolding helper for the presentation skill. Templates are resolved from this file's
// location (the skill directory), never from the caller's working directory.
//
//   node scaffold.mjs detect [--dir <dir>]
//   node scaffold.mjs bootstrap [--dir <dir>] [--apply] [--confirmed]
//   node scaffold.mjs presentation --dir <app dir> --slug <slug> --title <title>
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const bootstrapDir = join(skillDir, 'templates', 'bootstrap')
export const presentationTemplateDir = join(skillDir, 'templates', 'presentation')

const SOURCE_FILE = /\.(tsx?|jsx?|mjs)$/
const VITE_CONFIGS = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs', 'vite.config.mts']

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function walk(dir, skip = () => false) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (skip(entry.name)) return []
    return entry.isDirectory() ? walk(path, skip) : [path]
  })
}

const IGNORED_DIRS = new Set(['node_modules', 'dist', '.git', '.inspection', '__tests__'])

function sourceTexts(appDir) {
  return walk(join(appDir, 'src'), (name) => IGNORED_DIRS.has(name))
    .filter((file) => SOURCE_FILE.test(file) && !/\.(test|spec)\./.test(file))
    .map((file) => readFileSync(file, 'utf8'))
}

/** Build setup: a Vite + React + TypeScript app with a working build script. */
export function hasBuildAnchor(appDir) {
  const pkg = readJson(join(appDir, 'package.json'))
  if (!pkg || typeof pkg.scripts?.build !== 'string' || !pkg.scripts.build.trim()) return false
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  return (
    ['vite', 'react', 'typescript'].every((name) => name in deps) &&
    VITE_CONFIGS.some((name) => existsSync(join(appDir, name)))
  )
}

/**
 * Scene kit, detected by capability rather than file name: the step contract, a host that
 * mounts the active step and runs morphs, keyboard navigation, step chrome, and fit scaling.
 */
export function hasKitAnchor(appDir) {
  const source = sourceTexts(appDir).join('\n')
  return (
    /\b(interface|type)\s+Step\b/.test(source) &&
    source.includes('AnimatePresence') &&
    source.includes('LayoutGroup') &&
    source.includes('ArrowRight') &&
    source.includes('keydown') &&
    source.includes('data-step-count') &&
    /scale/.test(source) &&
    /(ResizeObserver|innerWidth|clientWidth)/.test(source)
  )
}

/** Presentation index: a registry of slugs with lazy loaders plus path-based route resolution. */
export function hasIndexAnchor(appDir) {
  const texts = sourceTexts(appDir)
  return (
    texts.some((t) => /slug\s*:/.test(t) && /\bimport\(/.test(t)) &&
    texts.some((t) => /pathname/.test(t))
  )
}

export function detectAnchors(appDir) {
  return {
    build: hasBuildAnchor(appDir),
    kit: hasKitAnchor(appDir),
    index: hasIndexAnchor(appDir),
  }
}

const MONOREPO_SIGNALS = [
  ['workspaces', (dir) => readJson(join(dir, 'package.json'))?.workspaces !== undefined],
  ['pnpm-workspace.yaml', (dir) => existsSync(join(dir, 'pnpm-workspace.yaml'))],
  ['packages/', (dir) => existsSync(join(dir, 'packages')) && statSync(join(dir, 'packages')).isDirectory()],
  ['apps/', (dir) => existsSync(join(dir, 'apps')) && statSync(join(dir, 'apps')).isDirectory()],
]

function signalsAt(dir) {
  return MONOREPO_SIGNALS.filter(([, test]) => test(dir)).map(([name]) => name)
}

/** Walks up from `start` to the nearest directory carrying a monorepo signal. */
export function findMonorepoRoot(start) {
  for (let dir = start; ; dir = dirname(dir)) {
    const signals = signalsAt(dir)
    if (signals.length) return { root: dir, signals }
    if (existsSync(join(dir, '.git')) || dirname(dir) === dir) return null
  }
}

function isNonEmpty(dir) {
  return existsSync(dir) && readdirSync(dir).some((name) => name !== '.git')
}

/** Decides where a presentation app lives and what is missing there. */
export function detect(dirArg = process.cwd()) {
  const start = resolve(dirArg)
  const monorepo = findMonorepoRoot(start)
  const projectRoot = monorepo ? monorepo.root : start

  let target = start
  let reason = 'standalone project: scaffold at the project root'
  const startAnchors = detectAnchors(start)
  if (startAnchors.build && startAnchors.kit && startAnchors.index) {
    reason = 'already inside a complete presentation app'
  } else if (monorepo) {
    const nested = join(monorepo.root, 'presentations')
    const nestedAnchors = detectAnchors(nested)
    target = nested
    reason = nestedAnchors.build && nestedAnchors.kit && nestedAnchors.index
      ? 'monorepo with an existing complete presentations/ app'
      : `monorepo (${monorepo.signals.join(', ')}): scaffold a self-contained app under presentations/`
  }

  const anchors = detectAnchors(target)
  const missing = Object.entries(anchors).filter(([, present]) => !present).map(([name]) => name)
  const nonEmpty = isNonEmpty(projectRoot)
  return {
    start,
    projectRoot,
    target,
    reason,
    monorepo: monorepo ? monorepo.signals : [],
    anchors,
    missing,
    nonEmpty,
    requiresConfirmation: missing.length > 0 && nonEmpty,
  }
}

export function anchorOf(relPath) {
  const path = relPath.split('\\').join('/')
  if (path.startsWith('src/presentation-kit/')) return 'kit'
  if (
    path.startsWith('src/presentations/') ||
    ['src/Router.tsx', 'src/Landing.tsx', 'src/route.ts'].includes(path)
  ) {
    return 'index'
  }
  if (path.startsWith('scripts/')) return 'tooling'
  return 'build'
}

export function templateFiles() {
  return walk(bootstrapDir, (name) => name === 'node_modules' || name === 'dist').map((file) =>
    relative(bootstrapDir, file),
  )
}

function mergePackageJson(targetPath) {
  const template = readJson(join(bootstrapDir, 'package.json'))
  const existing = readJson(targetPath)
  if (!existing) return null
  const added = { dependencies: [], devDependencies: [], scripts: [] }
  for (const field of ['dependencies', 'devDependencies']) {
    const have = { ...existing.dependencies, ...existing.devDependencies }
    existing[field] ??= {}
    for (const [name, version] of Object.entries(template[field])) {
      if (!(name in have)) {
        existing[field][name] = version
        added[field].push(name)
      }
    }
  }
  existing.scripts ??= {}
  for (const [name, command] of Object.entries(template.scripts)) {
    if (!(name in existing.scripts)) {
      existing.scripts[name] = command
      added.scripts.push(name)
    }
  }
  writeFileSync(targetPath, JSON.stringify(existing, null, 2) + '\n')
  return added
}

/**
 * Copies only what is missing: files of missing anchors (plus verification tooling) that do
 * not already exist. Existing files are never overwritten.
 */
export function bootstrap(dirArg, { apply = false, confirmed = false } = {}) {
  const plan = detect(dirArg)
  /** @type {{ applied: boolean, copied: string[], skippedExisting: string[], addedDependencies: ReturnType<typeof mergePackageJson>, nextSteps: string[], blocked?: string }} */
  const progress = { applied: false, copied: [], skippedExisting: [], addedDependencies: null, nextSteps: [] }
  const result = { ...plan, ...progress }
  if (plan.missing.length === 0) return result
  if (plan.requiresConfirmation && apply && !confirmed) {
    return { ...result, blocked: `confirm the target ${plan.target} with the user, then rerun with --confirmed` }
  }

  const wanted = new Set([...plan.missing, 'tooling'])
  for (const rel of templateFiles()) {
    if (!wanted.has(anchorOf(rel))) continue
    const destination = join(plan.target, rel)
    if (rel === 'package.json' && existsSync(destination)) continue
    if (existsSync(destination)) {
      result.skippedExisting.push(rel)
      continue
    }
    result.copied.push(rel)
    if (!apply) continue
    mkdirSync(dirname(destination), { recursive: true })
    copyFileSync(join(bootstrapDir, rel), destination)
  }
  if (apply) {
    result.applied = true
    result.addedDependencies = mergePackageJson(join(plan.target, 'package.json'))
    result.nextSteps = [`cd ${plan.target}`, 'npm install', 'npx playwright install chromium']
  }
  return result
}

export function renderTemplate(text, tokens) {
  return Object.entries(tokens).reduce((out, [token, value]) => out.split(token).join(value), text)
}

/** Creates a presentation folder from the template and appends it to the registry. */
export function createPresentation(appDir, slug, title) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`invalid slug: ${slug}`)
  if (!title?.trim()) throw new Error('a title is required')
  const presentations = join(resolve(appDir), 'src', 'presentations')
  const registryPath = join(presentations, 'index.ts')
  const folder = join(presentations, slug)
  if (!existsSync(registryPath)) throw new Error(`no presentation registry at ${registryPath}`)
  const registry = readFileSync(registryPath, 'utf8')
  if (existsSync(folder) || registry.includes(`slug: '${slug}'`)) {
    throw new Error(`presentation "${slug}" already exists; nothing was changed`)
  }
  const closing = registry.lastIndexOf('\n]')
  if (!/PRESENTATIONS[^=]*=\s*\[/.test(registry) || closing === -1) {
    throw new Error('could not find the PRESENTATIONS array to extend')
  }

  const tokens = { __SLUG__: slug, __TITLE__: title.replace(/["\\]/g, '\\$&') }
  const written = []
  for (const file of walk(presentationTemplateDir)) {
    const rel = relative(presentationTemplateDir, file)
    const destination = join(folder, rel)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, renderTemplate(readFileSync(file, 'utf8'), tokens))
    written.push(relative(resolve(appDir), destination))
  }
  const entry = `  {\n    slug: '${slug}',\n    title: ${JSON.stringify(title).replace(/'/g, "\\'")},\n    load: () => import('./${slug}/Talk'),\n  },`
  writeFileSync(registryPath, `${registry.slice(0, closing + 1)}${entry}\n${registry.slice(closing + 1)}`)
  return { slug, folder: relative(resolve(appDir), folder), written, registry: relative(resolve(appDir), registryPath) }
}

function parseArgs(argv) {
  const [command, ...rest] = argv
  const options = {}
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]
    if (!arg.startsWith('--')) throw new Error(`unexpected argument: ${arg}`)
    const key = arg.slice(2)
    options[key] = ['apply', 'confirmed'].includes(key) ? true : rest[++i]
  }
  return { command, options }
}

function main() {
  const { command, options } = parseArgs(process.argv.slice(2))
  let output
  if (command === 'detect') output = detect(options.dir)
  else if (command === 'bootstrap') output = bootstrap(options.dir, { apply: options.apply, confirmed: options.confirmed })
  else if (command === 'presentation') output = createPresentation(options.dir ?? process.cwd(), options.slug, options.title)
  else throw new Error('usage: scaffold.mjs <detect|bootstrap|presentation> [options]')
  console.log(JSON.stringify(output, null, 2))
  if (output.blocked) process.exit(3)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`scaffold: ${error.message}`)
    process.exit(2)
  }
}
