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

/** Source files under `dir` (recursive, skipping dependency and output directories). */
function sourceFiles(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return IGNORED.has(entry.name) || entry.name === 'dist' ? [] : sourceFiles(full)
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [full] : []
  })
}

const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const exportsName = (text, pattern) =>
  new RegExp(
    `export\\s+(?:default\\s+)?(?:declare\\s+)?(?:async\\s+)?(?:function|const|class|interface|type)\\s+(?:${pattern})\\b|export\\s+(?:type\\s+)?\\{[^}]*\\b(?:${pattern})\\b`,
  ).test(text)

/**
 * Which of the three contract anchors exist under `dir`. Detection reads what the files
 * export, not what they are called, so renamed or reorganised equivalents still count and
 * empty files with canonical names do not.
 */
export function detectAnchors(dir) {
  const pkg = readJson(join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const build =
    Boolean(pkg?.scripts?.build) &&
    Boolean(deps.vite && deps.react && deps.typescript) &&
    listing(dir).some((f) => /^vite\.config\.[cm]?[jt]s$/.test(f)) &&
    listing(dir).some((f) => /^tsconfig.*\.json$/.test(f))
  const sources = sourceFiles(join(dir, 'src')).map((f) => stripComments(readFileSync(f, 'utf8')))
  // Scene kit: the presentation host, the stage that mounts the active step, and the step contract.
  const kit = [/Presentation/, /Stage/, /Step|SceneProps/].every((name) => sources.some((text) => exportsName(text, name.source)))
  // Presentation index: a registry of presentations that maps each one to a loadable route.
  const index = sources.some((text) => exportsName(text, '\\w*(?:[Pp]resentations|[Rr]egistry)\\w*'))
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
