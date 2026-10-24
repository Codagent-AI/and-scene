import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyProject, npm, portIsFree, removeProject, repoRoot, type RunResult } from '../support/project'

const status = () => execFileSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' })

const previewPort = (output: string) => {
  const match = /verify: preview http:\/\/127\.0\.0\.1:(\d+)/.exec(output)
  return match ? Number(match[1]) : undefined
}

describe('E2E-001: the reference presentation passes production verification', () => {
  let result: RunResult
  beforeAll(async () => {
    result = await npm(['run', 'verify'], repoRoot)
  })

  it('exits zero with a clear pass result covering build, sample and render', () => {
    expect(result.code, result.output).toBe(0)
    expect(result.output).toMatch(/verify: build/)
    expect(result.output).toMatch(/verify: sample/)
    expect(result.output).toMatch(/PASS verify: build, sample, render \(1 presentations, 9 steps\)/)
    expect(result.output).not.toMatch(/FAIL/)
  })

  it('renders the registered sample route through all nine steps', () => {
    expect(result.output).toContain('rendered how-to-make-a-presentation: 9 steps')
  })

  it('uses 127.0.0.1 for the preview host, readiness probe and browser URLs', () => {
    const urls = result.output.match(/https?:\/\/[^\s)]+/g) ?? []
    expect(urls.length).toBeGreaterThanOrEqual(2)
    for (const url of urls) expect(url.startsWith('http://127.0.0.1:'), url).toBe(true)
    expect(result.output).not.toContain('localhost')
  })

  it('leaves no preview server running', async () => {
    const port = previewPort(result.output)
    expect(port).toBeGreaterThan(0)
    expect(await portIsFree(port!)).toBe(true)
  })
})

// Each fault is injected into its own disposable copy; the source checkout must stay untouched.
interface Fault {
  name: string
  file: string
  edit: (source: string) => string
  phase: 'build' | 'sample' | 'render'
  /** Whether verification gets far enough to start the production preview. */
  startsPreview: boolean
  expected: RegExp[]
}

const SCENE = 'src/presentations/how-to-make-a-presentation/SampleScene.tsx'
const STEPS_INDEX = 'src/presentations/how-to-make-a-presentation/steps/index.ts'

const replaceOnce = (source: string, from: string, to: string) => {
  if (!source.includes(from)) throw new Error(`fault injection target not found: ${from}`)
  return source.replace(from, to)
}

const faults: Fault[] = [
  {
    name: 'a build-breaking edit in a non-sample module',
    file: 'src/Landing.tsx',
    edit: (s) => `${s}\nexport const broken: number = 'not a number'\n`,
    phase: 'build',
    startsPreview: false,
    expected: [/FAIL build/, /npm run build exited with code/],
  },
  {
    name: 'a missing reference sample',
    file: 'src/presentations/index.ts',
    edit: () => "import type { PresentationEntry } from '../router'\n\nexport const presentations: PresentationEntry[] = []\n",
    phase: 'sample',
    startsPreview: false,
    expected: [/FAIL sample/, /how-to-make-a-presentation/, /not registered/],
  },
  {
    name: 'out-of-order sample steps',
    file: STEPS_INDEX,
    edit: (s) => replaceOnce(s, 'step2, step3', 'step3, step2'),
    phase: 'sample',
    startsPreview: true,
    expected: [/FAIL sample/, /step 2 title/, /step 3 title/],
  },
  {
    name: 'a malformed sample caption',
    file: 'src/presentations/how-to-make-a-presentation/steps/04-deck-grows.ts',
    edit: (s) => replaceOnce(s, 'Same shapes, new beats.', 'Same shapes, old beats.'),
    phase: 'sample',
    startsPreview: true,
    expected: [/FAIL sample/, /step 4 caption/],
  },
  {
    name: 'a console error while stepping',
    file: SCENE,
    edit: (s) => replaceOnce(s, '  const { step } = payload\n', "  const { step } = payload\n  if (step === 4) console.error('injected failure')\n"),
    phase: 'render',
    startsPreview: true,
    expected: [/FAIL render/, /injected failure/, /step 4 of 9 \(index 3\)/, /presentation: how-to-make-a-presentation/],
  },
  {
    name: 'an uncaught page error while stepping',
    file: SCENE,
    edit: (s) =>
      replaceOnce(
        replaceOnce(s, '  const { step } = payload\n', "  const { step } = payload\n  useEffect(() => {\n    if (step === 6) setTimeout(() => { throw new Error('late page error') })\n  }, [step])\n"),
        "import { Fragment,",
        "import { useEffect, Fragment,",
      ),
    phase: 'render',
    startsPreview: true,
    expected: [/FAIL render/, /late page error/, /step 6 of 9 \(index 5\)/],
  },
  {
    name: 'a transition that does not advance the step index',
    file: 'src/presentation-kit/usePresentationNav.ts',
    edit: (s) => replaceOnce(s, 'setIndex((i) => clampIndex(i + 1, count))', 'setIndex((i) => Math.min(clampIndex(i + 1, count), 3))'),
    phase: 'render',
    startsPreview: true,
    expected: [/FAIL render/, /did not advance to index 4/, /step 5 of 9 \(index 4\)/],
  },
]

describe('E2E-002: verification failures are actionable', () => {
  const copies: string[] = []
  const before = status()
  afterAll(() => {
    copies.forEach(removeProject)
    expect(status()).toBe(before)
  })

  it.each(faults)('fails, naming the phase and step, for $name', async (fault) => {
    const copy = copyProject('e2e002')
    copies.push(copy)
    const file = path.join(copy, fault.file)
    writeFileSync(file, fault.edit(readFileSync(file, 'utf8')))

    const result = await npm(['run', 'verify'], copy)

    expect(result.code, result.output).toBe(1)
    expect(result.output).not.toMatch(/PASS/)
    for (const pattern of fault.expected) expect(result.output).toMatch(pattern)
    for (const other of ['build', 'sample', 'render'].filter((phase) => phase !== fault.phase)) {
      expect(result.output).not.toMatch(new RegExp(`FAIL ${other}`))
    }
    const port = previewPort(result.output)
    if (fault.startsPreview) {
      expect(port).toBeGreaterThan(0)
      expect(await portIsFree(port!)).toBe(true) // the preview subprocess was cleaned up
    } else {
      expect(port).toBeUndefined() // failed before any preview started
    }
  })
})
