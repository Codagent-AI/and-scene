import { spawn } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

export const REPO = path.resolve(import.meta.dirname, '../..')

export interface RunResult {
  code: number | null
  stdout: string
  stderr: string
}

export function run(command: string, args: string[], options: { cwd: string; env?: NodeJS.ProcessEnv; timeoutMs?: number }): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, env: { ...process.env, ...options.env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error(`${command} ${args.join(' ')} timed out\n${stdout}\n${stderr}`))
    }, options.timeoutMs ?? 240_000)
    child.on('error', reject)
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, stdout, stderr })
    })
  })
}

export function tempDir(prefix: string): string {
  return mkdtempSync(path.join(os.tmpdir(), `${prefix}-`))
}

export function remove(dir: string) {
  rmSync(dir, { recursive: true, force: true })
}

const COPIED = [
  'src', 'scripts', 'public', 'index.html', 'package.json', 'vite.config.ts', 'tsconfig.app.json',
  'tsconfig.node.json', 'presentation.config.json', 'eslint.config.js',
]

/**
 * A throwaway copy of the application that shares the repository's installed
 * dependencies. The source checkout is never modified.
 */
export function copyProject(): string {
  const dest = tempDir('and-scene-copy')
  for (const item of COPIED) cpSync(path.join(REPO, item), path.join(dest, item), { recursive: true })
  writeFileSync(
    path.join(dest, 'tsconfig.json'),
    JSON.stringify({ files: [], references: [{ path: './tsconfig.app.json' }, { path: './tsconfig.node.json' }] }),
  )
  symlinkSync(path.join(REPO, 'node_modules'), path.join(dest, 'node_modules'), 'dir')
  return dest
}

export function write(dir: string, rel: string, text: string) {
  mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  writeFileSync(path.join(dir, rel), text)
}

/** True when something accepts connections on the IPv4 loopback port. */
export function isListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port })
    socket.once('connect', () => (socket.destroy(), resolve(true)))
    socket.once('error', () => resolve(false))
  })
}

export function previewPort(output: string): number | null {
  const m = output.match(/\[render\] preview http:\/\/127\.0\.0\.1:(\d+)\//)
  return m ? Number(m[1]) : null
}

/** True while a process with this pid exists. */
export function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export function previewPid(output: string): number | null {
  const m = output.match(/\[render\] preview http:\/\/127\.0\.0\.1:\d+\/ pid=(\d+)/)
  return m ? Number(m[1]) : null
}
