// Shared helpers for the presentation skill's scripts. Everything resolves relative to
// this file (the skill directory), never to the caller's working directory.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates', 'bootstrap')
export const PRESENTATION_TEMPLATE_DIR = path.join(SKILL_DIR, 'templates', 'presentation')

export const ANCHORS = ['build', 'kit', 'index']

/** Template paths (files or directories) that make up each contract anchor. */
export const ANCHOR_PATHS = {
  build: [
    'package.json',
    'package-lock.json',
    '.gitignore',
    'eslint.config.js',
    'index.html',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'vite.config.ts',
    'public',
    'src/index.css',
    'scripts',
  ],
  kit: ['src/presentation-kit'],
  index: ['src/main.tsx', 'src/App.tsx', 'src/Landing.tsx', 'src/route.ts', 'src/presentations'],
}

/** Dependencies every presentation app needs, as declared by the bootstrap template. */
export function requiredDependencies() {
  const pkg = JSON.parse(fs.readFileSync(path.join(BOOTSTRAP_DIR, 'package.json'), 'utf8'))
  return { dependencies: pkg.dependencies, devDependencies: pkg.devDependencies, scripts: pkg.scripts }
}

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function filesIn(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    return e.isDirectory() ? filesIn(full) : [full]
  })
}

/** Which of the three contract anchors exist under `dir`. Keyed on contract, not file-for-file identity. */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const hasViteConfig = fs.readdirSync(dir, { withFileTypes: true }).some((e) => /^vite\.config\./.test(e.name))
  const build = Boolean(
    pkg?.scripts?.build && deps.vite && deps.react && deps.typescript && (hasViteConfig || fs.existsSync(path.join(dir, 'index.html'))),
  )
  const kitSources = filesIn(path.join(dir, 'src', 'presentation-kit')).filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))
  const kitText = kitSources.map((f) => fs.readFileSync(f, 'utf8'))
  const kit = kitText.some((t) => /export[^;\n]*\bPresentation\b/.test(t)) && kitText.some((t) => /\bStep\b/.test(t))
  const presentationsDir = path.join(dir, 'src', 'presentations')
  const index = fs.existsSync(presentationsDir) && fs.readdirSync(presentationsDir).some((n) => /^index\.(ts|tsx|js|jsx)$/.test(n))
  return { build, kit, index }
}

export function isMonorepo(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  if (pkg?.workspaces) return true
  if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return true
  return ['packages', 'apps'].some((d) => fs.existsSync(path.join(dir, d)) && fs.statSync(path.join(dir, d)).isDirectory())
}

const IGNORED_ENTRIES = new Set(['.git', '.DS_Store'])
export function isEmptyDir(dir) {
  return !fs.existsSync(dir) || fs.readdirSync(dir).every((n) => IGNORED_ENTRIES.has(n))
}

/**
 * Decides where the presentation app lives and what is missing.
 * - an existing presentation app (kit or index present) is used as is;
 * - a monorepo gets a self-contained app under `presentations/`;
 * - otherwise (empty or standalone project) the app lives at the root.
 */
export function resolveTarget(cwd) {
  const root = path.resolve(cwd)
  const rootAnchors = detectAnchors(root)
  let kind
  let target = root
  if (rootAnchors.kit || rootAnchors.index) kind = 'existing-app'
  else if (isMonorepo(root)) {
    kind = 'monorepo'
    target = path.join(root, 'presentations')
  } else kind = isEmptyDir(root) ? 'empty' : 'standalone'

  const anchors = fs.existsSync(target) ? detectAnchors(target) : { build: false, kit: false, index: false }
  const missing = ANCHORS.filter((a) => !anchors[a])
  return {
    root,
    target,
    kind,
    anchors,
    missing,
    projectEmpty: isEmptyDir(root),
    // A non-empty project missing the kit or index must be confirmed before anything is written.
    needsConfirmation: !isEmptyDir(root) && (missing.includes('kit') || missing.includes('index')),
  }
}

export { filesIn }
