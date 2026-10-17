import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const BOOTSTRAP = path.join(ROOT, 'skills/presentation/templates/bootstrap')

export const read = (...parts: string[]) => readFileSync(path.join(ROOT, ...parts), 'utf8')

export function walk(dir: string, filter: (file: string) => boolean = () => true): string[] {
  return readdirSync(dir, { recursive: true })
    .map(String)
    .filter((f) => !statSync(path.join(dir, f)).isDirectory() && filter(f))
    .sort()
}
