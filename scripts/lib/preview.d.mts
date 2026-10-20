import type { ChildProcess } from 'node:child_process'

export const HOST: '127.0.0.1'
export class PhaseError extends Error {
  constructor(phase: string, message: string)
  phase: string
}
export function previewArgs(port: number): string[]
export function previewUrl(port: number, path?: string): string
export function findFreePort(): Promise<number>
export function runCommand(command: string, args: string[], options: { cwd: string; phase: string }): Promise<string>
export function runBuild(root: string): Promise<string>
export function waitForHttp(url: string, options?: { timeoutMs?: number; intervalMs?: number; fetchImpl?: typeof fetch }): Promise<void>
export function stopProcess(child: ChildProcess | undefined, graceMs?: number): Promise<void>
export interface Preview {
  port: number
  stop: () => Promise<void>
}
export function startPreview(root: string): Promise<Preview>
export const launchChromium: () => Promise<unknown>
export const defaultDeps: {
  runBuild: typeof runBuild
  startPreview: typeof startPreview
  launchBrowser: () => Promise<unknown>
}
