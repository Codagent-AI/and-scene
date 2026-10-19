import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { alive, copyRepo, previewPid, run } from '../helpers/proc.ts'

const dirs: string[] = []
const SAMPLE = 'src/presentations/how-to-make-a-presentation'

function edit(dir: string, file: string, change: (s: string) => string) {
  const p = join(dir, file)
  const before = readFileSync(p, 'utf8')
  const after = change(before)
  if (after === before) throw new Error(`fault did not change ${file}`)
  writeFileSync(p, after)
}

async function verifyWith(fault: (dir: string) => void) {
  const dir = copyRepo()
  dirs.push(dir)
  fault(dir)
  const r = await run('node', ['scripts/verify.mjs'], dir)
  return r
}

function expectFailure(r: { code: number; out: string }, expected: RegExp) {
  expect(r.code).not.toBe(0)
  expect(r.out).toMatch(expected)
  expect(r.out).not.toContain('verify: PASS')
  const pid = previewPid(r.out)
  if (pid) expect(alive(pid)).toBe(false)
}

describe('E2E-002: verification failures are actionable', () => {
  beforeAll(() => {
    // fail fast rather than test a stale tree
    expect(readFileSync(`${SAMPLE}/Scene.tsx`, 'utf8')).toContain('SceneLayer')
  })
  afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

  it('fails the build phase on a type error', async () => {
    const r = await verifyWith((d) => edit(d, 'src/presentations/index.ts', (s) => `${s}\nexport const broken: number = 'not a number'\n`))
    expectFailure(r, /verify: FAIL phase=build: npm run build failed/)
    expect(r.out).toMatch(/error TS2322/)
    expect(r.out).not.toMatch(/phase render/)
  })

  it('fails the sample phase when the sample is missing from the registry', async () => {
    const r = await verifyWith((d) => edit(d, 'src/presentations/index.ts', (s) => s.replace(/\n\s{2}\{ slug: 'how-to-make-a-presentation'[^\n]*\n/, '\n')))
    expectFailure(r, /verify: FAIL phase=sample: .*not registered/)
  })

  it('fails the sample phase when the nine steps are out of order', async () => {
    const r = await verifyWith((d) =>
      edit(d, `${SAMPLE}/narration.ts`, (s) => s.replace("title: 'You have a topic'", "title: 'The skill interviews you'").replace("title: 'The skill interviews you', caption: 'One", "title: 'You have a topic', caption: 'One")),
    )
    expectFailure(r, /verify: FAIL phase=sample: .*step 1 title/)
  })

  it('fails the sample phase when a step is missing from the sample', async () => {
    const r = await verifyWith((d) => edit(d, `${SAMPLE}/narration.ts`, (s) => s.replace(/\n\s{2}\{ id: 'reveal'[^\n]*/, '')))
    expectFailure(r, /verify: FAIL phase=sample: expected 9 steps, found 8/)
  })

  it('fails the render phase and still stops the preview when Chromium cannot launch', async () => {
    const dir = copyRepo()
    dirs.push(dir)
    const r = await run('node', ['scripts/verify.mjs'], dir, { PLAYWRIGHT_BROWSERS_PATH: join(dir, 'no-browsers') })
    expectFailure(r, /verify: FAIL phase=render: Playwright Chromium is not installed/)
    expect(previewPid(r.out)).toBeDefined()
  })

  it('names the offending step for a console error', async () => {
    const r = await verifyWith((d) =>
      edit(d, `${SAMPLE}/Scene.tsx`, (s) =>
        s.replace("import { Check,", "import { useEffect } from 'react'\nimport { Check,").replace('export function Scene({ payload }: SceneProps<Payload>) {', 'export function Scene({ payload }: SceneProps<Payload>) {\n  useEffect(() => {\n    if (payload.stage === 4) console.error("injected console failure")\n  }, [payload.stage])'),
      ),
    )
    expectFailure(r, /verify: FAIL phase=render step=3: .*injected console failure/)
    expect(r.out).toContain('verify: step 2 rendered')
  })

  it.each([[1, 0], [4, 3], [9, 8]])('attributes a React render exception at stage %i to step index %i', async (stage, index) => {
    const r = await verifyWith((d) =>
      edit(d, `${SAMPLE}/Scene.tsx`, (s) => s.replace('export function Scene({ payload }: SceneProps<Payload>) {', `export function Scene({ payload }: SceneProps<Payload>) {\n  if (payload.stage === ${stage}) throw new Error("injected render failure")`)),
    )
    expectFailure(r, new RegExp(`verify: FAIL phase=render step=${index}: .*injected render failure`))
  })

  it('fails when the rendered caption is absent', async () => {
    const r = await verifyWith((d) => edit(d, 'src/presentation-kit/chrome/Footer.tsx', (s) => s.replace('<p data-presentation-caption="">{step.caption}</p>', '')))
    expectFailure(r, /verify: FAIL phase=render step=0: no caption rendered/)
  })

  it('fails when the rendered era does not match the outline', async () => {
    const r = await verifyWith((d) => edit(d, 'src/presentation-kit/chrome/Header.tsx', (s) => s.replace('{step.era}', 'wrong era')))
    expectFailure(r, /verify: FAIL phase=render step=0: era "wrong era" does not match "the ask"/)
  })

  it('names the offending step for an uncaught page error', async () => {
    const r = await verifyWith((d) =>
      edit(d, `${SAMPLE}/Scene.tsx`, (s) =>
        s.replace("import { Check,", "import { useEffect } from 'react'\nimport { Check,").replace('export function Scene({ payload }: SceneProps<Payload>) {', 'export function Scene({ payload }: SceneProps<Payload>) {\n  useEffect(() => {\n    if (payload.stage === 6) setTimeout(() => { throw new Error("injected page error") }, 50)\n  }, [payload.stage])'),
      ),
    )
    expectFailure(r, /verify: FAIL phase=render step=5: .*injected page error/)
  })

  it('names the step whose transition does not advance the public step index', async () => {
    const r = await verifyWith((d) => edit(d, 'src/presentation-kit/usePresentationNav.ts', (s) => s.replace('setIndex((i) => clampIndex(i + 1, count))', 'setIndex((i) => clampIndex(Math.min(i + 1, 2), count))')))
    expectFailure(r, /verify: FAIL phase=render step=3: step 2 did not advance to 3/)
  })
})
