import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { inflateSync } from 'node:zlib'

export const repoRoot = path.resolve(import.meta.dirname, '..', '..')

export interface RunResult {
  code: number
  output: string
}

export function run(cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): Promise<RunResult> {
  return new Promise((resolve) => {
    // vitest sets NODE_ENV=test, which would make `vite build` emit a development bundle
    const inherited = { ...process.env }
    delete inherited.NODE_ENV
    const child = spawn(cmd, args, { cwd, env: { ...inherited, ...env } })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

const COPIED = [
  'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json',
  'vite.config.ts', 'index.html', 'eslint.config.js', 'verify.config.json', 'src', 'scripts', 'public',
]

/** A throwaway copy of the app that shares the repository's installed dependencies. */
export async function copyApp(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'and-scene-copy-'))
  for (const entry of COPIED) {
    await cp(path.join(repoRoot, entry), path.join(dir, entry), {
      recursive: true,
      filter: (source) => !source.includes(`${path.sep}__tests__`),
    })
  }
  await symlink(path.join(repoRoot, 'node_modules'), path.join(dir, 'node_modules'))
  return dir
}

export const removeApp = (dir: string) => rm(dir, { recursive: true, force: true })

export async function editFile(dir: string, rel: string, edit: (text: string) => string) {
  const file = path.join(dir, rel)
  await writeFile(file, edit(await readFile(file, 'utf8')))
}

export async function addFile(dir: string, rel: string, text: string) {
  await mkdir(path.dirname(path.join(dir, rel)), { recursive: true })
  await writeFile(path.join(dir, rel), text)
}

/** Whether any process still runs a command line that mentions the directory. */
export async function leftoverProcesses(dir: string): Promise<string> {
  const { output } = await run('pgrep', ['-af', dir], os.tmpdir())
  return output
    .split('\n')
    .filter((line) => line && !line.includes('pgrep'))
    .join('\n')
}

/** Reads one pixel from a non-interlaced 8-bit RGB/RGBA PNG. */
export function pixelAt(png: Buffer, x: number, y: number): [number, number, number] {
  const width = png.readUInt32BE(16)
  const channels = png[25] === 6 ? 4 : 3
  const chunks: Buffer[] = []
  for (let offset = 8; offset < png.length; ) {
    const length = png.readUInt32BE(offset)
    if (png.toString('ascii', offset + 4, offset + 8) === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + length))
    offset += 12 + length
  }
  const raw = inflateSync(Buffer.concat(chunks))
  const stride = width * channels
  let previous = Buffer.alloc(stride)
  for (let row = 0; row <= y; row++) {
    const filter = raw[row * (stride + 1)]
    const line = Buffer.from(raw.subarray(row * (stride + 1) + 1, (row + 1) * (stride + 1)))
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? line[i - channels] : 0
      const up = previous[i]
      const upLeft = i >= channels ? previous[i - channels] : 0
      const paeth = () => {
        const p = left + up - upLeft
        const [pa, pb, pc] = [Math.abs(p - left), Math.abs(p - up), Math.abs(p - upLeft)]
        return pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft
      }
      const add = [0, left, up, (left + up) >> 1, paeth()][filter]
      line[i] = (line[i] + add) & 255
    }
    if (row === y) return [line[x * channels], line[x * channels + 1], line[x * channels + 2]]
    previous = line
  }
  throw new Error('pixel out of range')
}
