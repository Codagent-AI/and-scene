#!/usr/bin/env node
// Deterministic scaffold helper for the presentation skill.
// Commands:
//   anchors <dir>            report the three contract anchors and missing dependencies
//   target <dir>             resolve where the presentation app belongs
//   scaffold <dir>           add the missing anchors from the bootstrap; never overwrites a file
// Templates resolve relative to this file, so the caller's working directory does not matter.
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SKILL_DIR = fileURLToPath(new URL('..', import.meta.url))
export const TEMPLATE_ROOT = join(SKILL_DIR, 'templates', 'bootstrap')

/** Dependencies the scaffold needs; the skill must not assume any are installed. */
export const REQUIRED_DEPENDENCIES = [
  'react',
  'react-dom',
  'motion',
  'lucide-react',
  'vite',
  '@vitejs/plugin-react',
  'typescript',
  '@types/react',
  '@types/react-dom',
  '@types/node',
  'eslint',
  '@eslint/js',
  'globals',
  'typescript-eslint',
  'eslint-plugin-react-hooks',
  'eslint-plugin-react-refresh',
  'playwright',
]

/** Exports that make up the scene kit's step contract and engine. */
const KIT_EXPORTS = [
  /export\s+(?:async\s+)?function\s+Presentation\b|export\s+const\s+Presentation\b|export\s*\{[^}]*\bPresentation\b/,
  /export\s+(?:async\s+)?function\s+Stage\b|export\s+const\s+Stage\b|export\s*\{[^}]*\bStage\b/,
  /export\s+(?:async\s+)?function\s+usePresentationNav\b|export\s+const\s+usePresentationNav\b|export\s*\{[^}]*\busePresentationNav\b/,
  /export\s+(?:interface|type)\s+Step\b|export\s*\{[^}]*\bStep\b/,
  /export\s+(?:interface|type)\s+SceneProps\b|export\s*\{[^}]*\bSceneProps\b/,
]

const VITE_CONFIGS = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs']
const SOURCE_EXT = /\.(?:ts|tsx|js|mjs)$/

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return null
  }
}

/** Every source file under dir/src, as text. Missing directories yield no files. */
async function sourceTexts(dir) {
  const root = join(dir, 'src')
  if (!existsSync(root)) return []
  const texts = []
  const walk = async (path) => {
    for (const entry of await readdir(path)) {
      const next = join(path, entry)
      if ((await stat(next)).isDirectory()) await walk(next)
      else if (SOURCE_EXT.test(entry)) texts.push({ path: next, text: await readFile(next, 'utf8') })
    }
  }
  await walk(root)
  return texts
}

/** Build setup: a Vite app with a build script, React, Vite, and a Vite config file. */
async function hasBuildSetup(dir) {
  const manifest = await readJson(join(dir, 'package.json'))
  if (!manifest?.scripts?.build) return false
  const declared = new Set([...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.devDependencies ?? {})])
  if (!declared.has('react') || !declared.has('vite')) return false
  return VITE_CONFIGS.some((name) => existsSync(join(dir, name)))
}

/** Scene kit: the engine's exports exist across the app's source, not just in files with fixed names. */
async function hasSceneKit(dir) {
  const texts = await sourceTexts(dir)
  return KIT_EXPORTS.every((pattern) => texts.some(({ text }) => pattern.test(text)))
}

/** Presentation index: a source file exports a collection of entries that each map a slug to a lazy loader. */
async function hasPresentationIndex(dir) {
  const texts = await sourceTexts(dir)
  return texts.some(
    ({ text }) => /export\s+(?:const|let|default)\b/.test(text) && /\bslug\s*:/.test(text) && /\bload\s*:[^]*import\s*\(/.test(text),
  )
}

/** Contract-level detection: keyed on what the anchor provides, not on file names or formatting. */
export async function detectAnchors(dir) {
  const build = await hasBuildSetup(dir)
  const kit = await hasSceneKit(dir)
  const index = await hasPresentationIndex(dir)
  return { build, kit, index, complete: build && kit && index }
}

/** A project is a monorepo if it declares workspaces, has pnpm-workspace.yaml, or has packages/ or apps/. */
export async function isMonorepo(dir) {
  if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return true
  if (existsSync(join(dir, 'packages')) || existsSync(join(dir, 'apps'))) return true
  const packageJson = await readJson(join(dir, 'package.json'))
  return Boolean(packageJson && packageJson.workspaces)
}

/** Required dependencies the target's package.json does not declare. */
export async function missingDependencies(dir) {
  const packageJson = await readJson(join(dir, 'package.json'))
  const declared = new Set([
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {}),
  ])
  return REQUIRED_DEPENDENCIES.filter((name) => !declared.has(name))
}

async function isNonEmpty(dir) {
  if (!existsSync(dir)) return false
  const entries = await readdir(dir)
  return entries.some((entry) => entry !== '.git')
}

/** Decides where the presentation app lives and whether the user must confirm before writes. */
export async function resolveTarget(dir) {
  const anchors = await detectAnchors(dir)
  if (anchors.complete) return { target: dir, action: 'reuse', monorepo: false, confirmationRequired: false }

  if (await isMonorepo(dir)) {
    const target = join(dir, 'presentations')
    const nested = await detectAnchors(target)
    if (nested.complete) return { target, action: 'reuse', monorepo: true, confirmationRequired: false }
    return { target, action: 'scaffold', monorepo: true, confirmationRequired: true }
  }

  return { target: dir, action: 'scaffold', monorepo: false, confirmationRequired: await isNonEmpty(dir) }
}

async function listTemplateFiles(root = TEMPLATE_ROOT) {
  const files = []
  for (const entry of await readdir(root)) {
    const path = join(root, entry)
    if ((await stat(path)).isDirectory()) {
      files.push(...(await listTemplateFiles(path)))
    } else {
      files.push(relative(TEMPLATE_ROOT, path))
    }
  }
  return files.sort()
}

/** Which anchor a template file belongs to. Anything not kit or index is build setup. */
export function anchorOf(rel) {
  const path = rel.split(sep).join('/')
  if (path.startsWith('src/presentation-kit/')) return 'kit'
  if (path.startsWith('src/presentations/') || path === 'src/route.tsx' || path === 'src/Landing.tsx') return 'index'
  return 'build'
}

/**
 * Adds the missing anchors from the bootstrap. An anchor that is already present keeps its files;
 * a missing anchor gets its files, but never overwrites one that exists. An existing manifest gets
 * its missing scripts and required dependencies merged in, so an install can satisfy the contract.
 */
export async function scaffoldInto(target) {
  const present = await detectAnchors(target)
  const created = []
  const skipped = []
  const packageJsonCreated = !existsSync(join(target, 'package.json'))
  for (const rel of await listTemplateFiles()) {
    const dest = join(target, rel)
    const anchor = anchorOf(rel)
    if (existsSync(dest) || present[anchor] || (rel === 'package-lock.json' && !packageJsonCreated)) {
      skipped.push(rel)
      continue
    }
    await mkdir(dirname(dest), { recursive: true })
    await copyFile(join(TEMPLATE_ROOT, rel), dest)
    created.push(rel)
  }
  const merged = packageJsonCreated ? { addedScripts: [], addedDependencies: [] } : await mergeManifest(target)
  return { created, skipped, ...merged }
}

/** Adds scripts and required dependencies the target lacks, using the bootstrap's declared versions. */
async function mergeManifest(target) {
  const manifestPath = join(target, 'package.json')
  const manifest = await readJson(manifestPath)
  const template = await readJson(join(TEMPLATE_ROOT, 'package.json'))
  if (!manifest || !template) return { addedScripts: [], addedDependencies: [] }
  const addedScripts = []
  manifest.scripts = manifest.scripts ?? {}
  for (const [name, command] of Object.entries(template.scripts ?? {})) {
    if (!(name in manifest.scripts)) {
      manifest.scripts[name] = command
      addedScripts.push(name)
    }
  }
  const templateVersions = { ...template.dependencies, ...template.devDependencies }
  const declared = new Set([...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.devDependencies ?? {})])
  const addedDependencies = []
  manifest.devDependencies = manifest.devDependencies ?? {}
  for (const name of REQUIRED_DEPENDENCIES) {
    if (!declared.has(name) && templateVersions[name]) {
      manifest.devDependencies[name] = templateVersions[name]
      addedDependencies.push(name)
    }
  }
  if (addedScripts.length > 0 || addedDependencies.length > 0) {
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  }
  return { addedScripts, addedDependencies }
}

async function main(argv) {
  const [command, dirArg] = argv
  if (!command || !dirArg) {
    throw new Error('usage: scaffold.mjs <anchors|target|scaffold> <dir>')
  }
  const dir = resolve(process.cwd(), dirArg)
  if (command === 'anchors') {
    return { anchors: await detectAnchors(dir), missingDependencies: await missingDependencies(dir) }
  }
  if (command === 'target') return resolveTarget(dir)
  if (command === 'scaffold') {
    const resolved = await resolveTarget(dir)
    if (resolved.action === 'reuse') return { ...resolved, created: [], skipped: [] }
    const result = await scaffoldInto(resolved.target)
    return { ...resolved, ...result, missingDependencies: await missingDependencies(resolved.target) }
  }
  throw new Error(`unknown command: ${command}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error.message)
      process.exit(1)
    })
}
