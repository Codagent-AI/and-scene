#!/usr/bin/env node
// Deterministic scaffold helper for the presentation skill.
// Commands:
//   anchors <dir>            report the three contract anchors and missing dependencies
//   target <dir>             resolve where the presentation app belongs
//   scaffold <dir>           copy missing bootstrap files (never overwrites existing ones)
// Templates resolve relative to this file, so the caller's working directory does not matter.
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
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

const VITE_CONFIGS = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs']

/** Contract-level detection: a build setup, a scene kit, and a presentation index. */
export function detectAnchors(dir) {
  const build = existsSync(join(dir, 'package.json')) && VITE_CONFIGS.some((name) => existsSync(join(dir, name)))
  const kit = existsSync(join(dir, 'src', 'presentation-kit', 'index.ts')) &&
    existsSync(join(dir, 'src', 'presentation-kit', 'types.ts'))
  const index = existsSync(join(dir, 'src', 'presentations', 'index.ts'))
  return { build, kit, index, complete: build && kit && index }
}

/** A project is a monorepo if it declares workspaces, has pnpm-workspace.yaml, or has packages/ or apps/. */
export async function isMonorepo(dir) {
  if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return true
  if (existsSync(join(dir, 'packages')) || existsSync(join(dir, 'apps'))) return true
  const packageJson = await readJson(join(dir, 'package.json'))
  return Boolean(packageJson && packageJson.workspaces)
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return null
  }
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
  const anchors = detectAnchors(dir)
  if (anchors.complete) return { target: dir, action: 'reuse', monorepo: false, confirmationRequired: false }

  if (await isMonorepo(dir)) {
    const target = join(dir, 'presentations')
    const nested = detectAnchors(target)
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

/**
 * Copies template files that the target does not already have. Existing files are never
 * overwritten. The lock file is copied only with its package.json, so they stay in step.
 */
export async function scaffoldInto(target) {
  const created = []
  const skipped = []
  const files = await listTemplateFiles()
  const packageJsonCreated = !existsSync(join(target, 'package.json'))
  for (const rel of files) {
    const dest = join(target, rel)
    if (rel === 'package-lock.json' && !packageJsonCreated) {
      skipped.push(rel)
      continue
    }
    if (existsSync(dest)) {
      skipped.push(rel)
      continue
    }
    await mkdir(dirname(dest), { recursive: true })
    await copyFile(join(TEMPLATE_ROOT, rel), dest)
    created.push(rel)
  }
  return { created, skipped }
}

async function main(argv) {
  const [command, dirArg] = argv
  if (!command || !dirArg) {
    throw new Error('usage: scaffold.mjs <anchors|target|scaffold> <dir>')
  }
  const dir = resolve(process.cwd(), dirArg)
  if (command === 'anchors') {
    return { anchors: detectAnchors(dir), missingDependencies: await missingDependencies(dir) }
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
