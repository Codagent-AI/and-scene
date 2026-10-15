#!/usr/bin/env node
// Usage: node <skill>/scripts/scaffold.mjs [--target <dir>] [--presentation <slug> --title <title>]
// Copies only the missing anchors from <skill>/templates/bootstrap into the target (default: the
// resolved target for the current directory). With --presentation it also creates a new
// presentation folder from templates/presentation. Never overwrites existing files, and does not
// register or install anything: follow SKILL.md for the registry line and `npm install`.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { PRESENTATION_TEMPLATE_DIR, resolveTarget, scaffold } from './lib.mjs'

function arg(name) {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : undefined
}

export function createPresentation(target, slug, title) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`slug must be kebab-case: ${slug}`)
  const dest = path.join(target, 'src', 'presentations', slug)
  if (existsSync(dest)) throw new Error(`presentation already exists: ${dest}`)
  const walk = (src, out) => {
    mkdirSync(out, { recursive: true })
    for (const name of readdirSync(src)) {
      const s = path.join(src, name)
      const o = path.join(out, name)
      if (statSync(s).isDirectory()) walk(s, o)
      else writeFileSync(o, readFileSync(s, 'utf8').replaceAll('__SLUG__', slug).replaceAll('__TITLE__', title))
    }
  }
  walk(PRESENTATION_TEMPLATE_DIR, dest)
  return dest
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const resolved = resolveTarget(process.cwd())
  const target = path.resolve(arg('--target') ?? resolved.target)
  const report = scaffold(target)
  const slug = arg('--presentation')
  if (slug) report.presentation = createPresentation(target, slug, arg('--title') ?? slug)
  console.log(JSON.stringify(report, null, 2))
}
