import fs from 'node:fs'
import path from 'node:path'

export function walk(dir: string, filter: (file: string) => boolean = () => true): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.name === 'node_modules' || entry.name === 'dist') return []
    return entry.isDirectory() ? walk(full, filter) : filter(full) ? [full] : []
  })
}
