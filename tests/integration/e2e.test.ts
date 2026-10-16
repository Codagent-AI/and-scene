import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { cleanupTemp, copyProject, portClosed, repoRoot, run, tempDir } from './helpers'

afterAll(cleanupTemp)

describe('E2E-001: reference presentation passes production verification', () => {
  it('builds, renders all nine steps on 127.0.0.1, and exits zero with a clear pass', () => {
    const res = run('npm', ['run', 'verify'], { cwd: repoRoot })
    expect(res.status).toBe(0)
    expect(res.output).toContain('[verify] build: ok')
    expect(res.output).toMatch(/\[verify\] registry: ok \(.*how-to-make-a-presentation/)
    expect(res.output).toMatch(/rendered how-to-make-a-presentation: 9 steps via http:\/\/127\.0\.0\.1:\d+/)
    expect(res.output).toMatch(/\[verify\] preview: http:\/\/127\.0\.0\.1:\d+/)
    expect(res.output).not.toMatch(/localhost|\[::1\]/)
    expect(res.output).toContain('[verify] PASS')
  })
})

describe('E2E-002: verification failures are actionable', () => {
  const edit = (dir: string, rel: string, fn: (s: string) => string) => {
    const file = path.join(dir, rel)
    writeFileSync(file, fn(readFileSync(file, 'utf8')))
  }
  const faults: { name: string; phase: string; step?: number; mutate: (dir: string) => void; expectText?: RegExp }[] = [
    {
      name: 'a build-breaking edit',
      phase: 'build',
      mutate: (d) => edit(d, 'src/presentation-kit/constants.ts', (s) => `${s}\nexport const broken: number = 'not a number'\n`),
    },
    {
      name: 'a missing sample registration',
      phase: 'registry',
      mutate: (d) =>
        edit(d, 'src/presentations/index.ts', (s) => s.replace(/\{\s*slug: 'how-to-make-a-presentation'[\s\S]*?\},\n/, '')),
      expectText: /how-to-make-a-presentation.*not registered/,
    },
    {
      name: 'an out-of-order sample',
      phase: 'render',
      step: 0,
      mutate: (d) =>
        edit(d, 'src/presentations/how-to-make-a-presentation/steps/index.ts', (s) =>
          s.replace('  step1,\n  step2,\n', '  step2,\n  step1,\n'),
        ),
      expectText: /does not match/,
    },
    {
      name: 'a step that emits a browser error',
      phase: 'render',
      step: 2,
      mutate: (d) =>
        edit(d, 'src/presentations/how-to-make-a-presentation/steps/SampleScene.tsx', (s) =>
          s.replace('  const cardsShown', "  if (n === 3) console.error('boom from step three')\n  const cardsShown"),
        ),
      expectText: /boom from step three/,
    },
    {
      name: 'a transition that does not advance the step index',
      phase: 'render',
      step: 1,
      mutate: (d) => edit(d, 'src/presentation-kit/usePresentationNav.ts', (s) => s.replace("const NEXT_KEYS = ['ArrowRight', ' ', 'PageDown']", 'const NEXT_KEYS: string[] = []')),
      expectText: /did not advance/,
    },
  ]

  for (const fault of faults) {
    it(`fails non-zero naming the failed phase for ${fault.name}`, async () => {
      const dir = tempDir('e2e')
      copyProject(repoRoot, path.join(dir, 'app'), ['skills', 'tests'])
      const app = path.join(dir, 'app')
      fault.mutate(app)
      const res = run('node', ['scripts/verify.mjs'], { cwd: app })
      expect(res.status).not.toBe(0)
      expect(res.output).not.toContain('[verify] PASS')
      const stepPart = fault.step === undefined ? '' : ` step=${fault.step}`
      expect(res.output).toContain(`[verify] FAIL phase=${fault.phase}${stepPart}`)
      if (fault.expectText) expect(res.output).toMatch(fault.expectText)
      const origin = res.output.match(/\[verify\] preview: (http:\/\/127\.0\.0\.1:\d+)/)?.[1]
      if (fault.phase === 'render') {
        expect(origin).toBeDefined()
        expect(await portClosed(origin!)).toBe(true)
      }
    })
  }
})
