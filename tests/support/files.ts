import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

export function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    return e.isDirectory() ? (e.name === 'node_modules' || e.name === 'dist' ? [] : walk(full)) : [full]
  })
}

export const read = (file: string) => readFileSync(file, 'utf8')
export const exists = (file: string) => statSync(file, { throwIfNoEntry: false }) !== undefined

/** Relative path -> contents for every file under dir. */
export function tree(dir: string): Record<string, string> {
  return Object.fromEntries(walk(dir).map((f) => [path.relative(dir, f), readFileSync(f, 'utf8')]))
}
