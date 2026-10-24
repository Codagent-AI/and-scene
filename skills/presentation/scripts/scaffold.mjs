// Anchor detection, scaffold-target resolution, and non-destructive scaffolding
// for the presentation skill. Templates resolve from this file's location, never
// from the caller's working directory.
//
//   node scaffold.mjs resolve <dir>            print the detection/target report as JSON
//   node scaffold.mjs apply <dir> [--confirm] [--install]
//                                              scaffold the missing anchors into the resolved target;
//                                              refuses to write into a non-empty project without --confirm
//   node scaffold.mjs create <target> <slug> <title>   copy the presentation template and register it
import { spawnSync } from 'node:child_process'
import { access, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates/bootstrap')
export const PRESENTATION_TEMPLATE_DIR = path.join(SKILL_DIR, 'templates/presentation')

export const ANCHORS = ['build', 'kit', 'index']

const exists = (p) => access(p).then(() => true, () => false)
async function readJson(p) {
  try {
    return JSON.parse(await readFile(p, 'utf8'))
  } catch {
    return undefined
  }
}

async function walk(dir, { maxDepth = 6, skip = ['node_modules', 'dist', '.git'] } = {}, depth = 0) {
  const out = []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    if (skip.includes(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (depth < maxDepth) out.push(...(await walk(full, { maxDepth, skip }, depth + 1)))
    } else out.push(full)
  }
  return out
}

/** Which template files belong to which anchor. */
export function anchorOf(relPath) {
  const p = relPath.split(path.sep).join('/')
  if (p.startsWith('src/presentation-kit/')) return 'kit'
  if (p.startsWith('src/presentations/') || ['src/router.ts', 'src/AppRouter.tsx', 'src/Landing.tsx'].includes(p)) return 'index'
  return 'build'
}

/**
 * Contract-level detection: each anchor is recognised by what it provides, not
 * by exact file names or formatting.
 */
export async function detectAnchors(dir) {
  const result = { build: false, kit: false, index: false }
  const pkg = await readJson(path.join(dir, 'package.json'))
  if (pkg) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    const hasConfig = (await readdir(dir)).some((name) => /^vite\.config\.(ts|js|mjs|mts|cjs)$/.test(name))
    result.build = Boolean(pkg.scripts?.build && deps.vite && deps.react && deps.typescript && hasConfig)
  }
  const sources = (await walk(path.join(dir, 'src'))).filter((f) => /\.(tsx?|jsx?)$/.test(f))
  const texts = new Map(await Promise.all(sources.map(async (f) => [f, await readFile(f, 'utf8')])))
  const hosts = [...texts].filter(([, t]) => /export\s+(?:default\s+)?(?:function|const)\s+Presentation\b/.test(t))
  for (const [file] of hosts) {
    const kitDir = path.dirname(file)
    const stageInKit = [...texts].some(([f, t]) => f.startsWith(kitDir) && /AnimatePresence/.test(t))
    if (stageInKit) result.kit = true
  }
  result.index = [...texts].some(([, t]) => /\bslug\s*:/.test(t) && /\bload\s*:/.test(t) && /import\s*\(/.test(t))
  return result
}

export async function detectMonorepo(dir) {
  const signals = []
  const pkg = await readJson(path.join(dir, 'package.json'))
  if (pkg?.workspaces) signals.push('package.json workspaces')
  if (await exists(path.join(dir, 'pnpm-workspace.yaml'))) signals.push('pnpm-workspace.yaml')
  for (const name of ['packages', 'apps']) {
    if ((await stat(path.join(dir, name)).catch(() => undefined))?.isDirectory()) signals.push(`${name}/ directory`)
  }
  return signals
}

async function isNonEmpty(dir) {
  const entries = await readdir(dir).catch(() => [])
  return entries.some((name) => name !== '.git' && name !== '.DS_Store')
}

const noAnchors = { build: false, kit: false, index: false }
const detectIfDir = async (dir) => ((await exists(dir)) ? detectAnchors(dir) : { ...noAnchors })

/**
 * Where the scaffold belongs: an existing presentation app (kit or index present)
 * is reused, a monorepo gets a self-contained `presentations/` app, anything else
 * scaffolds at the root.
 */
export async function resolveTarget(dir) {
  dir = path.resolve(dir)
  const here = await detectIfDir(dir)
  const nestedDir = path.join(dir, 'presentations')
  const nested = await detectIfDir(nestedDir)
  const monorepoSignals = await detectMonorepo(dir)
  let target = dir
  let reason = 'standalone or empty project: scaffold at the root'
  if (here.kit || here.index) reason = 'already a presentation app: reuse it'
  else if (nested.kit || nested.index) {
    target = nestedDir
    reason = 'existing presentations/ app: reuse it'
  } else if (monorepoSignals.length > 0) {
    target = nestedDir
    reason = `monorepo (${monorepoSignals.join(', ')}): scaffold a self-contained app under presentations/`
  }
  const anchors = target === dir ? here : nested
  const missing = ANCHORS.filter((a) => !anchors[a])
  const projectNonEmpty = await isNonEmpty(dir)
  return {
    root: dir,
    target,
    reason,
    monorepo: monorepoSignals.length > 0,
    anchors,
    missing,
    projectNonEmpty,
    needsConfirmation: projectNonEmpty && (!anchors.kit || !anchors.index),
  }
}

/** Adds dependencies the template declares but the target's package.json lacks. */
export async function ensureDependencies(target) {
  const file = path.join(target, 'package.json')
  const pkg = await readJson(file)
  const template = await readJson(path.join(BOOTSTRAP_DIR, 'package.json'))
  const added = []
  if (!pkg) return added
  for (const section of ['dependencies', 'devDependencies']) {
    for (const [name, version] of Object.entries(template[section])) {
      if (pkg.dependencies?.[name] || pkg.devDependencies?.[name]) continue
      pkg[section] = { ...pkg[section], [name]: version }
      added.push(name)
    }
  }
  pkg.scripts = { ...pkg.scripts }
  for (const name of ['verify', 'inspect']) {
    if (!pkg.scripts[name]) pkg.scripts[name] = template.scripts[name]
  }
  await writeFile(file, `${JSON.stringify(pkg, null, 2)}\n`)
  return added
}

/** Copies the template files of the given anchors, never overwriting an existing file. */
export async function scaffold(target, anchors = ANCHORS) {
  const written = []
  const skipped = []
  const targetHadPackage = await exists(path.join(target, 'package.json'))
  for (const file of await walk(BOOTSTRAP_DIR)) {
    const rel = path.relative(BOOTSTRAP_DIR, file)
    if (!anchors.includes(anchorOf(rel))) continue
    if (targetHadPackage && rel === 'package-lock.json') continue
    const dest = path.join(target, rel)
    if (await exists(dest)) {
      skipped.push(rel)
      continue
    }
    await mkdir(path.dirname(dest), { recursive: true })
    await writeFile(dest, await readFile(file))
    written.push(rel)
  }
  const dependenciesAdded = await ensureDependencies(target)
  return { written, skipped, dependenciesAdded }
}

const render = (text, vars) => text.replace(/\{\{(SLUG|TITLE)\}\}/g, (_, key) => vars[key])

/** Writes a new presentation folder from the template and registers it. */
export async function createPresentation(target, slug, title) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new Error(`slug must be lowercase letters, digits, and dashes: ${slug}`)
  const destDir = path.join(target, 'src/presentations', slug)
  if (await exists(destDir)) throw new Error(`presentation folder already exists: ${destDir}`)
  const registryFile = path.join(target, 'src/presentations/index.ts')
  const registry = await readFile(registryFile, 'utf8')
  if (new RegExp(`slug:\\s*['"]${slug}['"]`).test(registry)) throw new Error(`slug already registered: ${slug}`)
  const vars = { SLUG: slug, TITLE: title.replace(/["\\]/g, '') }
  for (const file of await walk(PRESENTATION_TEMPLATE_DIR)) {
    const dest = path.join(destDir, path.relative(PRESENTATION_TEMPLATE_DIR, file))
    await mkdir(path.dirname(dest), { recursive: true })
    await writeFile(dest, render(await readFile(file, 'utf8'), vars))
  }
  const entry = `  {\n    slug: '${slug}',\n    title: '${vars.TITLE.replace(/'/g, "\\'")}',\n    load: () => import('./${slug}/Talk.tsx'),\n  },\n`
  const close = registry.lastIndexOf('\n]')
  if (close === -1) throw new Error('could not find the end of the presentations array in src/presentations/index.ts')
  await writeFile(registryFile, `${registry.slice(0, close + 1)}${entry}${registry.slice(close + 1)}`)
  return { dir: destDir, registered: slug }
}

async function main([command, ...args]) {
  if (command === 'resolve') {
    console.log(JSON.stringify(await resolveTarget(args[0] ?? '.'), null, 2))
  } else if (command === 'apply') {
    const report = await resolveTarget(args[0] ?? '.')
    if (report.needsConfirmation && !args.includes('--confirm')) {
      console.error(
        `Refusing to scaffold: ${report.root} is not empty and lacks ${report.missing.join(', ')}.\n` +
          `Target: ${report.target} (${report.reason}).\n` +
          'State this target to the user and re-run with --confirm once they agree. Nothing was written.',
      )
      process.exitCode = 2
      return
    }
    await mkdir(report.target, { recursive: true })
    const result = await scaffold(report.target, report.missing)
    console.log(JSON.stringify({ target: report.target, ...result }, null, 2))
    if (args.includes('--install')) {
      const run = spawnSync('npm', ['install'], { cwd: report.target, stdio: 'inherit' })
      if (run.status !== 0) process.exitCode = run.status ?? 1
    }
  } else if (command === 'create') {
    const [target, slug, title] = args
    console.log(JSON.stringify(await createPresentation(path.resolve(target), slug, title ?? slug), null, 2))
  } else {
    console.error('usage: scaffold.mjs resolve <dir> | apply <dir> [--install] | create <target> <slug> <title>')
    process.exitCode = 1
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main(process.argv.slice(2))
