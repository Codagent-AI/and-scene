import { spawn } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { createConnection } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

const COPIED = [
  'package.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'index.html',
  'public',
  'src',
  'scripts',
  'verify.config.json',
]

/** A throwaway copy of the repository app that shares the repo's installed node_modules. */
export function copyProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'and-scene-copy-'))
  for (const name of COPIED) cpSync(join(REPO, name), join(dir, name), { recursive: true })
  writeFileSync(
    join(dir, 'tsconfig.json'),
    JSON.stringify({ files: [], references: [{ path: './tsconfig.app.json' }, { path: './tsconfig.node.json' }] }),
  )
  symlinkSync(join(REPO, 'node_modules'), join(dir, 'node_modules'), 'dir')
  return dir
}

/** Rewrites a file in a project copy; throws if the expected text is not there. */
export function edit(dir: string, file: string, from: string | RegExp, to: string): void {
  const path = join(dir, file)
  const before = readFileSync(path, 'utf8')
  const after = before.replace(from, to)
  if (after === before) throw new Error(`fault injection did not change ${file}`)
  writeFileSync(path, after)
}

export function exists(dir: string, file: string): boolean {
  return existsSync(join(dir, file))
}

export interface RunResult {
  code: number | null
  stdout: string
  stderr: string
}

export function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): Promise<RunResult> {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env } })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('close', (code) => resolvePromise({ code, stdout, stderr }))
  })
}

/** Resolves true when something accepts connections on the loopback port. */
export function isListening(port: number): Promise<boolean> {
  return new Promise((resolvePromise) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    socket.once('connect', () => (socket.destroy(), resolvePromise(true)))
    socket.once('error', () => resolvePromise(false))
  })
}

export function previewPort(output: string): number | null {
  const match = output.match(/preview http:\/\/127\.0\.0\.1:(\d+)/)
  return match ? Number(match[1]) : null
}
