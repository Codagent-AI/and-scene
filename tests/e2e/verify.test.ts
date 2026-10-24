import { mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { ROOT, readJson } from '../support/files.ts'
import { copyRepo, edit, processExists, remove, run } from '../support/repoCopy.ts'

const config = readJson('verify.config.json').presentations[0]
const copies: string[] = []
afterAll(() => copies.forEach(remove))

const SCENE = 'src/presentations/how-to-make-a-presentation/SampleScene.tsx'
const STEPS = 'src/presentations/how-to-make-a-presentation/steps.ts'

function faultyCopy(mutate: (dir: string) => void) {
  const dir = copyRepo()
  copies.push(dir)
  mutate(dir)
  return dir
}

const verify = (dir: string, extra: string[] = []) => run('node', ['scripts/verify.mjs', ...extra], dir)
const previewOf = (dir: string) => path.join(dir, 'node_modules', 'vite', 'bin', 'vite.js')

describe('E2E-001: the reference presentation passes production verification', () => {
  it('builds, serves on 127.0.0.1, steps through all nine steps and exits zero with a clear pass', async () => {
    const result = await run('npm', ['run', 'verify'], ROOT)
    expect(result.code, result.output).toBe(0)
    const lines = result.output.split('\n')
    expect(lines.some((l) => l.startsWith('PASS verify:'))).toBe(true)
    expect(result.output).not.toMatch(/FAIL/)
    for (let i = 0; i < 9; i++) {
      const line = lines.find((l) => l.includes(`step ${i} ok (${config.steps[i].title})`))
      expect(line, `step ${i}`).toBeTruthy()
    }
    const observed = lines.filter((l) => /step \d ok/.test(l)).map((l) => Number(/step (\d) ok/.exec(l)![1]))
    expect(observed).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(result.output).toMatch(/\[sample\] how-to-make-a-presentation/)
    expect(result.output).toMatch(/http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation/)
    expect(result.output).not.toMatch(/localhost|\[::1\]/)
    expect(await processExists(previewOf(ROOT) + ' preview')).toBe(false)
  })
})

describe('E2E-002: verification failures are actionable', () => {
  const faults: {
    name: string
    phase: string
    mutate: (dir: string) => void
    expectIn: RegExp
    rendered?: boolean
  }[] = [
    {
      name: 'a type error in a presentation that is not the sample breaks the whole-app build',
      phase: 'build',
      expectIn: /npm run build exited/,
      mutate: (dir) => {
        edit(dir, 'src/presentations/index.ts', (t) => t.replace('\n]', "\n  { slug: 'broken', title: 'Broken', load: () => import('./broken/Talk.tsx') },\n]"))
        mkdirSync(path.join(dir, 'src/presentations/broken'), { recursive: true })
        writeFileSync(path.join(dir, 'src/presentations/broken/Talk.tsx'), "const n: number = 'not a number'\nexport default function Talk() { return <p>{n}</p> }\n")
      },
    },
    {
      name: 'a registry without the sample',
      phase: 'sample',
      expectIn: /not registered/,
      mutate: (dir) => edit(dir, 'src/presentations/index.ts', (t) => t.replace(`slug: '${config.slug}'`, "slug: 'renamed-sample'")),
    },
    {
      name: 'a sample registered under the wrong title',
      phase: 'sample',
      expectIn: /sample title is/,
      mutate: (dir) => edit(dir, 'src/presentations/index.ts', (t) => t.replace(config.title, 'Some Other Title')),
    },
    {
      name: 'a reordered sample (steps 3 and 4 swapped)',
      phase: 'outline',
      rendered: true,
      expectIn: /step 2: title is "The deck grows"/,
      mutate: (dir) =>
        edit(dir, STEPS, (t) => t.replace('Answers become steps', '@@').replace('The deck grows', 'Answers become steps').replace('@@', 'The deck grows')),
    },
    {
      name: 'a console.error on a middle step',
      phase: 'render',
      rendered: true,
      expectIn: /step 4: console\.error: boom-in-step-5/,
      mutate: (dir) =>
        edit(dir, SCENE, (t) =>
          t.replace("import { Bot,", "import { useEffect } from 'react'\nimport { Bot,").replace(
            'export function SampleScene({ payload }: SceneProps<SampleState>) {',
            "export function SampleScene({ payload }: SceneProps<SampleState>) {\n  useEffect(() => {\n    if (payload.stage === 5) console.error('boom-in-step-5')\n  }, [payload.stage])",
          ),
        ),
    },
    {
      name: 'an uncaught page error on a late step',
      phase: 'render',
      rendered: true,
      expectIn: /step 6: uncaught: late-failure/,
      mutate: (dir) =>
        edit(dir, SCENE, (t) =>
          t.replace("import { Bot,", "import { useEffect } from 'react'\nimport { Bot,").replace(
            'export function SampleScene({ payload }: SceneProps<SampleState>) {',
            "export function SampleScene({ payload }: SceneProps<SampleState>) {\n  useEffect(() => {\n    if (payload.stage === 7) setTimeout(() => { throw new Error('late-failure') }, 0)\n  }, [payload.stage])",
          ),
        ),
    },
    {
      name: 'an error that fires only after the step has settled for a moment',
      phase: 'render',
      rendered: true,
      expectIn: /step 7: console\.error: delayed-failure/,
      mutate: (dir) =>
        edit(dir, SCENE, (t) =>
          t.replace("import { Bot,", "import { useEffect } from 'react'\nimport { Bot,").replace(
            'export function SampleScene({ payload }: SceneProps<SampleState>) {',
            "export function SampleScene({ payload }: SceneProps<SampleState>) {\n  useEffect(() => {\n    if (payload.stage !== 8) return\n    const id = setTimeout(() => console.error('delayed-failure'), 400)\n    return () => clearTimeout(id)\n  }, [payload.stage])",
          ),
        ),
    },
    {
      name: 'a step that throws while rendering',
      phase: 'render',
      rendered: true,
      expectIn: /step 5:/,
      mutate: (dir) =>
        edit(dir, SCENE, (t) =>
          t.replace(
            'export function SampleScene({ payload }: SceneProps<SampleState>) {',
            "export function SampleScene({ payload }: SceneProps<SampleState>) {\n  if (payload.stage === 6) throw new Error('render-failure')",
          ),
        ),
    },
    {
      name: 'a route that renders only placeholder content (no presentation chrome)',
      phase: 'render',
      expectIn: /step 0: .*did not render a presentation/,
      rendered: true,
      mutate: (dir) =>
        edit(dir, 'src/presentations/how-to-make-a-presentation/Talk.tsx', (t) =>
          t.replace(/export default function Talk\(\) \{[\s\S]*\}\s*$/, 'export default function Talk() {\n  return <p>coming soon</p>\n}\n').replace("import { Presentation } from '../../presentation-kit/index.ts'\n", '').replace("import { STEPS } from './steps.ts'\n", ''),
        ),
    },
    {
      name: 'a transition that never advances the step index',
      phase: 'render',
      rendered: true,
      expectIn: /step 4: the step index did not advance to 4/,
      mutate: (dir) =>
        edit(dir, 'src/presentation-kit/usePresentationNav.ts', (t) =>
          t.replace(
            '() => setState((s) => ({ ...s, index: clampIndex(clampIndex(s.index, count) + 1, count) })),',
            '() => setState((s) => (s.index === 3 ? s : { ...s, index: clampIndex(clampIndex(s.index, count) + 1, count) })),',
          ),
        ),
    },
  ]

  it.concurrent.each(faults)('fails for $name', async ({ phase, mutate, expectIn, rendered }) => {
    const dir = faultyCopy(mutate)
    const result = await verify(dir)
    expect(result.code, result.output).not.toBe(0)
    expect(result.output).toContain(`FAIL verify [${phase}]`)
    expect(result.output).toMatch(expectIn)
    expect(result.output).not.toMatch(/PASS/)
    if (!rendered) expect(result.output).not.toMatch(/step \d ok/)
    if (phase === 'build' || phase === 'sample') expect(result.output).not.toMatch(/\[render\]/)
    expect(await processExists(previewOf(dir) + ' preview')).toBe(false)
  })

  it('fails and cleans up when the preview cannot start', async () => {
    const dir = faultyCopy(() => {})
    const blocker = createServer()
    await new Promise<void>((resolve) => blocker.listen(0, '127.0.0.1', resolve))
    const port = (blocker.address() as { port: number }).port
    try {
      const result = await verify(dir, ['--port', String(port)])
      expect(result.code).not.toBe(0)
      expect(result.output).toMatch(/FAIL verify \[render\]: preview failed to start/)
      expect(result.output).not.toMatch(/PASS/)
      expect(await processExists(previewOf(dir) + ' preview')).toBe(false)
    } finally {
      blocker.close()
    }
  })

  it('fails when the verification config is missing', async () => {
    const dir = faultyCopy((d) => remove(path.join(d, 'verify.config.json')))
    const result = await verify(dir)
    expect(result.code).toBe(1)
    expect(result.output).toContain('FAIL verify [config]')
  })
})
