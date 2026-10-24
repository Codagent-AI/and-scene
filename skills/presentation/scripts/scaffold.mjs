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
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'eslint.config.js',
  'index.html',
  '.gitignore',
  'public/favicon.svg',
]

// Needed by any anchor: dependencies, the verification scripts, and the files that route a URL
// to a registered presentation. Existing files are never overwritten.
const SUPPORT_FILES = [
  'package.json',
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
const supportFiles = () => expand(SUPPORT_FILES)

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

function runInherited(command, args, cwd) {
  return spawnSync(command, args, { cwd, stdio: ['ignore', 2, 2] }).status === 0
}

/**
 * Copies the template files of every missing anchor, plus the shared support files (dependencies,
 * verification scripts, route host), into `target`. Existing files are never overwritten; an
 * existing package.json only gains the dependencies and scripts it lacks. With `install`, runs the
 * package install and downloads the Chromium that render verification drives.
 */
export function scaffoldMissing(target, { install = false, runCommand = runInherited } = {}) {
  const missing = missingAnchors(target)
  const created = []
  const skipped = []
  const merged = []
  fs.mkdirSync(target, { recursive: true })
  const planned = missing.length ? [...supportFiles(), ...missing.flatMap((anchor) => FILES_BY_ANCHOR[anchor]())] : []
  for (const rel of new Set(planned)) {
    const from = path.join(BOOTSTRAP_DIR, rel)
    const to = path.join(target, rel)
    if (rel === 'package.json' && fs.existsSync(to)) {
      merged.push(...mergePackageJson(from, to))
    } else if (fs.existsSync(to)) {
      skipped.push(rel)
    } else {
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
    if (!runCommand('npm', [command], target)) throw new Error(`npm ${command} failed in ${target}`)
    if (!runCommand('npx', ['playwright', 'install', 'chromium'], target)) {
      throw new Error(`Chromium download failed in ${target}; run "npx playwright install chromium" there before npm run verify`)
    }
    installed = true
  }
  return { missing, created, skipped, merged, installed }
}

const quoted = (value) => JSON.stringify(value)
const commentSafe = (value) => value.replace(/\*\//g, '* /').replace(/\s+/g, ' ')

/** Substitutes the presentation tokens; titles are escaped for the context they land in. */
export function render(text, { slug, title }) {
  return text
    .replaceAll('__TITLE_LITERAL__', quoted(title))
    .replaceAll('__TITLE_COMMENT__', commentSafe(title))
    .replaceAll('__SLUG__', slug)
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
