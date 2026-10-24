#!/usr/bin/env node
// Refreshes the bootstrap template snapshot from the canonical sources:
// the scene kit, the root verification/inspection scripts, and the routing shell are copied
// byte-for-byte, and the starter presentation is instantiated from templates/presentation.
// Usage: node scripts/sync-templates.mjs [--check]   (--check exits 1 if anything is stale)
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const skill = path.join(root, 'skills', 'presentation')
const bootstrap = path.join(skill, 'templates', 'bootstrap')
const check = process.argv.includes('--check')

const STARTER = { slug: 'starter', title: 'Starter presentation' }
const COPIES = [
  ['src/presentation-kit', 'src/presentation-kit'],
  ['scripts/verify.mjs', 'scripts/verify.mjs'],
  ['scripts/inspect-presentation.mjs', 'scripts/inspect-presentation.mjs'],
  ['scripts/lib', 'scripts/lib'],
  ['src/main.tsx', 'src/main.tsx'],
  ['src/Router.tsx', 'src/Router.tsx'],
  ['src/route.ts', 'src/route.ts'],
  ['src/Landing.tsx', 'src/Landing.tsx'],
]

function files(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? files(full) : [full]
  })
}

const stale = []
function write(file, content) {
  if (existsSync(file) && readFileSync(file, 'utf8') === content) return
  stale.push(path.relative(root, file))
  if (!check) {
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, content)
  }
}

for (const [from, to] of COPIES) {
  const source = path.join(root, from)
  const sources = statSync(source).isDirectory() ? files(source) : [source]
  for (const file of sources) {
    const target = path.join(bootstrap, to, path.relative(source, file))
    write(target, readFileSync(file, 'utf8'))
  }
  // Files deleted from the canonical source must disappear from the snapshot too.
  if (statSync(source).isDirectory()) {
    for (const file of files(path.join(bootstrap, to))) {
      if (!existsSync(path.join(source, path.relative(path.join(bootstrap, to), file)))) {
        stale.push(path.relative(root, file))
        if (!check) rmSync(file)
      }
    }
  }
}

const templateDir = path.join(skill, 'templates', 'presentation')
for (const file of files(templateDir)) {
  const text = readFileSync(file, 'utf8').replace(/__SLUG__/g, STARTER.slug).replace(/__TITLE__/g, STARTER.title)
  write(path.join(bootstrap, 'src', 'presentations', STARTER.slug, path.relative(templateDir, file)), text)
}

if (check && stale.length) {
  console.error(`stale template files:\n${stale.join('\n')}`)
  process.exit(1)
}
console.log(stale.length ? `synced ${stale.length} file(s)` : 'templates are up to date')
