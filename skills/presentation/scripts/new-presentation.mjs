#!/usr/bin/env node
// Creates a self-contained presentation folder from templates/presentation and appends
// its single registry line. Existing presentations and registry lines are never touched.
//
//   node new-presentation.mjs --target <app dir> --slug <slug> --title "<Title>"
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { findRegistry } from './scaffold.mjs'

const templateDir = path.resolve(import.meta.dirname, '..', 'templates', 'presentation')
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function walk(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full, base) : [path.relative(base, full)]
  })
}

export function registryLine(slug, title) {
  return `  { slug: '${slug}', title: '${title.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}', load: () => import('./${slug}/Talk.tsx') },`
}

export function createPresentation(target, slug, title) {
  if (/[\u0000-\u001f\u007f]/.test(title)) throw new Error('invalid title: control characters (such as newlines) are not allowed')
  if (!SLUG.test(slug)) throw new Error(`invalid slug "${slug}": use lowercase letters, digits and single hyphens`)
  const presentations = path.join(target, 'src', 'presentations')
  const indexFile = findRegistry(target)
  if (!indexFile) throw new Error(`no presentation index under ${presentations}: scaffold first`)
  const index = fs.readFileSync(indexFile, 'utf8')
  const destDir = path.join(presentations, slug)
  if (fs.existsSync(destDir) || new RegExp(`slug:\\s*['"]${slug}['"]`).test(index)) throw new Error(`presentation "${slug}" already exists; refusing to overwrite it`)
  const close = index.lastIndexOf('\n]')
  if (close < 0) throw new Error(`could not find the end of the PRESENTATIONS array in ${indexFile}`)

  const fill = (text) => text.replaceAll('__SLUG__', slug).replaceAll('__CLASS__', slug).replaceAll('__TITLE__', title.replace(/\\/g, '\\\\').replace(/'/g, "\\'"))
  const created = []
  for (const rel of walk(templateDir)) {
    const outRel = rel === 'presentation.css' ? `${slug}.css` : rel
    const dest = path.join(destDir, outRel)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, fill(fs.readFileSync(path.join(templateDir, rel), 'utf8')))
    created.push(path.join('src', 'presentations', slug, outRel))
  }
  fs.writeFileSync(indexFile, `${index.slice(0, close)}\n${registryLine(slug, title)}${index.slice(close)}`)
  return { created, registered: slug }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const value = (flag) => args[args.indexOf(flag) + 1]
  try {
    const result = createPresentation(path.resolve(value('--target') ?? '.'), value('--slug') ?? '', value('--title') ?? '')
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(`new-presentation: ${error.message}`)
    process.exitCode = 1
  }
}
