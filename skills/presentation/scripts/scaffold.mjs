// Copies the bootstrap template into a target app, adding only what is missing.
// Template paths resolve from this file, never from the caller's working directory.
//
// usage: node scaffold.mjs <target-dir> [--anchors build,kit,index]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectAnchors, locate } from './detect.mjs'

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP = path.join(SKILL_DIR, 'templates', 'bootstrap')
const HOSTED_MAIN = path.join(SKILL_DIR, 'templates', 'hosted-main.tsx')

const FILES = {
  build: ['package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js', 'index.html', '.gitignore'],
  kit: ['src/presentation-kit', 'scripts'],
  index: ['src/main.tsx', 'src/Router.tsx', 'src/Landing.tsx', 'src/route.ts', 'src/index.css', 'src/presentations', 'verify.config.json'],
}

const walk = (p) =>
  fs.statSync(p).isDirectory() ? fs.readdirSync(p).flatMap((f) => walk(path.join(p, f))) : [p]

/** Adds missing keys of `from` into `into`, never changing values already present. */
function mergeMissing(into, from) {
  for (const [k, v] of Object.entries(from)) if (!(k in into)) into[k] = v
}

function mergePackage(target) {
  const file = path.join(target, 'package.json')
  const tpl = JSON.parse(fs.readFileSync(path.join(BOOTSTRAP, 'package.json'), 'utf8'))
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(tpl, null, 2) + '\n')
    return
  }
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'))
  for (const key of ['scripts', 'dependencies', 'devDependencies']) {
    pkg[key] ??= {}
    mergeMissing(pkg[key], tpl[key])
  }
  pkg.type ??= tpl.type
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n')
}

/**
 * An existing entry point that does not reach the registry keeps running its app
 * for non-presentation paths: it moves to `app-main` and a router entry replaces it.
 * The router entry is always `.tsx`; `index.html` is repointed when the host entry had another extension.
 */
function wireEntry(target, written) {
  if (detectAnchors(target).index) return
  const { entry } = locate(target)
  if (!fs.existsSync(entry) || !/\.[tj]sx?$/.test(entry)) return
  const ext = path.extname(entry)
  const dir = path.dirname(entry)
  const moved = path.join(dir, `app-main${ext}`)
  if (fs.existsSync(moved)) return
  const next = path.join(dir, `${path.basename(entry, ext)}.tsx`)
  fs.renameSync(entry, moved)
  fs.copyFileSync(HOSTED_MAIN, next)
  // A plain JS host module has no types: declare it so the router entry's dynamic import builds under `tsc -b`.
  if (/^\.[jm]?jsx?$/.test(ext)) {
    const decl = path.join(dir, 'app-main.d.ts')
    if (!fs.existsSync(decl)) fs.writeFileSync(decl, 'export {}\n')
  }
  const html = path.join(target, 'index.html')
  if (next !== entry && fs.existsSync(html)) {
    fs.writeFileSync(html, fs.readFileSync(html, 'utf8').replace(path.basename(entry), path.basename(next)))
  }
  written.push(`${path.relative(target, next)} (router entry; previous entry moved to ${path.relative(target, moved)})`)
}

export function scaffold(target, anchors) {
  const written = []
  const write = (rel) => {
    for (const src of walk(path.join(BOOTSTRAP, rel))) {
      const r = path.relative(BOOTSTRAP, src)
      const dest = path.join(target, r)
      if (fs.existsSync(dest)) continue // never disturb what is already there
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(src, dest)
      written.push(r)
    }
  }
  fs.mkdirSync(target, { recursive: true })
  const hadPackage = fs.existsSync(path.join(target, 'package.json'))
  for (const anchor of anchors) {
    if (anchor === 'build') {
      // A lock file only matches a freshly written package.json.
      for (const f of FILES.build) if (f !== 'package.json' && (f !== 'package-lock.json' || !hadPackage)) write(f)
    } else {
      FILES[anchor].forEach(write)
    }
  }
  if (anchors.includes('index')) wireEntry(target, written)
  // Every scaffold needs the dependency set, even when package.json already existed.
  mergePackage(target)
  return { written, needsInstall: !hadPackage || anchors.length > 0 }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const target = path.resolve(args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--anchors') ?? '.')
  const i = args.indexOf('--anchors')
  const detected = detectAnchors(target)
  const anchors = i === -1 ? Object.keys(detected).filter((k) => !detected[k]) : args[i + 1].split(',')
  const result = scaffold(target, anchors)
  console.log(JSON.stringify({ target, anchors, ...result }, null, 2))
  if (result.needsInstall) console.log('Next: run `npm install` in the target to install the dependency set.')
}
