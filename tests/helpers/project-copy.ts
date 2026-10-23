import { cpSync, mkdirSync, readdirSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'

export const REPO = join(__dirname, '..', '..')

const COPIED = [
  'package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json',
  'tsconfig.node.json', 'tsconfig.test.json', 'verify.config.json', 'eslint.config.js', 'public', 'src', 'scripts', 'tests/types',
]

/**
 * An isolated copy of the repository (sources only). `node_modules` is rebuilt from symlinks so
 * the copy can build without sharing tsc's incremental state with the source checkout.
 */
export function copyProject(dest: string) {
  mkdirSync(dest, { recursive: true })
  for (const entry of COPIED) cpSync(join(REPO, entry), join(dest, entry), { recursive: true })
  const modules = join(dest, 'node_modules')
  mkdirSync(modules)
  for (const name of readdirSync(join(REPO, 'node_modules'))) {
    if (name === '.tmp' || name === '.vite' || name === '.vite-temp') continue
    symlinkSync(join(REPO, 'node_modules', name), join(modules, name))
  }
}

export interface RunResult {
  status: number | null
  stdout: string
  stderr: string
}

export function run(cmd: string, args: string[], cwd: string, timeoutMs = 300_000): RunResult {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: timeoutMs, env: { ...process.env, CI: '1' } })
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

/** True when any process still references `dir` on its command line (a leaked preview server). */
export function hasLeakedProcess(dir: string): boolean {
  return spawnSync('pgrep', ['-f', dir]).status === 0
}

export { spawn }
