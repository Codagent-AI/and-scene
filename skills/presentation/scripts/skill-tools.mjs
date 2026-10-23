// Helpers behind skills/presentation/SKILL.md: detect scaffold anchors and the target,
// scaffold missing anchors, create + register a presentation. Templates are resolved
// relative to this file, never the caller's working directory.
//
//   skill-tools.mjs detect [dir]
//   skill-tools.mjs scaffold [dir] [--anchors build,kit,index]
//   skill-tools.mjs new <dir> <slug> <title>
//   skill-tools.mjs register <dir> <slug> <title>
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const TEMPLATES = fileURLToPath(new URL('../templates/', import.meta.url))
const BOOTSTRAP = path.join(TEMPLATES, 'bootstrap')
const PRESENTATION = path.join(TEMPLATES, 'presentation')
export const ANCHORS = ['build', 'kit', 'index']

/** Files (relative to an app root) each anchor owns. */
const ANCHOR_FILES = {
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
    'public',
    'src/main.tsx',
    'src/index.css',
  ],
  kit: ['src/presentation-kit'],
  index: ['src/presentations', 'src/Landing.tsx', 'src/router.ts', 'src/App.tsx'],
}

/** Verification/inspection scripts every presentation app needs, whichever anchors are being scaffolded. */
const TOOLING_FILES = ['scripts']

const SOURCE_EXTS = ['ts', 'tsx', 'js', 'jsx', 'mjs']
const findFile = (root, dir, base) =>
  readdirSync(path.join(root, dir)).find((n) => SOURCE_EXTS.some((e) => n === `${base}.${e}`))

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function hasBuildSetup(root) {
  const pkg = readJson(path.join(root, 'package.json'))
  if (!pkg?.scripts?.build) return false
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const viteConfig = ['ts', 'js', 'mjs', 'mts'].some((ext) => existsSync(path.join(root, `vite.config.${ext}`)))
  return viteConfig && ['react', 'react-dom', 'vite', 'typescript'].every((d) => d in deps)
}

/** Contract-level anchor detection: presence of the pieces, not byte-identical files. */
export function anchorsAt(root) {
  return {
    build: hasBuildSetup(root),
    kit: existsSync(path.join(root, 'src/presentation-kit')) && ['Presentation', 'types'].every((b) => findFile(root, 'src/presentation-kit', b)),
    index: existsSync(path.join(root, 'src/presentations')) && Boolean(findFile(root, 'src/presentations', 'index')),
  }
}

function isEmptyDir(dir) {
  return !existsSync(dir) || readdirSync(dir).filter((n) => n !== '.git').length === 0
}

export function isMonorepo(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  if (pkg?.workspaces) return true
  if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return true
  return ['packages', 'apps'].some((d) => existsSync(path.join(dir, d)) && statSync(path.join(dir, d)).isDirectory())
}

/**
 * Resolve where the presentation app lives and which anchors it lacks.
 * kind: 'existing-app' | 'empty' | 'monorepo' | 'standalone'
 */
export function detect(dir) {
  dir = path.resolve(dir)
  const candidates = [dir, path.join(dir, 'presentations')]
  const appRoot = candidates.find((c) => {
    const a = anchorsAt(c)
    return a.kit || a.index
  })
  let target = dir
  let kind
  if (appRoot) {
    target = appRoot
    kind = 'existing-app'
  } else if (isEmptyDir(dir)) {
    kind = 'empty'
  } else if (isMonorepo(dir)) {
    target = path.join(dir, 'presentations')
    kind = 'monorepo'
  } else {
    kind = 'standalone'
  }
  const anchors = anchorsAt(target)
  const missing = ANCHORS.filter((a) => !anchors[a])
  const sceneMissing = !anchors.kit || !anchors.index
  return {
    dir,
    target,
    kind,
    anchors,
    missing,
    needsConfirmation: kind !== 'empty' && sceneMissing,
  }
}

function copyMissing(from, to, report) {
  if (!existsSync(from)) return
  if (statSync(from).isDirectory()) {
    for (const name of readdirSync(from)) copyMissing(path.join(from, name), path.join(to, name), report)
    return
  }
  if (existsSync(to)) {
    report.skipped.push(to)
    return
  }
  mkdirSync(path.dirname(to), { recursive: true })
  cpSync(from, to)
  report.created.push(to)
}

/** Add dependencies/scripts that are absent from an existing package.json; never change existing ones. */
function mergePackageJson(target, report) {
  const file = path.join(target, 'package.json')
  const have = readJson(file)
  const want = readJson(path.join(BOOTSTRAP, 'package.json'))
  if (!have) return
  let changed = false
  for (const section of ['dependencies', 'devDependencies', 'scripts']) {
    for (const [name, value] of Object.entries(want[section] ?? {})) {
      // A dependency already present in the other section counts as present.
      const present = section === 'scripts' ? name in (have.scripts ?? {}) : name in { ...have.dependencies, ...have.devDependencies }
      if (present) continue
      have[section] = { ...have[section], [name]: value }
      report.added.push(`${section}.${name}`)
      changed = true
    }
  }
  if (changed) writeFileSync(file, JSON.stringify(have, null, 2) + '\n')
}

/** Copy the files of the given anchors from templates/bootstrap, never overwriting existing files. */
export function scaffold(target, anchors = ANCHORS) {
  target = path.resolve(target)
  const report = { target, created: [], skipped: [], added: [], wiring: null }
  for (const anchor of anchors) if (!ANCHORS.includes(anchor)) throw new Error(`unknown anchor "${anchor}"`)
  mkdirSync(target, { recursive: true })
  const hadPackage = existsSync(path.join(target, 'package.json'))
  const files = [...anchors.flatMap((a) => ANCHOR_FILES[a]), ...TOOLING_FILES]
  for (const rel of files) {
    if (rel === 'package-lock.json' && hadPackage) continue
    copyMissing(path.join(BOOTSTRAP, rel), path.join(target, rel), report)
  }
  // Kit, index and tooling all need the template's dependencies and npm scripts, even when the
  // build setup itself already exists.
  if (hadPackage) mergePackageJson(target, report)
  if (anchors.includes('index')) {
    const main = path.join(target, 'src/main.tsx')
    if (!existsSync(main) || !/\bpathname\b/.test(readFileSync(main, 'utf8'))) {
      report.wiring = 'The project entry point does not use the router: render <App pathname={window.location.pathname} /> from src/App.tsx (or call resolveRoute from src/router.ts) so each presentation is reachable at /<slug>. An existing src/main.tsx is never overwritten.'
    }
  }
  report.created = report.created.map((f) => path.relative(target, f))
  report.skipped = report.skipped.map((f) => path.relative(target, f))
  return report
}

/** Index of the `]` closing the array literal that opens at `open`, skipping strings and comments. */
function matchingBracket(source, open) {
  let depth = 0
  for (let i = open; i < source.length; i++) {
    const c = source[i]
    if (c === "'" || c === '"' || c === '`') {
      for (i++; i < source.length && source[i] !== c; i++) if (source[i] === '\\') i++
    } else if (c === '/' && source[i + 1] === '/') {
      i = source.indexOf('\n', i)
      if (i < 0) break
    } else if (c === '/' && source[i + 1] === '*') {
      i = source.indexOf('*/', i + 2) + 1
    } else if (c === '[' || c === '(' || c === '{') depth++
    else if (c === ']' || c === ')' || c === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/** Insert a registry entry into the `presentations` array; existing entries are left untouched. */
export function register(target, slug, title) {
  if (!SLUG.test(slug)) throw new Error(`invalid slug "${slug}": use lowercase words joined by hyphens`)
  const dir = path.join(target, 'src/presentations')
  const name = existsSync(dir) && findFile(target, 'src/presentations', 'index')
  if (!name) throw new Error('presentation index not found; scaffold the index anchor first')
  const file = path.join(dir, name)
  const source = readFileSync(file, 'utf8')
  if (new RegExp(`slug:\\s*['"]${slug}['"]`).test(source)) throw new Error(`"${slug}" is already registered`)
  const declaration = /\bpresentations\b[^=\n]*=\s*\[/.exec(source)
  if (!declaration) throw new Error('could not find the `presentations` array in the registry')
  const open = declaration.index + declaration[0].length - 1
  const close = matchingBracket(source, open)
  if (close < 0) throw new Error('could not find the end of the registry array')
  const entry = `  {\n    slug: '${slug}',\n    title: ${JSON.stringify(title)},\n    load: () => import('./${slug}/Talk.tsx'),\n  },\n`
  let before = source.slice(0, close).replace(/\s*$/, '')
  if (!before.endsWith(',') && !before.endsWith('[')) before += ','
  writeFileSync(file, `${before}\n${entry}${source.slice(close)}`)
  return file
}

function materialize(from, to, tokens) {
  mkdirSync(to, { recursive: true })
  for (const name of readdirSync(from)) {
    const src = path.join(from, name)
    if (statSync(src).isDirectory()) {
      materialize(src, path.join(to, name), tokens)
      continue
    }
    let text = readFileSync(src, 'utf8')
    for (const [token, value] of Object.entries(tokens)) text = text.replaceAll(token, () => value)
    writeFileSync(path.join(to, name), text)
  }
}

/** Write templates/presentation into src/presentations/<slug>/ (no registration). */
export function createPresentationFiles(target, slug, title) {
  if (!SLUG.test(slug)) throw new Error(`invalid slug "${slug}": use lowercase words joined by hyphens`)
  const dest = path.join(target, 'src/presentations', slug)
  if (existsSync(dest)) throw new Error(`${path.relative(target, dest)} already exists`)
  materialize(PRESENTATION, dest, { __SLUG__: slug, __TITLE__: JSON.stringify(title) })
  return dest
}

/** Create a self-contained presentation folder and register it. */
export function newPresentation(target, slug, title) {
  const dest = createPresentationFiles(target, slug, title)
  register(target, slug, title)
  return dest
}

function main(argv) {
  const [cmd, ...rest] = argv
  const flag = (name) => {
    const at = rest.indexOf(`--${name}`)
    return at >= 0 ? rest[at + 1] : undefined
  }
  const pos = rest.filter((a, i) => !a.startsWith('--') && !(i > 0 && rest[i - 1].startsWith('--')))
  switch (cmd) {
    case 'detect':
      return console.log(JSON.stringify(detect(pos[0] ?? '.'), null, 2))
    case 'scaffold': {
      const dir = pos[0] ?? '.'
      const info = detect(dir)
      const anchors = flag('anchors') ? flag('anchors').split(',') : info.missing
      return console.log(JSON.stringify(scaffold(info.target, anchors), null, 2))
    }
    case 'new':
      return console.log(newPresentation(path.resolve(pos[0]), pos[1], pos[2]))
    case 'register':
      return console.log(register(path.resolve(pos[0]), pos[1], pos[2]))
    default:
      console.error('usage: skill-tools.mjs detect|scaffold|new|register ...')
      process.exitCode = 2
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2))
  } catch (e) {
    console.error(e.message)
    process.exitCode = 1
  }
}
