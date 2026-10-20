import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ROOT } from './repo.ts'

const SKIP = new Set(['node_modules', '.git', 'dist', 'inspection', 'test-results', 'skills', 'openspec', '.agent-runner', 'validator_logs', '.validator'])

/** An independent throwaway copy of the repository that shares installed packages without sharing build caches. */
export function copyRepo(): string {
  const dir = join(mkdtempSync(join(tmpdir(), 'and-scene-e2e-')), 'repo')
  cpSync(ROOT, dir, { recursive: true, filter: (src) => !SKIP.has(src.slice(ROOT.length + 1).split('/')[0]) })
  mkdirSync(join(dir, 'node_modules'))
  for (const entry of readdirSync(join(ROOT, 'node_modules'))) {
    if (entry === '.tmp' || entry === '.vite') continue
    symlinkSync(join(ROOT, 'node_modules', entry), join(dir, 'node_modules', entry))
  }
  return dir
}

export const edit = (dir: string, file: string, change: (source: string) => string) =>
  writeFileSync(join(dir, file), change(readFileSync(join(dir, file), 'utf8')))

export const append = (dir: string, file: string, text: string) => appendFileSync(join(dir, file), text)
