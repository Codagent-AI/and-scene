#!/usr/bin/env node
// Detect, plan and apply the presentation scaffold. Templates are resolved
// from this file's location, never from the caller's working directory.
//
//   node <skill>/scripts/bootstrap.mjs detect [--dir D]
//   node <skill>/scripts/bootstrap.mjs plan   [--dir D]
//   node <skill>/scripts/bootstrap.mjs apply  [--dir D] [--confirmed] [--no-install]
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const bootstrapDir = path.join(skillDir, 'templates', 'bootstrap')
export const presentationTemplateDir = path.join(skillDir, 'templates', 'presentation')

/** Template files (relative to templates/bootstrap) owned by each anchor. */
const ANCHOR_FILES = {
  build: ['index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js', '.gitignore', 'public/', 'src/index.css'],
  kit: ['src/presentation-kit/'],
  index: ['src/presentations/', 'src/route.ts', 'src/Root.tsx', 'src/Landing.tsx', 'src/main.tsx'],
  tooling: ['scripts/'],
}

const KIT_EXPORTS = ['Presentation', 'Stage', 'Step', 'SceneProps', 'usePresentationNav', 'useFitScale', 'Toc']
const BUILD_DEPS = ['react', 'react-dom', 'vite', 'typescript']

const read = (file) => readFileSync(file, 'utf8')
const readJson = (file) => JSON.parse(read(file))

function walk(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

function isEmptyDir(dir) {
  return !existsSync(dir) || readdirSync(dir).every((name) => name === '.git')
}

/** A script's command text with `npm run <other>` style delegations expanded. */
function expandScript(scripts, name, depth = 0) {
  const command = scripts?.[name]
  if (typeof command !== 'string') return ''
  if (depth >= 4) return command
  const delegated = [...command.matchAll(/\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?([\w:.-]+)/g)].map((m) => m[1])
  return [command, ...delegated.map((other) => (other === name ? '' : expandScript(scripts, other, depth + 1)))].join(' ')
}

/** Contract-level anchor detection: what the app provides, not how its files are named. */
export function detectAnchors(dir) {
  const anchors = { build: false, kit: false, index: false }

  const pkgFile = path.join(dir, 'package.json')
  if (existsSync(pkgFile)) {
    const pkg = readJson(pkgFile)
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    const hasConfig = readdirSync(dir).some((name) => /^vite\.config\./.test(name))
    anchors.build =
      /\bvite\b/.test(expandScript(pkg.scripts, 'build')) &&
      BUILD_DEPS.every((name) => name in deps) &&
      hasConfig &&
      existsSync(path.join(dir, 'tsconfig.json'))
  }

  const kitSource = walk(path.join(dir, 'src/presentation-kit'))
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .map(read)
    .join('\n')
  anchors.kit =
    kitSource !== '' &&
    KIT_EXPORTS.every((name) =>
      new RegExp(`export\\s+(?:default\\s+)?(?:declare\\s+)?(?:function|const|class|interface|type)\\s+${name}\\b|export\\s*(?:type\\s*)?\\{[^}]*\\b${name}\\b`).test(kitSource),
    )

  const registry = ['index.ts', 'index.tsx']
    .map((name) => path.join(dir, 'src/presentations', name))
    .find(existsSync)
  const appSource = walk(path.join(dir, 'src'))
    .filter((file) => /\.(ts|tsx)$/.test(file) && !file.includes(`${path.sep}presentation-kit${path.sep}`))
    .map(read)
    .join('\n')
  anchors.index =
    registry !== undefined &&
    /\bslug\b/.test(read(registry)) &&
    /pathname/.test(appSource) &&
    /presentations/.test(appSource)

  return anchors
}

function looksLikeMonorepo(dir) {
  if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return 'pnpm-workspace.yaml'
  const pkgFile = path.join(dir, 'package.json')
  if (existsSync(pkgFile) && readJson(pkgFile).workspaces) return 'package.json workspaces'
  for (const name of ['packages', 'apps']) {
    if (existsSync(path.join(dir, name)) && statSync(path.join(dir, name)).isDirectory()) return `${name}/ layout`
  }
  return null
}

function hasPresentationAnchors(dir) {
  const { kit, index } = detectAnchors(dir)
  return kit || index
}

/**
 * Where the presentation app lives: an app we are already inside, the
 * `presentations/` app of a monorepo, or the project root.
 */
export function resolveTarget(startDir) {
  const start = path.resolve(startDir)
  for (let dir = start; ; dir = path.dirname(dir)) {
    if (hasPresentationAnchors(dir)) {
      return { target: dir, kind: 'existing-app', reason: 'presentation anchors already present', projectEmpty: false }
    }
    if (path.dirname(dir) === dir) break
  }
  const nested = path.join(start, 'presentations')
  if (hasPresentationAnchors(nested)) {
    return { target: nested, kind: 'existing-app', reason: 'presentation app found under presentations/', projectEmpty: false }
  }
  const monorepo = looksLikeMonorepo(start)
  if (monorepo) {
    return { target: nested, kind: 'monorepo', reason: `monorepo detected (${monorepo})`, projectEmpty: false }
  }
  return { target: start, kind: 'standalone', reason: 'standalone project', projectEmpty: isEmptyDir(start) }
}

function templateFilesFor(anchor) {
  const wanted = ANCHOR_FILES[anchor]
  return walk(bootstrapDir)
    .map((file) => path.relative(bootstrapDir, file).split(path.sep).join('/'))
    .filter((rel) => wanted.some((prefix) => (prefix.endsWith('/') ? rel.startsWith(prefix) : rel === prefix)))
}

/** What scaffolding would add, without writing anything. */
export function planScaffold(target) {
  const anchors = detectAnchors(target)
  const missing = Object.keys(anchors).filter((name) => !anchors[name])
  const copy = []
  const conflicts = []
  const groups = [...missing, ...(missing.length > 0 ? ['tooling'] : [])]
  for (const group of groups) {
    for (const rel of templateFilesFor(group)) {
      if (existsSync(path.join(target, rel))) conflicts.push(rel)
      else copy.push(rel)
    }
  }

  const template = readJson(path.join(bootstrapDir, 'package.json'))
  const pkgFile = path.join(target, 'package.json')
  const existing = existsSync(pkgFile) ? readJson(pkgFile) : null
  const have = { ...existing?.dependencies, ...existing?.devDependencies }
  const addDependencies = missing.length === 0 ? {} : Object.fromEntries(Object.entries(template.dependencies).filter(([n]) => !(n in have)))
  const addDevDependencies = missing.length === 0 ? {} : Object.fromEntries(Object.entries(template.devDependencies).filter(([n]) => !(n in have)))
  const addScripts = missing.length === 0 ? {} : Object.fromEntries(Object.entries(template.scripts).filter(([n]) => !(n in (existing?.scripts ?? {}))))
  const copyLock = existing === null && missing.length > 0
  return { target, anchors, missing, copy, conflicts, addDependencies, addDevDependencies, addScripts, createPackage: existing === null && missing.length > 0, copyLock }
}

/** A valid npm package name derived from the target directory name. */
export function packageName(target, fallback) {
  const name = path.basename(target).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[-._]+|-+$/g, '')
  return name || fallback
}

export class ConfirmationRequired extends Error {
  constructor(target) {
    super(`scaffolding into non-empty project requires confirmation of target ${target}`)
    this.name = 'ConfirmationRequired'
  }
}

/**
 * Write the plan. Existing files are never overwritten. Writing into a
 * non-empty project needs `confirmed: true`; without it nothing is written.
 */
export function applyScaffold(startDir, { confirmed = false } = {}) {
  const resolved = resolveTarget(startDir)
  const plan = planScaffold(resolved.target)
  if (plan.missing.length === 0) return { ...resolved, plan, written: [], skipped: true }
  const projectEmpty = resolved.kind === 'standalone' ? resolved.projectEmpty : false
  if (!projectEmpty && !confirmed) throw new ConfirmationRequired(resolved.target)

  mkdirSync(resolved.target, { recursive: true })
  const written = []
  for (const rel of plan.copy) {
    const dest = path.join(resolved.target, rel)
    mkdirSync(path.dirname(dest), { recursive: true })
    writeFileSync(dest, readFileSync(path.join(bootstrapDir, rel)))
    written.push(rel)
  }

  const template = readJson(path.join(bootstrapDir, 'package.json'))
  const pkgFile = path.join(resolved.target, 'package.json')
  if (plan.createPackage) {
    writeFileSync(pkgFile, `${JSON.stringify({ ...template, name: packageName(resolved.target, template.name) }, null, 2)}\n`)
    const lock = path.join(bootstrapDir, 'package-lock.json')
    if (existsSync(lock) && !existsSync(path.join(resolved.target, 'package-lock.json'))) {
      writeFileSync(path.join(resolved.target, 'package-lock.json'), readFileSync(lock))
      written.push('package-lock.json')
    }
    written.push('package.json')
  } else {
    const additions = [plan.addDependencies, plan.addDevDependencies, plan.addScripts]
    if (additions.some((added) => Object.keys(added).length > 0)) {
      const pkg = readJson(pkgFile)
      pkg.dependencies = { ...pkg.dependencies, ...plan.addDependencies }
      pkg.devDependencies = { ...pkg.devDependencies, ...plan.addDevDependencies }
      pkg.scripts = { ...pkg.scripts, ...plan.addScripts }
      writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`)
      written.push('package.json')
    }
  }
  return { ...resolved, plan, written, skipped: false }
}

function cli(argv) {
  const [command, ...rest] = argv
  const flag = (name) => rest.includes(name)
  const dirIndex = rest.indexOf('--dir')
  const dir = path.resolve(dirIndex >= 0 ? rest[dirIndex + 1] : process.cwd())
  const print = (value) => console.log(JSON.stringify(value, null, 2))
  if (command === 'detect') {
    const resolved = resolveTarget(dir)
    return print({ ...resolved, anchors: detectAnchors(resolved.target) })
  }
  if (command === 'plan') {
    const resolved = resolveTarget(dir)
    return print({ ...resolved, plan: planScaffold(resolved.target) })
  }
  if (command === 'apply') {
    try {
      const result = applyScaffold(dir, { confirmed: flag('--confirmed') })
      print(result)
      if (!result.skipped && !flag('--no-install')) {
        const install = spawnSync('npm', ['install'], { cwd: result.target, stdio: 'inherit' })
        if (install.status !== 0) process.exitCode = install.status ?? 1
      }
    } catch (error) {
      console.error(error.message)
      process.exitCode = error instanceof ConfirmationRequired ? 2 : 1
    }
    return undefined
  }
  console.error('usage: bootstrap.mjs detect|plan|apply [--dir D] [--confirmed] [--no-install]')
  process.exitCode = 1
  return undefined
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli(process.argv.slice(2))
