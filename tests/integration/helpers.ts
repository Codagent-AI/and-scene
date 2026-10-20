import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, symlinkSync } from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

export const repoRoot = process.cwd()

export interface RunResult {
  status: number | null
  output: string
}

export function run(cmd: string, args: string[], cwd: string, timeoutMs = 280_000): RunResult {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 })
  return { status: r.status, output: `${r.stdout ?? ''}${r.stderr ?? ''}` }
}

export const tmpDir = (prefix: string) => mkdtempSync(path.join(os.tmpdir(), prefix))

const COPIED = [
  'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts',
  'index.html', 'eslint.config.js', '.npmrc', '.gitignore', 'public', 'src', 'scripts',
]

/**
 * A disposable copy of the repository that can build and verify on its own.
 * node_modules is a real directory of symlinks, so each copy keeps its own
 * TypeScript build cache and the source checkout is never written to.
 */
export function copyRepo(): string {
  const dir = tmpDir('and-scene-copy-')
  // Unit tests are not part of the shipped app; leaving them out keeps injected faults isolated.
  const skipTests = (src: string) => !/\.test\.(ts|tsx)$/.test(src) && !src.includes('__fixtures__')
  for (const entry of COPIED) {
    cpSync(path.join(repoRoot, entry), path.join(dir, entry), { recursive: true, filter: skipTests })
  }
  mkdirSync(path.join(dir, 'node_modules'))
  for (const name of readdirSync(path.join(repoRoot, 'node_modules'))) {
    if (['.tmp', '.vite', '.cache'].includes(name)) continue
    symlinkSync(path.join(repoRoot, 'node_modules', name), path.join(dir, 'node_modules', name))
  }
  return dir
}

export const exists = (...p: string[]) => existsSync(path.join(...p))

/** Resolves true when something accepts connections on the loopback port. */
export const canConnect = (port: number) =>
  new Promise<boolean>((resolve) => {
    const s = net.connect(port, '127.0.0.1')
    s.once('connect', () => (s.destroy(), resolve(true)))
    s.once('error', () => resolve(false))
  })

export const previewPort = (output: string): number => {
  const m = /preview http:\/\/127\.0\.0\.1:(\d+)\//.exec(output)
  if (!m) throw new Error(`no preview URL in output:\n${output}`)
  return Number(m[1])
}
