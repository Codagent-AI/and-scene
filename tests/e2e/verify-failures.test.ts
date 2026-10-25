// E2E-002: verification failures are actionable.
import fs from 'node:fs'
import { afterAll, describe, expect, it } from 'vitest'
import { copyRepo, edit } from '../helpers/copy.ts'
import { sh, type Result } from '../helpers/materialize.ts'

const dirs: string[] = []
afterAll(() => {
  for (const d of dirs) fs.rmSync(d, { recursive: true, force: true })
})

/** Copies the repo, injects one fault, runs verification, and checks nothing is left behind. */
async function verifyWithFault(name: string, fault: (dir: string) => void): Promise<Result> {
  const dir = copyRepo(`and-scene-e2e002-${name}`)
  dirs.push(dir)
  fault(dir)
  const run = sh('npm', ['run', 'verify'], dir)
  const preview = /preview ready at (http:\/\/127\.0\.0\.1:\d+)/.exec(run.out)
  if (preview) await expect(fetch(preview[1], { signal: AbortSignal.timeout(2000) })).rejects.toThrow()
  expect(run.out).not.toContain('VERIFY PASSED')
  return run
}

const SCENE = 'src/presentations/how-to-make-a-presentation/SampleScene.tsx'

describe('E2E-002 verification failure contract', () => {
  it('fails the build phase on a type error and never starts a preview', async () => {
    const run = await verifyWithFault('build', (d) =>
      edit(d, 'src/presentations/how-to-make-a-presentation/entities.ts', (t) => `${t}\nexport const broken: number = 'not a number'\n`),
    )
    expect(run.code).not.toBe(0)
    expect(run.out).toContain('FAIL phase=build')
    expect(run.out).toContain('VERIFY FAILED (phase: build)')
    expect(run.out).not.toContain('preview ready')
  })

  it('fails the sample phase when the reference sample is not registered', async () => {
    const run = await verifyWithFault('missing', (d) =>
      edit(d, 'src/presentations/index.ts', (t) => t.replace(/\{\s*slug: 'how-to-make-a-presentation'[\s\S]*?\},\n/, '')),
    )
    expect(run.code).not.toBe(0)
    expect(run.out).toContain('FAIL phase=sample')
    expect(run.out).toContain('is not registered')
  })

  it('fails the sample phase, naming the step, when the steps are out of order', async () => {
    const run = await verifyWithFault('order', (d) => {
      edit(d, 'src/presentations/how-to-make-a-presentation/steps/index.ts', (t) =>
        t.replace('[step1, step2, step3', '[step2, step1, step3'),
      )
    })
    expect(run.code).not.toBe(0)
    expect(run.out).toContain('FAIL phase=sample presentation=how-to-make-a-presentation step=1')
    expect(run.out).toMatch(/title mismatch: expected "You have a topic", found "The skill interviews you"/)
  })

  it('fails the render phase on a console error and identifies the step', async () => {
    const run = await verifyWithFault('console', (d) =>
      edit(d, SCENE, (t) =>
        t.replace(
          'const shown = new Set<EntityId>(payload.shown)',
          "if (payload.shown.includes(E.tray)) console.error('injected console fault')\n  const shown = new Set<EntityId>(payload.shown)",
        ),
      ),
    )
    expect(run.code).not.toBe(0)
    expect(run.out).toContain('FAIL phase=render presentation=how-to-make-a-presentation step=3 (index 2)')
    expect(run.out).toContain('injected console fault')
  })

  it('fails the render phase on an uncaught page error and identifies the step', async () => {
    const run = await verifyWithFault('pageerror', (d) =>
      edit(d, SCENE, (t) =>
        t.replace(
          'const shown = new Set<EntityId>(payload.shown)',
          "if (payload.shown.includes(E.ghost)) setTimeout(() => { throw new Error('injected page fault') })\n  const shown = new Set<EntityId>(payload.shown)",
        ),
      ),
    )
    expect(run.code).not.toBe(0)
    expect(run.out).toContain('FAIL phase=render presentation=how-to-make-a-presentation step=5 (index 4)')
    expect(run.out).toContain('injected page fault')
  })

  it('fails the render phase when a scene crashes while rendering, naming that step rather than a stalled transition', async () => {
    const run = await verifyWithFault('rendercrash', (d) =>
      edit(d, SCENE, (t) =>
        t.replace(
          'const shown = new Set<EntityId>(payload.shown)',
          "if (payload.shown.includes(E.ghost)) throw new Error('injected render fault')\n  const shown = new Set<EntityId>(payload.shown)",
        ),
      ),
    )
    expect(run.code).not.toBe(0)
    expect(run.out).toContain('FAIL phase=render presentation=how-to-make-a-presentation step=5 (index 4)')
    expect(run.out).toContain('injected render fault')
    expect(run.out).not.toContain('transition did not advance')
  })

  it('fails when an error fires after the final step finishes its entry animation', async () => {
    const run = await verifyWithFault('latefault', (d) =>
      edit(d, SCENE, (t) =>
        t.replace(
          'const shown = new Set<EntityId>(payload.shown)',
          "if (payload.shown.includes(E.frameLabel)) setTimeout(() => console.error('injected late fault'), 900)\n  const shown = new Set<EntityId>(payload.shown)",
        ),
      ),
    )
    expect(run.code).not.toBe(0)
    expect(run.out).toContain('FAIL phase=render presentation=how-to-make-a-presentation step=9 (index 8)')
    expect(run.out).toContain('injected late fault')
  })

  it('fails the render phase when a transition does not advance the step index', async () => {
    const run = await verifyWithFault('transition', (d) =>
      edit(d, 'src/presentation-kit/nav.ts', (t) => t.replace("return { ...state, index: clamp(state.index + 1, count) }", 'return state')),
    )
    expect(run.code).not.toBe(0)
    expect(run.out).toContain('FAIL phase=render presentation=how-to-make-a-presentation step=1 (index 0)')
    expect(run.out).toContain('transition did not advance data-step-index from 0 to 1')
  })
})
