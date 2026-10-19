import { afterAll, describe, expect, it } from 'vitest'
import { createConnection } from 'node:net'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { copyProject, run } from './helpers'

const SLUG = 'how-to-make-a-presentation'
const VERIFY_TIMEOUT_MS = 420_000
const created: string[] = []

afterAll(() => {
  for (const dir of created) rmSync(dir, { recursive: true, force: true })
})

function freshCopy(prefix: string): string {
  const dir = copyProject(prefix)
  created.push(dir)
  return dir
}

function verify(dir: string) {
  return run(process.execPath, ['scripts/verify.mjs', '--root', dir], { cwd: dir, timeoutMs: VERIFY_TIMEOUT_MS })
}

/** Resolves true when something accepts TCP connections on 127.0.0.1:port. */
function isListening(port: number): Promise<boolean> {
  return new Promise((resolveListening) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    socket.once('connect', () => {
      socket.destroy()
      resolveListening(true)
    })
    socket.once('error', () => resolveListening(false))
    socket.setTimeout(2_000, () => {
      socket.destroy()
      resolveListening(false)
    })
  })
}

function previewPort(output: string): number | undefined {
  const match = /preview http:\/\/127\.0\.0\.1:(\d+)/.exec(output)
  return match ? Number(match[1]) : undefined
}

async function expectNoLeftoverPreview(output: string): Promise<void> {
  const port = previewPort(output)
  if (port !== undefined) expect(await isListening(port), `preview on port ${port} still listening`).toBe(false)
}

/** Shared generator for the sample's Talk.tsx in throwaway copies; each fault is opt-in. */
interface Fault {
  swap: readonly number[] | null
  consoleErrorAt: number | null
  uncaughtAt: number | null
  blockAdvanceFrom: number | null
}

const NO_FAULT: Fault = { swap: null, consoleErrorAt: null, uncaughtAt: null, blockAdvanceFrom: null }

function talkSource(fault: Fault): string {
  return `import { useEffect } from 'react'
import { Presentation, type Step } from '../../presentation-kit'
import { OUTLINE, PRESENTATION_TITLE } from './outline'

const FAULT: { swap: readonly number[] | null; consoleErrorAt: number | null; uncaughtAt: number | null; blockAdvanceFrom: number | null } = ${JSON.stringify(fault)}

function Probe({ payload }: { payload: number }) {
  useEffect(() => {
    if (payload === FAULT.consoleErrorAt) console.error('injected console error at payload ' + payload)
    if (payload === FAULT.uncaughtAt) {
      setTimeout(() => {
        throw new Error('injected uncaught error at payload ' + payload)
      }, 0)
    }
  }, [payload])
  return null
}

const rows = [...OUTLINE]
if (FAULT.swap) {
  const [a, b] = FAULT.swap
  const tmp = rows[a]
  rows[a] = rows[b]
  rows[b] = tmp
}

const steps: Step<number>[] = rows.map((row, i) => ({ ...row, groupKey: 'scene', Scene: Probe, payload: i }))

export default function Talk() {
  useEffect(() => {
    if (FAULT.blockAdvanceFrom === null) return
    // Capture-phase window listener: swallows one ArrowRight before the kit's nav hook sees it.
    const block = (e: KeyboardEvent) => {
      const root = document.querySelector('[data-presentation-root]')
      if (e.key === 'ArrowRight' && root?.getAttribute('data-step-index') === String(FAULT.blockAdvanceFrom)) {
        e.stopImmediatePropagation()
      }
    }
    window.addEventListener('keydown', block, true)
    return () => window.removeEventListener('keydown', block, true)
  }, [])
  return <Presentation steps={steps} title={PRESENTATION_TITLE} initialMode="browse" />
}
`
}

function replaceOnce(file: string, from: string, to: string): void {
  const text = readFileSync(file, 'utf8')
  if (!text.includes(from)) throw new Error(`fixture drift: "${from}" not found in ${file}`)
  writeFileSync(file, text.replace(from, to))
}

const SAMPLE_DIR = 'src/presentations/how-to-make-a-presentation'

describe('verify end-to-end: reference presentation passes', () => {
  it('E2E-001 builds, registers, renders all nine steps and reports PASS', async () => {
    const dir = freshCopy('and-scene-e2e-pass-')
    const result = await verify(dir)
    expect(result.code, result.output).toBe(0)
    expect(result.output).toMatch(/^PASS verify: build ok, sample ok, render ok \(9 of 9/m)
    expect(result.output).not.toContain('FAIL')
    expect(result.output).not.toContain('localhost')

    const port = previewPort(result.output)
    expect(port, result.output).toBeDefined()
    expect(result.output).toContain(`ready http://127.0.0.1:${port}/`)
    expect(result.output).toContain(`open http://127.0.0.1:${port}/${SLUG}`)

    const steps = [...result.output.matchAll(/ok step (\d+) \(index (\d+)\)/g)].map((m) => [Number(m[1]), Number(m[2])])
    expect(steps).toEqual(Array.from({ length: 9 }, (_, i) => [i + 1, i]))

    await expectNoLeftoverPreview(result.output)
  }, VERIFY_TIMEOUT_MS + 60_000)
})

describe('verify end-to-end: failures are actionable', () => {
  it('E2E-002a: a build-breaking edit fails in the build phase before any browser runs', async () => {
    const dir = freshCopy('and-scene-e2e-build-')
    writeFileSync(join(dir, SAMPLE_DIR, 'outline.ts'), readFileSync(join(dir, SAMPLE_DIR, 'outline.ts'), 'utf8') + "\nexport const BROKEN: number = 'not a number'\n")
    const result = await verify(dir)
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(/FAIL \[build\]/)
    expect(result.output).not.toMatch(/PASS/)
    expect(result.output).not.toContain('preview http://')
  }, VERIFY_TIMEOUT_MS)

  it('E2E-002b: an unregistered sample fails the sample phase', async () => {
    const dir = freshCopy('and-scene-e2e-unreg-')
    writeFileSync(
      join(dir, 'src/presentations/index.ts'),
      `import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentations: readonly PresentationEntry[] = []
`,
    )
    const result = await verify(dir)
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(/FAIL \[sample\]/)
    expect(result.output).not.toMatch(/PASS/)
    expect(result.output).not.toContain('preview http://')
  }, VERIFY_TIMEOUT_MS)

  it('E2E-002c: out-of-order sample steps fail naming the step', async () => {
    const dir = freshCopy('and-scene-e2e-order-')
    writeFileSync(join(dir, SAMPLE_DIR, 'Talk.tsx'), talkSource({ ...NO_FAULT, swap: [1, 2] }))
    const result = await verify(dir)
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(/FAIL \[sample\] step 2 \(index 1\): title/)
    expect(result.output).not.toMatch(/PASS/)
    await expectNoLeftoverPreview(result.output)
  }, VERIFY_TIMEOUT_MS)

  it('E2E-002d: a corrupted normative caption fails naming the step', async () => {
    const dir = freshCopy('and-scene-e2e-caption-')
    replaceOnce(join(dir, SAMPLE_DIR, 'outline.ts'), 'Each answer lands as a step card', 'Each answer lands as a card')
    const result = await verify(dir)
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(/FAIL \[sample\] step 3 \(index 2\): caption/)
    expect(result.output).not.toMatch(/PASS/)
    await expectNoLeftoverPreview(result.output)
  }, VERIFY_TIMEOUT_MS)

  it('E2E-002e: a console.error at a non-first step fails render at that step', async () => {
    const dir = freshCopy('and-scene-e2e-console-')
    writeFileSync(join(dir, SAMPLE_DIR, 'Talk.tsx'), talkSource({ ...NO_FAULT, consoleErrorAt: 2 }))
    const result = await verify(dir)
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(/FAIL \[render\] step 3 \(index 2\): console\.error: injected console error/)
    expect(result.output).not.toMatch(/PASS/)
    await expectNoLeftoverPreview(result.output)
  }, VERIFY_TIMEOUT_MS)

  it('E2E-002f: an uncaught page error at a non-first step fails render at that step', async () => {
    const dir = freshCopy('and-scene-e2e-uncaught-')
    writeFileSync(join(dir, SAMPLE_DIR, 'Talk.tsx'), talkSource({ ...NO_FAULT, uncaughtAt: 3 }))
    const result = await verify(dir)
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(/FAIL \[render\] step 4 \(index 3\): pageerror: injected uncaught error/)
    expect(result.output).not.toMatch(/PASS/)
    await expectNoLeftoverPreview(result.output)
  }, VERIFY_TIMEOUT_MS)

  it('E2E-002g: a transition that does not advance fails with the step identified, without any browser error', async () => {
    const dir = freshCopy('and-scene-e2e-stuck-')
    writeFileSync(join(dir, SAMPLE_DIR, 'Talk.tsx'), talkSource({ ...NO_FAULT, blockAdvanceFrom: 4 }))
    const result = await verify(dir)
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(/FAIL \[render\] step 6 \(index 5\): transition did not advance/)
    expect(result.output).not.toMatch(/console\.error|pageerror/)
    expect(result.output).not.toMatch(/PASS/)
    await expectNoLeftoverPreview(result.output)
  }, VERIFY_TIMEOUT_MS)
})

describe('verify end-to-end: registry mode (verify.config.json sample: false)', () => {
  it('E2E-003a renders every registered presentation without the sample table and reports PASS', async () => {
    const dir = freshCopy('and-scene-e2e-registry-')
    writeFileSync(join(dir, 'verify.config.json'), '{ "sample": false }\n')
    const result = await verify(dir)
    expect(result.code, result.output).toBe(0)
    expect(result.output).toContain('sample skipped: verify.config.json sets "sample" to false')
    expect(result.output).not.toContain('sample ok')
    expect(result.output).toMatch(/^PASS verify: build ok, sample skipped, render ok \(1 registered presentation, 9 steps/m)
    expect(result.output).not.toContain('FAIL')
    expect(result.output).toContain(`open http://127.0.0.1:${previewPort(result.output)}/${SLUG}`)
    const steps = [...result.output.matchAll(/ok step (\d+) \(index (\d+)\)/g)].map((m) => Number(m[2]))
    expect(steps).toEqual(Array.from({ length: 9 }, (_, i) => i))
    await expectNoLeftoverPreview(result.output)
  }, VERIFY_TIMEOUT_MS + 60_000)

  it('E2E-003b with an empty registry fails naming sample and never starts the preview', async () => {
    const dir = freshCopy('and-scene-e2e-empty-')
    writeFileSync(join(dir, 'verify.config.json'), '{ "sample": false }\n')
    writeFileSync(
      join(dir, 'src/presentations/index.ts'),
      `import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const presentations: readonly PresentationEntry[] = []
`,
    )
    const result = await verify(dir)
    expect(result.code).not.toBe(0)
    expect(result.output).toMatch(/FAIL \[sample\] no presentations registered/)
    expect(result.output).not.toMatch(/PASS/)
    expect(result.output).not.toContain('preview http://')
  }, VERIFY_TIMEOUT_MS)
})
