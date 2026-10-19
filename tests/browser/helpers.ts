import { spawn } from 'node:child_process'
import { cpSync, mkdtempSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

export const REPO_ROOT = resolve(import.meta.dirname, '..', '..')

const COPY_SKIP = new Set(['node_modules', 'dist', '.git', '.inspection', 'validator_logs', '.validator', '.agent-runner'])

/** Copies the working tree (without node_modules/dist/.git) to a fresh temp dir and links node_modules. */
export function copyProject(prefix = 'and-scene-'): string {
  const dest = mkdtempSync(join(tmpdir(), prefix))
  cpSync(REPO_ROOT, dest, {
    recursive: true,
    filter: (src) => !COPY_SKIP.has(src.slice(REPO_ROOT.length + 1).split('/')[0]),
  })
  symlinkSync(join(REPO_ROOT, 'node_modules'), join(dest, 'node_modules'), 'dir')
  return dest
}

export interface RunResult {
  code: number | null
  stdout: string
  stderr: string
  output: string
}

/** Runs a command to completion, capturing output. Never throws on non-zero exit. */
export function run(cmd: string, args: string[], opts: { cwd: string; env?: NodeJS.ProcessEnv; timeoutMs?: number }): Promise<RunResult> {
  return new Promise((res) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, env: { ...process.env, ...opts.env } })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => child.kill('SIGKILL'), opts.timeoutMs ?? 180_000)
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('close', (code) => {
      clearTimeout(timer)
      res({ code, stdout, stderr, output: stdout + stderr })
    })
  })
}
