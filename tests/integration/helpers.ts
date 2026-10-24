import { spawn, spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const repo = path.resolve(import.meta.dirname, '../..')

const SKIP = new Set(['node_modules', 'dist', '.git', 'inspection', 'validator_logs', 'tests'])

/** Disposable copy of the repository that reuses the source checkout's node_modules. */
export function copyRepo(): string {
  const dest = mkdtempSync(path.join(tmpdir(), 'and-scene-copy-'))
  cpSync(repo, dest, {
    recursive: true,
    filter: (src) => !SKIP.has(path.basename(src)) || path.dirname(src) !== repo,
  })
  symlinkSync(path.join(repo, 'node_modules'), path.join(dest, 'node_modules'), 'dir')
  return dest
}

export interface RunResult {
  code: number
  output: string
}

export function exec(cmd: string, args: string[], cwd: string, timeoutMs = 280_000): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs)
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code: code ?? 1, output })
    })
  })
}

export function edit(file: string, from: string | RegExp, to: string) {
  const text = readFileSync(file, 'utf8')
  const next = text.replace(from, to)
  if (next === text) throw new Error(`edit did not change ${file}`)
  writeFileSync(file, next)
}

/** Command lines of processes whose command mentions `needle` (to prove cleanup). */
export function processesMatching(needle: string): string[] {
  const ps = spawnSync('ps', ['-eo', 'args'], { encoding: 'utf8' }).stdout
  return ps.split('\n').filter((l) => l.includes(needle))
}
