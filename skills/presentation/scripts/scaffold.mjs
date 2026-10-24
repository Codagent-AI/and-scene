// Detect the three presentation anchors, resolve where the app belongs, and copy
// only what is missing from templates/bootstrap/. Never overwrites an existing file.
//   node scaffold.mjs [--root <dir>] [--dry-run]     (prints a JSON report)
// Templates are located relative to this file, so the caller's working directory is irrelevant.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const TEMPLATE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'bootstrap')

const BUILD_FILES = ['package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'index.html', 'eslint.config.js', '.npmrc', 'verify.config.json', 'gitignore.template', 'scripts']
const KIT_FILES = ['src/presentation-kit']
const INDEX_FILES = ['src/presentations', 'src/router.tsx', 'src/routes.ts', 'src/Landing.tsx', 'src/main.tsx', 'src/index.css']
const GROUPS = { build: BUILD_FILES, kit: KIT_FILES, index: INDEX_FILES }

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}
const files = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { recursive: true }).filter((f) => statSync(path.join(dir, f)).isFile()).map((f) => path.basename(f))
    : []

/** Contract-level detection: what each anchor does, not exact names or formatting. */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const kitFiles = files(path.join(dir, 'src', 'presentation-kit'))
  const presentations = path.join(dir, 'src', 'presentations')
  return {
    build:
      Boolean(pkg?.scripts?.build) &&
      Boolean(deps.vite) &&
      Boolean(deps.react) &&
      readdirSync(dir).some((f) => /^tsconfig.*\.json$/.test(f)),
    kit: kitFiles.some((f) => /presentation/i.test(f)) && kitFiles.some((f) => /stage/i.test(f)),
    index: existsSync(presentations) && readdirSync(presentations).some((f) => /^index\.(tsx?|jsx?|mjs)$/.test(f)),
  }
}

export function isMonorepo(root) {
  const pkg = readJson(path.join(root, 'package.json'))
  return Boolean(pkg?.workspaces) || existsSync(path.join(root, 'pnpm-workspace.yaml')) || existsSync(path.join(root, 'packages')) || existsSync(path.join(root, 'apps'))
}

/**
 * An existing presentation app has the scene kit and the presentation index; a build
 * setup alone (for example a monorepo root) does not make a directory one.
 */
export function resolveTarget(root) {
  for (const candidate of [root, path.join(root, 'presentations')]) {
    if (!existsSync(candidate)) continue
    const a = detectAnchors(candidate)
    if (a.kit && a.index) return { target: candidate, existing: true }
  }
  return { target: isMonorepo(root) ? path.join(root, 'presentations') : root, existing: false }
}

function copyMissing(from, to, copied, skipped, dryRun, base) {
  if (statSync(from).isDirectory()) {
    for (const name of readdirSync(from)) copyMissing(path.join(from, name), path.join(to, name), copied, skipped, dryRun, base)
    return
  }
  const rel = path.relative(base, to)
  if (existsSync(to)) return void skipped.push(rel)
  copied.push(rel)
  if (!dryRun) {
    mkdirSync(path.dirname(to), { recursive: true })
    cpSync(from, to)
  }
}

/** Copy the missing anchors into the resolved target and report what happened. */
export function scaffold(root, { dryRun = false } = {}) {
  const { target, existing } = resolveTarget(root)
  const before = existsSync(target) ? detectAnchors(target) : { build: false, kit: false, index: false }
  const copied = []
  const skipped = []
  for (const [anchor, entries] of Object.entries(GROUPS)) {
    if (before[anchor]) continue
    for (const entry of entries) {
      const dest = entry === 'gitignore.template' ? '.gitignore' : entry
      copyMissing(path.join(TEMPLATE, entry), path.join(target, dest), copied, skipped, dryRun, target)
    }
  }
  const template = readJson(path.join(TEMPLATE, 'package.json'))
  const have = readJson(path.join(target, 'package.json'))
  const present = { ...have?.dependencies, ...have?.devDependencies }
  const wanted = { ...template.dependencies, ...template.devDependencies }
  const missingDependencies = Object.entries(wanted).filter(([name]) => !present[name]).map(([name, range]) => `${name}@${range}`)
  return { target, existingApp: existing, anchorsBefore: before, copied, skipped, missingDependencies, dryRun }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const at = args.indexOf('--root')
  const root = path.resolve(at >= 0 ? args[at + 1] : process.cwd())
  console.log(JSON.stringify(scaffold(root, { dryRun: args.includes('--dry-run') }), null, 2))
}
