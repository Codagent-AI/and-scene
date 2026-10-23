import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanupSandboxes, copyRepo, edit, leftoverProcesses, run } from '../helpers/sandbox'
import path from 'node:path'

afterAll(cleanupSandboxes)

const verify = (dir: string) => run('npm', ['run', 'verify'], dir)
const SAMPLE = 'src/presentations/how-to-make-a-presentation'

describe('E2E-001: reference presentation passes production verification', () => {
  let dir: string
  let result: Awaited<ReturnType<typeof verify>>
  beforeAll(async () => {
    dir = copyRepo()
    result = await verify(dir)
  })

  it('exits zero with a clear pass result covering all nine steps', () => {
    expect(result.out).toMatch(/PASS verify: 1 presentation\(s\), 9 step\(s\) rendered without errors/)
    expect(result.code).toBe(0)
  })

  it('builds, reads the registry, and renders the registered sample route', () => {
    expect(result.out).toMatch(/\[verify\] build/)
    expect(result.out).toMatch(/\[verify\] registry/)
    expect(result.out).toMatch(/\[verify\] render: how-to-make-a-presentation/)
  })

  it('serves the preview on the IPv4 loopback address only', () => {
    expect(result.out).toMatch(/http:\/\/127\.0\.0\.1:\d+/)
    expect(result.out).not.toMatch(/localhost|\[::1\]/)
  })

  it('leaves no preview process behind', async () => {
    expect(await leftoverProcesses(dir)).toEqual([])
  })
})

describe('E2E-002: verification failures are actionable', () => {
  const faults: { name: string; phase: string; step?: number; expectText?: RegExp; apply: (dir: string) => void }[] = [
    {
      name: 'a build-breaking edit',
      phase: 'build',
      apply: (dir) => edit(path.join(dir, 'src/Landing.tsx'), (t) => `${t}\nexport const broken: number = 'not a number'\n`),
    },
    {
      name: 'a missing sample',
      phase: 'registry',
      expectText: /required presentation "how-to-make-a-presentation" is not registered/,
      apply: (dir) => edit(path.join(dir, 'src/presentations/index.ts'), (t) => t.replace(/slug: 'how-to-make-a-presentation'/, "slug: 'other'")),
    },
    {
      name: 'an out-of-order sample',
      phase: 'outline',
      step: 0,
      expectText: /step 1 title/,
      apply: (dir) =>
        edit(path.join(dir, SAMPLE, 'steps/meta.ts'), (t) =>
          t.replace("title: 'You have a topic'", "title: 'The skill interviews you'").replace("title: 'The skill interviews you',\n    caption: 'One", "title: 'You have a topic',\n    caption: 'One"),
        ),
    },
    {
      name: 'a malformed sample with a missing step',
      phase: 'outline',
      expectText: /expected 9 steps, found 8/,
      apply: (dir) =>
        edit(path.join(dir, SAMPLE, 'steps/index.ts'), (t) => t.replace('STEP_META.map(', 'STEP_META.slice(0, 8).map(')),
    },
    {
      name: 'a step that emits a browser error',
      phase: 'render',
      step: 2,
      expectText: /boom at step 3/,
      apply: (dir) =>
        edit(path.join(dir, SAMPLE, 'steps/SampleScene.tsx'), (t) =>
          t
            .replace("import { Bot,", "import { useEffect } from 'react'\nimport { Bot,")
            .replace('const s = payload.step\n', "const s = payload.step\n  useEffect(() => {\n    if (s === 2) console.error('boom at step 3')\n  }, [s])\n"),
        ),
    },
    {
      name: 'an uncaught page exception',
      phase: 'render',
      step: 4,
      expectText: /uncaught exception: .*uncaught at step 5/,
      apply: (dir) =>
        edit(path.join(dir, SAMPLE, 'steps/SampleScene.tsx'), (t) =>
          t
            .replace("import { Bot,", "import { useEffect } from 'react'\nimport { Bot,")
            .replace('const s = payload.step\n', "const s = payload.step\n  useEffect(() => {\n    if (s === 4) setTimeout(() => { throw new Error('uncaught at step 5') }, 0)\n  }, [s])\n"),
        ),
    },
    {
      name: 'a step that throws while rendering',
      phase: 'render',
      step: 5,
      expectText: /render failure at step 6/,
      apply: (dir) =>
        edit(path.join(dir, SAMPLE, 'steps/SampleScene.tsx'), (t) =>
          t.replace('const s = payload.step\n', "const s = payload.step\n  if (s === 5) throw new Error('render failure at step 6')\n"),
        ),
    },
    {
      name: 'a transition that does not advance the step index',
      phase: 'transition',
      step: 3,
      expectText: /did not advance past step 3/,
      apply: (dir) =>
        edit(path.join(dir, 'src/presentation-kit/usePresentationNav.ts'), (t) =>
          t.replace('setIndex((i) => clampIndex(i + 1, count))', 'setIndex((i) => Math.min(clampIndex(i + 1, count), 3))'),
        ),
    },
  ]

  it.each(faults)('fails non-zero and names the phase for $name', async ({ phase, step, expectText, apply }) => {
    const dir = copyRepo()
    apply(dir)
    const { code, out } = await verify(dir)
    expect(code).not.toBe(0)
    expect(out).toContain(`FAIL verify [${phase}]`)
    expect(out).not.toMatch(/PASS verify/)
    if (step !== undefined) expect(out).toContain(`(step index ${step})`)
    if (expectText) expect(out).toMatch(expectText)
    expect(await leftoverProcesses(dir)).toEqual([])
  })
})
