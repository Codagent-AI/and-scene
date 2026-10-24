import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

/** Runs a command and resolves with its exit code and combined output (never rejects). */
export function run(command, args, { cwd, env, timeoutMs = 240_000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs)
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code: code ?? 1, stdout, stderr, output: stdout + stderr })
    })
  })
}

/**
 * Gives `dest` its own node_modules directory whose entries link to the shared install, so
 * caches and TypeScript build info written during a build stay private to the copy.
 */
export function linkNodeModules(sharedNodeModules, dest) {
  const target = path.join(dest, 'node_modules')
  fs.mkdirSync(target, { recursive: true })
  for (const name of fs.readdirSync(sharedNodeModules)) {
    if (name === '.tmp' || name === '.vite') continue
    fs.symlinkSync(path.join(sharedNodeModules, name), path.join(target, name))
  }
}

const SKIP = new Set(['node_modules', 'dist', '.git', '.inspection', 'validator_logs'])

/** Copies a project tree without dependencies, build output, or git data, and links node_modules. */
export function copyProject(src, dest) {
  fs.cpSync(src, dest, { recursive: true, filter: (file) => !SKIP.has(path.basename(file)) })
  linkNodeModules(path.join(src, 'node_modules'), dest)
  return dest
}

export function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' })
    socket.once('connect', () => (socket.destroy(), resolve(true)))
    socket.once('error', () => resolve(false))
  })
}

export function previewPort(output) {
  const match = output.match(/preview http:\/\/127\.0\.0\.1:(\d+)/)
  return match ? Number(match[1]) : null
}

export function edit(file, transform) {
  const before = fs.readFileSync(file, 'utf8')
  const after = transform(before)
  if (after === before) throw new Error(`edit did not change ${file}`)
  fs.writeFileSync(file, after)
}
