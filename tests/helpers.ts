import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const REPO = path.resolve(import.meta.dirname, '..')

/** Copies the repository (without deps/build output) into a throwaway directory. */
export function copyRepo(): string {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-copy-'))
  const skip = new Set(['node_modules', 'dist', '.git', '.inspection', 'validator_logs'])
  fs.cpSync(REPO, dest, { recursive: true, filter: (src) => !skip.has(path.basename(src)) })
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dest, 'node_modules'))
  return dest
}

export function node(cwd: string, args: string[], timeout = 240_000) {
  const r = spawnSync('node', args, { cwd, encoding: 'utf8', timeout })
  return { code: r.status, out: `${r.stdout}${r.stderr}` }
}

export function walk(dir: string, filter: (f: string) => boolean = () => true): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'node_modules' || e.name === 'dist' ? [] : walk(full, filter)
    return filter(full) ? [full] : []
  })
}

export const isTest = (f: string) => /\.test\.tsx?$/.test(f)
