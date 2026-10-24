// Anchor detection, scaffold-target resolution, and non-destructive scaffolding
// for the presentation skill. Templates resolve from this file's location, never
// from the caller's working directory.
//
//   node scaffold.mjs resolve <dir>            print the detection/target report as JSON
//   node scaffold.mjs apply <dir> [--confirm] [--install]
//                                              scaffold the missing anchors into the resolved target;
//                                              refuses to write into a non-empty project without --confirm
//   node scaffold.mjs create <target> <slug> <title>   copy the presentation template and register it
import { spawnSync } from 'node:child_process'
import { access, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP_DIR = path.join(SKILL_DIR, 'templates/bootstrap')
export const PRESENTATION_TEMPLATE_DIR = path.join(SKILL_DIR, 'templates/presentation')

export const ANCHORS = ['build', 'kit', 'index']

const exists = (p) => access(p).then(() => true, () => false)
async function readJson(p) {
  try {
    return JSON.parse(await readFile(p, 'utf8'))
  } catch {
    return undefined
  }
}

async function walk(dir, { maxDepth = 6, skip = ['node_modules', 'dist', '.git'] } = {}, depth = 0) {
  const out = []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    if (skip.includes(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (depth < maxDepth) out.push(...(await walk(full, { maxDepth, skip }, depth + 1)))
    } else out.push(full)
  }
  return out
}

/** Which template files belong to which anchor. */
export function anchorOf(relPath) {
  const p = relPath.split(path.sep).join('/')
  if (p.startsWith('src/presentation-kit/')) return 'kit'
  if (
    p.startsWith('src/presentations/') ||
    ['src/router.ts', 'src/AppRouter.tsx', 'src/lazyPresentation.ts', 'src/Landing.tsx', 'scripts/verify.config.mjs'].includes(p)
  ) {
    return 'index'
  }
  return 'build'
}

/** The verification and inspection scripts are wanted by every scaffold, whichever anchors it adds. */
const isSharedScript = (relPath) => relPath.startsWith('scripts/') && anchorOf(relPath) === 'build'

/**
 * Contract-level detection: each anchor is recognised by what it provides, not
 * by exact file names or formatting.
 */
export async function detectAnchors(dir) {
  const result = { build: false, kit: false, index: false }
  const pkg = await readJson(path.join(dir, 'package.json'))
  if (pkg) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    const hasConfig = (await readdir(dir)).some((name) => /^vite\.config\.(ts|js|mjs|mts|cjs)$/.test(name))
    result.build = Boolean(pkg.scripts?.build && deps.vite && deps.react && deps.typescript && hasConfig)
  }
  const sources = await readSources(dir)
  result.kit = findKit(sources) !== undefined
  result.index = findRegistry(sources) !== undefined && isRouted(sources)
  return result
}

async function readSources(dir) {
  const files = (await walk(path.join(dir, 'src'))).filter((f) => /\.(tsx?|jsx?)$/.test(f))
  return new Map(await Promise.all(files.map(async (f) => [f, await readFile(f, 'utf8')])))
}

const KIT_CONTRACT = {
  'a Step/Scene step contract': [/\bStep\b/, /\bScene\b/],
  'a stage that mounts the active step and runs morphs': [/AnimatePresence|LayoutGroup/],
  'keyboard navigation': [/keydown|ArrowRight/],
  'present and browse modes': [/['"]present['"]/, /['"]browse['"]/],
  'captions and a table of contents': [/caption/i, /toc|contents/i],
  'a fit-scaled canvas': [/scale/i],
}

/**
 * The scene kit is the directory that exports a `Presentation` host and, together,
 * provides every part of the kit contract. Names and formatting do not matter.
 */
export function findKit(sources) {
  for (const [file, text] of sources) {
    if (!/export\s+(?:default\s+)?(?:function|const)\s+Presentation\b/.test(text)) continue
    const dir = path.dirname(file)
    const all = [...sources].filter(([f]) => f.startsWith(dir + path.sep)).map(([, t]) => t).join('\n')
    if (Object.values(KIT_CONTRACT).every((res) => res.every((re) => re.test(all)))) return { dir, host: file }
  }
  return undefined
}

/** A file mapping slugs to loaders (quoted or unquoted property names). */
export function findRegistry(sources) {
  const hits = [...sources].filter(
    ([, t]) => /['"]?\bslug\b['"]?\s*:/.test(t) && /['"]?\bload\b['"]?\s*:/.test(t) && /import\s*\(/.test(t),
  )
  hits.sort(([a], [b]) => Number(/presentations[\\/]index\./.test(b)) - Number(/presentations[\\/]index\./.test(a)))
  return hits[0]?.[0]
}

/** The registry is only an index if something routes by its slugs. */
const isRouted = (sources) =>
  [...sources.values()].some((t) => /pathname|useLocation|createBrowserRouter|<Route\b|location\.hash/.test(t) && /\bslug\b/.test(t))

export async function detectMonorepo(dir) {
  const signals = []
  const pkg = await readJson(path.join(dir, 'package.json'))
  if (pkg?.workspaces) signals.push('package.json workspaces')
  if (await exists(path.join(dir, 'pnpm-workspace.yaml'))) signals.push('pnpm-workspace.yaml')
  for (const name of ['packages', 'apps']) {
    if ((await stat(path.join(dir, name)).catch(() => undefined))?.isDirectory()) signals.push(`${name}/ directory`)
  }
  return signals
}

async function isNonEmpty(dir) {
  const entries = await readdir(dir).catch(() => [])
  return entries.some((name) => name !== '.git' && name !== '.DS_Store')
}

const noAnchors = { build: false, kit: false, index: false }
const detectIfDir = async (dir) => ((await exists(dir)) ? detectAnchors(dir) : { ...noAnchors })

/**
 * Where the scaffold belongs: an existing presentation app (kit or index present)
 * is reused, a monorepo gets a self-contained `presentations/` app, anything else
 * scaffolds at the root.
 */
export async function resolveTarget(dir) {
  dir = path.resolve(dir)
  const here = await detectIfDir(dir)
  const nestedDir = path.join(dir, 'presentations')
  const nested = await detectIfDir(nestedDir)
  const monorepoSignals = await detectMonorepo(dir)
  let target = dir
  let reason = 'standalone or empty project: scaffold at the root'
  if (here.kit || here.index) reason = 'already a presentation app: reuse it'
  else if (nested.kit || nested.index) {
    target = nestedDir
    reason = 'existing presentations/ app: reuse it'
  } else if (monorepoSignals.length > 0) {
    target = nestedDir
    reason = `monorepo (${monorepoSignals.join(', ')}): scaffold a self-contained app under presentations/`
  }
  const anchors = target === dir ? here : nested
  const missing = ANCHORS.filter((a) => !anchors[a])
  const projectNonEmpty = await isNonEmpty(dir)
  return {
    root: dir,
    target,
    reason,
    monorepo: monorepoSignals.length > 0,
    anchors,
    missing,
    projectNonEmpty,
    needsConfirmation: projectNonEmpty && (!anchors.kit || !anchors.index),
  }
}

/** Adds dependencies the template declares but the target's package.json lacks. */
export async function ensureDependencies(target) {
  const file = path.join(target, 'package.json')
  const pkg = await readJson(file)
  const template = await readJson(path.join(BOOTSTRAP_DIR, 'package.json'))
  const added = []
  if (!pkg) return added
  for (const section of ['dependencies', 'devDependencies']) {
    for (const [name, version] of Object.entries(template[section])) {
      if (pkg.dependencies?.[name] || pkg.devDependencies?.[name]) continue
      pkg[section] = { ...pkg[section], [name]: version }
      added.push(name)
    }
  }
  pkg.scripts = { ...pkg.scripts }
  for (const [name, command] of Object.entries(template.scripts)) {
    if (!pkg.scripts[name]) pkg.scripts[name] = command
  }
  // The scripts and config files ship as ES modules.
  if (pkg.type === undefined) pkg.type = 'module'
  await writeFile(file, `${JSON.stringify(pkg, null, 2)}\n`)
  return added
}

/** Copies the template files of the given anchors, never overwriting an existing file. */
export async function scaffold(target, anchors = ANCHORS) {
  const written = []
  const skipped = []
  const manual = []
  const targetHadPackage = await exists(path.join(target, 'package.json'))
  for (const file of await walk(BOOTSTRAP_DIR)) {
    const rel = path.relative(BOOTSTRAP_DIR, file)
    const posix = rel.split(path.sep).join('/')
    if (!anchors.includes(anchorOf(rel)) && !isSharedScript(posix)) continue
    if (targetHadPackage && rel === 'package-lock.json') continue
    const dest = path.join(target, rel)
    if (await exists(dest)) {
      skipped.push(rel)
      continue
    }
    await mkdir(path.dirname(dest), { recursive: true })
    await writeFile(dest, await readFile(file))
    written.push(rel)
  }
  const dependenciesAdded = await ensureDependencies(target)
  if (written.includes('src/AppRouter.tsx')) {
    const entry = (await Promise.all(['src/main.tsx', 'src/main.jsx', 'src/main.ts'].map(async (f) => ((await exists(path.join(target, f))) ? f : undefined)))).find(Boolean)
    if (entry && !written.includes(entry) && !/AppRouter/.test(await readFile(path.join(target, entry), 'utf8'))) {
      manual.push(`${entry} already existed and was kept: render <AppRouter pathname={window.location.pathname} registry={presentations} /> from it to route to each presentation`)
    }
  }
  return { written, skipped, dependenciesAdded, manual }
}

const render = (text, vars) => text.replace(/\{\{(SLUG|TITLE)\}\}/g, (_, key) => vars[key])

/** One printable line, free of quote, backslash, `*`, `/` (so no comment terminator can form), and line-separator characters. */
const sanitizeTitle = (title) =>
  title.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ').replace(/["\\`]/g, '').replace(/[*/]+/g, '').replace(/\s+/g, ' ').trim()

/** Index of the `]` closing the `[` that encloses `from`, skipping strings and comments. */
function enclosingArray(text, from) {
  let depth = 0
  let open = -1
  for (let i = from - 1; i >= 0; i--) {
    if (text[i] === ']') depth++
    else if (text[i] === '[') {
      if (depth === 0) {
        open = i
        break
      }
      depth--
    }
  }
  if (open === -1) return undefined
  depth = 0
  for (let i = open; i < text.length; i++) {
    const c = text[i]
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < text.length && text[i] !== c; i++) if (text[i] === '\\') i++
    } else if (c === '/' && text[i + 1] === '/') i = text.indexOf('\n', i) === -1 ? text.length : text.indexOf('\n', i)
    else if (c === '/' && text[i + 1] === '*') i = text.indexOf('*/', i) === -1 ? text.length : text.indexOf('*/', i) + 1
    else if (c === '[') depth++
    else if (c === ']' && --depth === 0) return { open, close: i }
  }
  return undefined
}

const toImport = (from, to) => {
  const rel = path.relative(from, to).split(path.sep).join('/')
  return rel.startsWith('.') ? rel : `./${rel}`
}

/** Refuses to write a registry that TypeScript cannot parse (skipped when TypeScript is unavailable). */
async function assertParses(file, text) {
  let ts
  try {
    ts = (await import('typescript')).default
  } catch {
    return
  }
  const { diagnostics } = ts.transpileModule(text, { reportDiagnostics: true, fileName: file })
  if (diagnostics?.length) throw new Error(`refusing to register: the updated ${file} would not parse (${diagnostics[0].messageText})`)
}

/**
 * Writes a new presentation folder next to the project's detected registry, wires
 * its imports to the detected scene kit, and appends one registry entry.
 */
export async function createPresentation(target, slug, title) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new Error(`slug must be lowercase letters, digits, and dashes: ${slug}`)
  const sources = await readSources(target)
  const registryFile = findRegistry(sources)
  if (!registryFile) throw new Error('no presentation index found: scaffold one first')
  const kit = findKit(sources)
  if (!kit) throw new Error('no scene kit found: scaffold one first')
  const kitBarrel = (await readdir(kit.dir)).find((n) => /^index\.(tsx?|jsx?)$/.test(n)) ?? path.basename(kit.host)
  const registry = sources.get(registryFile)
  const destDir = path.join(path.dirname(registryFile), slug)
  if (await exists(destDir)) throw new Error(`presentation folder already exists: ${destDir}`)
  if (new RegExp(`['"]?slug['"]?\\s*:\\s*['"]${slug}['"]`).test(registry)) throw new Error(`slug already registered: ${slug}`)
  // the array holding the existing `slug:` entries, wherever it sits in the file
  const firstSlug = registry.search(/['"]?\bslug\b['"]?\s*:\s*['"`]/)
  const array = enclosingArray(registry, firstSlug)
  const tail = array && /\}(\s*,)?(\s*)$/.exec(registry.slice(array.open, array.close))
  if (!array || !tail) throw new Error(`could not find the presentations array in ${registryFile}`)
  const vars = { SLUG: slug, TITLE: sanitizeTitle(title) }
  const loader = toImport(path.dirname(registryFile), path.join(destDir, 'Talk.tsx'))
  const entry = `{\n    slug: '${slug}',\n    title: '${vars.TITLE.replace(/'/g, "\\'")}',\n    load: () => import('${loader}'),\n  }`
  const bodyEnd = array.open + tail.index + 1
  const updated = `${registry.slice(0, bodyEnd)},\n  ${entry}${tail[1] ? ',' : ''}${tail[2]}${registry.slice(array.close)}`
  await assertParses(registryFile, updated)
  for (const file of await walk(PRESENTATION_TEMPLATE_DIR)) {
    const dest = path.join(destDir, path.relative(PRESENTATION_TEMPLATE_DIR, file))
    await mkdir(path.dirname(dest), { recursive: true })
    const kitImport = toImport(path.dirname(dest), path.join(kit.dir, kitBarrel))
    const text = render(await readFile(file, 'utf8'), vars).replace(/(?:\.\.\/)+presentation-kit\/index\.ts/g, kitImport)
    await writeFile(dest, text)
  }
  await writeFile(registryFile, updated)
  return { dir: destDir, registry: registryFile, registered: slug }
}

async function main([command, ...args]) {
  if (command === 'resolve') {
    console.log(JSON.stringify(await resolveTarget(args[0] ?? '.'), null, 2))
  } else if (command === 'apply') {
    const report = await resolveTarget(args[0] ?? '.')
    if (report.needsConfirmation && !args.includes('--confirm')) {
      console.error(
        `Refusing to scaffold: ${report.root} is not empty and lacks ${report.missing.join(', ')}.\n` +
          `Target: ${report.target} (${report.reason}).\n` +
          'State this target to the user and re-run with --confirm once they agree. Nothing was written.',
      )
      process.exitCode = 2
      return
    }
    await mkdir(report.target, { recursive: true })
    const result = await scaffold(report.target, report.missing)
    console.log(JSON.stringify({ target: report.target, ...result }, null, 2))
    for (const note of result.manual) console.error(`NOTE: ${note}`)
    if (args.includes('--install')) {
      const run = spawnSync('npm', ['install'], { cwd: report.target, stdio: 'inherit' })
      if (run.status !== 0) process.exitCode = run.status ?? 1
    }
  } else if (command === 'create') {
    const [target, slug, title] = args
    console.log(JSON.stringify(await createPresentation(path.resolve(target), slug, title ?? slug), null, 2))
  } else {
    console.error('usage: scaffold.mjs resolve <dir> | apply <dir> [--install] | create <target> <slug> <title>')
    process.exitCode = 1
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main(process.argv.slice(2))
