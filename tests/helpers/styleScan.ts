/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

export interface StyleScanResult {
  /** Stylesheet files of any flavour. */
  cssFiles: string[]
  /** Any mention of Tailwind (dependency, config, import, class plugin). */
  tailwind: string[]
  /** CSS custom-property theme tokens (`--foo:` declarations or `var(--foo)` reads). */
  tokens: string[]
  /** Inline style properties that are visual styling rather than geometry or motion. */
  inlineStyle: string[]
}

const STYLESHEET = /\.(css|scss|sass|less|styl|pcss|postcss)$/i
const SOURCE = /\.(tsx?|jsx?|mjs|cjs|json|html)$/i
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.inspection'])

/** Style properties a reusable kit or scaffold must not set inline. */
const FORBIDDEN_PROP =
  /\b(color|background\w*|font\w*|border(?!Box)\w*|boxShadow|textShadow|dropShadow|outline\w*|letterSpacing|lineHeight|textDecoration\w*|textTransform|filter|backdropFilter|gap|rowGap|columnGap|accentColor|caretColor|fill|stroke)\s*:/g
/** Spacing is only allowed as a zero reset. */
const SPACING_PROP = /\b(padding\w*|margin\w*)\s*:\s*([^,}\n]+)/g

function walk(dir: string, out: string[]): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
}

function isZero(value: string): boolean {
  return /^\s*['"`]?0(px)?(\s+0(px)?)*['"`]?\s*$/.test(value)
}

/** Scan every file under `root` (not node_modules/dist) for prohibited styling. */
export function scanForStyling(root: string): StyleScanResult {
  const result: StyleScanResult = { cssFiles: [], tailwind: [], tokens: [], inlineStyle: [] }
  for (const file of walk(root, [])) {
    const rel = relative(root, file)
    if (STYLESHEET.test(file)) {
      result.cssFiles.push(rel)
      continue
    }
    if (!SOURCE.test(file)) continue
    const raw = readFileSync(file, 'utf8')
    if (/tailwind/i.test(raw)) result.tailwind.push(rel)
    const isCode = /\.(tsx?|jsx?|mjs|cjs)$/i.test(file)
    const text = isCode ? stripComments(raw) : raw
    const lines = text.split('\n')
    lines.forEach((line, i) => {
      const where = `${rel}:${i + 1}: ${line.trim()}`
      if (/var\(\s*--|(^|[\s'"`{,(])--[a-z][\w-]*\s*['"`]?\s*:/i.test(line)) result.tokens.push(where)
      if (!isCode) return
      FORBIDDEN_PROP.lastIndex = 0
      if (FORBIDDEN_PROP.test(line)) result.inlineStyle.push(where)
      for (const match of line.matchAll(SPACING_PROP)) {
        if (!isZero(match[2] ?? '')) result.inlineStyle.push(where)
      }
    })
  }
  return result
}

/** True when the scan found nothing. */
export function isStyleClean(result: StyleScanResult): boolean {
  return Object.values(result).every((list) => list.length === 0)
}
