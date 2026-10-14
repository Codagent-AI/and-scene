#!/usr/bin/env node
// Deterministic scaffolding helper for the presentation skill (see ../SKILL.md).
//
//   node scripts/scaffold.mjs plan     <projectDir>
//   node scripts/scaffold.mjs scaffold <projectDir> [--confirm] [--no-install]
//   node scripts/scaffold.mjs add      <appDir> --slug <slug> --title <title>
//
// `plan` detects the three contract anchors (build setup, scene kit, presentation index),
// resolves the scaffold target, and reports what is missing. `scaffold` copies only the
// missing parts from ../templates/bootstrap and installs the dependency set. `add` copies
// ../templates/presentation into src/presentations/<slug> and registers it.
//
// Templates resolve from this file's location, never from the caller's working directory.
// Existing files are never overwritten. Each command prints one JSON object on stdout.
// Exit codes: 0 done, 1 error, 2 refused because a non-empty target needs --confirm.
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP_DIR = join(SKILL_DIR, 'templates', 'bootstrap')
export const PRESENTATION_TEMPLATE_DIR = join(SKILL_DIR, 'templates', 'presentation')
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm'

export const ANCHORS = ['build', 'kit', 'index']
const REGISTRY = join('src', 'presentations', 'index.ts')
const REGISTRY_MARKER = '// @presentation-registry'
const KIT_DIR = join('src', 'presentation-kit')
const KIT_CONTRACT_FILES = ['types.ts', 'Presentation.tsx', 'Stage.tsx', 'usePresentationNav.ts', 'useFitScale.ts']
const LOCKFILES = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb']
const IGNORED_ROOT_ENTRIES = new Set(['.git', '.DS_Store'])

// Files copied for each missing anchor. A directory entry copies every file under it.
const ANCHOR_FILES = {
  build: [
    'index.html',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'eslint.config.js',
    'public/favicon.svg',
  ],
  kit: [KIT_DIR],
  index: [
    REGISTRY,
    'src/presentations/types.ts',
    'src/main.tsx',
    'src/RouteView.tsx',
    'src/router.ts',
    'src/Landing.tsx',
    'src/index.css',
  ],
}

// Verification and inspection tooling is copied whenever anything is scaffolded, because the
// self-verify step depends on `npm run verify` and `npm run inspect` existing in the app.
const TOOLING_FILES = [
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'scripts/inspect-presentation.d.mts',
]

const SCRIPT_NAMES = ['dev', 'build', 'lint', 'preview', 'verify', 'inspect']

export class HelperError extends Error {}

// ── Filesystem helpers ───────────────────────────────────────────────────────

function readText(file) {
  return existsSync(file) ? readFileSync(file, 'utf8') : null
}

function readJson(file) {
  const text = readText(file)
  if (text === null) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function isDirectory(path) {
  return existsSync(path) && statSync(path).isDirectory()
}

/** Every file under `dir`, as paths relative to `dir`, in sorted order. */
function walkFiles(dir, prefix = '') {
  return readdirSync(join(dir, prefix), { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const rel = prefix ? join(prefix, entry.name) : entry.name
      return entry.isDirectory() ? walkFiles(dir, rel) : [rel]
    })
}

function isEmptyDirectory(dir) {
  if (!isDirectory(dir)) return true
  return readdirSync(dir).every((name) => IGNORED_ROOT_ENTRIES.has(name))
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

// ── Anchor detection (contract level, not byte-identical) ────────────────────

/** Build setup: a Vite app with a build script, a vite dependency, and a Vite config. */
function hasBuildSetup(appDir) {
  const pkg = readJson(join(appDir, 'package.json'))
  if (!pkg?.scripts?.build) return false
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  if (!deps.vite) return false
  return ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'].some((name) => existsSync(join(appDir, name)))
}

/** Scene kit: the step contract, stage, navigation, and fit-scale modules, plus the Presentation host. */
function hasSceneKit(appDir) {
  const kitDir = join(appDir, KIT_DIR)
  if (!KIT_CONTRACT_FILES.every((name) => existsSync(join(kitDir, name)))) return false
  const types = readText(join(kitDir, 'types.ts')) ?? ''
  const host = readText(join(kitDir, 'Presentation.tsx')) ?? ''
  return (
    /export\s+(type|interface)\s+Step\b/.test(types) &&
    /export\s+(type|interface)\s+Scene\b/.test(types) &&
    /export function Presentation\b/.test(host)
  )
}

/** Presentation index: an explicit registry array that maps each presentation to its route. */
function hasPresentationIndex(appDir) {
  const source = readText(join(appDir, REGISTRY)) ?? ''
  return /export const PRESENTATIONS\b/.test(source)
}

export function detectAnchors(appDir) {
  return {
    build: hasBuildSetup(appDir),
    kit: hasSceneKit(appDir),
    index: hasPresentationIndex(appDir),
  }
}

// ── Target resolution ────────────────────────────────────────────────────────

/** Monorepo signals: workspaces, a pnpm workspace file, or a packages/ or apps/ layout. */
export function detectMonorepo(projectDir) {
  const signals = []
  if (readJson(join(projectDir, 'package.json'))?.workspaces) signals.push('package.json workspaces')
  if (existsSync(join(projectDir, 'pnpm-workspace.yaml'))) signals.push('pnpm-workspace.yaml')
  for (const dir of ['packages', 'apps']) {
    if (isDirectory(join(projectDir, dir))) signals.push(`${dir}/ layout`)
  }
  return { isMonorepo: signals.length > 0, signals }
}

/**
 * Standalone or already-complete projects scaffold at the root. A monorepo gets its own
 * self-contained app under presentations/ and its root files are left untouched.
 */
export function resolveTarget(projectDir) {
  const rootAnchors = detectAnchors(projectDir)
  const monorepo = detectMonorepo(projectDir)
  if (ANCHORS.every((anchor) => rootAnchors[anchor])) {
    return { target: '.', reason: 'project already has all three anchors', monorepo }
  }
  if (monorepo.isMonorepo) {
    return {
      target: 'presentations',
      reason: `monorepo (${monorepo.signals.join(', ')}); the app is self-contained under presentations/`,
      monorepo,
    }
  }
  return { target: '.', reason: 'standalone project', monorepo }
}

/** What a scaffold run would do, without writing anything. */
export function plan(projectDir) {
  const root = resolve(projectDir)
  const { target, reason, monorepo } = resolveTarget(root)
  const appDir = resolve(root, target)
  const anchors = detectAnchors(appDir)
  const missing = ANCHORS.filter((anchor) => !anchors[anchor])
  const nonEmpty = !isEmptyDirectory(root)
  return {
    projectDir: root,
    target,
    appDir,
    reason,
    monorepo,
    anchors,
    missing,
    nonEmpty,
    requiresConfirmation: missing.length > 0 && nonEmpty,
  }
}

// ── Scaffold ─────────────────────────────────────────────────────────────────

function copyMissing(relPath, appDir, result) {
  const dest = join(appDir, relPath)
  if (existsSync(dest)) {
    result.kept.push(relPath)
    return
  }
  mkdirSync(dirname(dest), { recursive: true })
  cpSync(join(BOOTSTRAP_DIR, relPath), dest)
  result.written.push(relPath)
}

function copyEntry(entry, appDir, result) {
  if (isDirectory(join(BOOTSTRAP_DIR, entry))) {
    for (const rel of walkFiles(join(BOOTSTRAP_DIR, entry))) copyMissing(join(entry, rel), appDir, result)
  } else {
    copyMissing(entry, appDir, result)
  }
}

/** Adds any missing required dependency or script without touching existing entries. */
function ensurePackageJson(appDir, result) {
  const file = join(appDir, 'package.json')
  const template = readJson(join(BOOTSTRAP_DIR, 'package.json'))
  const existing = readJson(file)
  if (existing === null && existsSync(file)) {
    throw new HelperError(`${file} is not valid JSON; fix it before scaffolding`)
  }
  if (existing === null) {
    writeJson(file, template)
    result.written.push('package.json')
    return
  }
  const next = structuredClone(existing)
  for (const field of ['dependencies', 'devDependencies']) {
    for (const [name, version] of Object.entries(template[field])) {
      const declared = next.dependencies?.[name] ?? next.devDependencies?.[name]
      if (declared === undefined) {
        next[field] = { ...next[field], [name]: version }
      }
    }
  }
  for (const name of SCRIPT_NAMES) {
    next.scripts ??= {}
    next.scripts[name] ??= template.scripts[name]
  }
  if (JSON.stringify(next) !== JSON.stringify(existing)) {
    writeJson(file, next)
    result.updated.push('package.json')
  } else {
    result.kept.push('package.json')
  }
}

/** Appends bootstrap ignore entries that the project's .gitignore does not already have. */
function ensureGitignore(appDir, result) {
  const file = join(appDir, '.gitignore')
  const wanted = (readText(join(BOOTSTRAP_DIR, '.gitignore')) ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
  const existing = readText(file)
  if (existing === null) {
    writeFileSync(file, `${wanted.join('\n')}\n`)
    result.written.push('.gitignore')
    return
  }
  const present = new Set(existing.split('\n').map((line) => line.trim()))
  const missing = wanted.filter((line) => !present.has(line))
  if (missing.length === 0) {
    result.kept.push('.gitignore')
    return
  }
  writeFileSync(file, `${existing.replace(/\n*$/, '\n')}${missing.join('\n')}\n`)
  result.updated.push('.gitignore')
}

function ensureLockfile(appDir, result) {
  if (LOCKFILES.some((name) => existsSync(join(appDir, name)))) return
  copyMissing('package-lock.json', appDir, result)
}

function installDependencies(appDir) {
  const run = spawnSync(NPM, ['install', '--no-audit', '--no-fund'], {
    cwd: appDir,
    encoding: 'utf8',
    timeout: 900_000,
  })
  return { ran: true, status: run.status, output: lastLines(`${run.stdout ?? ''}${run.stderr ?? ''}`) }
}

function lastLines(text, count = 20) {
  return text.trim().split('\n').slice(-count).join('\n')
}

/**
 * Creates whatever anchors are missing. Refuses a non-empty target unless `confirm` is set,
 * so the caller must state the target to the user and get approval first.
 */
export function scaffold(projectDir, { confirm = false, install = true } = {}) {
  const planned = plan(projectDir)
  if (planned.missing.length === 0) {
    return { ...planned, action: 'none', message: 'all three anchors are present; nothing to scaffold' }
  }
  if (planned.requiresConfirmation && !confirm) {
    return {
      ...planned,
      action: 'refused',
      message: `target "${planned.target}" is in a non-empty project; confirm it with the user, then re-run with --confirm`,
    }
  }

  const appDir = planned.appDir
  mkdirSync(appDir, { recursive: true })
  const result = { written: [], updated: [], kept: [] }
  ensurePackageJson(appDir, result)
  for (const anchor of planned.missing) {
    for (const entry of ANCHOR_FILES[anchor]) copyEntry(entry, appDir, result)
  }
  for (const entry of TOOLING_FILES) copyMissing(entry, appDir, result)
  ensureGitignore(appDir, result)
  ensureLockfile(appDir, result)

  const anchorsAfter = detectAnchors(appDir)
  const stillMissing = ANCHORS.filter((anchor) => !anchorsAfter[anchor])
  if (stillMissing.length > 0) {
    throw new HelperError(`scaffold finished but anchors are still missing: ${stillMissing.join(', ')}`)
  }
  const installation = install ? installDependencies(appDir) : { ran: false }
  if (installation.ran && installation.status !== 0) {
    throw new HelperError(`npm install failed in ${appDir} (exit ${installation.status})\n${installation.output}`)
  }
  return {
    ...planned,
    action: 'scaffolded',
    anchorsBefore: planned.anchors,
    anchors: anchorsAfter,
    missing: [],
    ...result,
    install: installation,
  }
}

// ── Presentations ────────────────────────────────────────────────────────────

// Must start with a letter: the slug becomes a CSS class selector, and `.2024-recap` is invalid CSS.
const SLUG_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

/** Escapes text for a single-quoted TypeScript string literal. */
export function tsStringLiteralBody(text) {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function registeredSlugs(source) {
  return [...source.matchAll(/\bslug:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
}

/** Copies the presentation template into src/presentations/<slug> and registers it. */
export function addPresentation(appDir, { slug, title }) {
  if (!SLUG_PATTERN.test(slug ?? '')) {
    throw new HelperError(`slug "${slug}" must start with a lowercase letter and use lowercase words joined by hyphens, e.g. how-to-cook-rice`)
  }
  if (!title || !title.trim() || /[\r\n]/.test(title)) {
    throw new HelperError('title must be a single non-empty line')
  }
  const anchors = detectAnchors(appDir)
  if (!anchors.index) {
    throw new HelperError(`no presentation index at ${join(appDir, REGISTRY)}; run "scaffold" first`)
  }
  const registryFile = join(appDir, REGISTRY)
  const registry = readText(registryFile)
  if (!registry.includes(REGISTRY_MARKER)) {
    throw new HelperError(`registry marker "${REGISTRY_MARKER}" is missing from ${REGISTRY}`)
  }
  if (registeredSlugs(registry).includes(slug)) throw new HelperError(`slug "${slug}" is already registered`)

  const dir = join(appDir, 'src', 'presentations', slug)
  if (existsSync(dir)) throw new HelperError(`${relative(appDir, dir)} already exists`)

  const substitutions = { SLUG: slug, TITLE: tsStringLiteralBody(title) }
  const files = []
  for (const rel of walkFiles(PRESENTATION_TEMPLATE_DIR)) {
    const text = readFileSync(join(PRESENTATION_TEMPLATE_DIR, rel), 'utf8')
    const filled = text.replace(/\{\{(SLUG|TITLE)\}\}/g, (_, key) => substitutions[key])
    if (/\{\{[A-Z_]+\}\}/.test(filled)) throw new HelperError(`unfilled placeholder in template file ${rel}`)
    mkdirSync(dirname(join(dir, rel)), { recursive: true })
    writeFileSync(join(dir, rel), filled)
    files.push(relative(appDir, join(dir, rel)))
  }

  const markerLine = registry.split('\n').find((line) => line.includes(REGISTRY_MARKER))
  const indent = markerLine.match(/^\s*/)[0]
  const entry = [
    `${indent}{`,
    `${indent}  slug: '${slug}',`,
    `${indent}  title: '${tsStringLiteralBody(title)}',`,
    `${indent}  load: () => import('./${slug}/Talk'),`,
    `${indent}},`,
  ].join('\n')
  // A function replacer keeps `$&`, `$'`, and `$$` in titles literal.
  writeFileSync(registryFile, registry.replace(markerLine, () => `${entry}\n${markerLine}`))

  return { slug, title, dir: relative(appDir, dir), files, registry: REGISTRY }
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const USAGE = `usage:
  node scripts/scaffold.mjs plan     <projectDir>
  node scripts/scaffold.mjs scaffold <projectDir> [--confirm] [--no-install]
  node scripts/scaffold.mjs add      <appDir> --slug <slug> --title <title>`

function flagValue(args, name) {
  const index = args.indexOf(name)
  if (index === -1) return undefined
  const value = args[index + 1]
  if (value === undefined || value.startsWith('--')) throw new HelperError(`${name} needs a value`)
  return value
}

function emit(value) {
  console.log(JSON.stringify(value, null, 2))
}

export function run(argv) {
  const [command, target, ...rest] = argv
  if (!command || !target) throw new HelperError(USAGE)
  if (command === 'plan') {
    emit(plan(target))
    return 0
  }
  if (command === 'scaffold') {
    const result = scaffold(target, { confirm: rest.includes('--confirm'), install: !rest.includes('--no-install') })
    emit(result)
    return result.action === 'refused' ? 2 : 0
  }
  if (command === 'add') {
    emit(addPresentation(resolve(target), { slug: flagValue(rest, '--slug'), title: flagValue(rest, '--title') }))
    return 0
  }
  throw new HelperError(USAGE)
}

const isEntryPoint = process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href

if (isEntryPoint) {
  try {
    process.exitCode = run(process.argv.slice(2))
  } catch (error) {
    console.error(error instanceof HelperError ? error.message : error?.stack ?? String(error))
    process.exitCode = 1
  }
}
