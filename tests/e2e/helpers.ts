import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { ROOT } from '../unit/helpers'

export { ROOT }

export function verify(cwd: string) {
  const r = spawnSync('npm', ['run', 'verify'], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 280_000 })
  return { status: r.status, output: `${r.stdout}${r.stderr}` }
}

/** The preview the run reported starting: `preview http://127.0.0.1:PORT (pid N, port P)`. */
export function previewOf(output: string) {
  const m = output.match(/preview (http:\/\/127\.0\.0\.1:(\d+)) \(pid (\d+), port (\d+)\)/)
  return m ? { url: m[1], port: Number(m[2]), pid: Number(m[3]) } : null
}

export function pidState(pid: number): 'gone' | 'zombie' | 'running' {
  const stat = `/proc/${pid}/stat`
  if (!fs.existsSync(stat)) return 'gone'
  return fs.readFileSync(stat, 'utf8').split(') ')[1][0] === 'Z' ? 'zombie' : 'running'
}

export function portListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port })
    socket.once('connect', () => (socket.destroy(), resolve(true)))
    socket.once('error', () => resolve(false))
  })
}

const git = (...args: string[]) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

/** HEAD, tracked diff, status and untracked inventory of the source checkout. */
export function sourceSnapshot() {
  return {
    head: git('rev-parse', 'HEAD'),
    status: git('status', '--porcelain'),
    diff: git('diff', 'HEAD'),
    untracked: git('ls-files', '-o', '--exclude-standard'),
  }
}

/** An independent copy of the checkout (tracked + untracked, ignoring ignored paths). */
export function copyRepo(): string {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'and-scene-e2e-'))
  for (const rel of git('ls-files', '-co', '--exclude-standard').split('\n').filter(Boolean)) {
    const from = path.join(ROOT, rel)
    if (!fs.existsSync(from)) continue
    fs.mkdirSync(path.dirname(path.join(dest, rel)), { recursive: true })
    fs.copyFileSync(from, path.join(dest, rel))
  }
  // Share installed dependencies, but keep tool caches (e.g. tsbuildinfo) per copy.
  const nm = path.join(dest, 'node_modules')
  fs.mkdirSync(nm)
  for (const name of fs.readdirSync(path.join(ROOT, 'node_modules'))) {
    if (name === '.tmp' || name === '.vite') continue
    fs.symlinkSync(path.join(ROOT, 'node_modules', name), path.join(nm, name))
  }
  return dest
}

export function edit(dir: string, rel: string, change: (text: string) => string) {
  const file = path.join(dir, rel)
  const before = fs.readFileSync(file, 'utf8')
  const after = change(before)
  if (after === before) throw new Error(`fault did not change ${rel}`)
  fs.writeFileSync(file, after)
}
