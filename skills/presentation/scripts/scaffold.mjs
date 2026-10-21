#!/usr/bin/env node
// Helper for the presentation skill: detect scaffold anchors, resolve where the
// presentation app belongs, scaffold what is missing, and add a presentation.
// Templates are resolved relative to this file, never the caller's cwd.
//
//   node scaffold.mjs detect <projectRoot>
//   node scaffold.mjs apply <targetDir> [--install]
//   node scaffold.mjs new <targetDir> <slug> <title>
import { spawn } from 'node:child_process'
import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates', 'bootstrap')
export const PRESENTATION_DIR = path.join(SKILL_DIR, 'templates', 'presentation')

const exists = (p) => stat(p).then(() => true, () => false)
const readJson = (p) => readFile(p, 'utf8').then(JSON.parse, () => null)

async function listFiles(dir, skip = new Set(['node_modules', 'dist', '.git'])) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (skip.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await listFiles(full, skip)))
    else out.push(full)
  }
  return out
}

/** Contract-level detection: keyed on what the project provides, not on exact files. */
export async function detectAnchors(dir) {
  const pkg = await readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const build =
    !!pkg?.scripts?.build &&
    ['vite', 'react', 'typescript'].every((name) => name in deps) &&
    (await exists(path.join(dir, 'tsconfig.json')))

  const sources = []
  for (const file of await listFiles(path.join(dir, 'src'))) {
    if (/\.[cm]?[jt]sx?$/.test(file)) sources.push(await readFile(file, 'utf8'))
  }
  const any = (re) => sources.some((text) => re.test(text))
  const kit =
    any(/export\s+(?:default\s+)?(?:function|const|class)\s+Presentation\b|export\s*\{[^}]*\bPresentation\b/) &&
    any(/export\s+(?:type|interface)\s+Step\b|export\s+(?:type\s*)?\{[^}]*\bStep\b/) &&
    any(/AnimatePresence/) &&
    any(/keydown/)
  const index = any(/slug\s*:/) && any(/load\s*:/) && (await exists(path.join(dir, 'src', 'presentations')))
  return { build, kit, index }
}

export async function isEmptyProject(dir) {
  const entries = await readdir(dir).catch(() => [])
  return entries.every((name) => name === '.git')
}

export async function hasMonorepoSignal(root) {
  const pkg = await readJson(path.join(root, 'package.json'))
  if (pkg?.workspaces) return true
  return (
    (await exists(path.join(root, 'pnpm-workspace.yaml'))) ||
    (await exists(path.join(root, 'packages'))) ||
    (await exists(path.join(root, 'apps')))
  )
}

/**
 * Decides where the presentation app lives. Anchors are judged in the resolved
 * target directory; a monorepo root's own build never satisfies them.
 */
export async function resolveTarget(root) {
  const empty = await isEmptyProject(root)
  const rootAnchors = await detectAnchors(root)
  let target = root
  let reason = 'standalone project: scaffold at the repository root'
  if (empty) {
    reason = 'empty directory: scaffold at the root'
  } else if (rootAnchors.kit || rootAnchors.index) {
    reason = 'existing presentation app at the root'
  } else {
    const nested = path.join(root, 'presentations')
    const nestedAnchors = await detectAnchors(nested)
    if (nestedAnchors.kit || nestedAnchors.index) {
      target = nested
      reason = 'existing presentation app in presentations/'
    } else if (await hasMonorepoSignal(root)) {
      target = nested
      reason = 'monorepo: scaffold a self-contained app in presentations/'
    }
  }
  const anchors = target === root ? rootAnchors : await detectAnchors(target)
  const missing = Object.keys(anchors).filter((name) => !anchors[name])
  return { target, reason, empty, anchors, missing, needsConfirmation: !empty && missing.length > 0 }
}

/** Verification and inspection tooling is copied whenever anything is scaffolded, since the package scripts depend on it. */
const isTooling = (relative) => relative.startsWith('scripts/')

function groupOf(relative) {
  if (relative.startsWith('src/presentation-kit/')) return 'kit'
  if (
    relative.startsWith('src/presentations/') ||
    ['src/Router.tsx', 'src/Landing.tsx', 'src/routes.ts', 'src/main.tsx'].includes(relative)
  ) {
    return 'index'
  }
  return 'build'
}

const major = (range) => /\d+/.exec(String(range))?.[0]

/**
 * Adds missing scripts and dependencies without changing existing ones. Returns
 * the dependencies whose existing major version differs from what the kit needs.
 */
async function mergePackageJson(targetFile, templateFile, targetDir) {
  const current = await readJson(targetFile)
  const template = await readJson(templateFile)
  const merged = { ...current }
  const incompatible = []
  for (const field of ['scripts', 'dependencies', 'devDependencies']) {
    merged[field] = { ...template[field], ...current[field] }
  }
  for (const field of ['dependencies', 'devDependencies']) {
    for (const [name, required] of Object.entries(template[field])) {
      const existing = current[field]?.[name]
      if (existing && major(existing) !== major(required)) incompatible.push({ name, existing, required })
    }
  }
  // Drop template commands whose script files were not copied; never touch the project's own scripts.
  for (const name of Object.keys(template.scripts)) {
    if (current.scripts?.[name] !== undefined) continue
    const file = /node (scripts\/\S+)/.exec(merged.scripts[name])?.[1]
    if (file && !(await exists(path.join(targetDir, file)))) delete merged.scripts[name]
  }
  await writeFile(targetFile, `${JSON.stringify(merged, null, 2)}\n`)
  return incompatible
}

/** Copies only the missing anchors' files; never overwrites an existing file. */
export async function scaffold(targetDir, anchors) {
  const result = { copied: [], skipped: [], merged: [], incompatible: [] }
  const missing = Object.entries(anchors).filter(([, present]) => !present).map(([name]) => name)
  if (missing.length === 0) return result
  await mkdir(targetDir, { recursive: true })
  const hadPackage = await exists(path.join(targetDir, 'package.json'))
  for (const file of await listFiles(BOOTSTRAP_DIR, new Set(['node_modules']))) {
    const relative = path.relative(BOOTSTRAP_DIR, file).split(path.sep).join('/')
    if (!isTooling(relative) && !missing.includes(groupOf(relative))) continue
    if (relative === 'package.json' || relative === 'package-lock.json') continue
    const target = path.join(targetDir, relative)
    if (await exists(target)) {
      result.skipped.push(relative)
      continue
    }
    await mkdir(path.dirname(target), { recursive: true })
    await cp(file, target)
    result.copied.push(relative)
  }
  // Dependencies are never assumed present: add every one that is missing.
  if (hadPackage) {
    result.incompatible = await mergePackageJson(path.join(targetDir, 'package.json'), path.join(BOOTSTRAP_DIR, 'package.json'), targetDir)
    result.merged.push('package.json')
  } else {
    for (const name of ['package.json', 'package-lock.json']) {
      await cp(path.join(BOOTSTRAP_DIR, name), path.join(targetDir, name))
      result.copied.push(name)
    }
  }
  return result
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' })
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`))))
  })
}

export async function installDependencies(dir) {
  await run('npm', ['install'], dir)
  await run('npx', ['playwright', 'install', 'chromium'], dir)
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Writes a presentation folder from the template and appends its registry line. */
export async function createPresentation(targetDir, slug, title) {
  if (!SLUG.test(slug)) throw new Error(`slug "${slug}" must be kebab-case`)
  const folder = path.join(targetDir, 'src', 'presentations', slug)
  const registryFile = path.join(targetDir, 'src', 'presentations', 'index.ts')
  if (await exists(folder)) throw new Error(`presentation "${slug}" already exists`)
  const registry = await readFile(registryFile, 'utf8')
  const fill = (text) => text.replaceAll('__SLUG__', slug).replaceAll('__TITLE__', title.replaceAll('\\', '\\\\').replaceAll("'", "\\'"))

  await mkdir(folder, { recursive: true })
  const files = []
  for (const name of await readdir(PRESENTATION_DIR)) {
    const text = fill(await readFile(path.join(PRESENTATION_DIR, name), 'utf8'))
    if (name === 'registry-entry.txt') continue
    await writeFile(path.join(folder, name), text)
    files.push(name)
  }
  const entry = fill(await readFile(path.join(PRESENTATION_DIR, 'registry-entry.txt'), 'utf8'))
  const close = registry.lastIndexOf('\n]')
  if (close === -1) throw new Error('could not find the end of the PRESENTATIONS array in src/presentations/index.ts')
  await writeFile(registryFile, `${registry.slice(0, close + 1)}${entry}${registry.slice(close + 1)}`)
  return { folder, files }
}

async function main(argv) {
  const [command, dir = process.cwd(), ...rest] = argv
  const resolved = path.resolve(dir)
  if (command === 'detect') {
    console.log(JSON.stringify(await resolveTarget(resolved), null, 2))
  } else if (command === 'apply') {
    const result = await scaffold(resolved, await detectAnchors(resolved))
    console.log(JSON.stringify(result, null, 2))
    if (rest.includes('--install')) await installDependencies(resolved)
  } else if (command === 'new') {
    const [slug, ...title] = rest
    console.log(JSON.stringify(await createPresentation(resolved, slug, title.join(' ') || slug), null, 2))
  } else {
    throw new Error('usage: scaffold.mjs detect <root> | apply <target> [--install] | new <target> <slug> <title>')
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
