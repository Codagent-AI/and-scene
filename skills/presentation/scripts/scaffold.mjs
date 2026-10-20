// Detects the presentation scaffold's three contract anchors, resolves where the app belongs,
// and copies only what is missing. Templates are located relative to this file, never the cwd.
//
//   node scaffold.mjs detect [dir]
//   node scaffold.mjs apply [dir] [--confirmed] [--install]
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const TEMPLATE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'bootstrap')

/** Files each anchor owns, relative to the app root and to the bootstrap template. */
export const ANCHOR_FILES = {
  build: ['package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js', 'index.html', '.gitignore'],
  kit: ['src/presentation-kit', 'scripts', 'verify.config.json'],
  index: ['src/main.tsx', 'src/Router.tsx', 'src/Landing.tsx', 'src/index.css', 'src/presentations', 'verify.config.json'],
}

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function walk(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name === 'dist' || name === '.git') return []
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

export function isEmpty(dir) {
  return !existsSync(dir) || readdirSync(dir).every((name) => name === '.git')
}

/** A monorepo has `workspaces`, a pnpm workspace file, or a packages/ or apps/ directory. */
export function isMonorepo(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  return Boolean(pkg?.workspaces) || existsSync(path.join(dir, 'pnpm-workspace.yaml')) || ['packages', 'apps'].some((d) => existsSync(path.join(dir, d)))
}

const SOURCE_FILE = /\.(ts|tsx|js|jsx)$/
const isRegistrySource = (s) => /\bslug\s*:/.test(s) && /\bload\s*:/.test(s) && /import\(/.test(s)

/** The source file playing the registry role (relative path), preferring src/presentations/index.ts. */
export function findRegistry(dir) {
  const files = walk(path.join(dir, 'src')).filter((f) => SOURCE_FILE.test(f) && !/\.test\./.test(f))
  const preferred = path.join(dir, 'src', 'presentations', 'index.ts')
  const ordered = [...files.filter((f) => f === preferred), ...files.filter((f) => f !== preferred).sort((a, b) => a.length - b.length || a.localeCompare(b))]
  const found = ordered.find((f) => isRegistrySource(readFileSync(f, 'utf8')))
  return found ? path.relative(dir, found) : null
}

function resolveFile(base) {
  // NodeNext-style specifiers name the emitted extension (./x.js) while the source is ./x.ts.
  const stem = base.replace(/\.(m|c)?jsx?$/, '')
  const exts = ['.ts', '.tsx', '.js', '.jsx']
  const candidates = [base, ...exts.map((e) => base + e), ...exts.map((e) => stem + e), ...exts.map((e) => path.join(base, `index${e}`))]
  return candidates.find((c) => SOURCE_FILE.test(c) && existsSync(c) && statSync(c).isFile()) ?? null
}

/** tsconfig `paths` as [pattern, targets[]] pairs resolved against baseUrl; `@/` and `~/` default to src/. */
function pathAliases(dir) {
  const aliases = []
  for (const name of ['tsconfig.app.json', 'tsconfig.json']) {
    try {
      const text = readFileSync(path.join(dir, name), 'utf8').replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1')
      const { compilerOptions = {} } = JSON.parse(text)
      const base = path.resolve(dir, compilerOptions.baseUrl ?? '.')
      for (const [pattern, targets] of Object.entries(compilerOptions.paths ?? {})) aliases.push([pattern, targets.map((t) => path.resolve(base, t))])
    } catch {
      // An unreadable tsconfig only means fewer aliases are known.
    }
  }
  for (const prefix of ['@/', '~/']) aliases.push([`${prefix}*`, [path.join(dir, 'src', '*')]])
  return aliases
}

/** Module specifiers a browser actually loads: type-only imports and exports are erased by the compiler. */
export function runtimeImports(source) {
  const specs = []
  for (const [, , typeOnly, clause, spec] of source.matchAll(/(^|[;\n])\s*(?:import|export)\s+(type\s+)?([^'";]*?)\s*from\s*['"]([^'"]+)['"]/g)) {
    const names = /^\{([^}]*)\}$/.exec(clause.trim())?.[1]
    const allInlineTypes = names !== undefined && names.split(',').filter((n) => n.trim()).every((n) => /^type\s/.test(n.trim()))
    if (!typeOnly && !allInlineTypes) specs.push(spec)
  }
  for (const [, spec] of source.matchAll(/(?:^|[;\n])\s*import\s*['"]([^'"]+)['"]/g)) specs.push(spec)
  for (const [, spec] of source.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) specs.push(spec)
  return specs
}

/** Module entry points of index.html: every `<script type="module" src>` plus the imports of inline module scripts. */
function htmlEntries(html) {
  const entries = []
  const inline = []
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\btype\s*=\s*["']module["']/i.test(attrs)) continue
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1]
    if (src) entries.push(src.startsWith('/') ? `.${src}` : src)
    else inline.push(...runtimeImports(body).map((spec) => (spec.startsWith('/') ? `.${spec}` : spec)))
  }
  return [...entries, ...inline]
}

/** Whether the app's browser entry (a module script in index.html) reaches the registry through its runtime imports. */
export function registryIsRouted(dir, registryRel) {
  if (!registryRel) return false
  const html = existsSync(path.join(dir, 'index.html')) ? readFileSync(path.join(dir, 'index.html'), 'utf8') : ''
  const aliases = pathAliases(dir)
  let untraceable = false
  const resolveSpec = (from, spec) => {
    if (spec.startsWith('.')) return resolveFile(path.resolve(path.dirname(from), spec))
    for (const [pattern, targets] of aliases) {
      const star = pattern.indexOf('*')
      const matches = star === -1 ? spec === pattern : spec.startsWith(pattern.slice(0, star)) && spec.endsWith(pattern.slice(star + 1))
      if (!matches) continue
      const rest = star === -1 ? '' : spec.slice(star, spec.length - (pattern.length - star - 1))
      for (const target of targets) {
        const found = resolveFile(target.replace('*', rest))
        if (found) return found
      }
      untraceable = true
    }
    return null
  }
  const target = path.join(dir, registryRel)
  const seen = new Set()
  const queue = htmlEntries(html)
    .map((entry) => resolveFile(path.resolve(dir, entry)))
    .filter(Boolean)
  while (queue.length) {
    const file = queue.pop()
    if (seen.has(file)) continue
    seen.add(file)
    if (file === target) return true
    for (const spec of runtimeImports(readFileSync(file, 'utf8'))) {
      const next = resolveSpec(file, spec)
      if (next) queue.push(next)
    }
  }
  // An alias that cannot be traced is not evidence that the registry is unrouted; do not report a working host as missing.
  return untraceable
}

/** Contract-level anchor detection: what the files provide, not what they are called. */
export function anchorsAt(dir) {
  const pkg = readJson(path.join(dir, 'package.json'))
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
  const build =
    Boolean(pkg) &&
    /\bvite\b/.test(pkg.scripts?.build ?? '') &&
    ['vite', 'react', 'typescript'].every((d) => d in deps) &&
    existsSync(path.join(dir, 'index.html')) &&
    readdirSync(dir).some((f) => /^tsconfig.*\.json$/.test(f))

  const sources = walk(path.join(dir, 'src'))
    .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f) && !/\.test\./.test(f))
    .map((f) => readFileSync(f, 'utf8'))
  const some = (predicate) => sources.some(predicate)
  const kit =
    some((s) => /\bSceneProps\b/.test(s)) &&
    some((s) => /AnimatePresence/.test(s) && /LayoutGroup/.test(s)) &&
    some((s) => /ArrowRight/.test(s) && /PageDown/.test(s)) &&
    some((s) => /caption/i.test(s) && /data-presentation-caption|<p\b|<figcaption/.test(s)) &&
    some((s) => /toc/i.test(s) && /table of contents/i.test(s)) &&
    some((s) => /\bbrowse\b/.test(s) && /\bpresent\b/.test(s)) &&
    some((s) => /scale\(/.test(s)) &&
    some((s) => /export (function|const) Presentation\b/.test(s))
  const registry = findRegistry(dir)
  const index = registry !== null && registryIsRouted(dir, registry)
  return { build, kit, index }
}

/** Where the app belongs: an existing presentation app, else presentations/ in a monorepo, else here. */
export function resolveTarget(dir) {
  const here = anchorsAt(dir)
  if (here.kit || here.index) return { target: dir, reason: 'already a presentation app' }
  if (isMonorepo(dir)) return { target: path.join(dir, 'presentations'), reason: 'monorepo: self-contained app under presentations/' }
  return { target: dir, reason: isEmpty(dir) ? 'empty directory' : 'standalone project' }
}

export function detect(dir) {
  const root = path.resolve(dir)
  const { target, reason } = resolveTarget(root)
  const anchors = anchorsAt(target)
  const missing = Object.keys(anchors).filter((name) => !anchors[name])
  return {
    dir: root,
    target,
    reason,
    nonEmpty: !isEmpty(root),
    monorepo: isMonorepo(root),
    anchors,
    missing,
    registry: findRegistry(target),
    needsConfirmation: !isEmpty(root) && missing.length > 0,
  }
}

function filesOf(base, rel) {
  const full = path.join(base, rel)
  if (!existsSync(full)) return []
  return statSync(full).isDirectory() ? walk(full).map((f) => path.relative(base, f)) : [rel]
}

/** Which template files would be written for the missing anchors; existing files are never replaced. */
export function planScaffold(target, missing, templateDir = TEMPLATE_DIR) {
  const copy = []
  const skip = []
  const hasPackage = existsSync(path.join(target, 'package.json'))
  const mergePackage = missing.length > 0 && hasPackage
  for (const anchor of missing) {
    for (const entry of ANCHOR_FILES[anchor]) {
      for (const rel of filesOf(templateDir, entry)) {
        // The host keeps its own manifest and lockfile; a template lock would not match the merged manifest.
        if (hasPackage && (rel === 'package.json' || rel === 'package-lock.json')) continue
        if (rel === '.gitignore' && existsSync(path.join(target, rel))) copy.push({ rel, mode: 'append' })
        else if (existsSync(path.join(target, rel))) skip.push(rel)
        else copy.push({ rel, mode: 'copy' })
      }
    }
  }
  const seen = new Set()
  return {
    copy: copy.filter(({ rel }) => !seen.has(rel) && seen.add(rel)),
    skip: [...new Set(skip)],
    mergePackage,
  }
}

/** Add missing dependencies and scripts to an existing package.json without altering existing entries. */
export function mergePackageJson(existing, template) {
  const merged = { ...existing }
  for (const field of ['dependencies', 'devDependencies', 'scripts']) {
    merged[field] = { ...template[field], ...existing[field] }
  }
  if (!merged.type) merged.type = template.type
  return merged
}

export function applyScaffold(dir, { confirmed = false, install = false, templateDir = TEMPLATE_DIR, runInstall = spawnSync } = {}) {
  const found = detect(dir)
  if (found.needsConfirmation && !confirmed) {
    throw new Error(`confirmation required: state the target ${found.target} to the user and rerun with --confirmed`)
  }
  const plan = planScaffold(found.target, found.missing, templateDir)
  mkdirSync(found.target, { recursive: true })
  for (const { rel, mode } of plan.copy) {
    const to = path.join(found.target, rel)
    const from = path.join(templateDir, rel)
    mkdirSync(path.dirname(to), { recursive: true })
    if (mode === 'append') {
      const have = new Set(readFileSync(to, 'utf8').split('\n'))
      const extra = readFileSync(from, 'utf8').split('\n').filter((line) => line && !have.has(line))
      if (extra.length) writeFileSync(to, `${readFileSync(to, 'utf8').replace(/\n?$/, '\n')}${extra.join('\n')}\n`)
    } else {
      cpSync(from, to)
    }
  }
  if (plan.mergePackage) {
    const file = path.join(found.target, 'package.json')
    const merged = mergePackageJson(readJson(file), readJson(path.join(templateDir, 'package.json')))
    writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`)
  }
  const installed = []
  if (install) {
    for (const [cmd, args] of [['npm', ['install']], ['npx', ['playwright', 'install', 'chromium']]]) {
      const result = runInstall(cmd, args, { cwd: found.target, stdio: 'inherit' })
      const ok = !result.error && result.status === 0
      installed.push(`${cmd} ${args.join(' ')}: ${ok ? 'ok' : `failed (${result.error?.message ?? `exit ${result.status}`})`}`)
    }
    if (installed.some((line) => !line.includes(': ok'))) {
      throw new Error(`install failed after scaffolding ${found.target}:\n${installed.join('\n')}`)
    }
  }
  const remaining = detect(dir).missing
  const followUp = remaining.includes('index')
    ? [
        `The registry is not reachable from the app entry (index.html script), so the new routes cannot be opened. ${plan.skip.includes('src/main.tsx') ? 'The existing src/main.tsx was kept. ' : ''}` +
          'Make the entry render `<Router registry={PRESENTATIONS} pathname={window.location.pathname} />` ' +
          "(`Router` from ./Router.tsx, `PRESENTATIONS` from the registry) or mount it at the host's routing point, then run detect again until `missing` is empty.",
      ]
    : []
  return { ...found, written: plan.copy.map((c) => c.rel), skipped: plan.skip, mergedPackageJson: plan.mergePackage, installed, remaining, followUp }
}

/** True when this file is the process entry point, also when started through a symlinked path. */
function isMain() {
  if (!process.argv[1]) return false
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

if (isMain()) {
  const [command, ...rest] = process.argv.slice(2)
  const flags = new Set(rest.filter((a) => a.startsWith('--')))
  const dir = rest.find((a) => !a.startsWith('--')) ?? process.cwd()
  try {
    if (command === 'detect') console.log(JSON.stringify(detect(dir), null, 2))
    else if (command === 'apply') console.log(JSON.stringify(applyScaffold(dir, { confirmed: flags.has('--confirmed'), install: flags.has('--install') }), null, 2))
    else throw new Error('usage: scaffold.mjs detect|apply [dir] [--confirmed] [--install]')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
