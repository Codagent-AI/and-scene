import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { createConnection } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const source = process.cwd()
const copies: string[] = []

/**
 * E2E-002 materializes disposable copies so faults never touch the source checkout.
 * node_modules is a per-copy symlink farm: dependencies are shared, but the
 * incremental tsc build cache stays local so an injected type error really fails.
 */
function makeFaultyCopy(): string {
  const root = mkdtempSync(join(tmpdir(), 'and-scene-fault-'))
  copies.push(root)
  const tracked = execFileSync('git', ['ls-files'], { cwd: source, encoding: 'utf8' }).split('\n').filter(Boolean)
  for (const file of tracked) cpSync(join(source, file), join(root, file), { recursive: true })
  mkdirSync(join(root, 'node_modules'))
  for (const entry of readdirSync(join(source, 'node_modules'))) {
    if (entry === '.tmp' || entry === '.cache') continue
    symlinkSync(join(source, 'node_modules', entry), join(root, 'node_modules', entry))
  }
  return root
}

function runVerify(root: string) {
  try {
    const stdout = execFileSync('node', ['scripts/verify.mjs'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return { status: 0, output: stdout }
  } catch (error) {
    const failure = error as { status: number | null; stdout?: string; stderr?: string }
    return { status: failure.status ?? -1, output: `${failure.stdout ?? ''}${failure.stderr ?? ''}` }
  }
}

function patch(root: string, file: string, find: string, replace: string) {
  const path = join(root, file)
  const before = readFileSync(path, 'utf8')
  expect(before, `fault anchor not found in ${file}`).toContain(find)
  writeFileSync(path, before.replace(find, replace))
}

const portIsFree = (port: number) => new Promise<boolean>((resolve) => {
  const socket = createConnection({ host: '127.0.0.1', port })
  socket.once('connect', () => { socket.destroy(); resolve(false) })
  socket.once('error', () => resolve(true))
})

afterAll(() => {
  for (const root of copies) rmSync(root, { recursive: true, force: true })
})

describe('E2E-002: verification failures are actionable', () => {
  it('fails the build phase on a type error without reporting success', () => {
    const root = makeFaultyCopy()
    patch(root, 'src/presentations/index.ts', 'export const presentations', 'const broken: number = "not a number"\nexport const presentations')

    const { status, output } = runVerify(root)
    expect(status).not.toBe(0)
    expect(output).toContain('FAIL: verification')
    expect(output).not.toContain('PASS:')
  }, 180_000)

  it('fails when the reference sample is missing from the registry', () => {
    const root = makeFaultyCopy()
    patch(root, 'src/presentations/index.ts', "slug: 'how-to-make-a-presentation'", "slug: 'some-other-presentation'")

    const { status, output } = runVerify(root)
    expect(status).not.toBe(0)
    expect(output).toContain('reference sample is missing from the presentation registry')
    expect(output).not.toContain('PASS:')
  }, 180_000)

  it('names the offending step when a step emits a browser error', async () => {
    const root = makeFaultyCopy()
    patch(root, 'src/presentations/how-to-make-a-presentation/steps/Scene.tsx', 'export function Scene', 'if (typeof window !== "undefined") console.error("injected scene fault")\nexport function Scene')

    const { status, output } = runVerify(root)
    expect(status).not.toBe(0)
    expect(output).toMatch(/step \d+:/)
    expect(output).toContain('injected scene fault')
    expect(output).not.toContain('PASS:')
    expect(await portIsFree(4173), 'preview subprocess was left running').toBe(true)
  }, 180_000)

  it('names the offending step when a transition does not advance', async () => {
    const root = makeFaultyCopy()
    // Keeps the signature type-safe so the fault surfaces as a stalled transition, not a build error.
    patch(root, 'src/presentation-kit/navigation.ts', "const delta = direction === 'next' ? 1 : -1", "const delta = direction === 'next' ? 0 : -1")

    const { status, output } = runVerify(root)
    expect(status).not.toBe(0)
    expect(output).toMatch(/step \d+: (transition stopped at index|expected title)/)
    expect(output).not.toContain('PASS:')
    expect(await portIsFree(4173), 'preview subprocess was left running').toBe(true)
  }, 180_000)
})
