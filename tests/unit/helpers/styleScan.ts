import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

export function walk(dir: string, filter: (file: string) => boolean = () => true): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full, filter))
    else if (filter(full)) out.push(full)
  }
  return out
}

/** Declarations whose value supplies no look are allowed anywhere. */
const NEUTRAL_DECLARATION = /[\w-]+\s*:\s*(?:currentColor|inherit|none|transparent|0)\s*(?=[;,}\n]|$)/g

const FORBIDDEN_PROPERTY =
  /(^|[^\w-])(color|background(?:-?[cC]olor|-?[iI]mage)?|font(?:-?[fF]amily|-?[sS]ize|-?[wW]eight|-?[sS]tyle)?|border(?:-?[a-zA-Z]+)?|outline(?:-?[a-zA-Z]+)?|box-?[sS]hadow|text-?[sS]hadow|text-?[dD]ecoration|filter|backdrop-?[fF]ilter|padding(?:-?[a-zA-Z]+)?|margin(?:-?[a-zA-Z]+)?|gap|row-?[gG]ap|column-?[gG]ap|line-?[hH]eight|letter-?[sS]pacing|fill|stroke(?:-?[wW]idth)?|cursor)\s*:/g

const THEME_TOKEN = /--[a-zA-Z][\w-]*\s*:/g
const FRAMEWORK = /tailwind|@apply|styled-components|@emotion|class-variance|unocss|bootstrap/i

export interface Finding {
  file: string
  match: string
}

/** Strips comments and neutral values, then reports look-supplying declarations. */
export function scanSource(file: string, source: string): Finding[] {
  const cleaned = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(NEUTRAL_DECLARATION, '')
  const findings: Finding[] = []
  // Motion sets opacity from code; a stylesheet must not.
  if (file.endsWith('.css') && /opacity\s*:/.test(cleaned)) findings.push({ file, match: 'opacity:' })
  for (const re of [FORBIDDEN_PROPERTY, THEME_TOKEN]) {
    for (const m of cleaned.matchAll(re)) findings.push({ file, match: m[0].trim() })
  }
  if (FRAMEWORK.test(source)) findings.push({ file, match: 'styling framework reference' })
  return findings
}

export function scanDir(dir: string): Finding[] {
  const files = walk(dir, (f) => /\.(css|ts|tsx|js|jsx|mjs)$/.test(f))
  return files.flatMap((f) => scanSource(f, readFileSync(f, 'utf8')))
}
