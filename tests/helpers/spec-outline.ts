import { readFileSync } from 'node:fs'
import path from 'node:path'

export const ROOT = path.resolve(__dirname, '../..')

/** The normative nine-step table, parsed from the canonical verification spec. */
export function specOutline(): { era: string; title: string; caption: string }[] {
  const spec = readFileSync(path.join(ROOT, 'openspec/changes/create-and-scene/specs/presentation-verification/spec.md'), 'utf8')
  return spec
    .split('\n')
    .filter((l) => /^\| [1-9] \|/.test(l))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
    .map(([, era, title, caption]) => ({ era, title: title.replace(/^"|"$/g, ''), caption }))
}
