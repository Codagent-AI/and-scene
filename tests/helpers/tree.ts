import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/** All files under `dir` as relative paths, sorted. */
export function listFiles(dir: string): string[] {
  const out: string[] = []
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      if (name === 'node_modules' || name === 'dist') continue
      const p = join(d, name)
      if (statSync(p).isDirectory()) walk(p)
      else out.push(relative(dir, p))
    }
  }
  walk(dir)
  return out.sort()
}

export const read = (p: string) => readFileSync(p)
export const text = (p: string) => readFileSync(p, 'utf8')
