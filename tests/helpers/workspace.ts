import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import net from 'node:net'

export const REPO = path.resolve(import.meta.dirname, '../..')

export interface RunResult {
  code: number
  stdout: string
  stderr: string
  output: string
}

export function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr, output: stdout + stderr }))
  })
}

export async function tempDir(prefix: string): Promise<string> {
  return mkdtemp(path.join(tmpdir(), `${prefix}-`))
}

/** Gives a copy its own node_modules directory whose entries link to the repo's installed packages. */
async function linkNodeModules(dest: string) {
  const source = path.join(REPO, 'node_modules')
  const target = path.join(dest, 'node_modules')
  await mkdir(target, { recursive: true })
  for (const name of await readdir(source)) {
    if (['.tmp', '.vite', '.cache'].includes(name)) continue
    await symlink(path.join(source, name), path.join(target, name))
  }
}

/** Disposable copy of the repository's app (no tests, no git) that builds with the shared dependencies. */
export async function copyApp(prefix: string): Promise<string> {
  const dest = await tempDir(prefix)
  for (const entry of ['src', 'scripts', 'public', 'index.html', 'package.json', 'package-lock.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'eslint.config.js']) {
    await cp(path.join(REPO, entry), path.join(dest, entry), { recursive: true })
  }
  await writeFile(
    path.join(dest, 'tsconfig.json'),
    JSON.stringify({ files: [], references: [{ path: './tsconfig.app.json' }, { path: './tsconfig.node.json' }] }),
  )
  await writeFile(path.join(dest, 'tsconfig.node.json'), (await readFile(path.join(REPO, 'tsconfig.node.json'), 'utf8')).replace(/"include":.*/, '"include": ["vite.config.ts"]'))
  await linkNodeModules(dest)
  return dest
}

export async function edit(file: string, change: (text: string) => string) {
  const before = await readFile(file, 'utf8')
  const after = change(before)
  if (after === before) throw new Error(`edit did not change ${file}`)
  await writeFile(file, after)
}

export const remove = (dir: string) => rm(dir, { recursive: true, force: true })

/** True when nothing accepts connections on the IPv4 loopback port. */
export function portIsClosed(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect(port, '127.0.0.1')
    socket.once('connect', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => resolve(true))
  })
}

export function previewPort(output: string): number | undefined {
  const match = /preview http:\/\/127\.0\.0\.1:(\d+)/.exec(output)
  return match ? Number(match[1]) : undefined
}
