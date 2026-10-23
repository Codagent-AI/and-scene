import { execFileSync, spawn } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync } from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { ROOT } from './spec-outline'

export interface RunResult {
  code: number | null
  stdout: string
  stderr: string
}

export function run(command: string, args: string[], options: { cwd: string; timeoutMs?: number; env?: NodeJS.ProcessEnv }): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, env: { ...process.env, ...options.env, CI: '1' }, stdio: ['ignore', 'pipe', 'pipe'], detached: true })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    // Kill the whole process group so a timed-out run leaves no build or browser behind.
    const timer = setTimeout(() => process.kill(-child.pid!, 'SIGKILL'), options.timeoutMs ?? 300000)
    child.on('error', reject)
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, stdout, stderr })
    })
  })
}

const created: string[] = []
export function tmpDir(prefix: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), `${prefix}-`))
  created.push(dir)
  return dir
}
export function cleanupTmp() {
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true })
}

/**
 * A disposable copy of the repository (working tree, not .git) whose
 * node_modules entries are symlinked, so builds run without a reinstall.
 */
export function copyRepo(prefix: string): string {
  const dest = tmpDir(prefix)
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)
  for (const f of files) {
    if (!existsSync(path.join(ROOT, f))) continue
    mkdirSync(path.dirname(path.join(dest, f)), { recursive: true })
    cpSync(path.join(ROOT, f), path.join(dest, f))
  }
  const nm = path.join(dest, 'node_modules')
  mkdirSync(nm)
  for (const name of readdirSync(path.join(ROOT, 'node_modules'))) {
    if (name === '.tmp' || name === '.vite' || name === '.vite-temp') continue
    symlinkSync(path.join(ROOT, 'node_modules', name), path.join(nm, name))
  }
  return dest
}

export function portIsClosed(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port })
    socket.once('connect', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => resolve(true))
  })
}

/** Command lines of processes whose arguments mention `marker` (e.g. a browser using our TMPDIR). */
export function processesMentioning(marker: string): string[] {
  const out = execFileSync('ps', ['-eo', 'pid,args'], { encoding: 'utf8' })
  return out.split('\n').filter((l) => l.includes(marker) && !l.includes('ps -eo'))
}
