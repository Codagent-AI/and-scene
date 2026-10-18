import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, symlinkSync } from 'node:fs'
import net from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const repoRoot = path.resolve(import.meta.dirname, '../..')
export const scaffoldCli = path.join(repoRoot, 'skills/presentation/scripts/scaffold.mjs')

export const tempDir = (prefix) => mkdtempSync(path.join(tmpdir(), prefix))

export function sh(command, args, cwd, env = {}) {
  const r = spawnSync(command, args, { cwd, encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024 })
  return { status: r.status, output: `${r.stdout}${r.stderr}` }
}

export const linkModules = (dir) => symlinkSync(path.join(repoRoot, 'node_modules'), path.join(dir, 'node_modules'), 'dir')

/** Disposable copy of the repository app (no dependencies, history, tests or skill). */
export function copyRepo() {
  const dir = tempDir('and-scene-copy-')
  const skip = /(^|\/)(node_modules|dist|\.git|\.inspection|tests|skills|openspec|validator_logs|\.agent-runner|\.validator)(\/|$)/
  cpSync(repoRoot, dir, { recursive: true, filter: (src) => !skip.test(path.relative(repoRoot, src)) })
  linkModules(dir)
  return dir
}

export function portIsClosed(port) {
  return new Promise((resolve) => {
    const socket = net.connect(port, '127.0.0.1')
    socket.once('connect', () => (socket.destroy(), resolve(false)))
    socket.once('error', () => resolve(true))
  })
}

export function freePort() {
  return new Promise((resolve) => {
    const s = net.createServer().listen(0, '127.0.0.1', () => {
      const { port } = s.address()
      s.close(() => resolve(port))
    })
  })
}
