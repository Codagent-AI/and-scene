import { spawn, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { build, preview } from 'vite'
import { chromium, type Browser, type Page } from 'playwright'

export const repoRoot = resolve(__dirname, '..', '..')

export interface Served {
  url: string
  close(): Promise<void>
}

/** Serves a built directory on 127.0.0.1 with SPA fallback. */
export async function serveDirectory(dir: string): Promise<Served> {
  const server = await preview({
    configFile: false,
    root: dir,
    logLevel: 'silent',
    build: { outDir: '.' },
    preview: { host: '127.0.0.1', port: 0, strictPort: false },
  })
  const url = (server.resolvedUrls?.local[0] ?? '').replace(/\/$/, '')
  return { url, close: () => server.close() }
}

export async function buildMotionFixtures(): Promise<string> {
  await build({ configFile: join(repoRoot, 'tests/fixtures/vite.config.ts'), logLevel: 'silent' })
  return join(repoRoot, '.fixture-dist', 'motion')
}

export async function launch(): Promise<Browser> {
  return chromium.launch()
}

export interface Frame {
  t: number
  els: Record<string, { x: number; y: number; w: number; h: number; op: number }[]>
}

/** Installs a requestAnimationFrame sampler reporting canvas-relative geometry per entity. */
export async function installSampler(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>
    w.__sample = (ids: string[], ms: number) =>
      new Promise<Frame[]>((done) => {
        const frames: Frame[] = []
        const t0 = performance.now()
        const effective = (el: Element) => {
          let opacity = 1
          for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) {
            opacity *= Number(getComputedStyle(n).opacity)
          }
          return opacity
        }
        const measure = () => {
          const t = performance.now() - t0
          const canvas = document.querySelector('[data-presentation-canvas]')!
          const box = canvas.getBoundingClientRect()
          const scale = box.width / canvas.clientWidth
          const els: Frame['els'] = {}
          for (const id of ids) {
            els[id] = [...document.querySelectorAll(`[data-presentation-entity="${id}"]`)].map((el) => {
              const r = el.getBoundingClientRect()
              return {
                x: (r.left - box.left) / scale,
                y: (r.top - box.top) / scale,
                w: r.width / scale,
                h: r.height / scale,
                op: effective(el),
              }
            })
          }
          frames.push({ t, els })
          if (t < ms) tick()
          else done(frames)
        }
        // measure in a task after the frame so Motion's own render step has been applied
        const tick = () => requestAnimationFrame(() => setTimeout(measure, 0))
        measure()
      })
  })
}

export async function sampleDuring(page: Page, ids: string[], action: () => Promise<void>, ms = 1600) {
  const pending = page.evaluate(([list, duration]) => (window as unknown as { __sample(i: string[], m: number): Promise<Frame[]> }).__sample(list as string[], duration as number), [ids, ms] as const)
  await action()
  return pending
}

export interface Workspace {
  dir: string
  cleanup(): void
}

/** Disposable copy of the repository (sources only) sharing the original dependencies. */
export function copyRepository(): Workspace {
  const dir = mkdtempSync(join(tmpdir(), 'and-scene-copy-'))
  const skip = new Set(['node_modules', 'dist', '.git', '.inspection', '.fixture-dist', 'validator_logs', '.agent-runner'])
  cpSync(repoRoot, dir, {
    recursive: true,
    filter: (source) => !skip.has(source.slice(repoRoot.length + 1).split('/')[0]),
  })
  symlinkSync(join(repoRoot, 'node_modules'), join(dir, 'node_modules'))
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

export interface RunResult {
  code: number | null
  output: string
}

export function run(command: string, args: string[], cwd: string, env: Record<string, string> = {}, timeoutMs = 600_000): Promise<RunResult> {
  return new Promise((done) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (c) => (output += c))
    child.stderr.on('data', (c) => (output += c))
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs)
    child.on('close', (code) => {
      clearTimeout(timer)
      done({ code, output })
    })
  })
}

export function listProcesses(pattern: string): string[] {
  const out = spawnSync('ps', ['-eo', 'pid,args'], { encoding: 'utf8' }).stdout
  return out.split('\n').filter((line) => line.includes(pattern) && !line.includes('ps -eo'))
}

export function tmpDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

export function ensureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true })
}
