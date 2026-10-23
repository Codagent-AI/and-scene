// Scaffold helper for the presentation skill. Dependency-free Node ESM.
// Templates resolve from this file's location, never from the caller's cwd.
import { promises as fs, constants as fsConstants } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const TEMPLATE_ROOT = path.resolve(
  fileURLToPath(new URL('../templates/bootstrap/', import.meta.url)),
)
export const ANCHORS = ['build', 'kit', 'index']

const BUILD_FILES = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'eslint.config.js',
  'index.html',
  '.gitignore',
  'public/favicon.svg',
]
const INDEX_FILES = [
  'src/main.tsx',
  'src/Router.tsx',
  'src/Landing.tsx',
  'src/index.css',
  'src/presentations/index.ts',
  'src/presentations/types.ts',
]
const KIT_PREFIX = 'src/presentation-kit/'
const VERIFY_PREFIXES = ['scripts/', 'src/presentations/how-to-make-a-presentation/']
const MONOREPO_DIRS = ['packages', 'apps']

const exists = async (p) => fs.access(p).then(() => true, () => false)
const readText = (p) => fs.readFile(p, 'utf8').catch(() => null)

async function readPackageJson(dir) {
  const text = await readText(path.join(dir, 'package.json'))
  if (text === null) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// Collects exported names from declarations and export lists (`export { A as B }`).
function exportedNames(source) {
  const names = new Set()
  for (const m of source.matchAll(/export\s+(?:default\s+)?(?:declare\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g)) {
    names.add(m[1])
  }
  for (const m of source.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const item of m[1].split(',')) {
      const parts = item.replace(/^\s*type\s+/, '').trim().split(/\s+as\s+/)
      const exported = parts[parts.length - 1].trim()
      if (exported) names.add(exported)
    }
  }
  return names
}

async function listFiles(dir, filter) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await listFiles(full, filter)))
    else if (filter(full)) out.push(full)
  }
  return out
}

const toRel = (base, file) => path.relative(base, file).split(path.sep).join('/')

async function detectBuild(appDir) {
  const pkg = await readPackageJson(appDir)
  if (!pkg) return false
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const hasDeps = ['react', 'react-dom', 'vite', 'typescript'].every((d) => d in deps)
  const hasBuild = typeof pkg.scripts?.build === 'string'
  const entries = await fs.readdir(appDir).catch(() => [])
  const hasVite = entries.some((name) => name.startsWith('vite.config.'))
  return hasDeps && hasBuild && hasVite
}

// Capability checks on the kit's behaviour, not its names. Any file may provide each capability.
const KIT_CAPABILITIES = {
  step: (all) => /\bera\s*:/.test(all) && /\bcaption\s*:/.test(all) && /\bpayload\s*:/.test(all) && /\bscene\s*:/.test(all),
  navigation: (all) =>
    /addEventListener\(\s*['"]keydown['"]/.test(all) &&
    /ArrowRight/.test(all) &&
    /addEventListener\(\s*['"]touchend['"]/.test(all),
  fit: (all) => /getBoundingClientRect|ResizeObserver|innerWidth/.test(all) && /Math\.min\(/.test(all) && /scale\(/.test(all),
  stepsRendered: (all) => /\bsteps\b/.test(all) && /\.map\(/.test(all),
}

async function detectKit(appDir) {
  const files = await listFiles(path.join(appDir, 'src', 'presentation-kit'), (f) => /\.tsx?$/.test(f))
  const texts = await Promise.all(files.map((file) => readText(file)))
  const names = new Set()
  for (const text of texts) for (const name of exportedNames(text ?? '')) names.add(name)
  const all = texts.join('\n')
  return names.has('Step') && Object.values(KIT_CAPABILITIES).every((holds) => holds(all))
}

async function detectIndex(appDir) {
  const source = await readText(path.join(appDir, 'src', 'presentations', 'index.ts'))
  if (source === null) return false
  return (
    exportedNames(source).has('PRESENTATIONS') &&
    /\bslug\s*:/.test(source) &&
    /\bload\s*:\s*\(\s*\)\s*=>\s*import\(/.test(source)
  )
}

// Contract-level anchor detection; cosmetic differences do not change the result.
export async function detectAnchors(appDir) {
  return {
    build: await detectBuild(appDir),
    kit: await detectKit(appDir),
    index: await detectIndex(appDir),
  }
}

export async function findMonorepoSignals(projectDir) {
  const signals = []
  const pkg = await readPackageJson(projectDir)
  if (pkg && 'workspaces' in pkg) signals.push('workspaces')
  if (await exists(path.join(projectDir, 'pnpm-workspace.yaml'))) signals.push('pnpm-workspace.yaml')
  for (const dir of MONOREPO_DIRS) {
    const stat = await fs.stat(path.join(projectDir, dir)).catch(() => null)
    if (stat?.isDirectory()) signals.push(`${dir}/`)
  }
  return signals
}

async function isNonEmpty(projectDir) {
  const entries = await fs.readdir(projectDir).catch(() => [])
  return entries.some((name) => name !== '.git')
}

// Chooses the app directory: root, an existing presentations/ app, or presentations/ in a monorepo.
export async function resolveTarget(projectDir) {
  const root = path.resolve(projectDir)
  const signals = await findMonorepoSignals(root)
  const rootAnchors = await detectAnchors(root)
  const nonEmpty = await isNonEmpty(root)
  const withSignals = (appDir, relation, anchors, reason) => ({
    appDir,
    relation,
    signals,
    anchors,
    nonEmpty,
    needsConfirmation: nonEmpty && ANCHORS.some((a) => !anchors[a]),
    reason,
  })

  if (ANCHORS.every((a) => rootAnchors[a])) {
    return withSignals(root, 'root', rootAnchors, 'all three anchors present at the project root')
  }
  const presentationsDir = path.join(root, 'presentations')
  if (signals.length > 0) {
    const presAnchors = await detectAnchors(presentationsDir)
    const reused = ANCHORS.some((a) => presAnchors[a])
    const action = reused ? 'reusing the existing app in presentations/' : 'scaffolding a self-contained app in presentations/'
    return withSignals(presentationsDir, 'presentations', presAnchors,
      `monorepo signal(s) ${signals.join(', ')}; ${action}`)
  }
  return withSignals(root, 'root', rootAnchors, 'standalone project; scaffolding at the project root')
}

async function templateFiles(templateRoot) {
  return (await listFiles(templateRoot, () => true)).map((f) => toRel(templateRoot, f))
}

// Maps a template-relative path to the anchor group that owns it, or 'verify' / null.
function groupOf(rel) {
  if (BUILD_FILES.includes(rel)) return 'build'
  if (rel.startsWith(KIT_PREFIX)) return 'kit'
  if (INDEX_FILES.includes(rel)) return 'index'
  if (VERIFY_PREFIXES.some((p) => rel.startsWith(p))) return 'verify'
  return null
}

export async function planScaffold(appDir, { templateRoot = TEMPLATE_ROOT } = {}) {
  // Fail before any write if the host manifest cannot be read as JSON.
  const hostManifest = path.join(appDir, 'package.json')
  if (await exists(hostManifest)) {
    try {
      JSON.parse(await fs.readFile(hostManifest, 'utf8'))
    } catch (error) {
      throw new Error(`cannot scaffold: ${hostManifest} is not valid JSON (${error.message}); nothing was written`)
    }
  }
  const anchors = await detectAnchors(appDir)
  const missingAnchors = ANCHORS.filter((a) => !anchors[a])
  const rels = await templateFiles(templateRoot)
  const files = []
  for (const rel of rels) {
    const dest = path.join(appDir, rel)
    // package.json is always merged, so dependencies the kit needs are declared even when the build anchor exists.
    if (rel === 'package.json') {
      files.push({ rel, action: (await exists(dest)) ? 'merge-package-json' : 'create' })
      continue
    }
    const group = groupOf(rel)
    if (group === null) continue
    if (group !== 'verify' && !missingAnchors.includes(group)) continue
    files.push({ rel, action: (await exists(dest)) ? 'skip-existing' : 'create' })
  }
  return { missingAnchors, files }
}

// Merges only missing dependency, devDependency and script keys; existing values are kept.
async function mergePackageJson(destFile, templateFile) {
  const target = JSON.parse(await fs.readFile(destFile, 'utf8'))
  const source = JSON.parse(await fs.readFile(templateFile, 'utf8'))
  const indent = (await fs.readFile(destFile, 'utf8')).match(/^([ \t]+)"/m)?.[1] ?? 2
  let changed = false
  for (const section of ['dependencies', 'devDependencies', 'scripts']) {
    const wanted = source[section] ?? {}
    for (const [name, value] of Object.entries(wanted)) {
      target[section] ??= {}
      if (!(name in target[section])) {
        target[section][name] = value
        changed = true
      }
    }
  }
  if (changed) await fs.writeFile(destFile, `${JSON.stringify(target, null, indent)}\n`)
  return changed
}

// Applies the plan: creates missing files, merges package.json, never overwrites.
export async function applyScaffold(appDir, { templateRoot = TEMPLATE_ROOT } = {}) {
  const { files } = await planScaffold(appDir, { templateRoot })
  const touched = []
  for (const { rel, action } of files) {
    const dest = path.join(appDir, rel)
    const src = path.join(templateRoot, rel)
    if (action === 'create') {
      await fs.mkdir(path.dirname(dest), { recursive: true })
      await fs.copyFile(src, dest, fsConstants.COPYFILE_EXCL)
      touched.push(rel)
    } else if (action === 'merge-package-json') {
      if (await mergePackageJson(dest, src)) touched.push(rel)
    }
  }
  return touched
}

async function main(argv) {
  const apply = argv.includes('--apply')
  const [projectDir] = argv.filter((arg) => !arg.startsWith('--'))
  if (!projectDir) {
    process.stderr.write('usage: node scaffold.mjs <projectDir> [--apply]\n')
    return 2
  }
  const target = await resolveTarget(projectDir)
  const plan = await planScaffold(target.appDir)
  const result = { target, plan }
  if (apply) result.written = await applyScaffold(target.appDir)
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  return 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => { process.exitCode = code },
    (err) => {
      process.stderr.write(`${err.stack ?? err}\n`)
      process.exitCode = 1
    },
  )
}
