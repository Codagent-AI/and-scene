import { execFile } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const SKIP = new Set(['node_modules', 'dist', '.inspect', '.git', 'validator_logs'])

export interface RunResult {
  code: number
  output: string
}

export function run(cmd: string, args: string[], cwd: string): Promise<RunResult> {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd, maxBuffer: 32 * 1024 * 1024 }, (err, stdout, stderr) => {
      const code = err ? (typeof err.code === 'number' ? err.code : 1) : 0
      resolve({ code, output: `${stdout}${stderr}` })
    })
  })
}

/** Disposable copy of the project; node_modules is symlinked, the source checkout is never touched. */
export function copyProject(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'and-scene-'))
  cpSync(REPO, dir, { recursive: true, filter: (src) => !SKIP.has(path.basename(src)) || src === REPO })
  symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'))
  return dir
}

export function removeProject(dir: string) {
  rmSync(dir, { recursive: true, force: true })
}

/** Lines of `ps` output mentioning `needle` (e.g. a copy's directory) — leftover subprocesses. */
export async function processesMentioning(needle: string): Promise<string[]> {
  const { output } = await run('ps', ['-eo', 'args'], REPO)
  return output.split('\n').filter((l) => l.includes(needle) && !l.includes('ps -eo'))
}
