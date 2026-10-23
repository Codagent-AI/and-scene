import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { cleanupDirs, copyRepo, edit, previewIsGone, repoRoot, run } from './helpers'

afterAll(cleanupDirs)

const sample = 'src/presentations/how-to-make-a-presentation'

describe('E2E: reference presentation passes production verification', () => {
  it('builds, renders all nine steps on 127.0.0.1, and exits zero with a clear pass', async () => {
    const result = run('node', ['scripts/verify.mjs'], repoRoot)
    expect(result.status, result.output).toBe(0)
    expect(result.stdout).toMatch(/PASS verify: build ok, 1 presentation\(s\), 9 step\(s\) rendered/)
    expect(result.stdout).toContain('/how-to-make-a-presentation rendered 9 steps')
    expect(result.stdout).toMatch(/preview at http:\/\/127\.0\.0\.1:\d+/)
    expect(await previewIsGone(result.stdout)).toBe(true)
  })
})

describe('E2E: verification failures are actionable', () => {
  const faults: {
    name: string
    phase: string
    mention: RegExp
    apply: (dir: string) => void
  }[] = [
    {
      name: 'a build-breaking edit',
      phase: 'build',
      mention: /main\.tsx/,
      apply: (dir) => edit(path.join(dir, 'src/main.tsx'), (s) => `${s}\nconst broken: number = 'text'\nexport { broken }\n`),
    },
    {
      name: 'a missing reference sample',
      phase: 'sample',
      mention: /not registered/,
      apply: (dir) =>
        edit(path.join(dir, 'src/presentations/index.ts'), (s) =>
          s.replace(/\[\n[\s\S]*\n\]/, '[]'),
        ),
    },
    {
      name: 'an out-of-order sample',
      phase: 'sample',
      mention: /step 1 title/,
      apply: (dir) =>
        edit(path.join(dir, `${sample}/steps/index.ts`), (s) =>
          s.replace('[s1, s2, ', '[s2, s1, '),
        ),
    },
    {
      name: 'a step that logs a console error',
      phase: 'render',
      mention: /step 5: console error: .*boom-step/,
      apply: (dir) =>
        edit(path.join(dir, `${sample}/Scene.tsx`), (s) =>
          s
            .replace('{ payload }: SceneProps<SamplePayload>', '{ payload, index }: SceneProps<SamplePayload>')
            .replace('  return <SceneLayer>', "  if (index === 4) console.error('boom-step')\n  return <SceneLayer>"),
        ),
    },
    {
      name: 'a step that throws an uncaught error',
      phase: 'render',
      mention: /step 3: uncaught page error: .*late-boom/,
      apply: (dir) =>
        edit(path.join(dir, `${sample}/Scene.tsx`), (s) =>
          s
            .replace('{ payload }: SceneProps<SamplePayload>', '{ payload, index }: SceneProps<SamplePayload>')
            .replace(
              '  return <SceneLayer>',
              "  if (index === 2) setTimeout(() => { throw new Error('late-boom') }, 0)\n  return <SceneLayer>",
            ),
        ),
    },
    {
      name: 'a transition that never advances the step index',
      phase: 'render',
      mention: /step 4: transition did not advance/,
      apply: (dir) =>
        edit(path.join(dir, 'src/presentation-kit/usePresentationNav.ts'), (s) =>
          s.replace('Math.min(index, Math.max(count - 1, 0))', 'Math.min(index, 2, Math.max(count - 1, 0))'),
        ),
    },
  ]

  for (const fault of faults) {
    it(`fails on ${fault.name}, naming the phase, and cleans up the preview`, async () => {
      const dir = copyRepo()
      fault.apply(dir)
      const result = run('node', ['scripts/verify.mjs'], dir)
      expect(result.status, result.output).not.toBe(0)
      expect(result.stderr).toContain(`FAIL verify [${fault.phase}]`)
      expect(result.output).toMatch(fault.mention)
      expect(result.stdout).not.toContain('PASS verify')
      if (fault.phase !== 'build') expect(await previewIsGone(result.stdout)).toBe(true)
    })
  }
})
