import { spawn } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const SAMPLE_SLUG = 'how-to-make-a-presentation'

const EXCLUDED = new Set(['.git', 'dist', 'node_modules', 'openspec', 'validator_logs', 'tests', 'skills'])

export interface ReferenceStep {
  era: string
  title: string
  caption: string
}

export interface Fault {
  /** Step index at which the fault triggers in the browser. */
  step?: number
  kind?: 'rename-title' | 'swap-titles' | 'console-error' | 'throw' | 'stall'
}

/** Disposable copy of the repo (no .git/dist/node_modules) with node_modules symlinked. */
export async function makeCopy(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'and-scene-verify-'))
  await cp(REPO_ROOT, dir, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(REPO_ROOT, src)
      return !EXCLUDED.has(rel.split(path.sep)[0] ?? '')
    },
  })
  await symlink(path.join(REPO_ROOT, 'node_modules'), path.join(dir, 'node_modules'))
  return dir
}

export async function removeCopy(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true })
}

export async function readReference(): Promise<{ steps: ReferenceStep[]; presentationTitle: string }> {
  return JSON.parse(await readFile(path.join(REPO_ROOT, 'scripts', 'verify.reference.json'), 'utf8'))
}

/** Source of a minimal controlled presentation (kit Presentation + trivial Scene) with an optional fault. */
export function fixtureSource(steps: ReferenceStep[], presentationTitle: string, fault: Fault = {}): string {
  const rows = steps.map((s) => ({ ...s }))
  if (fault.kind === 'rename-title') rows[fault.step ?? 0]!.title = `${rows[fault.step ?? 0]!.title} (renamed)`
  if (fault.kind === 'swap-titles') {
    const a = rows[0]!.title
    rows[0]!.title = rows[1]!.title
    rows[1]!.title = a
  }
  return `import { useEffect } from 'react'
import { Box, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'

const FAULT: { kind: string | null; step: number } = ${JSON.stringify({ kind: fault.kind ?? null, step: fault.step ?? 0 })}

function Scene({ stepIndex }: SceneProps) {
  if (FAULT.kind === 'throw' && stepIndex === FAULT.step) throw new Error('fixture render failure at step ' + stepIndex)
  useEffect(() => {
    if (FAULT.kind === 'console-error' && stepIndex === FAULT.step) console.error('fixture console error at step ' + stepIndex)
    if (FAULT.kind !== 'stall' || stepIndex !== FAULT.step) return
    const block = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') e.stopImmediatePropagation()
    }
    window.addEventListener('keydown', block, true)
    return () => window.removeEventListener('keydown', block, true)
  }, [stepIndex])
  return (
    <SceneLayer>
      <Box id="you" x={40} y={40} w={120} h={60} label={'step ' + stepIndex} />
    </SceneLayer>
  )
}

const ROWS = ${JSON.stringify(rows, null, 2)}

const STEPS: Step[] = ROWS.map((r, i) => ({ id: 's' + i, era: r.era, title: r.title, caption: r.caption, Scene, groupKey: 'main' }))

export default function Talk() {
  return <Presentation steps={STEPS} title=${JSON.stringify(presentationTitle)} initialMode="browse" />
}
`
}

export async function installFixture(dir: string, fault: Fault = {}): Promise<void> {
  const ref = await readReference()
  const file = path.join(dir, 'src', 'presentations', SAMPLE_SLUG, 'Talk.tsx')
  await writeFile(file, fixtureSource(ref.steps, ref.presentationTitle, fault))
}

export function registrySource(entries: Array<{ slug: string; title: string; dir?: string }>): string {
  const items = entries
    .map((e) => `  { slug: '${e.slug}', title: '${e.title}', load: () => import('./${e.dir ?? e.slug}/Talk') },`)
    .join('\n')
  return `import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentations: PresentationEntry[] = [
${items}
]
`
}

export interface RunResult {
  code: number | null
  output: string
}

export function runVerify(
  cwd: string,
  opts: { env?: Record<string, string>; command?: [string, string[]]; timeoutMs?: number } = {},
): Promise<RunResult> {
  const [cmd, args] = opts.command ?? ['node', ['scripts/verify.mjs']]
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...opts.env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    const timer = setTimeout(() => child.kill('SIGKILL'), opts.timeoutMs ?? 240_000)
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, output })
    })
  })
}

export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = net.createServer()
    s.once('error', reject)
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address() as net.AddressInfo
      s.close(() => resolve(port))
    })
  })
}

/** True when something accepts connections on 127.0.0.1:port. */
export function isListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = net.connect({ host: '127.0.0.1', port })
    sock.once('connect', () => {
      sock.destroy()
      resolve(true)
    })
    sock.once('error', () => resolve(false))
  })
}

/** Command lines of processes whose argv mentions the directory (e.g. a leftover vite preview). */
export function leftoverProcesses(dir: string): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn('pgrep', ['-af', dir])
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.on('close', () =>
      resolve(
        out
          .split('\n')
          .filter((l) => l && !l.includes('pgrep'))
          .join('\n'),
      ),
    )
  })
}
