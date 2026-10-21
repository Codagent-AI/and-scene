import { execFile } from 'node:child_process'
import { cp, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export interface Result {
  code: number
  output: string
}

export function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): Promise<Result> {
  return new Promise((resolve) => {
    execFile(command, args, { cwd, env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024, timeout: 280000 }, (error, stdout, stderr) => {
      const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0
      resolve({ code, output: `${stdout}${stderr}` })
    })
  })
}

export const tempDir = (prefix: string) => mkdtemp(path.join(os.tmpdir(), `${prefix}-`))

const INCLUDED = [
  'src', 'scripts', 'public', 'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json',
  'tsconfig.node.json', 'vite.config.ts', 'index.html', 'eslint.config.js',
]

/** A disposable copy of the repository that reuses the installed dependencies. */
export async function copyRepo(): Promise<string> {
  const dest = await tempDir('and-scene')
  for (const entry of INCLUDED) {
    await cp(path.join(ROOT, entry), path.join(dest, entry), {
      recursive: true,
      filter: (source) => !/\.test\.[tj]sx?$/.test(source) && !source.includes('/.presentation-inspect'),
    })
  }
  await symlink(path.join(ROOT, 'node_modules'), path.join(dest, 'node_modules'), 'dir')
  return dest
}

export async function mutate(dir: string, file: string, from: string, to: string) {
  const target = path.join(dir, file)
  const source = await readFile(target, 'utf8')
  if (!source.includes(from)) throw new Error(`fault anchor not found in ${file}: ${from}`)
  await writeFile(target, source.replace(from, to))
}

export function portIsClosed(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port })
    socket.once('connect', () => (socket.destroy(), resolve(false)))
    socket.once('error', () => resolve(true))
  })
}

export function previewPort(output: string): number {
  const match = /(?:preview:?) http:\/\/127\.0\.0\.1:(\d+)/.exec(output)
  if (!match) throw new Error(`no preview URL in output:\n${output}`)
  return Number(match[1])
}
