import { execFileSync, spawn } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync } from 'node:fs'
import net from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const REPO = path.resolve(import.meta.dirname, '../..')

export interface RunResult {
  code: number | null
  output: string
}

export function run(command: string, args: string[], opts: { cwd: string; env?: NodeJS.ProcessEnv; timeoutMs?: number }): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: opts.cwd, env: { ...process.env, ...opts.env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    const timer = setTimeout(() => child.kill('SIGKILL'), opts.timeoutMs ?? 300_000)
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, output })
    })
  })
}

export function makeTempDir(prefix: string): string {
  return mkdtempSync(path.join(tmpdir(), prefix))
}

export function remove(dir: string) {
  rmSync(dir, { recursive: true, force: true })
}

const SKIP = new Set(['node_modules', 'dist', '.git', '.inspection', 'validator_logs'])

/**
 * Disposable copy of the repository. `node_modules` is a real directory of symlinks to the
 * source packages so every copy keeps its own `.tmp`/`.vite` caches (shared TypeScript build
 * info would otherwise hide edits made in a sibling copy).
 */
export function copyRepo(): string {
  const dest = makeTempDir('and-scene-copy-')
  cpSync(REPO, dest, { recursive: true, filter: (src) => !SKIP.has(path.basename(src)) || src === REPO })
  mkdirSync(path.join(dest, 'node_modules'))
  for (const name of readdirSync(path.join(REPO, 'node_modules'))) {
    if (name === '.tmp' || name === '.vite') continue
    symlinkSync(path.join(REPO, 'node_modules', name), path.join(dest, 'node_modules', name))
  }
  return dest
}

/** True when something accepts connections on the IPv4 loopback port. */
export function isListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
  })
}

/** Process-group ids of every preview this output says it started. */
export function previewPids(output: string): number[] {
  return [...output.matchAll(/\[preview\] pid (\d+) \(process group\)/g)].map((m) => Number(m[1]))
}

/** True while any non-zombie process of the group (the preview and its npx/vite children) exists. */
export function groupAlive(pid: number): boolean {
  const table = execFileSync('ps', ['-eo', 'pgid=,stat='], { encoding: 'utf8' })
  return table.split('\n').some((line) => {
    const [pgid, stat = ''] = line.trim().split(/\s+/)
    return Number(pgid) === pid && !stat.startsWith('Z')
  })
}

/** Ports of every preview this output says it started. */
export function previewPorts(output: string): number[] {
  return [...output.matchAll(/waiting for http:\/\/127\.0\.0\.1:(\d+)\//g)].map((m) => Number(m[1]))
}
