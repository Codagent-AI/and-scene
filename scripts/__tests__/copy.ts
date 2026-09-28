// Disposable copies of this checkout for browser-backed tests; the source tree is never mutated.
import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repo = fileURLToPath(new URL('../..', import.meta.url))
const skipped = new Set(['node_modules', '.git', 'dist', '.inspection', 'validator_logs', 'tsconfig.app.tsbuildinfo', 'tsconfig.node.tsbuildinfo'])

export function makeCopy(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), `${prefix}-`))
  cpSync(repo, dir, { recursive: true, filter: (src) => !skipped.has(basename(src)) })
  symlinkSync(join(repo, 'node_modules'), join(dir, 'node_modules'))
  return dir
}

export function run(command: string, args: string[], cwd: string, timeout = 240_000) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout })
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` }
}

/** Preview servers started from a copy carry that copy's path in their command line. */
export function leftoverPreviews(dir: string): string {
  return spawnSync('pgrep', ['-f', join(dir, 'node_modules/vite/bin/vite.js')], { encoding: 'utf8' }).stdout.trim()
}
