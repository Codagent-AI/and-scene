// Materializes missing scaffold anchors and new presentations from the templates that ship with
// the skill. Template paths resolve from this file's location, never from the working directory.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { missingAnchors, planScaffold } from './anchors.mjs'
import { registerPresentation } from './register.mjs'

export const TEMPLATES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates')
export const BOOTSTRAP_DIR = path.join(TEMPLATES_DIR, 'bootstrap')
export const PRESENTATION_TEMPLATE_DIR = path.join(TEMPLATES_DIR, 'presentation')

const BUILD_FILES = [
  'package.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'eslint.config.js',
  'index.html',
  '.gitignore',
  'public/favicon.svg',
  'src/main.tsx',
  'src/Router.tsx',
  'src/route.ts',
  'src/Landing.tsx',
  'src/index.css',
  'scripts',
]

function listFiles(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    return e.isDirectory() ? listFiles(full, base) : [path.relative(base, full)]
  })
}

function expand(entries, from = BOOTSTRAP_DIR) {
  return entries.flatMap((rel) => {
    const full = path.join(from, rel)
    return fs.statSync(full).isDirectory() ? listFiles(full, from) : [rel]
  })
}

const FILES_BY_ANCHOR = {
  build: () => expand(BUILD_FILES),
  kit: () => expand(['src/presentation-kit']),
  index: () => expand(['src/presentations']),
}

function mergePackageJson(templateFile, targetFile) {
  const template = JSON.parse(fs.readFileSync(templateFile, 'utf8'))
  const existing = JSON.parse(fs.readFileSync(targetFile, 'utf8'))
  const added = []
  for (const field of ['dependencies', 'devDependencies', 'scripts']) {
    existing[field] ??= {}
    for (const [name, value] of Object.entries(template[field] ?? {})) {
      if (!(name in existing[field])) {
        existing[field][name] = value
        added.push(`${field}.${name}`)
      }
    }
  }
  if (added.length) fs.writeFileSync(targetFile, `${JSON.stringify(existing, null, 2)}\n`)
  return added
}

/**
 * Copies the template files of every missing anchor into `target`. Existing files are never
 * overwritten; an existing package.json only gains the dependencies and scripts it lacks.
 */
export function scaffoldMissing(target, { install = false } = {}) {
  const missing = missingAnchors(target)
  const created = []
  const skipped = []
  const merged = []
  fs.mkdirSync(target, { recursive: true })
  const copied = new Set()
  for (const anchor of missing) {
    for (const rel of FILES_BY_ANCHOR[anchor]()) {
      if (copied.has(rel)) continue
      copied.add(rel)
      const from = path.join(BOOTSTRAP_DIR, rel)
      const to = path.join(target, rel)
      if (rel === 'package.json' && fs.existsSync(to)) {
        merged.push(...mergePackageJson(from, to))
        continue
      }
      if (fs.existsSync(to)) {
        skipped.push(rel)
        continue
      }
      fs.mkdirSync(path.dirname(to), { recursive: true })
      fs.copyFileSync(from, to)
      created.push(rel)
    }
  }
  // The lockfile only travels with a freshly created package.json.
  const lock = 'package-lock.json'
  if (created.includes('package.json') && !fs.existsSync(path.join(target, lock))) {
    fs.copyFileSync(path.join(BOOTSTRAP_DIR, lock), path.join(target, lock))
    created.push(lock)
  }
  let installed = false
  if (install && missing.length) {
    const command = created.includes(lock) ? 'ci' : 'install'
    const result = spawnSync('npm', [command], { cwd: target, stdio: ['ignore', 2, 2] })
    if (result.status !== 0) throw new Error(`npm ${command} failed in ${target}`)
    installed = true
  }
  return { missing, created, skipped, merged, installed }
}

export function render(text, { slug, title }) {
  return text.replaceAll('__SLUG__', slug).replaceAll('__TITLE__', title)
}

/** Writes a presentation folder from the presentation template and registers it. */
export function createPresentation(appRoot, { slug, title, register = true }) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid slug "${slug}" (use lowercase-kebab-case)`)
  const dir = path.join(appRoot, 'src', 'presentations', slug)
  if (fs.existsSync(dir)) throw new Error(`Presentation folder already exists: ${dir}`)
  fs.mkdirSync(dir, { recursive: true })
  for (const rel of listFiles(PRESENTATION_TEMPLATE_DIR)) {
    fs.writeFileSync(path.join(dir, rel), render(fs.readFileSync(path.join(PRESENTATION_TEMPLATE_DIR, rel), 'utf8'), { slug, title }))
  }
  if (register) registerPresentation(appRoot, { slug, title })
  return dir
}

function cli(argv) {
  const [command, ...rest] = argv
  const opt = (name) => {
    const i = rest.indexOf(`--${name}`)
    return i === -1 ? undefined : rest[i + 1]
  }
  const cwd = path.resolve(opt('cwd') ?? process.cwd())
  if (command === 'plan') {
    console.log(JSON.stringify(planScaffold(cwd), null, 2))
  } else if (command === 'apply') {
    const target = opt('target') ? path.resolve(opt('target')) : planScaffold(cwd).target
    console.log(JSON.stringify({ target, ...scaffoldMissing(target, { install: rest.includes('--install') }) }, null, 2))
  } else if (command === 'create') {
    const target = opt('target') ? path.resolve(opt('target')) : planScaffold(cwd).target
    console.log(createPresentation(target, { slug: opt('slug'), title: opt('title') }))
  } else {
    console.error('usage: scaffold.mjs plan|apply|create [--cwd dir] [--target dir] [--install] [--slug s --title t]')
    process.exitCode = 1
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli(process.argv.slice(2))
