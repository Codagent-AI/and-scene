#!/usr/bin/env node
// Detects which scaffold anchors a project already has and where a presentation app belongs.
//
//   node detect-target.mjs [dir]   -> prints the result as JSON
//
// Detection is contract-level: it keys on the presence of the three anchors (build setup,
// scene kit, presentation index), not on a byte-identical scaffold.
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
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

const commentless = (text) => stripComments(text).trim()

/** Every command a `build` script runs, following `npm run <script>` delegation to any depth. */
function buildCommand(scripts) {
  const seen = new Set()
  const commands = []
  const visit = (name) => {
    const command = scripts?.[name]
    if (typeof command !== 'string' || seen.has(name)) return
    seen.add(name)
    commands.push(command)
    for (const [, next] of command.matchAll(/(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?([\w:-]+)/g)) visit(next)
  }
  visit('build')
  return commands.join(' && ')
}

/** A tsconfig that actually configures TypeScript (options, references, or an extended base). */
function isTsconfig(file) {
  try {
    return /"(?:compilerOptions|references|extends)"\s*:/.test(readFileSync(file, 'utf8'))
  } catch {
    return false
  }
}

/**
 * Which of the three contract anchors exist under `dir`. Detection reads what the files
 * contain, not what they are called, so renamed or reorganised equivalents still count and
 * empty or placeholder files with canonical names do not. It cannot run the build: the skill's
 * own build/render self-verification is what proves the result works.
 */
export function detectAnchors(dir) {
  const pkg = readJson(join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const files = listing(dir)
  const viteConfig = files.find((f) => /^vite\.config\.[cm]?[jt]s$/.test(f))
  const viteConfigText = viteConfig ? commentless(readFileSync(join(dir, viteConfig), 'utf8')) : ''
  const build =
    /\bvite\b/.test(buildCommand(pkg?.scripts)) &&
    Boolean(deps.vite && deps.react && deps.typescript) &&
    /export\s+default|module\.exports|defineConfig/.test(viteConfigText) &&
    files.some((f) => /^tsconfig.*\.json$/.test(f) && isTsconfig(join(dir, f)))

  const sources = sourceFiles(join(dir, 'src')).map((f) => commentless(readFileSync(f, 'utf8')))
  const declaring = (name, holds) => sources.some((text) => exportsName(text, name) && holds(text))
  // Scene kit: a host that takes steps, a stage that mounts each step's Scene, the Step/Scene
  // contract, present/browse navigation, and the fit-scale canvas.
  const kit =
    declaring('Presentation', (t) => /\bsteps\b/.test(t)) &&
    declaring('Stage', (t) => /\bScene\b/.test(t)) &&
    declaring('Step|SceneProps', (t) => /\bScene\b/.test(t) && /\bid\b/.test(t)) &&
    sources.some((t) => /keydown|ArrowRight/.test(t)) &&
    sources.some((t) => /\bscale\b/i.test(t))
  // Presentation index: a registry of presentations whose entries map a slug to a loadable route.
  const index =
    declaring('\\w*(?:[Pp]resentations|[Rr]egistry)\\w*', () => true) &&
    sources.some((t) => /\bslug\b/.test(t) && /\bload\b|import\(/.test(t))
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

/** True when this module is the script node was started with, even through a symlinked path. */
export function isEntrypoint(metaUrl, argv1 = process.argv[1]) {
  try {
    return Boolean(argv1) && realpathSync(argv1) === realpathSync(fileURLToPath(metaUrl))
  } catch {
    return false
  }
}

if (isEntrypoint(import.meta.url)) {
  console.log(JSON.stringify(detectTarget(process.argv[2] ?? process.cwd()), null, 2))
}
