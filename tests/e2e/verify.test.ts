import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyRepo, editFile, isClosed, makeTempDir, removeDir, runAsync, type RunResult } from '../helpers'

const SLUG = 'how-to-make-a-presentation'
const sampleFile = (root: string, ...p: string[]) => path.join(root, 'src', 'presentations', SLUG, ...p)

const dirs: string[] = []
async function verifyIn(fault?: (root: string) => void): Promise<RunResult> {
  const root = copyRepo(path.join(makeTempDir('and-scene-e2e-'), 'checkout'))
  dirs.push(path.dirname(root))
  fault?.(root)
  return runAsync('npm', ['run', 'verify'], root)
}

afterAll(() => dirs.forEach(removeDir))

describe('E2E-001: reference presentation passes production verification', () => {
  let result: RunResult
  beforeAll(async () => {
    result = await verifyIn()
  })

  it('exits zero with a clear pass', () => {
    expect(result.status, result.output).toBe(0)
    expect(result.output).toContain('[verify] PASS')
    expect(result.output).not.toMatch(/FAIL/)
  })

  it('builds, finds the registered sample and renders all nine steps', () => {
    expect(result.output).toContain('build: ok')
    expect(result.output).toContain(`registry: reference presentation "${SLUG}" registered`)
    expect(result.output).toContain(`render: /${SLUG} ok (9 steps)`)
  })

  it('uses the IPv4 loopback address for the preview', () => {
    expect(result.output).toMatch(/preview: http:\/\/127\.0\.0\.1:\d+/)
    expect(result.output).not.toMatch(/localhost/)
  })
})

describe('E2E-002: verification failures are actionable', () => {
  function expectFailure(r: RunResult, phase: string, step?: number) {
    expect(r.status, r.output).not.toBe(0)
    expect(r.output).not.toContain('[verify] PASS')
    const line = r.output.split('\n').find((l) => l.includes('[verify] FAIL'))
    expect(line, r.output).toBeTruthy()
    expect(line).toContain(`FAIL ${phase}`)
    if (step !== undefined) expect(line).toContain(`(step ${step})`)
  }

  async function previewClosed(r: RunResult) {
    const url = r.output.match(/preview: (http:\/\/127\.0\.0\.1:\d+)/)?.[1]
    if (url) expect(await isClosed(url)).toBe(true)
  }

  it('fails the build phase on a type error', async () => {
    const r = await verifyIn((root) =>
      editFile(sampleFile(root, 'Talk.tsx'), (t) => `${t}\nexport const broken: number = 'not a number'\n`),
    )
    expectFailure(r, 'build')
    expect(r.output).not.toContain('preview:')
  })

  it('fails when the reference sample is missing from the registry', async () => {
    const r = await verifyIn((root) =>
      editFile(path.join(root, 'src', 'presentations', 'index.ts'), (t) => t.replace(`slug: '${SLUG}'`, `slug: 'renamed-sample'`)),
    )
    expectFailure(r, 'registry')
    expect(r.output).toContain(SLUG)
  })

  it('fails when the sample steps are out of order', async () => {
    const r = await verifyIn((root) =>
      editFile(sampleFile(root, 'steps', 'index.ts'), (t) => t.replace('export const STEPS: Step<SamplePayload>[] = REFERENCE_OUTLINE.map(', 'export const STEPS: Step<SamplePayload>[] = [...REFERENCE_OUTLINE].reverse().map(')),
    )
    expectFailure(r, 'outline', 1)
    await previewClosed(r)
  })

  it('fails and names the step when a step logs a console error', async () => {
    const r = await verifyIn((root) =>
      editFile(sampleFile(root, 'steps', 'Scene.tsx'), (t) =>
        t.replace('  return (\n    <SceneLayer>', "  if (n === 4) console.error('boom at step four')\n  return (\n    <SceneLayer>"),
      ),
    )
    expectFailure(r, 'render', 4)
    expect(r.output).toContain('boom at step four')
    await previewClosed(r)
  })

  it('fails and names the step when an uncaught error is thrown', async () => {
    const r = await verifyIn((root) =>
      editFile(sampleFile(root, 'steps', 'Scene.tsx'), (t) =>
        t.replace('  return (\n    <SceneLayer>', "  if (n === 3) setTimeout(() => { throw new Error('uncaught at step three') }, 0)\n  return (\n    <SceneLayer>"),
      ),
    )
    expectFailure(r, 'render', 3)
    expect(r.output).toContain('uncaught at step three')
    await previewClosed(r)
  })

  it('fails and names the step when a transition does not advance the step index', async () => {
    const r = await verifyIn((root) =>
      editFile(path.join(root, 'src', 'presentation-kit', 'usePresentationNav.ts'), (t) =>
        t.replace('setIndex((i) => clampIndex(i + 1, count))', 'setIndex((i) => (i >= 3 ? i : clampIndex(i + 1, count)))'),
      ),
    )
    expectFailure(r, 'render', 5)
    expect(r.output).toContain('did not advance')
    await previewClosed(r)
  })

  it('leaves the source checkout untouched', () => {
    expect(fs.existsSync(path.join(import.meta.dirname, '..', '..', 'src', 'presentations', 'renamed-sample'))).toBe(false)
  })
})
