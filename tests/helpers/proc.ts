import { spawn } from 'node:child_process'
import { cpSync, mkdtempSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

export const REPO = resolve(import.meta.dirname, '../..')

export interface Result {
  code: number
  out: string
}

/** Run a command; resolves (never rejects) with combined output. */
export function run(cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): Promise<Result> {
  return new Promise((done) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('error', (e) => done({ code: 1, out: e.message }))
    child.on('close', (code) => done({ code: code ?? 1, out }))
  })
}

export const alive = (pid: number) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

const SKIP = new Set(['node_modules', 'dist', '.git', '.presentation-inspect', 'validator_logs', '.validator', '.agent-runner', 'openspec', 'tests'])

/** Disposable copy of the repository sources with the repository's node_modules linked in. */
export function copyRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'and-scene-copy-'))
  cpSync(REPO, dir, { recursive: true, filter: (src) => !SKIP.has(src.slice(REPO.length + 1).split('/')[0]) || src === REPO })
  symlinkSync(join(REPO, 'node_modules'), join(dir, 'node_modules'))
  return dir
}

/** The pid printed by verify ("preview ready at ... (pid N)"), if it got that far. */
export const previewPid = (out: string) => Number(/preview ready at \S+ \(pid (\d+)\)/.exec(out)?.[1]) || undefined
