import { appendFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { copyRepo, isListening, previewPorts, remove, run, type RunResult } from '../support/sandbox'

// E2E-002: one representative fault per verification phase, each in its own disposable copy.
const copies: string[] = []
afterAll(() => copies.forEach(remove))

const SAMPLE = 'src/presentations/how-to-make-a-presentation'

async function verifyFaulty(inject: (dir: string) => void): Promise<RunResult> {
  const dir = copyRepo()
  copies.push(dir)
  inject(dir)
  return run('npm', ['run', 'verify'], { cwd: dir, env: { VERIFY_STEP_TIMEOUT: '2000' } })
}

const edit = (dir: string, rel: string, change: (text: string) => string) => {
  const file = path.join(dir, rel)
  const before = readFileSync(file, 'utf8')
  const after = change(before)
  expect(after, `${rel} was not changed`).not.toBe(before)
  writeFileSync(file, after)
}

async function expectFailure(result: RunResult, phase: string, step?: number) {
  expect(result.code, result.output).not.toBe(0)
  expect(result.output).toMatch(new RegExp(`^VERIFY FAIL phase=${phase}${step === undefined ? '' : ` step=${step}`}\\b`, 'm'))
  expect(result.output).not.toMatch(/VERIFY PASS/)
  for (const port of previewPorts(result.output)) expect(await isListening(port), `preview port ${port} still listening`).toBe(false)
}

describe('E2E-002: verification failures are actionable', () => {
  it('a build-breaking edit outside the sample fails the build phase before any browser work', async () => {
    const result = await verifyFaulty((dir) => appendFileSync(path.join(dir, 'src/Landing.tsx'), "\nexport const broken: number = 'not a number'\n"))
    await expectFailure(result, 'build')
    expect(result.output).toMatch(/error TS2322/)
    expect(result.output).not.toMatch(/\[preview\]|phase render|phase sample/)
  })

  it('a missing reference sample fails the sample phase', async () => {
    const result = await verifyFaulty((dir) => {
      rmSync(path.join(dir, SAMPLE), { recursive: true })
      edit(dir, 'src/presentations/index.ts', (t) => t.replace(/\s*\{\s*slug: 'how-to-make-a-presentation'[\s\S]*?\},\n/, '\n'))
    })
    await expectFailure(result, 'sample')
    expect(result.output).toMatch(/reference sample "how-to-make-a-presentation" is not registered/)
    expect(result.output).not.toMatch(/\[preview\]/)
  })

  it('an out-of-order sample fails the sample phase naming the first wrong step', async () => {
    const result = await verifyFaulty((dir) => {
      const one = path.join(dir, SAMPLE, 'steps/step1.ts')
      const two = path.join(dir, SAMPLE, 'steps/step2.ts')
      const [a, b] = [readFileSync(one, 'utf8'), readFileSync(two, 'utf8')]
      writeFileSync(one, a.replace(/title: .*,/, (m) => b.match(/title: .*,/)![0] ?? m))
      writeFileSync(two, b.replace(/title: .*,/, (m) => a.match(/title: .*,/)![0] ?? m))
    })
    await expectFailure(result, 'sample', 0)
    expect(result.output).toMatch(/step 1 title is "The skill interviews you", expected "You have a topic"/)
  })

  it('a step that emits a console error fails the render phase naming that step', async () => {
    const result = await verifyFaulty((dir) =>
      edit(dir, `${SAMPLE}/Scene.tsx`, (t) =>
        t.replace("import type { ReactNode } from 'react'", "import { useEffect, type ReactNode } from 'react'").replace(
          '  const step = payload.step\n',
          "  const step = payload.step\n  useEffect(() => {\n    if (step === 5) console.error('injected fault')\n  }, [step])\n",
        ),
      ),
    )
    await expectFailure(result, 'render', 4)
    expect(result.output).toMatch(/console\.error on step index 4: injected fault/)
  })

  it('a step that throws an uncaught page error fails the render phase naming that step', async () => {
    const result = await verifyFaulty((dir) =>
      edit(dir, `${SAMPLE}/Scene.tsx`, (t) =>
        t.replace("import type { ReactNode } from 'react'", "import { useEffect, type ReactNode } from 'react'").replace(
          '  const step = payload.step\n',
          "  const step = payload.step\n  useEffect(() => {\n    if (step === 7) setTimeout(() => { throw new Error('injected page error') }, 0)\n  }, [step])\n",
        ),
      ),
    )
    await expectFailure(result, 'render', 6)
    expect(result.output).toMatch(/pageerror on step index 6: injected page error/)
  })

  it('a transition that does not advance the public step index fails the transition phase', async () => {
    const result = await verifyFaulty((dir) =>
      edit(dir, 'src/presentation-kit/usePresentationNav.ts', (t) => t.replace('setIndex((i) => Math.min(i + 1, last))', 'setIndex((i) => (i >= 2 ? i : Math.min(i + 1, last)))')),
    )
    await expectFailure(result, 'transition', 2)
    expect(result.output).toMatch(/ArrowRight on step 2 did not advance data-step-index to 3/)
  })
})
