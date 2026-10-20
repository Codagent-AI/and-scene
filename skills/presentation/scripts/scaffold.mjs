// Detects the presentation scaffold's three contract anchors, resolves where the app belongs,
// and copies only what is missing. Templates are located relative to this file, never the cwd.
//
//   node scaffold.mjs detect [dir]
//   node scaffold.mjs apply [dir] [--confirmed] [--install]
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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
  const index = some((s) => /\bslug\b/.test(s) && /\bload\s*:/.test(s) && /import\(/.test(s))
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
        if (rel === 'package.json' && hasPackage) continue
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

export function applyScaffold(dir, { confirmed = false, install = false, templateDir = TEMPLATE_DIR } = {}) {
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
      const result = spawnSync(cmd, args, { cwd: found.target, stdio: 'inherit' })
      installed.push(`${cmd} ${args.join(' ')}: ${result.status === 0 ? 'ok' : 'failed'}`)
    }
  }
  return { ...found, written: plan.copy.map((c) => c.rel), skipped: plan.skip, mergedPackageJson: plan.mergePackage, installed }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
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
