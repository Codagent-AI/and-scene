import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

export function listFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => path.relative(dir, path.join(e.parentPath, e.name)))
    .sort()
}

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const STYLE_PROPERTY =
  /\b(color|background\w*|border\w*|boxShadow|textShadow|font\w*|padding\w*|margin\w*|outline\w*|filter|letterSpacing|textTransform|textDecoration\w*|gap)\s*:/

const STYLE_PROPERTY_ALL = new RegExp(STYLE_PROPERTY.source, 'g')

/** Violations of the style-neutral kit contract found in a kit directory. */
export function scanKitForStyling(dir) {
  const problems = []
  for (const rel of listFiles(dir)) {
    const raw = readFileSync(path.join(dir, rel), 'utf8')
    const src = stripComments(raw)
    if (/\.(css|scss|sass|less)$/.test(rel)) problems.push(`${rel}: stylesheet inside the kit`)
    if (/import\s+['"][^'"]+\.(css|scss|sass|less)['"]/.test(src)) problems.push(`${rel}: imports a stylesheet`)
    if (/tailwind|styled-components|@emotion|@stitches/i.test(src)) problems.push(`${rel}: styling framework reference`)
    if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(src)) problems.push(`${rel}: color literal`)
    if (/--[a-z][\w-]*\s*:/.test(src)) problems.push(`${rel}: CSS custom property / theme token`)
    for (const name of new Set([...src.matchAll(STYLE_PROPERTY_ALL)].map((m) => m[1]))) {
      problems.push(`${rel}: visual style property "${name}"`)
    }
    if (/from\s+['"][^'"]*presentations\//.test(src)) problems.push(`${rel}: imports presentation-specific code`)
  }
  return problems
}
