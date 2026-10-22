// Deterministic helpers behind the presentation skill: anchor detection, scaffold target
// resolution, add-only scaffolding, and presentation creation/registration. Every template
// path resolves from this file's own location (the skill directory), never from the cwd.
import fs from 'node:fs'
import path from 'node:path'

export const SKILL_DIR = path.resolve(import.meta.dirname, '..')
export const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates', 'bootstrap')
export const PRESENTATION_TEMPLATE_DIR = path.join(SKILL_DIR, 'templates', 'presentation')

/** Which template files belong to which contract anchor. */
export const ANCHOR_FILES = {
  build: [
    'package.json',
    'package-lock.json',
    'index.html',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'eslint.config.js',
    '.gitignore',
    'public/favicon.svg',
  ],
  // Verification and inspection tooling: the scaffolded package scripts point here, so it is
  // copied whenever anything is scaffolded.
  tooling: ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib'],
  kit: ['src/presentation-kit'],
  index: [
    'src/main.tsx',
    'src/index.css',
    'src/Router.tsx',
    'src/Landing.tsx',
    'src/presentations/index.ts',
    'src/presentations/registry.ts',
    'src/presentations/lazyPresentation.ts',
  ],
}

/** App-shell files that an existing project may already own; scaffolding never replaces them. */
const ENTRY_FILES = ['src/main.tsx', 'src/index.css', 'index.html']

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function sourceFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f) && !/(^|[\\/])(__tests__|node_modules)[\\/]|\.test\./.test(f))
    .map((f) => path.join(dir, f))
}

/** Build anchor: a Vite + React + TypeScript app whose package.json can run `build`. */
function hasBuildSetup(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  if (!pkg?.scripts?.build) return false
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  return ['vite', 'react', 'typescript'].every((name) => name in deps)
}

/** Kit anchor, checked by content so file naming and formatting do not matter. */
function hasSceneKit(dir) {
  const src = path.join(dir, 'src')
  // Only the registry's own folder is excluded; the app directory itself may be named `presentations`.
  const text = sourceFiles(src)
    .filter((f) => path.relative(src, f).split(path.sep)[0] !== 'presentations')
    .map((f) => fs.readFileSync(f, 'utf8'))
    .join('\n')
  return [
    /\b(interface|type)\s+Step\b/, // step contract
    /\bScene(Props)?\b/,
    /AnimatePresence/, // host mounting the active step
    /LayoutGroup/,
    /keydown/, // navigation
    /ArrowRight/,
    /caption/i, // chrome
    /toc/i,
    /\bscale\b/i, // fit-scale canvas
  ].every((marker) => marker.test(text))
}

/** Index anchor: a registry mapping presentations to routes. */
function hasPresentationIndex(dir) {
  const folder = path.join(dir, 'src', 'presentations')
  if (!fs.existsSync(folder)) return false
  // Contract: a module that maps presentations (slug, title, lazy loader) to routes; names and spacing are free.
  return fs
    .readdirSync(folder)
    .filter((name) => /\.(ts|tsx|js|jsx|mjs)$/.test(name))
    .some((name) => {
      const text = fs.readFileSync(path.join(folder, name), 'utf8')
      const lazyEntries = /\bslug\b/.test(text) && /import\s*\(/.test(text)
      const emptyRegistry = /=\s*\[/.test(text) && /PresentationEntry|\bslug\b/.test(text) && !/\binterface\b/.test(text)
      return lazyEntries || emptyRegistry
    })
}

export function detectAnchors(dir) {
  return { build: hasBuildSetup(dir), kit: hasSceneKit(dir), index: hasPresentationIndex(dir) }
}

export const anyAnchor = (anchors) => Object.values(anchors).some(Boolean)
export const missingAnchors = (anchors) => Object.keys(anchors).filter((name) => !anchors[name])

export function isEmptyProject(dir) {
  if (!fs.existsSync(dir)) return true
  return fs.readdirSync(dir).filter((name) => name !== '.git').length === 0
}

/** Monorepo signals: package.json `workspaces`, pnpm-workspace.yaml, or a packages/ or apps/ directory. */
export function monorepoSignals(dir) {
  const signals = []
  if (readJson(path.join(dir, 'package.json'))?.workspaces) signals.push('package.json workspaces')
  if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) signals.push('pnpm-workspace.yaml')
  for (const name of ['packages', 'apps']) {
    if (fs.existsSync(path.join(dir, name)) && fs.statSync(path.join(dir, name)).isDirectory()) signals.push(`${name}/ directory`)
  }
  return signals
}

/** Nearest ancestor (or the directory itself) that already holds a presentation app anchor. */
function findExistingApp(start) {
  let dir = path.resolve(start)
  for (;;) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      const { kit, index } = detectAnchors(dir)
      // A bare build setup (for example a monorepo root) is not a presentation app.
      if (kit || index) return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

/**
 * Decides where infrastructure belongs. `confirm` is true when the project is non-empty and
 * is missing the kit or the index: the skill must state the target and wait for approval.
 */
export function resolveTarget(projectDir) {
  const start = path.resolve(projectDir)
  const existing = findExistingApp(start)
  let target
  let kind
  let reason
  if (existing) {
    target = existing
    kind = 'existing-app'
    reason = 'a presentation app already exists here; reusing it'
  } else if (fs.existsSync(path.join(start, 'presentations')) && findExistingApp(path.join(start, 'presentations')) === path.join(start, 'presentations')) {
    target = path.join(start, 'presentations')
    kind = 'existing-app'
    reason = 'a presentation app already exists in presentations/; reusing it'
  } else {
    const signals = monorepoSignals(start)
    if (signals.length > 0) {
      target = path.join(start, 'presentations')
      kind = 'monorepo-subapp'
      reason = `monorepo detected (${signals.join(', ')}); scaffolding a self-contained app in presentations/`
    } else {
      target = start
      kind = 'root'
      reason = 'standalone project; scaffolding at the project root'
    }
  }
  const anchors = detectAnchors(target)
  const confirm = !isEmptyProject(start) && (!anchors.kit || !anchors.index)
  return { target, kind, reason, anchors, missing: missingAnchors(anchors), confirm }
}

function listFiles(root, rel) {
  const full = path.join(root, rel)
  if (!fs.existsSync(full)) return []
  if (fs.statSync(full).isFile()) return [rel]
  return fs
    .readdirSync(full, { recursive: true, encoding: 'utf8' })
    .filter((f) => fs.statSync(path.join(full, f)).isFile())
    .map((f) => path.join(rel, f))
}

/** Adds dependencies and scripts the project lacks; never changes anything already declared. */
export function mergePackageJson(existing, template) {
  const merged = { ...existing }
  const added = []
  for (const field of ['dependencies', 'devDependencies', 'scripts']) {
    merged[field] = { ...existing[field] }
    for (const [name, value] of Object.entries(template[field] ?? {})) {
      const declared = field === 'scripts' ? name in merged.scripts : name in { ...existing.dependencies, ...existing.devDependencies }
      if (!declared) {
        merged[field][name] = value
        added.push(`${field}.${name}`)
      }
    }
    if (Object.keys(merged[field]).length === 0) delete merged[field]
  }
  return { merged, added }
}

/**
 * Copies only what is missing for the given anchors; existing files are never overwritten.
 * Returns the files written and the dependency additions made to an existing package.json.
 */
export function scaffold(targetDir, anchors = missingAnchors(detectAnchors(targetDir)), templateDir = BOOTSTRAP_DIR) {
  const written = []
  const skipped = []
  const addedDependencies = []
  const existingPackage = path.join(targetDir, 'package.json')
  // Fail before copying anything if an existing manifest cannot be merged.
  if (fs.existsSync(existingPackage) && !readJson(existingPackage)) throw new Error(`${existingPackage} is not valid JSON; fix it before scaffolding`)
  fs.mkdirSync(targetDir, { recursive: true })
  const hadPackage = fs.existsSync(path.join(targetDir, 'package.json'))
  for (const anchor of [...anchors, 'tooling']) {
    for (const rel of ANCHOR_FILES[anchor].flatMap((entry) => listFiles(templateDir, entry))) {
      const dest = path.join(targetDir, rel)
      if (rel === 'package-lock.json' && hadPackage) continue
      if (fs.existsSync(dest)) {
        if (rel !== 'package.json') skipped.push(rel)
        continue
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(path.join(templateDir, rel), dest)
      written.push(rel)
    }
  }
  // Whatever was scaffolded needs its dependencies, and an existing app may lack some.
  if (hadPackage) {
    const { merged, added } = mergePackageJson(readJson(path.join(targetDir, 'package.json')), readJson(path.join(templateDir, 'package.json')))
    if (added.length > 0) {
      fs.writeFileSync(path.join(targetDir, 'package.json'), `${JSON.stringify(merged, null, 2)}\n`)
      addedDependencies.push(...added)
    }
  }
  // An existing entry point is left alone, so it must be pointed at the router by hand.
  const integration = skipped.filter((rel) => ENTRY_FILES.includes(rel))
  return { written, skipped, addedDependencies, integration }
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const REGISTRY_END = /\n(\s*)\]\s*(\n|$)/

/**
 * Creates `src/presentations/<slug>/` from the presentation template and appends one
 * registry line. Refuses (changing nothing) when the slug or folder already exists.
 */
export function createPresentation(appDir, { slug, title }, templateDir = PRESENTATION_TEMPLATE_DIR) {
  if (!SLUG.test(slug)) throw new Error(`invalid slug "${slug}"; use lowercase letters, digits and hyphens`)
  if (!title?.trim()) throw new Error('a presentation title is required')
  const indexFile = path.join(appDir, 'src', 'presentations', 'index.ts')
  const folder = path.join(appDir, 'src', 'presentations', slug)
  if (!fs.existsSync(indexFile)) throw new Error(`no presentation index at ${indexFile}; scaffold first`)
  const index = fs.readFileSync(indexFile, 'utf8')
  if (fs.existsSync(folder)) throw new Error(`presentation folder ${folder} already exists; choose another slug`)
  if (new RegExp(`slug:\\s*['"\`]${slug}['"\`]`).test(index)) throw new Error(`slug "${slug}" is already registered; choose another`)
  if (!REGISTRY_END.test(index)) throw new Error(`cannot find the end of the registry array in ${indexFile}`)

  const entry = `  {\n    slug: '${slug}',\n    title: ${JSON.stringify(title)},\n    load: () => import('./${slug}/Talk.tsx'),\n  },`
  // The registry array closes at the last `]` on its own line, so nested arrays earlier in the file are safe.
  const close = [...index.matchAll(new RegExp(REGISTRY_END, 'g'))].at(-1)
  const updatedIndex = `${index.slice(0, close.index)}\n${entry}\n${close[1]}]${close[2]}${index.slice(close.index + close[0].length)}`
  const written = []
  try {
    for (const rel of listFiles(templateDir, '')) {
      const dest = path.join(folder, rel.replaceAll('__SLUG__', slug))
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      const text = fs
        .readFileSync(path.join(templateDir, rel), 'utf8')
        .replaceAll('__SLUG__', slug)
        .replaceAll('__TITLE_LITERAL__', JSON.stringify(title))
      fs.writeFileSync(dest, text)
      written.push(path.relative(appDir, dest))
    }
    fs.writeFileSync(indexFile, updatedIndex)
  } catch (error) {
    // Leave no orphan folder behind if any write fails.
    fs.rmSync(folder, { recursive: true, force: true })
    fs.writeFileSync(indexFile, index)
    throw error
  }
  return { slug, folder, written, route: `/${slug}` }
}
