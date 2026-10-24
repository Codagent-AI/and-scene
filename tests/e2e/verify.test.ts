import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyApp, edit, portIsClosed, previewPort, remove, run, type RunResult } from '../helpers/workspace'

const SAMPLE = 'src/presentations/how-to-make-a-presentation'

describe('E2E-001: reference presentation passes production verification', () => {
  let dir: string
  let result: RunResult

  beforeAll(async () => {
    dir = await copyApp('verify-pass')
    result = await run('npm', ['run', 'verify'], dir)
  })
  afterAll(() => remove(dir))

  it('exits zero with a clear pass result', () => {
    expect(result.code, result.output).toBe(0)
    expect(result.output).toContain('[verify] PASS verification complete')
    expect(result.output).not.toMatch(/FAIL/)
  })

  it('builds, finds the registered sample, and renders all nine steps in order', () => {
    expect(result.output).toContain('PASS build')
    expect(result.output).toContain('PASS registry (how-to-make-a-presentation)')
    expect(result.output).toContain('PASS render how-to-make-a-presentation (9 steps, observed step indices 0,1,2,3,4,5,6,7,8)')
  })

  it('runs the preview on the IPv4 loopback address and cleans it up', async () => {
    const port = previewPort(result.output)
    expect(port).toBeTypeOf('number')
    expect(result.output).not.toMatch(/localhost/)
    expect(await portIsClosed(port!)).toBe(true)
  })
})

interface Fault {
  name: string
  expectPhase: string
  expectStep?: number
  apply: (dir: string) => Promise<void>
}

const faults: Fault[] = [
  {
    name: 'a build-breaking edit',
    expectPhase: 'build',
    apply: (dir) => edit(path.join(dir, 'src/routing.ts'), (t) => `${t}\nexport const broken: number = 'not a number'\n`),
  },
  {
    name: 'a missing sample registration',
    expectPhase: 'sample',
    apply: (dir) =>
      edit(path.join(dir, 'src/presentations/index.ts'), (t) => t.replace(/\{\s*slug: 'how-to-make-a-presentation'[\s\S]*?\},\n/, '') + '\n// removed\n')
        .then(() =>
          edit(path.join(dir, 'src/presentations/index.ts'), (t) =>
            t.replace('= [', "= [\n  { slug: 'other', title: 'Other', load: () => import('./how-to-make-a-presentation/Talk') },"),
          ),
        ),
  },
  {
    name: 'an out-of-order sample',
    expectPhase: 'sample',
    expectStep: 0,
    apply: (dir) =>
      edit(path.join(dir, SAMPLE, 'meta.ts'), (t) =>
        t.replace("'You have a topic'", '@@').replace("'The skill interviews you'", "'You have a topic'").replace('@@', "'The skill interviews you'"),
      ),
  },
  {
    name: 'a step that logs a console error',
    expectPhase: 'render',
    expectStep: 3,
    apply: (dir) =>
      edit(path.join(dir, SAMPLE, 'SampleScene.tsx'), (t) =>
        t.replace('export function SampleScene({ payload }: SceneProps<SamplePayload>) {\n', "export function SampleScene({ payload }: SceneProps<SamplePayload>) {\n  if (payload.step === 4) console.error('injected console failure')\n"),
      ),
  },
  {
    name: 'a step that throws an uncaught page error',
    expectPhase: 'render',
    expectStep: 5,
    apply: (dir) =>
      edit(path.join(dir, SAMPLE, 'SampleScene.tsx'), (t) =>
        t.replace('export function SampleScene({ payload }: SceneProps<SamplePayload>) {\n', "export function SampleScene({ payload }: SceneProps<SamplePayload>) {\n  if (payload.step === 6) setTimeout(() => { throw new Error('injected page error') }, 0)\n"),
      ),
  },
  {
    name: 'an error that fires while the final reveal animates in',
    expectPhase: 'render',
    expectStep: 8,
    apply: (dir) =>
      edit(path.join(dir, SAMPLE, 'SampleScene.tsx'), (t) =>
        t.replace('export function SampleScene({ payload }: SceneProps<SamplePayload>) {\n', "export function SampleScene({ payload }: SceneProps<SamplePayload>) {\n  if (payload.step === 9) setTimeout(() => console.error('late animation failure'), 900)\n"),
      ),
  },
  {
    name: 'a transition that does not advance the step index',
    expectPhase: 'render',
    expectStep: 3,
    apply: (dir) =>
      edit(path.join(dir, 'src/presentation-kit/usePresentationNav.ts'), (t) =>
        t.replace('setIndex((i) => clampIndex(i + 1, count))', 'setIndex((i) => (i === 2 ? i : clampIndex(i + 1, count)))'),
      ),
  },
]

describe('E2E-002: verification failures are actionable', () => {
  for (const fault of faults) {
    it(`fails with the phase named for ${fault.name}`, async () => {
      const dir = await copyApp('verify-fail')
      try {
        await fault.apply(dir)
        const result = await run('node', ['scripts/verify.mjs', '--canonical-sample'], dir)
        expect(result.code, result.output).not.toBe(0)
        expect(result.stderr).toContain(`[verify] FAIL ${fault.expectPhase}:`)
        expect(result.output).not.toContain('PASS verification complete')
        if (fault.expectStep !== undefined) expect(result.stderr).toContain(`step index ${fault.expectStep}`)
        const port = previewPort(result.output)
        if (port !== undefined) expect(await portIsClosed(port)).toBe(true)
      } finally {
        await remove(dir)
      }
    })
  }
})
