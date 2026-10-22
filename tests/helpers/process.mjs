import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

export const repoRoot = path.resolve(import.meta.dirname, '..', '..')

export function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`))
}

/** Runs a command to completion and returns its status and combined output. */
export function run(command, args, { cwd, env, timeout = 540_000 } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    timeout,
    maxBuffer: 64 * 1024 * 1024,
  })
  return { status: result.status, out: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

/** Copies the source files a throwaway app needs and links the repository's dependencies. */
export function copyAppFiles(from, to, { files, dirs, skipTests = true }) {
  fs.mkdirSync(to, { recursive: true })
  for (const file of files) if (fs.existsSync(path.join(from, file))) fs.copyFileSync(path.join(from, file), path.join(to, file))
  for (const dir of dirs) {
    if (!fs.existsSync(path.join(from, dir))) continue
    fs.cpSync(path.join(from, dir), path.join(to, dir), {
      recursive: true,
      filter: (src) => !(skipTests && /(__tests__|\.test\.[tj]sx?$)/.test(src)),
    })
  }
}

export function linkDependencies(app) {
  fs.symlinkSync(path.join(repoRoot, 'node_modules'), path.join(app, 'node_modules'), 'dir')
}

/** True when something accepts TCP connections on the loopback port. */
export function isListening(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
  })
}

export function previewPortFrom(output) {
  const match = /preview: http:\/\/127\.0\.0\.1:(\d+)\//.exec(output) ?? /inspect: http:\/\/127\.0\.0\.1:(\d+)\//.exec(output)
  return match ? Number(match[1]) : null
}

export function leftoverPreviews(port) {
  const { out } = run('pgrep', ['-fa', `vite.js preview .*--port ${port}`])
  return out.split('\n').filter((line) => line && !line.includes('pgrep'))
}
