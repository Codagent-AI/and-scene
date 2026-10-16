import path from 'node:path'
import { spawn } from 'node:child_process'
import { SOURCE_ROOT } from './repoCopy'

export interface Detectors {
  findOverlaps(items: unknown[]): { a: string; b: string }[]
  indistinctActive(groups: unknown[]): string[]
  attributionIssues(attr: unknown): string[]
  parseViewport(text: string): { width: number; height: number }
  parseInspectArgs(argv: string[]): { slug?: string; settle?: number; out?: string; build: boolean; viewport?: { width: number; height: number } }
  inspectPresentation(opts: {
    slug: string
    root?: string
    settle?: number
    out?: string
    viewport?: { width: number; height: number }
    build?: boolean
    log?: (line: string) => void
  }): Promise<{ files: string[]; warnings: string[] }>
}
export interface VerifyApi {
  parseConfig(raw: unknown): { slug: string; expectedSteps?: { title: string; caption: string }[] }[]
  selectEntries<T extends { slug: string }>(entries: T[], slug?: string): T[]
  checkStepsInSource(source: string, steps: { title: string; caption: string }[]): string | null
  parseArgs(argv: string[]): { slug?: string }
}

export async function loadInspect(): Promise<Detectors> {
  const file = path.join(SOURCE_ROOT, 'scripts', 'inspect-presentation.mjs')
  return (await import(/* @vite-ignore */ file)) as Detectors
}
export async function loadVerify(): Promise<VerifyApi> {
  const file = path.join(SOURCE_ROOT, 'scripts', 'verify.mjs')
  return (await import(/* @vite-ignore */ file)) as VerifyApi
}

export interface RunResult {
  code: number | null
  out: string
}

/** Run a script from a different cwd to prove root resolution. */
export function runNode(root: string, script: string, args: string[] = [], timeoutMs = 280000): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(root, 'scripts', script), ...args], { cwd: path.dirname(root), stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    const t = setTimeout(() => child.kill('SIGKILL'), timeoutMs)
    child.on('close', (code) => {
      clearTimeout(t)
      resolve({ code, out })
    })
  })
}
