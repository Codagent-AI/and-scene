#!/usr/bin/env node
// Detects which scaffold anchors a project already has and where a presentation app belongs.
//
//   node detect-target.mjs [dir]   -> prints the result as JSON
//
// Detection is contract-level: it keys on the presence of the three anchors (build setup,
// scene kit, presentation index), not on a byte-identical scaffold.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const IGNORED = new Set(['.git', 'node_modules', '.DS_Store'])

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function listing(dir) {
  return existsSync(dir) ? readdirSync(dir) : []
}

/** Which of the three contract anchors exist directly under `dir`. */
export function detectAnchors(dir) {
  const pkg = readJson(join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const build =
    Boolean(pkg?.scripts?.build) &&
    Boolean(deps.vite && deps.react && deps.typescript) &&
    listing(dir).some((f) => /^vite\.config\.[cm]?[jt]s$/.test(f)) &&
    listing(dir).some((f) => /^tsconfig.*\.json$/.test(f))
  const kitFiles = listing(join(dir, 'src', 'presentation-kit'))
  const kit = ['Presentation', 'Stage', 'types'].every((name) => kitFiles.some((f) => f.startsWith(`${name}.`)))
  const index = listing(join(dir, 'src', 'presentations')).some((f) => /^index\.[jt]sx?$/.test(f))
  return { build, kit, index }
}

export function isMonorepo(dir) {
  const pkg = readJson(join(dir, 'package.json'))
  return Boolean(pkg?.workspaces) || existsSync(join(dir, 'pnpm-workspace.yaml')) ||
    existsSync(join(dir, 'packages')) || existsSync(join(dir, 'apps'))
}

const hasAny = (anchors) => Object.values(anchors).some(Boolean)

export function detectTarget(input) {
  const dir = resolve(input)
  const empty = listing(dir).filter((f) => !IGNORED.has(f)).length === 0
  const here = detectAnchors(dir)
  const monorepo = isMonorepo(dir)

  let target = dir
  let reason = 'standalone project: scaffold at the project root'
  if (empty) {
    reason = 'empty directory: scaffold at the root'
  } else if (Object.values(here).every(Boolean)) {
    reason = 'already inside a presentation app: all anchors present'
  } else if (monorepo) {
    target = join(dir, 'presentations')
    reason = 'monorepo detected: scaffold a self-contained app under presentations/'
  }

  const anchors = target === dir ? here : detectAnchors(target)
  const missing = Object.entries(anchors).filter(([, present]) => !present).map(([name]) => name)
  const scaffold = missing.length === 0 ? 'none' : missing.length === 3 ? 'full' : 'partial'
  return {
    dir,
    target,
    targetName: basename(target),
    reason,
    empty,
    monorepo,
    anchors,
    missing,
    scaffold,
    // A non-empty project is never written to before the user has confirmed the target.
    confirmRequired: !empty && scaffold !== 'none',
    existingTarget: hasAny(anchors),
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(detectTarget(process.argv[2] ?? process.cwd()), null, 2))
}
