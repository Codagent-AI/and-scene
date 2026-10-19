import { readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  REPO_ROOT,
  SAMPLE_SLUG,
  fixtureSource,
  freePort,
  installFixture,
  installSecondPresentation,
  isListening,
  leftoverProcesses,
  makeCopy,
  readReference,
  registrySource,
  removeCopy,
  runVerify,
  type Fault,
} from '../helpers/verify-fixture'

describe('E2E-001: reference presentation passes production verification', () => {
  it('npm run verify exits zero, reports PASS, uses 127.0.0.1, observes all nine step indices', async () => {
    const port = await freePort()
    const { code, output } = await runVerify(REPO_ROOT, {
      command: ['npm', ['run', 'verify']],
      env: { VERIFY_PORT: String(port) },
      timeoutMs: 420_000,
    })
    expect(output).toContain('[verify] PASS')
    expect(code).toBe(0)
    expect(output).toContain(`--host 127.0.0.1 --port ${port}`)
    expect(output).toContain(`probe http://127.0.0.1:${port}/ ok`)
    expect(output).toContain(`opening http://127.0.0.1:${port}/${SAMPLE_SLUG}`)
    expect(output).not.toContain('localhost')
    expect(output).toContain('data-step-count=9')
    for (let i = 0; i < 9; i++) expect(output).toContain(`step ${i} ok (data-step-index=${i}`)
    expect(output).toContain('observed step indices 0,1,2,3,4,5,6,7,8')
    for (const phase of ['build', 'sample-registration', 'render', 'transition']) {
      expect(output).toContain(`phase ${phase}: ok`)
    }
    expect(await isListening(port)).toBe(false)
  })
})

interface Case {
  name: string
  phase: string
  step?: number
  fault?: Fault
  /** Extra mutation of the disposable copy. */
  mutate?: (dir: string) => Promise<void>
  env?: Record<string, string>
}

const sampleFile = (dir: string) => path.join(dir, 'src', 'presentations', SAMPLE_SLUG, 'Talk.tsx')
const registryFile = (dir: string) => path.join(dir, 'src', 'presentations', 'index.ts')
const referenceFile = (dir: string) => path.join(dir, 'scripts', 'verify.reference.json')

const cases: Case[] = [
  {
    name: 'build-breaking type error in a non-sample application file',
    phase: 'build',
    mutate: (dir) => writeFile(path.join(dir, 'src', 'broken.ts'), "export const broken: number = 'not a number'\n"),
  },
  {
    name: 'sample removed from the registry',
    phase: 'sample-registration',
    mutate: (dir) => writeFile(registryFile(dir), registrySource([{ slug: 'other', title: 'Other', dir: SAMPLE_SLUG }])),
  },
  {
    name: 'registry has no entries',
    phase: 'sample-registration',
    mutate: (dir) => writeFile(registryFile(dir), registrySource([])),
  },
  {
    name: 'malformed reference file',
    phase: 'sample-registration',
    mutate: (dir) => writeFile(referenceFile(dir), '{ not json'),
  },
  {
    name: 'reference file without steps',
    phase: 'sample-registration',
    mutate: (dir) => writeFile(referenceFile(dir), JSON.stringify({ slug: SAMPLE_SLUG, presentationTitle: 'x' })),
  },
  {
    name: 'wrong step count (eight steps)',
    phase: 'render',
    step: 0,
    mutate: async (dir) => {
      const f = sampleFile(dir)
      const src = await readFile(f, 'utf8')
      await writeFile(f, src.replace('const STEPS: Step[] = ROWS.map', 'const STEPS: Step[] = ROWS.slice(0, 8).map'))
    },
  },
  { name: 'renamed title at step 3', phase: 'render', step: 3, fault: { kind: 'rename-title', step: 3 } },
  { name: 'swapped titles (out of order)', phase: 'render', step: 0, fault: { kind: 'swap-titles' } },
  { name: 'changed caption at step 2', phase: 'render', step: 2, fault: { kind: 'change-caption', step: 2 } },
  { name: 'swapped captions (out-of-order steps)', phase: 'render', step: 0, fault: { kind: 'swap-captions' } },
  { name: 'console.error at step 4', phase: 'render', step: 4, fault: { kind: 'console-error', step: 4 } },
  { name: 'render exception at step 0', phase: 'render', step: 0, fault: { kind: 'throw', step: 0 } },
  { name: 'render exception at step 6', phase: 'render', step: 6, fault: { kind: 'throw', step: 6 } },
  {
    name: 'transition that never advances (step 2 cannot advance)',
    phase: 'transition',
    step: 3,
    fault: { kind: 'stall', step: 2 },
    env: { VERIFY_STEP_TIMEOUT_MS: '1500' },
  },
]

describe('E2E-002: verification failures are actionable', () => {
  const copies: string[] = []
  afterAll(async () => {
    await Promise.all(copies.map(removeCopy))
  })

  it.each(cases)('$name fails in phase $phase', async (c) => {
    const dir = await makeCopy()
    copies.push(dir)
    await installFixture(dir, c.fault)
    await c.mutate?.(dir)
    const port = await freePort()
    const { code, output } = await runVerify(dir, { env: { VERIFY_PORT: String(port), ...c.env } })
    expect(code).not.toBe(0)
    expect(output).not.toContain('[verify] PASS')
    const m = /\[verify\] FAIL phase=(\S+)(?: step=(\d+))?/.exec(output)
    expect(m, output).not.toBeNull()
    expect(m![1]).toBe(c.phase)
    if (c.step !== undefined) expect(Number(m![2])).toBe(c.step)
    expect(await isListening(port)).toBe(false)
    expect(await leftoverProcesses(dir)).toBe('')
  })

  it('controlled fixture with no fault passes (guards the fault cases against false failures)', async () => {
    const dir = await makeCopy()
    copies.push(dir)
    await installFixture(dir)
    const port = await freePort()
    const { code, output } = await runVerify(dir, { env: { VERIFY_PORT: String(port) } })
    expect(output).toContain('[verify] PASS')
    expect(code).toBe(0)
    expect(await isListening(port)).toBe(false)
    expect(await leftoverProcesses(dir)).toBe('')
  })
})

describe('E2E-002: reference mode also verifies every other registered presentation', () => {
  const copies: string[] = []
  afterAll(async () => {
    await Promise.all(copies.map(removeCopy))
  })

  it('passes with a healthy second presentation and steps through both', async () => {
    const dir = await makeCopy()
    copies.push(dir)
    await installFixture(dir)
    await installSecondPresentation(dir)
    const port = await freePort()
    const { code, output } = await runVerify(dir, { env: { VERIFY_PORT: String(port) } })
    expect(output).toContain('mode: reference')
    expect(output).toContain('[verify] PASS')
    expect(output).toContain(`${SAMPLE_SLUG}: observed step indices 0,1,2,3,4,5,6,7,8`)
    expect(output).toContain('second: observed step indices 0,1,2,3,4,5,6,7,8')
    expect(code).toBe(0)
    expect(await isListening(port)).toBe(false)
  })

  it.each([
    { name: 'console error', phase: 'render', step: 2, fault: { kind: 'console-error', step: 2 } as Fault, env: {} },
    {
      name: 'stalled transition',
      phase: 'transition',
      step: 2,
      fault: { kind: 'stall', step: 1 } as Fault,
      env: { VERIFY_STEP_TIMEOUT_MS: '1500' },
    },
  ])('fails on a faulty second presentation ($name)', async (c) => {
    const dir = await makeCopy()
    copies.push(dir)
    await installFixture(dir)
    await installSecondPresentation(dir, c.fault)
    const port = await freePort()
    const { code, output } = await runVerify(dir, { env: { VERIFY_PORT: String(port), ...c.env } })
    expect(code).not.toBe(0)
    expect(output).not.toContain('[verify] PASS')
    expect(output).toContain(`${SAMPLE_SLUG}: observed step indices 0,1,2,3,4,5,6,7,8`)
    expect(output).toMatch(new RegExp(`\\[verify\\] FAIL phase=${c.phase} step=${c.step} second:`))
    expect(await isListening(port)).toBe(false)
    expect(await leftoverProcesses(dir)).toBe('')
  })
})

describe('scaffold-local gate (shared verify.mjs without reference file)', () => {
  const copies: string[] = []
  afterAll(async () => {
    await Promise.all(copies.map(removeCopy))
  })

  it('fails with phase sample-registration when nothing is registered', async () => {
    const dir = await makeCopy()
    copies.push(dir)
    await rm(referenceFile(dir))
    await writeFile(registryFile(dir), registrySource([]))
    const { code, output } = await runVerify(dir, { env: { VERIFY_PORT: String(await freePort()) } })
    expect(code).not.toBe(0)
    expect(output).toContain('mode: scaffold-local')
    expect(output).toMatch(/\[verify\] FAIL phase=sample-registration/)
  })

  it('steps through every step of every registered presentation and fails on a stalled one', async () => {
    const dir = await makeCopy()
    copies.push(dir)
    await rm(referenceFile(dir))
    await installFixture(dir)
    // Second presentation: a copy of the controlled fixture with a stalled transition at step 1.
    const second = path.join(dir, 'src', 'presentations', 'second')
    const { cp } = await import('node:fs/promises')
    await cp(path.join(dir, 'src', 'presentations', SAMPLE_SLUG), second, { recursive: true })
    await writeFile(
      registryFile(dir),
      registrySource([
        { slug: SAMPLE_SLUG, title: 'First' },
        { slug: 'second', title: 'Second' },
      ]),
    )
    const port = await freePort()
    const pass = await runVerify(dir, { env: { VERIFY_PORT: String(port) } })
    expect(pass.output).toContain('mode: scaffold-local')
    expect(pass.output).toContain('[verify] PASS')
    expect(pass.output).toContain(`${SAMPLE_SLUG}: observed step indices 0,1,2,3,4,5,6,7,8`)
    expect(pass.output).toContain('second: observed step indices 0,1,2,3,4,5,6,7,8')
    expect(pass.code).toBe(0)

    const ref = await readReference()
    await writeFile(
      path.join(second, 'Talk.tsx'),
      fixtureSource(ref.steps, ref.presentationTitle, { kind: 'stall', step: 1 }),
    )
    const fail = await runVerify(dir, { env: { VERIFY_PORT: String(await freePort()), VERIFY_STEP_TIMEOUT_MS: '1500' } })
    expect(fail.code).not.toBe(0)
    expect(fail.output).toMatch(/\[verify\] FAIL phase=transition step=2 second:/)
  })
})
