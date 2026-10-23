import { spawn, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

export const REPO = path.resolve(__dirname, '../..')
export const SKILL_SCRIPT = path.join(REPO, 'skills/presentation/scripts/scaffold.mjs')

const made: string[] = []

export function tempDir(prefix = 'and-scene-'): string {
  const d = mkdtempSync(path.join(os.tmpdir(), prefix))
  made.push(d)
  return d
}

export function cleanupTempDirs() {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true })
}

export interface RunResult {
  code: number | null
  out: string
}

/** Runs a command and resolves with combined output; never rejects. */
export function run(cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('error', (e) => resolve({ code: 1, out: out + String(e) }))
    child.on('close', (code) => resolve({ code, out }))
  })
}

export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.once('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address() as net.AddressInfo
      srv.close(() => resolve(port))
    })
  })
}

/** True when something accepts TCP connections on 127.0.0.1:port. */
export function isListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.connect({ host: '127.0.0.1', port })
    s.once('connect', () => (s.destroy(), resolve(true)))
    s.once('error', () => resolve(false))
  })
}

/** True when a process whose command line mentions the preview port is still alive. */
export function previewProcessAlive(port: number): boolean {
  const r = spawnSync('pgrep', ['-f', `vite.js preview .*--port ${port}`], { encoding: 'utf8' })
  return r.status === 0 && r.stdout.trim().length > 0
}

const COPY_EXCLUDE = new Set(['node_modules', 'dist', '.git', 'inspection', '.agent-runner', '.validator'])

/** Disposable copy of the repository that shares the original node_modules. */
export function copyRepo(): string {
  const dest = tempDir('and-scene-copy-')
  cpSync(REPO, dest, {
    recursive: true,
    filter: (src) => !COPY_EXCLUDE.has(path.basename(src)) || src === REPO,
  })
  symlinkSync(path.join(REPO, 'node_modules'), path.join(dest, 'node_modules'), 'dir')
  return dest
}

/** Bootstraps an empty app via the skill helper (invoked from an unrelated cwd). */
export async function materializeBootstrap(link: boolean): Promise<string> {
  const dest = tempDir('and-scene-app-')
  const elsewhere = tempDir('and-scene-cwd-')
  const r = await run(process.execPath, [SKILL_SCRIPT, 'bootstrap', dest], elsewhere)
  if (r.code !== 0) throw new Error(`bootstrap failed:\n${r.out}`)
  if (link) symlinkSync(path.join(REPO, 'node_modules'), path.join(dest, 'node_modules'), 'dir')
  return dest
}

export async function createPresentation(app: string, slug: string, title: string) {
  const elsewhere = tempDir('and-scene-cwd-')
  const r = await run(process.execPath, [SKILL_SCRIPT, 'create', app, '--slug', slug, '--title', title], elsewhere)
  if (r.code !== 0) throw new Error(`create failed:\n${r.out}`)
}

export function ensureDir(p: string) {
  mkdirSync(p, { recursive: true })
}
