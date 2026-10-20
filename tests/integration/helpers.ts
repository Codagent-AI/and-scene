import { spawn, execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const repoRoot = path.resolve(import.meta.dirname, '..', '..')

export function tempDir(prefix: string): string {
  return mkdtempSync(path.join(os.tmpdir(), `${prefix}-`))
}

export function removeDir(dir: string) {
  rmSync(dir, { recursive: true, force: true })
}

/**
 * A throwaway copy of the working tree (tracked and untracked, minus ignored files) whose
 * node_modules entries are symlinks to the repository's, except TypeScript's incremental cache.
 */
export function copyProject(dest: string) {
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
  for (const rel of files) {
    const from = path.join(repoRoot, rel)
    try {
      mkdirSync(path.dirname(path.join(dest, rel)), { recursive: true })
      cpSync(from, path.join(dest, rel))
    } catch {
      // file removed in the working tree but still indexed
    }
  }
  const modules = path.join(dest, 'node_modules')
  mkdirSync(modules)
  for (const name of readdirSync(path.join(repoRoot, 'node_modules'))) {
    if (name === '.tmp' || name === '.vite') continue
    symlinkSync(path.join(repoRoot, 'node_modules', name), path.join(modules, name))
  }
}

export interface RunResult {
  code: number
  output: string
}

export function exec(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (c) => (output += c))
    child.stderr.on('data', (c) => (output += c))
    child.on('error', (e) => resolve({ code: 1, output: output + e.message }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

export function alive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/** Wait briefly for a just-reaped process to disappear from the process table. */
export async function gone(pid: number, timeoutMs = 3000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (!alive(pid)) return true
    await new Promise((r) => setTimeout(r, 50))
  }
  return !alive(pid)
}

export const previewPid = (output: string): number | null => {
  const match = /preview: http:\/\/127\.0\.0\.1:\d+ \(pid (\d+)\)/.exec(output)
  return match ? Number(match[1]) : null
}
