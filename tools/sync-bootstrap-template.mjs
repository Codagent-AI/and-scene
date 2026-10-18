// Refreshes skills/presentation/templates/bootstrap/ from the canonical sources:
// the scene kit, routing files, config, verification scripts, and the starter
// presentation rendered from templates/presentation/. Run after changing any of them.
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = fileURLToPath(new URL('..', import.meta.url))
const skill = path.join(repo, 'skills/presentation/templates')
const bootstrap = path.join(skill, 'bootstrap')

export const MIRRORED_FILES = [
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'index.html',
  'src/main.tsx',
  'src/router.tsx',
  'src/Landing.tsx',
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'scripts/lib/preview.mjs',
]

export const STARTER = { slug: 'starter', title: 'Starter Presentation' }

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    return e.isDirectory() ? walk(full) : [full]
  })
}

export function renderTemplate(text, { slug, title }) {
  return text.replaceAll('__SLUG__', slug).replaceAll('__TITLE__', title)
}

/** Files of the presentation template rendered for `values`, keyed by relative path. */
export function renderPresentation(values) {
  const root = path.join(skill, 'presentation')
  return Object.fromEntries(walk(root).map((f) => [path.relative(root, f), renderTemplate(readFileSync(f, 'utf8'), values)]))
}

function main() {
  rmSync(path.join(bootstrap, 'src/presentation-kit'), { recursive: true, force: true })
  rmSync(path.join(bootstrap, 'src/presentations/starter'), { recursive: true, force: true })
  cpSync(path.join(repo, 'src/presentation-kit'), path.join(bootstrap, 'src/presentation-kit'), { recursive: true })
  for (const rel of MIRRORED_FILES) {
    mkdirSync(path.dirname(path.join(bootstrap, rel)), { recursive: true })
    cpSync(path.join(repo, rel), path.join(bootstrap, rel))
  }
  for (const [rel, text] of Object.entries(renderPresentation(STARTER))) {
    const dest = path.join(bootstrap, 'src/presentations/starter', rel)
    mkdirSync(path.dirname(dest), { recursive: true })
    writeFileSync(dest, text)
  }
  if (!statSync(path.join(bootstrap, 'package.json'), { throwIfNoEntry: false })) throw new Error('bootstrap/package.json is maintained by hand')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
