import { spawn } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync } from 'node:fs'
import { connect } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const ROOT = join(__dirname, '..')
export const BOOTSTRAP = join(ROOT, 'skills/presentation/templates/bootstrap')

const created: string[] = []

export function tempDir(prefix = 'and-scene-'): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  created.push(dir)
  return dir
}

export function cleanupTempDirs() {
  for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true })
}

/** A real node_modules directory of symlinks, so each copy keeps its own `.tmp` build cache. */
export function linkNodeModules(dest: string, from = join(ROOT, 'node_modules')) {
  const target = join(dest, 'node_modules')
  mkdirSync(target, { recursive: true })
  for (const name of readdirSync(from)) {
    if (name === '.tmp' || name === '.vite' || name === '.vite-temp') continue
    symlinkSync(join(from, name), join(target, name))
  }
}

const APP_ENTRIES = ['src', 'scripts', 'public', 'index.html', 'package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js']

/** Copies the runnable parts of the app (not dependencies or build output) from the repository. */
export function copyApp(dest: string, from = ROOT) {
  mkdirSync(dest, { recursive: true })
  for (const entry of APP_ENTRIES) {
    cpSync(join(from, entry), join(dest, entry), {
      recursive: true,
      filter: (path) => !/\.test\.[tj]sx?$/.test(path) && !path.includes('__tests__'),
    })
  }
}

export interface RunResult {
  code: number | null
  out: string
}

export function run(command: string, args: string[], options: { cwd: string; env?: NodeJS.ProcessEnv; timeoutMs?: number }): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: options.cwd, env: { ...process.env, ...options.env, FORCE_COLOR: '0' } })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    const timer = setTimeout(() => child.kill('SIGKILL'), options.timeoutMs ?? 300_000)
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, out })
    })
  })
}

export function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ port, host: '127.0.0.1' })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
  })
}

/** Command lines of live processes that mention `marker` (for leftover preview/browser checks). */
export async function leftoverProcesses(marker: string): Promise<string[]> {
  const { out } = await run('ps', ['-eo', 'args'], { cwd: ROOT })
  return out.split('\n').filter((line) => line.includes(marker))
}

/** Port the preview announced in verify/inspect output. */
export function previewPort(output: string): number | null {
  const match = /--port (\d+)/.exec(output)
  return match ? Number(match[1]) : null
}

/** Width and height from a PNG's IHDR chunk; throws if the bytes are not a PNG. */
export function pngSize(bytes: Buffer): { width: number; height: number } {
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('not a PNG')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}
