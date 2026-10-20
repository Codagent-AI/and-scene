import type { Preview } from './lib/preview.mjs'

export const DEFAULT_SETTLE_MS: number
export const DEFAULT_VIEWPORT: { width: number; height: number }
export const MIN_ATTRIBUTION_PX: number
export interface Candidate {
  label: string
  rect: { l: number; t: number; r: number; b: number }
  allowed: boolean
  containers: number[]
}
export type Signature = Record<string, string>
export interface PageDiagnostics {
  candidates: Candidate[]
  progress: { active: Signature | null; inactive: Signature[] }
  toc: { active: Signature | null; inactive: Signature[] }
  attribution: { fontSize: number; color: string; textDecorationLine: string; fontFamily: string } | null
}
export interface InspectOptions {
  slug: string | null
  settleMs: number
  viewport: { width: number; height: number }
  out: string
  build: boolean
}
export function parseArgs(argv: string[], env?: Record<string, string | undefined>): InspectOptions
export function isRegistered(root: string, slug: string): boolean
export function stepFileName(index: number): string
export function outputDir(root: string, out: string, slug: string, viewport: { width: number; height: number }): string
export function findOverlaps(candidates: Candidate[]): [string, string][]
export function isIndistinct(active: Signature | null, inactive: Signature[]): boolean
export function attributionIssues(attribution: PageDiagnostics['attribution']): string[]
export function warningsFor(step: number, page: PageDiagnostics): string[]
export function collectPage(): PageDiagnostics
export function inspectSteps(
  page: unknown,
  options: { count: number; settleMs: number; sleep: (ms: number) => Promise<unknown>; dir: string; log?: (line: string) => void },
): Promise<number>
export function inspect(
  argv: string[],
  options?: {
    root?: string
    env?: Record<string, string | undefined>
    log?: (line: string) => void
    deps?: {
      runBuild(root: string): Promise<unknown>
      startPreview(root: string): Promise<Preview>
      launchBrowser(): Promise<unknown>
    }
  },
): Promise<void>
