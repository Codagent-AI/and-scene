#!/usr/bin/env node
// Creates a presentation folder from the presentation templates and registers it.
// Usage: node new-presentation.mjs --slug my-talk --title "My Talk" [--cwd dir]
import fs from 'node:fs'
import path from 'node:path'
import { PRESENTATION_TEMPLATE_DIR, resolveTarget } from './lib.mjs'

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Renders the presentation templates into `dir`, replacing the placeholders. */
export function renderTemplates(dir, { slug, title }) {
  fs.mkdirSync(dir, { recursive: true })
  for (const name of fs.readdirSync(PRESENTATION_TEMPLATE_DIR)) {
    const text = fs
      .readFileSync(path.join(PRESENTATION_TEMPLATE_DIR, name), 'utf8')
      .replaceAll('__SLUG__', slug)
      .replaceAll('__TITLE_JSON__', JSON.stringify(title))
      .replaceAll('__TITLE__', title)
    fs.writeFileSync(path.join(dir, name.replace(/\.tmpl$/, '')), text)
  }
}

const REGISTRY_ARRAY = /\bpresentations\b(\s*:\s*[^=\n]+)?\s*=\s*\[/
const REGISTRY_FILES = ['index.ts', 'index.tsx', 'index.js', 'index.jsx']

/** Returns the registry text with one entry appended; throws, writing nothing, if it has no array to extend. */
export function withRegistryEntry(text, { slug, title }, file = 'the registry') {
  const open = text.search(REGISTRY_ARRAY)
  const close = open === -1 ? -1 : text.indexOf('\n]', open)
  if (close === -1) throw new Error(`cannot find the presentations array in ${file} (expected "presentations = [" ... "\\n]")`)
  const entry = `  {\n    slug: '${slug}',\n    title: '${title.replaceAll("'", "\\'")}',\n    load: () => import('./${slug}/Talk.tsx'),\n  },`
  return `${text.slice(0, close)}\n${entry}${text.slice(close)}`
}

/** Appends one registry line, leaving every existing entry untouched. */
export function registerPresentation(indexFile, presentation) {
  fs.writeFileSync(indexFile, withRegistryEntry(fs.readFileSync(indexFile, 'utf8'), presentation, indexFile))
}

export function newPresentation({ cwd, slug, title }) {
  if (!SLUG_PATTERN.test(slug ?? '')) throw new Error('--slug must be lowercase words joined by hyphens')
  if (!title) throw new Error('--title is required')
  const plan = resolveTarget(cwd)
  if (plan.missing.length > 0) throw new Error(`scaffold the missing anchors first: ${plan.missing.join(', ')}`)
  const dir = path.join(plan.target, 'src', 'presentations', slug)
  if (fs.existsSync(dir)) throw new Error(`presentation "${slug}" already exists`)
  const indexFile = REGISTRY_FILES.map((n) => path.join(plan.target, 'src', 'presentations', n)).find(fs.existsSync)
  // Validate the registry before writing anything, so a failure never leaves a half-created presentation.
  const registry = withRegistryEntry(fs.readFileSync(indexFile, 'utf8'), { slug, title }, indexFile)
  try {
    renderTemplates(dir, { slug, title })
    fs.writeFileSync(indexFile, registry)
  } catch (err) {
    fs.rmSync(dir, { recursive: true, force: true })
    throw err
  }
  return { target: plan.target, folder: path.relative(plan.target, dir), route: `/${slug}` }
}

function main() {
  const args = process.argv.slice(2)
  const get = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
  try {
    console.log(JSON.stringify(newPresentation({ cwd: get('--cwd') ?? process.cwd(), slug: get('--slug'), title: get('--title') }), null, 2))
  } catch (err) {
    console.error(`new-presentation: ${err.message}`)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main()
