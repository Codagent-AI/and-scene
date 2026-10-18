// Usage: node scaffold.mjs <target-dir> [--anchors build,kit,index]
// Copies the missing anchors from templates/bootstrap/ (resolved relative to this
// skill, never the caller's cwd). Existing files are never overwritten; package.json
// only gains missing dependencies and scripts. Run `npm install` afterwards.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const TEMPLATE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../templates/bootstrap')

/** Template paths (files or directories) each anchor owns. */
export const ANCHOR_PATHS = {
  build: [
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'vite.config.ts',
    'eslint.config.js',
    'index.html',
    'src/index.css',
    'scripts',
  ],
  kit: ['src/presentation-kit'],
  index: ['src/main.tsx', 'src/router.tsx', 'src/routing.ts', 'src/Landing.tsx', 'src/presentations'],
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    return e.isDirectory() ? walk(full) : [full]
  })
}

function filesUnder(rel) {
  const full = path.join(TEMPLATE_ROOT, rel)
  return statSync(full).isDirectory() ? walk(full).map((f) => path.relative(TEMPLATE_ROOT, f)) : [rel]
}

/** Merge missing dependencies and scripts into the target's package.json; returns what was added. */
export function mergePackageJson(templatePkg, existingPkg) {
  const merged = structuredClone(existingPkg)
  const added = []
  for (const field of ['dependencies', 'devDependencies', 'scripts']) {
    for (const [name, value] of Object.entries(templatePkg[field] ?? {})) {
      const taken = field !== 'scripts' ? name in { ...merged.dependencies, ...merged.devDependencies } : name in (merged.scripts ?? {})
      if (taken) continue
      merged[field] = { ...merged[field], [name]: value }
      added.push(`${field}.${name}`)
    }
  }
  merged.type ??= templatePkg.type
  return { merged, added }
}

export function scaffold(target, anchors, templateRoot = TEMPLATE_ROOT) {
  const copied = []
  const skipped = []
  mkdirSync(target, { recursive: true })
  const pkgPath = path.join(target, 'package.json')
  const tplPkg = JSON.parse(readFileSync(path.join(templateRoot, 'package.json'), 'utf8'))
  const fresh = !existsSync(pkgPath)
  if (fresh) {
    writeFileSync(pkgPath, JSON.stringify(tplPkg, null, 2) + '\n')
    cpSync(path.join(templateRoot, 'package-lock.json'), path.join(target, 'package-lock.json'))
    copied.push('package.json', 'package-lock.json')
  } else {
    const { merged, added } = mergePackageJson(tplPkg, JSON.parse(readFileSync(pkgPath, 'utf8')))
    if (added.length) {
      writeFileSync(pkgPath, JSON.stringify(merged, null, 2) + '\n')
      copied.push(`package.json (added ${added.join(', ')})`)
    }
  }
  const gitignore = path.join(target, '.gitignore')
  const wanted = readFileSync(path.join(templateRoot, '.gitignore'), 'utf8').split('\n').filter(Boolean)
  const have = existsSync(gitignore) ? readFileSync(gitignore, 'utf8').split('\n') : []
  const extra = wanted.filter((l) => !have.includes(l))
  if (extra.length) {
    writeFileSync(gitignore, [...have.filter((l, i, a) => l || i < a.length - 1), ...extra].join('\n') + '\n')
    copied.push('.gitignore (appended)')
  }
  for (const anchor of anchors) {
    for (const rel of ANCHOR_PATHS[anchor].flatMap(filesUnder)) {
      const dest = path.join(target, rel)
      if (existsSync(dest)) {
        skipped.push(rel)
        continue
      }
      mkdirSync(path.dirname(dest), { recursive: true })
      cpSync(path.join(templateRoot, rel), dest)
      copied.push(rel)
    }
  }
  return { copied, skipped }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [target, flag, list] = process.argv.slice(2)
  if (!target) {
    console.error('usage: node scaffold.mjs <target-dir> [--anchors build,kit,index]')
    process.exit(2)
  }
  const anchors = flag === '--anchors' ? list.split(',').filter(Boolean) : Object.keys(ANCHOR_PATHS)
  const unknown = anchors.filter((a) => !(a in ANCHOR_PATHS))
  if (unknown.length) {
    console.error(`unknown anchor(s): ${unknown.join(', ')}`)
    process.exit(2)
  }
  console.log(JSON.stringify(scaffold(path.resolve(target), anchors), null, 2))
}
