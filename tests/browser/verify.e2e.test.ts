import { afterAll, describe, expect, it } from 'vitest'
import { cleanupTempDirs, copyRepo, editFile, previewIsGone, previewUrls, runNpm } from './helpers'
import path from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'

afterAll(cleanupTempDirs)

const SAMPLE = 'src/presentations/how-to-make-a-presentation'
const TITLES = [
  'You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth',
  'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one",
]

describe('E2E-001: reference presentation passes production verification', () => {
  it('builds, previews on 127.0.0.1 and steps through all nine steps with a clear pass', async () => {
    const dir = copyRepo('e2e1-')
    const { code, output } = await runNpm(dir, ['run', 'verify'])
    expect(output).toMatch(/PASS verify: build, sample, render \(1 presentation\(s\), 9 step\(s\)\)/)
    expect(code).toBe(0)
    // registered and reachable
    expect(output).toContain('opening http://127.0.0.1:')
    expect(output).toContain('/how-to-make-a-presentation')
    // every step index observed in order, with nothing failing
    const order = [...output.matchAll(/how-to-make-a-presentation: step (\d) \(index (\d)\) ok/g)].map((m) => [Number(m[1]), Number(m[2])])
    expect(order).toEqual(TITLES.map((_, i) => [i + 1, i]))
    expect(output).not.toMatch(/FAIL|console\.error|uncaught/)
    // host, readiness probe and browser URL all use the IPv4 loopback address
    expect(output).toMatch(/preview listening on http:\/\/127\.0\.0\.1:\d+/)
    expect(output).toMatch(/readiness probe http:\/\/127\.0\.0\.1:\d+\//)
    expect(output).toMatch(/opening http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation/)
    expect(new Set(previewUrls(output).map((u) => new URL(u).hostname))).toEqual(new Set(['127.0.0.1']))
    expect(output).not.toMatch(/localhost/)
    expect(await previewIsGone(output)).toBe(true)
  })
})

describe('E2E-002: verification failures are actionable', () => {
  const faults: Array<{
    name: string
    phase: string
    mustMatch: RegExp[]
    previewStarts: boolean
    apply: (dir: string) => void
  }> = [
    {
      name: 'a type error in a second registered presentation fails the build',
      phase: 'build',
      previewStarts: false,
      mustMatch: [/second\/Talk\.tsx/],
      apply: (dir) => {
        mkdirSync(path.join(dir, 'src/presentations/second'), { recursive: true })
        writeFileSync(path.join(dir, 'src/presentations/second/Talk.tsx'), "export default function Talk() {\n  const n: number = 'not a number'\n  return <p>{n}</p>\n}\n")
        editFile(path.join(dir, 'src/presentations/index.ts'), (s) =>
          s.replace(/\n\]/, "\n  { slug: 'second', title: 'Second', load: () => import('./second/Talk') },\n]"),
        )
      },
    },
    {
      name: 'a missing reference sample fails',
      phase: 'sample',
      previewStarts: false,
      mustMatch: [/"how-to-make-a-presentation" is not registered/],
      apply: (dir) => editFile(path.join(dir, 'src/presentations/index.ts'), (s) => s.replace(/= \[[\s\S]*\n\]/, '= []')),
    },
    {
      name: 'an out-of-order sample fails naming the step',
      phase: 'sample',
      previewStarts: true,
      mustMatch: [/title is "The skill interviews you" but should be "You have a topic" at step 1 \(index 0\)/],
      apply: (dir) => {
        editFile(path.join(dir, SAMPLE, 'steps/step1.tsx'), (s) => s.replace('You have a topic', 'The skill interviews you'))
      },
    },
    {
      name: 'a console error on a later step fails naming that step',
      phase: 'render',
      previewStarts: true,
      mustMatch: [/console\.error: boom-console at step 4 \(index 3\)/],
      apply: (dir) =>
        editFile(path.join(dir, SAMPLE, 'Scene.tsx'), (s) =>
          s
            .replace("import { Check,", "import { useEffect } from 'react'\nimport { Check,")
            .replace('export function StoryScene({ payload }: SceneProps<StoryPayload>) {', "export function StoryScene({ payload }: SceneProps<StoryPayload>) {\n  useEffect(() => {\n    if (payload.stage === 4) console.error('boom-console')\n  }, [payload.stage])"),
        ),
    },
    {
      name: 'an uncaught exception on the final step fails naming that step',
      phase: 'render',
      previewStarts: true,
      mustMatch: [/uncaught exception: boom-page at step 9 \(index 8\)/],
      apply: (dir) =>
        editFile(path.join(dir, SAMPLE, 'Scene.tsx'), (s) =>
          s
            .replace("import { Check,", "import { useEffect } from 'react'\nimport { Check,")
            .replace('export function StoryScene({ payload }: SceneProps<StoryPayload>) {', "export function StoryScene({ payload }: SceneProps<StoryPayload>) {\n  useEffect(() => {\n    if (payload.stage === 9) setTimeout(() => { throw new Error('boom-page') }, 0)\n  }, [payload.stage])"),
        ),
    },
    {
      name: 'a transition that never advances the public step index fails naming the step',
      phase: 'render',
      previewStarts: true,
      mustMatch: [/transition did not advance to step 5 \(index 4\)/],
      apply: (dir) =>
        editFile(path.join(dir, SAMPLE, 'Talk.tsx'), (s) =>
          `${s}\nwindow.addEventListener('keydown', (e) => {\n  if (e.key === 'ArrowRight' && document.querySelector('[data-step-index="3"]')) e.stopImmediatePropagation()\n}, true)\n`,
        ),
    },
  ]

  it.each(faults)('$name', async ({ phase, mustMatch, previewStarts, apply }) => {
    const dir = copyRepo('e2e2-')
    apply(dir)
    const { code, output } = await runNpm(dir, ['run', 'verify'])
    expect(code).not.toBe(0)
    expect(output).toContain(`FAIL verify [${phase}]`)
    expect(output).not.toMatch(/PASS verify/)
    for (const pattern of mustMatch) expect(output).toMatch(pattern)
    expect(output.includes('preview listening')).toBe(previewStarts)
    expect(await previewIsGone(output)).toBe(true)
  })
})
