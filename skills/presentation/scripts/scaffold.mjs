import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Templates resolve from the skill directory (this file's parent), never from the caller's cwd.
export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates', 'bootstrap')
export const PRESENTATION_TEMPLATE_DIR = path.join(SKILL_DIR, 'templates', 'presentation')

export const ANCHORS = ['build', 'kit', 'index']
const SOURCE_EXT = /\.(tsx?|jsx?)$/

function exists(...parts) {
  return fs.existsSync(path.join(...parts))
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function* sourceFiles(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') yield* sourceFiles(full)
    } else if (SOURCE_EXT.test(entry.name)) {
      yield full
    }
  }
}

/** Contract-level detection: capabilities, not file names or formatting. */
export function detectAnchors(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const hasViteConfig = fs.existsSync(dir) && fs.readdirSync(dir).some((f) => /^vite\.config\./.test(f))
  const build = Boolean(
    pkg?.scripts?.build && deps.react && deps.vite && deps.typescript && hasViteConfig && exists(dir, 'index.html'),
  )

  let all = ''
  let index = false
  for (const file of sourceFiles(path.join(dir, 'src'))) {
    const text = fs.readFileSync(file, 'utf8')
    all += `\n${text}`
    if (/\bslug\s*:/.test(text) && /\bload\s*:/.test(text) && /\bimport\(/.test(text)) index = true
  }
  const kit =
    /\b(interface|type)\s+Step\b/.test(all) &&
    /AnimatePresence/.test(all) &&
    /ArrowRight/.test(all) &&
    /scale\(/.test(all) &&
    /toc/i.test(all)
  return { build, kit, index }
}

export function detectMonorepo(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  return Boolean(pkg?.workspaces) || exists(dir, 'pnpm-workspace.yaml') || exists(dir, 'packages') || exists(dir, 'apps')
}

function isNonEmpty(dir) {
  return fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f !== '.git')
}

/**
 * Where the presentation app belongs and what it lacks.
 * - already inside a presentation app (scene kit or index present) -> use it
 * - monorepo -> self-contained app in `presentations/`
 * - otherwise (empty or standalone) -> the root
 */
export function resolveTarget(cwd) {
  const here = detectAnchors(cwd)
  let kind
  let targetDir
  if (here.kit || here.index) {
    kind = 'existing-app'
    targetDir = cwd
  } else if (detectMonorepo(cwd)) {
    kind = 'monorepo'
    targetDir = path.join(cwd, 'presentations')
  } else {
    kind = isNonEmpty(cwd) ? 'standalone' : 'empty'
    targetDir = cwd
  }
  const anchors = targetDir === cwd ? here : detectAnchors(targetDir)
  const missing = ANCHORS.filter((a) => !anchors[a])
  const nonEmpty = isNonEmpty(cwd)
  return { kind, targetDir, anchors, missing, nonEmpty, needsConfirmation: missing.length > 0 && nonEmpty }
}

/** Which anchor a bootstrap template file belongs to. */
export function anchorOf(rel) {
  if (rel.startsWith('src/presentation-kit/')) return 'kit'
  if (/^(src\/(main|Router|router|Landing)\.tsx?|src\/presentations\/|scripts\/|verify\.config\.json$)/.test(rel)) return 'index'
  return 'build'
}

function* templateFiles(dir, base = dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* templateFiles(full, base)
    else yield path.relative(base, full).split(path.sep).join('/')
  }
}

function mergePackageJson(target, template) {
  const merged = { ...target }
  for (const key of ['scripts', 'dependencies', 'devDependencies']) {
    const added = Object.fromEntries(Object.entries(template[key] ?? {}).filter(([k]) => !(k in (target[key] ?? {}))))
    if (Object.keys(added).length) merged[key] = { ...target[key], ...added }
  }
  return merged
}

/**
 * Writes only the missing anchors' template files; existing files are never
 * overwritten. package.json gains whatever scripts/dependencies it lacks.
 */
export function scaffold(cwd, { confirmed = false, install = false } = {}) {
  const plan = resolveTarget(cwd)
  const result = { ...plan, written: [], skipped: [], packageUpdated: false, installed: false }
  if (plan.missing.length === 0) return result
  if (plan.needsConfirmation && !confirmed) {
    throw new Error(`target ${plan.targetDir} needs user confirmation before scaffolding ${plan.missing.join(', ')}`)
  }

  fs.mkdirSync(plan.targetDir, { recursive: true })
  let freshPackage = false
  for (const rel of templateFiles(BOOTSTRAP_DIR)) {
    if (rel === 'package-lock.json' || rel === 'package.json') continue
    if (!plan.missing.includes(anchorOf(rel))) continue
    const dest = path.join(plan.targetDir, rel)
    if (fs.existsSync(dest)) {
      result.skipped.push(rel)
      continue
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(path.join(BOOTSTRAP_DIR, rel), dest)
    result.written.push(rel)
  }

  const templatePkg = readJson(path.join(BOOTSTRAP_DIR, 'package.json'))
  const pkgFile = path.join(plan.targetDir, 'package.json')
  const existing = readJson(pkgFile)
  if (!existing) {
    freshPackage = true
    fs.writeFileSync(pkgFile, `${JSON.stringify({ ...templatePkg, name: path.basename(plan.targetDir) || templatePkg.name }, null, 2)}\n`)
    fs.copyFileSync(path.join(BOOTSTRAP_DIR, 'package-lock.json'), path.join(plan.targetDir, 'package-lock.json'))
    result.written.push('package.json', 'package-lock.json')
  } else {
    const merged = mergePackageJson(existing, templatePkg)
    if (JSON.stringify(merged) !== JSON.stringify(existing)) {
      fs.writeFileSync(pkgFile, `${JSON.stringify(merged, null, 2)}\n`)
      result.packageUpdated = true
    }
  }

  if (install) {
    const args = freshPackage ? ['ci'] : ['install']
    const run = spawnSync('npm', args, { cwd: plan.targetDir, stdio: 'inherit' })
    if (run.status !== 0) throw new Error(`npm ${args[0]} failed in ${plan.targetDir}`)
    result.installed = true
  }
  return result
}

function main(argv) {
  const [command, ...rest] = argv
  const flag = (name) => rest.includes(name)
  const cwdIndex = rest.indexOf('--cwd')
  const cwd = path.resolve(cwdIndex >= 0 ? rest[cwdIndex + 1] : process.cwd())
  if (command === 'plan') {
    console.log(JSON.stringify(resolveTarget(cwd), null, 2))
  } else if (command === 'apply') {
    console.log(JSON.stringify(scaffold(cwd, { confirmed: flag('--confirm'), install: flag('--install') }), null, 2))
  } else {
    console.error('usage: scaffold.mjs <plan|apply> [--cwd <dir>] [--confirm] [--install]')
    process.exitCode = 2
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
