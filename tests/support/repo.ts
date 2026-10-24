import { execFileSync, spawn } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

export const REPO = path.resolve(import.meta.dirname, '..', '..')
const made: string[] = []

export function tempDir(prefix: string) {
  const dir = mkdtempSync(path.join(os.tmpdir(), `and-scene-${prefix}-`))
  made.push(dir)
  return dir
}

export function cleanupTempDirs() {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true })
}

/** Link the source checkout's installed packages into a copy, keeping build caches private. */
export function linkNodeModules(into: string) {
  const dest = path.join(into, 'node_modules')
  mkdirSync(path.join(dest, '.tmp'), { recursive: true })
  const src = path.join(REPO, 'node_modules')
  for (const name of readdirSync(src)) {
    if (name === '.tmp') continue
    symlinkSync(path.join(src, name), path.join(dest, name))
  }
}

/** A disposable copy of the repository's working tree (tracked and untracked, not ignored). */
export function copyRepo(prefix: string) {
  const dir = tempDir(prefix)
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: REPO, encoding: 'utf8' })
    .split('\n')
    .filter((f) => f && existsSync(path.join(REPO, f)))
  for (const f of files) {
    mkdirSync(path.dirname(path.join(dir, f)), { recursive: true })
    cpSync(path.join(REPO, f), path.join(dir, f))
  }
  linkNodeModules(dir)
  return dir
}

export const edit = (file: string, fn: (src: string) => string) => {
  const before = readFileSync(file, 'utf8')
  const after = fn(before)
  if (after === before) throw new Error(`edit changed nothing in ${file}`)
  writeFileSync(file, after)
}

export interface RunResult {
  code: number | null
  stdout: string
  stderr: string
}

export function run(command: string, args: string[], opts: { cwd: string; env?: NodeJS.ProcessEnv }): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: opts.cwd, env: { ...process.env, ...opts.env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('error', (err) => resolve({ code: -1, stdout, stderr: stderr + String(err) }))
    child.on('exit', (code) => resolve({ code, stdout, stderr }))
  })
}

/** True when something accepts connections on 127.0.0.1:port. */
export function isListening(port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port })
    socket.once('connect', () => (socket.destroy(), resolve(true)))
    socket.once('error', () => resolve(false))
  })
}

export const previewPort = (output: string) => {
  const m = output.match(/preview ready at http:\/\/127\.0\.0\.1:(\d+)/)
  return m ? Number(m[1]) : undefined
}
