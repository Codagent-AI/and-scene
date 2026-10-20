import type { Preview } from './lib/preview.mjs'

export interface OutlineStep {
  era: string
  title: string
  caption: string
}
export interface Outline {
  slug: string
  title: string
  steps: OutlineStep[]
}
export interface FakePage {
  on(event: string, handler: (arg: never) => void): unknown
  goto(url: string, options?: unknown): Promise<unknown>
  waitForSelector(selector: string, options?: unknown): Promise<unknown>
  waitForTimeout(ms: number): Promise<unknown>
  getAttribute(selector: string, name: string): Promise<string | null>
  textContent(selector: string): Promise<string | null>
  keyboard: { press(key: string): Promise<unknown> }
  waitForFunction(fn: unknown, arg: unknown, options?: unknown): Promise<unknown>
}
export interface Browser {
  newPage(): Promise<FakePage>
  close(): Promise<unknown>
}
export interface VerifyDeps {
  runBuild(root: string): Promise<unknown>
  startPreview(root: string): Promise<Preview>
  launchBrowser(): Promise<Browser>
}
export function validateOutline(outline: unknown): Outline
export function loadOutline(root: string): Outline
export function checkRegistry(root: string, outline: Outline): void
export function checkTransition(from: number, to: number, expected: number): void
export function createErrorCollector(
  page: Pick<FakePage, 'on'>,
  getStep: () => number,
): { errors: { step: number; kind: string; text: string }[]; assertClean(): void }
export function renderSteps(page: FakePage, outline: Outline, baseUrl: string, log?: (line: string) => void): Promise<number>
export function verify(root?: string, log?: (line: string) => void, deps?: VerifyDeps): Promise<Outline>
