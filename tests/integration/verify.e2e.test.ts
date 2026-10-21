import os from 'node:os'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { copyRepo, mutate, portIsClosed, previewPort, run } from './helpers'
import type { Result } from './helpers'

// Same literals as the verifier's configuration, transcribed independently.
const TITLES = [
  'You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth',
  'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one",
]

const verify = (dir: string, args: string[] = []) => run(process.execPath, [path.join(dir, 'scripts/verify.mjs'), ...args], os.tmpdir())

describe('E2E-001: reference presentation passes production verification', () => {
  let dir: string
  let result: Result

  beforeAll(async () => {
    dir = await copyRepo()
    result = await verify(dir) // invoked from outside the checkout
  })

  it('exits zero with a clear pass result', () => {
    expect(result.code, result.output).toBe(0)
    expect(result.output).toMatch(/^verify: PASS .*9 steps of "how-to-make-a-presentation"/m)
    expect(result.output).not.toMatch(/FAIL/)
  })

  it('runs each phase in order: build, registered sample, production render', () => {
    const phases = [...result.output.matchAll(/^\[verify\] (build|sample|render): ok$/gm)].map((m) => m[1])
    expect(phases).toEqual(['build', 'sample', 'render'])
  })

  it('observes every step index 0-8 in sequence with the normative titles', () => {
    const seen = [...result.output.matchAll(/^\[verify\] step (\d+) ok: (.*)$/gm)].map((m) => [Number(m[1]), m[2]])
    expect(seen).toEqual(TITLES.map((title, i) => [i, title]))
  })

  it('uses 127.0.0.1 for the preview host, readiness probe and browser URL', () => {
    expect(result.output).toMatch(/^\[verify\] preview: http:\/\/127\.0\.0\.1:\d+ \(127\.0\.0\.1\)$/m)
    expect(result.output).toMatch(/^\[verify\] browser: http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation$/m)
    expect(result.output).not.toMatch(/localhost/)
  })

  it('stops the preview server when it finishes', async () => {
    expect(await portIsClosed(previewPort(result.output))).toBe(true)
  })
})

interface Fault {
  name: string
  inject: (dir: string) => Promise<void>
  phase: 'build' | 'sample' | 'render'
  message: RegExp
  step?: number
  args?: string[]
}

const SCENE = 'src/presentations/how-to-make-a-presentation/DiagramScene.tsx'
const SCENE_ANCHOR = 'const { stage } = payload\n'

const FAULTS: Fault[] = [
  {
    name: 'a type error in another presentation (whole-app build)',
    phase: 'build',
    message: /npm run build failed/,
    inject: async (dir) => {
      const { mkdir, writeFile } = await import('node:fs/promises')
      await mkdir(path.join(dir, 'src/presentations/broken'), { recursive: true })
      await writeFile(path.join(dir, 'src/presentations/broken/Talk.tsx'), "const n: number = 'not a number'\nexport default function Talk() { return <p>{n}</p> }\n")
      await mutate(dir, 'src/presentations/index.ts', '\n]', "\n  { slug: 'broken', title: 'Broken', load: () => import('./broken/Talk') },\n]")
    },
  },
  {
    name: 'the sample missing from the registry',
    phase: 'sample',
    message: /"how-to-make-a-presentation" is not registered/,
    inject: (dir) => mutate(dir, 'src/presentations/index.ts', "slug: 'how-to-make-a-presentation'", "slug: 'renamed-sample'"),
  },
  {
    name: 'a malformed sample title',
    phase: 'sample',
    message: /sample title is "How to Use This Skill"/,
    inject: (dir) => mutate(dir, 'src/presentations/index.ts', "title: 'How to Use This Skill to Make a Presentation'", "title: 'How to Use This Skill'"),
  },
  {
    name: 'sample steps out of order',
    phase: 'render',
    step: 2,
    message: /step 2: title is "The deck grows", expected "Answers become steps"/,
    inject: async (dir) => {
      const file = 'src/presentations/how-to-make-a-presentation/steps.ts'
      // Swap the titles of beats 3 and 4.
      const { readFile, writeFile } = await import('node:fs/promises')
      const target = path.join(dir, file)
      const lines = (await readFile(target, 'utf8')).split('\n')
      const a = lines.findIndex((l) => l.includes("title: 'Answers become steps'"))
      const b = lines.findIndex((l) => l.includes("title: 'The deck grows'"))
      ;[lines[a], lines[b]] = [lines[b], lines[a]]
      await writeFile(target, lines.join('\n'))
    },
  },
  {
    name: 'a console error while rendering a step',
    phase: 'render',
    step: 4,
    message: /console error at step 4: injected console failure/,
    inject: (dir) => mutate(dir, SCENE, SCENE_ANCHOR, `${SCENE_ANCHOR}  if (stage === 4) console.error('injected console failure')\n`),
  },
  {
    name: 'an uncaught page error after a step renders',
    phase: 'render',
    step: 5,
    message: /uncaught error at step 5: injected uncaught failure/,
    inject: (dir) => mutate(dir, SCENE, SCENE_ANCHOR, `${SCENE_ANCHOR}  if (stage === 5) setTimeout(() => { throw new Error('injected uncaught failure') }, 0)\n`),
  },
  {
    name: 'a step that throws while rendering',
    phase: 'render',
    step: 6,
    message: /step 6 did not render \(presentation unmounted\)/,
    inject: (dir) => mutate(dir, SCENE, SCENE_ANCHOR, `${SCENE_ANCHOR}  if (stage === 6) throw new Error('injected render crash')\n`),
  },
  {
    name: 'an error raised when the final step\'s entrance animation completes',
    phase: 'render',
    step: 8,
    message: /uncaught error at step 8: injected late failure/,
    inject: (dir) => mutate(dir, SCENE, SCENE_ANCHOR, `${SCENE_ANCHOR}  if (stage === 8) setTimeout(() => { throw new Error('injected late failure') }, 1100)\n`),
  },
  {
    name: 'a console error in another presentation selected by slug',
    phase: 'render',
    step: 0,
    args: ['other'],
    message: /console error at step 0: other presentation failure/,
    inject: async (dir) => {
      const { mkdir, writeFile } = await import('node:fs/promises')
      await mkdir(path.join(dir, 'src/presentations/other'), { recursive: true })
      await writeFile(
        path.join(dir, 'src/presentations/other/Talk.tsx'),
        "import { Presentation } from '../../presentation-kit'\nfunction Scene() { console.error('other presentation failure'); return null }\nconst STEPS = [{ id: 'a', era: 'e', title: 'A', caption: 'a', Scene, payload: undefined }]\nexport default function Talk() { return <Presentation steps={STEPS} title=\"Other\" /> }\n",
      )
      await mutate(dir, 'src/presentations/index.ts', '\n]', "\n  { slug: 'other', title: 'Other', load: () => import('./other/Talk') },\n]")
    },
  },
  {
    name: 'a transition that does not advance the public step index',
    phase: 'render',
    step: 4,
    message: /transition to step 4 failed: step index stayed at 3/,
    inject: (dir) => mutate(dir, 'src/presentation-kit/usePresentationNav.ts', 'setIndex(Math.min(index + 1, last))', 'setIndex(Math.min(index + 1, last, 3))'),
  },
]

describe('E2E-002: verification failures are actionable', () => {
  const results = new Map<string, Result>()

  beforeAll(async () => {
    for (const fault of FAULTS) {
      const dir = await copyRepo()
      await fault.inject(dir)
      results.set(fault.name, await verify(dir, fault.args))
    }
  })

  it.each(FAULTS.map((f) => [f.name, f] as const))('fails for %s', async (_name, fault) => {
    const { code, output } = results.get(fault.name)!
    expect(code, output).not.toBe(0)
    expect(output).toContain(`verify: FAIL (${fault.phase})`)
    expect(output).toMatch(fault.message)
    expect(output).not.toMatch(/verify: PASS/)
    if (fault.args) expect(output).toContain(`/${fault.args[0]}`)
    if (fault.step !== undefined) expect(output).toContain(`step ${fault.step}`)
    if (fault.phase === 'render') expect(await portIsClosed(previewPort(output))).toBe(true)
  })

  it('does not run the render phase after a build or sample failure', () => {
    for (const name of [FAULTS[0].name, FAULTS[1].name, FAULTS[2].name]) {
      expect(results.get(name)!.output).not.toMatch(/\[verify\] preview:/)
    }
  })
})
