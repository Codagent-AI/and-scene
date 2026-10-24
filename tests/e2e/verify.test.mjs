import net from 'node:net'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, copyRepo, edit, run } from '../helpers.mjs'

afterAll(cleanup)

const verify = (dir) => run(process.execPath, ['scripts/verify.mjs'], { cwd: dir })

const portOpen = (port) =>
  new Promise((resolve) => {
    const s = net.connect(port, '127.0.0.1')
    s.once('connect', () => (s.destroy(), resolve(true)))
    s.once('error', () => resolve(false))
  })

async function expectPreviewStopped(out) {
  const port = out.match(/http:\/\/127\.0\.0\.1:(\d+)/)?.[1]
  expect(port, 'preview URL should be reported on 127.0.0.1').toBeDefined()
  expect(await portOpen(Number(port))).toBe(false)
}

describe('E2E-001: reference presentation passes production verification', () => {
  let result
  beforeAll(async () => {
    result = await verify(copyRepo())
  })

  it('exits zero with a clear pass result', () => {
    expect(result.out).toContain('[verify] PASS')
    expect(result.code).toBe(0)
  })

  it('renders all nine steps of the registered sample', () => {
    expect(result.out).toContain('how-to-make-a-presentation: rendered 9 steps without errors')
  })

  it('serves the preview and drives the browser on 127.0.0.1 only', async () => {
    expect(result.out).toMatch(/preview ready at http:\/\/127\.0\.0\.1:\d+/)
    expect(result.out).not.toMatch(/localhost/)
    await expectPreviewStopped(result.out)
  })
})

describe('E2E-002: verification failures are actionable', () => {
  const faults = [
    {
      name: 'a build error',
      phase: 'build',
      inject: (d) => edit(path.join(d, 'src/Landing.tsx'), (s) => `${s}\nexport const broken: number = 'not a number'\n`),
      expects: /broken|not assignable/,
      previewRan: false,
    },
    {
      name: 'a missing reference sample',
      phase: 'sample',
      inject: (d) => edit(path.join(d, 'src/presentations/index.ts'), (s) => s.replace(/slug: 'how-to-make-a-presentation'/, "slug: 'renamed-sample'")),
      expects: /how-to-make-a-presentation.*not registered/,
      previewRan: false,
    },
    {
      name: 'an out-of-order sample',
      phase: 'sample',
      inject: (d) =>
        edit(path.join(d, 'src/presentations/how-to-make-a-presentation/steps/outline.ts'), (s) =>
          s.replace('You have a topic', 'TEMP').replace('The skill interviews you', 'You have a topic').replace('TEMP', 'The skill interviews you'),
        ),
      expects: /step 0: title\/caption do not match/,
      previewRan: true,
    },
    {
      name: 'a console error on one step',
      phase: 'render',
      inject: (d) =>
        edit(path.join(d, 'src/presentations/how-to-make-a-presentation/steps/SampleScene.tsx'), (s) =>
          s
            .replace("import { Check,", "import { useEffect } from 'react'\nimport { Check,")
            .replace('return (\n    <SceneLayer>', "useEffect(() => {\n    if (stage === 4) console.error('boom on four')\n  }, [stage])\n  return (\n    <SceneLayer>"),
        ),
      expects: /\(render\).*console\.error at step 3: boom on four/,
      previewRan: true,
    },
    {
      name: 'an uncaught page error on one step',
      phase: 'render',
      inject: (d) =>
        edit(path.join(d, 'src/presentations/how-to-make-a-presentation/steps/SampleScene.tsx'), (s) =>
          s
            .replace("import { Check,", "import { useEffect } from 'react'\nimport { Check,")
            .replace('return (\n    <SceneLayer>', "useEffect(() => {\n    if (stage === 6) setTimeout(() => { throw new Error('late failure') }, 0)\n  }, [stage])\n  return (\n    <SceneLayer>"),
        ),
      expects: /\(render\).*uncaught exception at step 5: late failure/,
      previewRan: true,
    },
    {
      name: 'a transition that does not advance the step index',
      phase: 'render',
      inject: (d) =>
        edit(path.join(d, 'src/presentation-kit/usePresentationNav.ts'), (s) =>
          s.replace('const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])', 'const next = useCallback(() => setIndex((i) => (i === 3 ? i : clampIndex(i + 1, count))), [count])'),
        ),
      expects: /\(render\).*step 3: transition to step 4 did not advance/,
      previewRan: true,
    },
  ]

  for (const fault of faults) {
    it(`fails non-zero, names the phase and offender, and cleans up for ${fault.name}`, async () => {
      const dir = copyRepo()
      fault.inject(dir)
      const result = await verify(dir)
      expect(result.code).not.toBe(0)
      expect(result.out).toContain(`[verify] FAIL (${fault.phase})`)
      expect(result.out).not.toContain('[verify] PASS')
      expect(result.out).toMatch(fault.expects)
      if (fault.previewRan) await expectPreviewStopped(result.out)
    })
  }
})
