#!/usr/bin/env node
// Keeps the skill's bootstrap snapshot aligned with the canonical kit, scripts, and host shell.
// `node scripts/sync-templates.mjs` rewrites the snapshot; `--check` only reports drift.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const BOOTSTRAP = join(ROOT, 'skills', 'presentation', 'templates', 'bootstrap')
const PRESENTATION_TEMPLATE = join(ROOT, 'skills', 'presentation', 'templates', 'presentation')

/** Files copied verbatim from the canonical repository into the bootstrap snapshot. */
const MIRRORED = [
  'scripts/lib.mjs',
  'scripts/verify.mjs',
  'scripts/inspect-presentation.mjs',
  'src/main.tsx',
  'src/App.tsx',
  'src/Landing.tsx',
  'src/routes.ts',
  'src/index.css',
]

export const STARTER = {
  slug: 'getting-started',
  title: 'Getting Started',
  steps: [
    { era: 'start', title: 'Name the idea', caption: 'Every presentation starts as one idea on one canvas.' },
    { era: 'start', title: 'Let it grow', caption: 'Each step changes the same scene instead of replacing it.' },
    { era: 'finish', title: 'Make it yours', caption: 'Replace this starter with a presentation about your topic.' },
  ],
}

const isTest = (name) => /\.test\.tsx?$/.test(name)

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

/** Substitutes `{{key}}` placeholders. */
export const render = (text, values) => text.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in values ? values[k] : m))

export function templateValues({ slug, title, steps }) {
  const values = { slug, title }
  steps.forEach((s, i) => {
    values[`era${i + 1}`] = s.era
    values[`title${i + 1}`] = s.title
    values[`caption${i + 1}`] = s.caption
  })
  return values
}

/** Renders the presentation template as `{ relativePath: contents }`. */
export function renderPresentationTemplate(spec) {
  const values = templateValues(spec)
  return Object.fromEntries(
    walk(PRESENTATION_TEMPLATE).map((file) => [relative(PRESENTATION_TEMPLATE, file), render(readFileSync(file, 'utf8'), values)]),
  )
}

/** Every generated file of the snapshot as `{ relativePathInBootstrap: contents }`. */
export function expectedSnapshot() {
  const out = {}
  for (const file of walk(join(ROOT, 'src', 'presentation-kit'))) {
    if (!isTest(file)) out[relative(ROOT, file)] = readFileSync(file, 'utf8')
  }
  for (const rel of MIRRORED) out[rel] = readFileSync(join(ROOT, rel), 'utf8')
  for (const [rel, text] of Object.entries(renderPresentationTemplate(STARTER))) {
    out[`src/presentations/${STARTER.slug}/${rel}`] = text
  }
  out['scripts/verify.config.json'] = `${JSON.stringify({ reference: { slug: STARTER.slug, steps: STARTER.steps.map(({ title, caption }) => ({ title, caption })) } }, null, 2)}\n`
  return out
}

function main() {
  const check = process.argv.includes('--check')
  const expected = expectedSnapshot()
  const drift = []
  for (const [rel, text] of Object.entries(expected)) {
    const target = join(BOOTSTRAP, rel)
    if (!existsSync(target) || readFileSync(target, 'utf8') !== text) drift.push(rel)
    else continue
    if (!check) {
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, text)
    }
  }
  // Remove stale kit files that no longer exist canonically.
  const kitDir = join(BOOTSTRAP, 'src', 'presentation-kit')
  if (existsSync(kitDir)) {
    for (const file of walk(kitDir)) {
      const rel = relative(BOOTSTRAP, file)
      if (!(rel in expected)) {
        drift.push(rel)
        if (!check) rmSync(file)
      }
    }
  }
  if (drift.length) console.log(`${check ? 'drift' : 'synced'}: ${drift.join(', ')}`)
  if (check && drift.length) process.exitCode = 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
