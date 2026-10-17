#!/usr/bin/env node
// Detects and scaffolds the infrastructure a generated presentation depends on.
//   node scaffold.mjs detect [dir]                      print the resolved target and missing anchors as JSON
//   node scaffold.mjs apply [dir] [--target <dir>] [--no-install] [--starter]
//   node scaffold.mjs create <slug> "<Title>" [--app <dir>]   add a new presentation folder and registry line
// Templates are resolved relative to this file (the skill directory), never the working directory.
import { spawnSync } from 'node:child_process'
import { cp, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP_DIR = path.join(skillDir, 'templates', 'bootstrap')
export const PRESENTATION_TEMPLATE_DIR = path.join(skillDir, 'templates', 'presentation')

/** `--workspaces=false` keeps a nested app's install (lockfile, node_modules) out of a monorepo root. */
export const INSTALL_ARGS = ['install', '--workspaces=false']

const IGNORED = new Set(['.git', '.DS_Store'])
const MONOREPO_FILES = ['pnpm-workspace.yaml', 'lerna.json', 'turbo.json']
const MONOREPO_DIRS = ['packages', 'apps']

const exists = (p) => stat(p).then(() => true, () => false)
const readJson = (p) => readFile(p, 'utf8').then(JSON.parse, () => null)

async function visibleEntries(dir) {
  return (await readdir(dir).catch(() => [])).filter((name) => !IGNORED.has(name))
}

export async function isMonorepo(dir) {
  const pkg = await readJson(path.join(dir, 'package.json'))
  if (pkg?.workspaces) return true
  for (const file of MONOREPO_FILES) if (await exists(path.join(dir, file))) return true
  for (const sub of MONOREPO_DIRS) if (await exists(path.join(dir, sub))) return true
  return false
}

/** Contract-level anchor detection: keyed on what exists, not on a byte-identical scaffold. */
export async function detectAnchors(dir) {
  const pkg = await readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const viteConfig = (await visibleEntries(dir)).some((name) => /^vite\.config\.[cm]?[jt]s$/.test(name))
  const build = Boolean(pkg?.scripts?.build && deps.vite && deps.react && deps.typescript && viteConfig)

  let kit = false
  for (const name of ['index.ts', 'index.tsx']) {
    const source = await readFile(path.join(dir, 'src', 'presentation-kit', name), 'utf8').catch(() => '')
    if (/\bPresentation\b/.test(source)) kit = true
  }
  const index = (await visibleEntries(path.join(dir, 'src', 'presentations'))).some((name) => /^index\.[jt]sx?$/.test(name))
  return { build, kit, index }
}

const missingOf = (anchors) => Object.keys(anchors).filter((name) => !anchors[name])

/** Resolves where the presentation app lives and which anchors it lacks. */
export async function detect(cwd) {
  const entries = await visibleEntries(cwd)
  const empty = entries.length === 0
  const monorepo = await isMonorepo(cwd)
  const nested = path.join(cwd, 'presentations')

  const here = await detectAnchors(cwd)
  const inNested = await detectAnchors(nested)
  let appDir = cwd
  let reason = 'standalone or empty project: scaffold at the repository root'
  if (here.kit || here.index) {
    reason = 'the current directory already is a presentation app'
  } else if (inNested.kit || inNested.index) {
    appDir = nested
    reason = 'an existing presentation app lives in presentations/'
  } else if (monorepo && !empty) {
    appDir = nested
    reason = 'monorepo detected: scaffold a self-contained app in presentations/'
  }
  const anchors = appDir === cwd ? here : inNested
  const missing = missingOf(anchors)
  return {
    cwd,
    appDir,
    reason,
    empty,
    monorepo,
    anchors,
    missing,
    // Writing scaffold files into a non-empty project needs the user's confirmation of the target first.
    needsConfirmation: !empty && missing.length > 0,
  }
}

/** Copies a file or directory tree, filling in only what is absent; existing files are never touched. */
async function copyIfAbsent(source, target, written, skipped) {
  if ((await stat(source)).isDirectory()) {
    for (const name of await readdir(source)) await copyIfAbsent(path.join(source, name), path.join(target, name), written, skipped)
    return
  }
  if (await exists(target)) {
    skipped.push(target)
    return
  }
  await mkdir(path.dirname(target), { recursive: true })
  await cp(source, target)
  written.push(target)
}

async function mergePackageJson(appDir, written) {
  const target = path.join(appDir, 'package.json')
  const template = await readJson(path.join(BOOTSTRAP_DIR, 'package.json'))
  const current = await readJson(target)
  if (!current) {
    await writeFile(target, `${JSON.stringify(template, null, 2)}\n`)
    written.push(target)
    return
  }
  const alreadyHas = (name) => name in { ...current.dependencies, ...current.devDependencies }
  const merged = { ...current, type: current.type ?? template.type }
  merged.scripts = { ...template.scripts, ...current.scripts }
  for (const section of ['dependencies', 'devDependencies']) {
    const add = Object.fromEntries(Object.entries(template[section] ?? {}).filter(([name]) => !alreadyHas(name)))
    merged[section] = { ...current[section], ...add }
  }
  await writeFile(target, `${JSON.stringify(merged, null, 2)}\n`)
  written.push(target)
}

const BUILD_FILES = [
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'eslint.config.js',
  'src/main.tsx',
  'src/index.css',
]
const INDEX_FILES = ['src/Router.tsx', 'src/router.ts', 'src/Landing.tsx']
/** The registry module, whatever its extension. */
async function registryFile(appDir) {
  for (const name of ['index.ts', 'index.tsx', 'index.js', 'index.jsx']) {
    const file = path.join(appDir, 'src', 'presentations', name)
    if (await exists(file)) return file
  }
  return null
}

const REGISTRY = `import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/** Explicit registry: adding a presentation is a new folder plus one line here. */
export const presentations: PresentationEntry[] = []
`

/** Copies the templates for the missing anchors without overwriting anything that exists. */
export async function apply(appDir, missing, { starter = false, install = true } = {}) {
  const written = []
  const skipped = []
  await mkdir(appDir, { recursive: true })
  const from = (rel) => path.join(BOOTSTRAP_DIR, rel)
  const to = (rel) => path.join(appDir, rel)

  if (missing.length) {
    // dependencies, scripts and verification tooling every presentation needs, whatever was already there
    const hadPackage = await exists(to('package.json'))
    await mergePackageJson(appDir, written)
    if (!hadPackage) await copyIfAbsent(from('package-lock.json'), to('package-lock.json'), written, skipped)
    for (const rel of ['scripts', 'verify.config.json']) await copyIfAbsent(from(rel), to(rel), written, skipped)
    const ignore = to('.gitignore')
    if (await exists(ignore)) {
      const lines = (await readFile(ignore, 'utf8')).split('\n')
      const extra = (await readFile(from('.gitignore'), 'utf8')).split('\n').filter((l) => l && !lines.includes(l))
      if (extra.length) await writeFile(ignore, `${lines.join('\n').replace(/\n*$/, '\n')}${extra.join('\n')}\n`)
    } else {
      await copyIfAbsent(from('.gitignore'), ignore, written, skipped)
    }
  }
  if (missing.includes('build')) {
    for (const rel of BUILD_FILES) await copyIfAbsent(from(rel), to(rel), written, skipped)
  }
  if (missing.includes('kit')) {
    await copyIfAbsent(from('src/presentation-kit'), to('src/presentation-kit'), written, skipped)
  }
  if (missing.includes('index')) {
    for (const rel of INDEX_FILES) await copyIfAbsent(from(rel), to(rel), written, skipped)
    if (starter) {
      await copyIfAbsent(from('src/presentations'), to('src/presentations'), written, skipped)
    } else if (!(await registryFile(appDir))) {
      await mkdir(to('src/presentations'), { recursive: true })
      await writeFile(to('src/presentations/index.ts'), REGISTRY)
      written.push(to('src/presentations/index.ts'))
    }
  }
  const notes = []
  const entry = await readFile(to('src/main.tsx'), 'utf8').catch(() => null)
  if (missing.includes('index') && entry !== null && !/\bRouter\b/.test(entry)) {
    notes.push('src/main.tsx exists but does not render <Router />: wire it (see templates/bootstrap/src/main.tsx) so presentation routes work')
  }

  let installed = false
  if (install && missing.length) {
    const result = spawnSync('npm', INSTALL_ARGS, { cwd: appDir, stdio: 'inherit' })
    installed = result.status === 0
    if (!installed) throw new Error('npm install failed in ' + appDir)
  }
  return { appDir, written, skipped, installed, notes }
}

/** Fills the placeholders of the new-presentation template. */
export function fillTemplate(text, slug, title) {
  // `__TITLE_JSON__` is a JS string literal (safe inside TSX attributes); `__TITLE__` is the raw text
  return text.replaceAll('__SLUG__', slug).replaceAll('__TITLE_JSON__', JSON.stringify(title)).replaceAll('__TITLE__', title)
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Adds a registry entry to an `index.ts` source, keeping the explicit-array format. */
export function addRegistryEntry(source, slug, title) {
  const open = /\bpresentations\b[^=\n;]*=\s*\[/.exec(source)
  const close = source.lastIndexOf(']')
  if (!open || close < open.index + open[0].length) throw new Error('could not find the presentations array in the registry')
  const quoted = `'${title.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
  const entry = `  {\n    slug: '${slug}',\n    title: ${quoted},\n    load: () => import('./${slug}/Talk.tsx'),\n  },\n`
  let body = source.slice(open.index + open[0].length, close).replace(/\s*$/, '')
  if (body && !body.endsWith(',')) body += ','
  return `${source.slice(0, open.index + open[0].length)}${body}\n${entry}${source.slice(close)}`
}

/** Creates `src/presentations/<slug>/` from the presentation template and registers it. */
export async function createPresentation(appDir, slug, title) {
  if (!SLUG_PATTERN.test(slug)) throw new Error(`invalid slug "${slug}" (use lowercase words joined by hyphens)`)
  const folder = path.join(appDir, 'src', 'presentations', slug)
  const registryPath = await registryFile(appDir)
  if (!registryPath) throw new Error('no presentation registry (src/presentations/index.*) found')
  if (await exists(folder)) throw new Error(`presentation "${slug}" already exists`)
  const registry = await readFile(registryPath, 'utf8')
  const updated = addRegistryEntry(registry, slug, title)
  await mkdir(folder, { recursive: true })
  for (const name of await readdir(PRESENTATION_TEMPLATE_DIR)) {
    const text = await readFile(path.join(PRESENTATION_TEMPLATE_DIR, name), 'utf8')
    await writeFile(path.join(folder, name), fillTemplate(text, slug, title))
  }
  await writeFile(registryPath, updated)
  return { folder, registryFile: registryPath }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, ...rest] = process.argv.slice(2)
  const flag = (name) => rest.includes(name)
  const value = (name) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : undefined)
  const positional = rest.filter((arg, i) => !arg.startsWith('--') && rest[i - 1] !== '--target')[0]
  const cwd = path.resolve(positional ?? process.cwd())
  const detected = command === 'create' ? null : await detect(cwd)
  if (command === 'create') {
    const [slug, title] = rest.filter((arg, i) => !arg.startsWith('--') && rest[i - 1] !== '--app')
    const appDir = path.resolve(value('--app') ?? (await detect(process.cwd())).appDir)
    console.log(JSON.stringify(await createPresentation(appDir, slug, title ?? slug), null, 2))
  } else if (command === 'detect') {
    console.log(JSON.stringify(detected, null, 2))
  } else if (command === 'apply') {
    const appDir = path.resolve(value('--target') ?? detected.appDir)
    const anchors = appDir === detected.appDir ? detected.missing : missingOf(await detectAnchors(appDir))
    console.log(JSON.stringify(await apply(appDir, anchors, { starter: flag('--starter'), install: !flag('--no-install') }), null, 2))
  } else {
    console.error('usage: scaffold.mjs detect|apply|create [dir] [--target <dir>] [--no-install] [--starter]')
    process.exit(2)
  }
}
