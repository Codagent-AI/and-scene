// Shared style-boundary rules. The unit contract test and the materialized-bootstrap integration
// test both scan kit source with these, so the two cannot drift apart.
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** Inline style properties the kit may set: placement, geometry, transforms, and overflow. */
export const ALLOWED_STYLE = new Set([
  'position',
  'left',
  'top',
  'right',
  'bottom',
  'inset',
  'width',
  'height',
  'min-width',
  'min-height',
  'transform',
  'transform-origin',
  'display',
  'flex',
  'flex-direction',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'align-items',
  'justify-content',
  'overflow',
  'pointer-events',
  'z-index',
  'white-space',
  'text-overflow',
  // Motion writes opacity while an entry or exit runs. It is animation state, not a visual default.
  'opacity',
])

/** Forbidden anywhere in kit source: visual declarations, style files, and framework hooks. */
export const FORBIDDEN_IN_SOURCE = [
  /\b(color|background\w*|border\w*|font\w*|box-?[Ss]hadow|outline\w*|textShadow|text-shadow|filter|padding\w*|margin\w*|gap|rowGap|columnGap|borderRadius)\s*:/,
  /\bstroke(Width|-width)?\s*[:=]/,
  /\bfill\s*[:=]/,
  /\.css['"]/,
  /tailwind/i,
  /--[a-z][\w-]*\s*:/,
]

/** Every non-test kit source file under `dir`. */
export function kitSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return entry === '__tests__' ? [] : kitSourceFiles(path)
    return /\.(ts|tsx)$/.test(entry) && !/\.test\./.test(entry) ? [path] : []
  })
}
