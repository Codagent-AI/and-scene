import { spawnSync, type SpawnSyncOptions } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

export const repoRoot = path.resolve(import.meta.dirname, '../..')

const dirs: string[] = []
export function tmpDir(prefix: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`))
  dirs.push(dir)
  return dir
}
export function cleanupTmpDirs() {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
}

export function run(command: string, args: string[], options: SpawnSyncOptions = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 540_000, ...options })
  return { status: result.status, stdout: String(result.stdout ?? ''), stderr: String(result.stderr ?? ''), output: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

const SKIP = new Set(['node_modules', 'dist', '.git', '.inspection', 'openspec', 'validator_logs', '.agent-runner', '.validator'])

/** A throwaway copy of the repository that shares (but never writes into) its installed dependencies. */
export function copyRepo(prefix: string) {
  const dest = tmpDir(prefix)
  fs.cpSync(repoRoot, dest, { recursive: true, filter: (src) => !SKIP.has(path.basename(src)) || src === repoRoot })
  const modules = path.join(dest, 'node_modules')
  fs.mkdirSync(modules)
  for (const entry of fs.readdirSync(path.join(repoRoot, 'node_modules'))) {
    if (entry.startsWith('.') && entry !== '.bin') continue
    fs.symlinkSync(path.join(repoRoot, 'node_modules', entry), path.join(modules, entry))
  }
  return dest
}

export const edit = (file: string, transform: (source: string) => string) => {
  const before = fs.readFileSync(file, 'utf8')
  const after = transform(before)
  if (after === before) throw new Error(`edit changed nothing in ${file}`)
  fs.writeFileSync(file, after)
}

export function isListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
  })
}

/** Ports of every preview server announced in verification or inspection output. */
export const previewPorts = (output: string) => [...output.matchAll(/--host 127\.0\.0\.1 --port (\d+)/g)].map((m) => Number(m[1]))
