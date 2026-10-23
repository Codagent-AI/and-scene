// E2E-001 and E2E-002: `npm run verify` on a disposable copy of the repository. The clean
// copy must pass; each copy with one injected fault must fail in the named phase and
// leave no preview server running.
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyRepo, isClosed, removeDir, replaceInFile, run } from '../integration/support'

const SAMPLE = 'src/presentations/how-to-make-a-presentation'
const PORT_LINE = /preview (http:\/\/127\.0\.0\.1:\d+)/

interface Verdict {
  code: number | null
  output: string
  previewUrl: string | null
}

async function verify(dir: string, env?: NodeJS.ProcessEnv): Promise<Verdict> {
  const result = await run(process.execPath, ['scripts/verify.mjs'], dir, 600_000, env ?? process.env)
  const previewUrl = result.output.match(PORT_LINE)?.[1] ?? null
  return { ...result, previewUrl }
}

const copies: string[] = []
async function faultyCopy(name: string, inject: (dir: string) => Promise<void>) {
  const dir = await copyRepo(name)
  copies.push(dir)
  await inject(dir)
  return dir
}

afterAll(async () => {
  for (const dir of copies) await removeDir(dir)
})

describe('E2E-001: reference presentation passes production verification', () => {
  let verdict: Verdict

  beforeAll(async () => {
    const dir = await copyRepo('e2e001')
    copies.push(dir)
    verdict = await verify(dir)
  }, 900_000)

  it('exits zero with a clear PASS line', () => {
    expect(verdict.code, verdict.output).toBe(0)
    expect(verdict.output).toMatch(/^PASS verify: build, sample outline, and 9 rendered steps/m)
    expect(verdict.output).not.toMatch(/^FAIL/m)
  })

  it('serves and checks the preview on IPv4 loopback', () => {
    expect(verdict.previewUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
  })

  it('leaves no preview server listening after the run', async () => {
    expect(verdict.previewUrl).not.toBeNull()
    expect(await isClosed(verdict.previewUrl as string)).toBe(true)
  })
})

describe('E2E-002: verification failures are actionable', () => {
  interface Case {
    name: string
    inject: (dir: string) => Promise<void>
    phase: 'build' | 'sample' | 'render' | 'transition'
    step?: number
  }

  const cases: Case[] = [
    {
      name: 'build-breaking edit',
      inject: (dir) => replaceInFile(join(dir, 'src/presentation-kit/constants.ts'), 'export const DESIGN_W = 880', "export const DESIGN_W: number = 'wide'"),
      phase: 'build',
    },
    {
      name: 'missing sample registration',
      inject: (dir) =>
        replaceInFile(join(dir, 'src/presentations/index.ts'), "slug: 'how-to-make-a-presentation'", "slug: 'renamed-away'"),
      phase: 'sample',
    },
    {
      name: 'out-of-order sample',
      inject: (dir) =>
        replaceInFile(join(dir, SAMPLE, 'steps.ts'), 'OUTLINE.map((step, index)', '[...OUTLINE].reverse().map((step, index)'),
      phase: 'sample',
    },
    {
      name: 'console error on a later step',
      inject: async (dir) => {
        const file = join(dir, SAMPLE, 'SampleScene.tsx')
        await replaceInFile(file, "import { AnimatePresence } from 'motion/react'", "import { useEffect } from 'react'\nimport { AnimatePresence } from 'motion/react'")
        await replaceInFile(
          file,
          '  const fresh = new Set<EntityId>(current.entering)',
          "  const fresh = new Set<EntityId>(current.entering)\n  useEffect(() => {\n    if (payload.state.ghost) console.error('injected console fault')\n  }, [payload.state.ghost])",
        )
      },
      phase: 'render',
      step: 4,
    },
    {
      name: 'uncaught page error on a later step',
      inject: async (dir) => {
        const file = join(dir, SAMPLE, 'SampleScene.tsx')
        await replaceInFile(file, "import { AnimatePresence } from 'motion/react'", "import { useEffect } from 'react'\nimport { AnimatePresence } from 'motion/react'")
        await replaceInFile(
          file,
          '  const fresh = new Set<EntityId>(current.entering)',
          "  const fresh = new Set<EntityId>(current.entering)\n  useEffect(() => {\n    if (payload.state.ghost) setTimeout(() => { throw new Error('injected page fault') })\n  }, [payload.state.ghost])",
        )
      },
      phase: 'render',
      step: 4,
    },
    {
      name: 'transition that does not advance',
      inject: (dir) =>
        replaceInFile(
          join(dir, 'src/presentation-kit/usePresentationNav.ts'),
          'setIndex((i) => clamp(i + 1, last))',
          'setIndex((i) => (i === 4 ? i : clamp(i + 1, last)))',
        ),
      phase: 'transition',
      step: 4,
    },
    {
      name: 'crash while rendering a later step',
      inject: async (dir) => {
        const file = join(dir, SAMPLE, 'SampleScene.tsx')
        await replaceInFile(file, '  const fresh = new Set<EntityId>(current.entering)', "  const fresh = new Set<EntityId>(current.entering)\n  if (payload.state.ghost) throw new Error('injected render crash')")
      },
      phase: 'render',
      step: 4,
    },
    {
      name: 'crash while rendering the first step',
      inject: async (dir) => {
        const file = join(dir, SAMPLE, 'SampleScene.tsx')
        await replaceInFile(file, '  const fresh = new Set<EntityId>(current.entering)', "  const fresh = new Set<EntityId>(current.entering)\n  if (!payload.state.skill) throw new Error('injected first-step crash')")
      },
      phase: 'render',
      step: 0,
    },
    {
      name: 'error raised while the final step is still entering',
      inject: async (dir) => {
        const file = join(dir, SAMPLE, 'SampleScene.tsx')
        await replaceInFile(file, "import { AnimatePresence } from 'motion/react'", "import { useEffect } from 'react'\nimport { AnimatePresence } from 'motion/react'")
        await replaceInFile(
          file,
          '  const fresh = new Set<EntityId>(current.entering)',
          "  const fresh = new Set<EntityId>(current.entering)\n  useEffect(() => {\n    if (payload.state.reveal) setTimeout(() => console.error('late entry fault'), 1200)\n  }, [payload.state.reveal])",
        )
      },
      phase: 'render',
      step: 8,
    },
  ]

  for (const testCase of cases) {
    describe(testCase.name, () => {
      let verdict: Verdict

      beforeAll(async () => {
        const dir = await faultyCopy(`e2e002-${testCase.phase}`, testCase.inject)
        verdict = await verify(dir)
      }, 900_000)

      it(`exits non-zero and names the ${testCase.phase} phase`, () => {
        expect(verdict.code).not.toBe(0)
        expect(verdict.output).toContain(`FAIL ${testCase.phase}`)
        expect(verdict.output).not.toMatch(/^PASS/m)
      })

      if (testCase.step !== undefined) {
        it(`names the offending step ${testCase.step}`, () => {
          expect(verdict.output).toContain(`step ${testCase.step}`)
        })
      }

      it('cleans up any preview server it started', async () => {
        if (verdict.previewUrl) expect(await isClosed(verdict.previewUrl)).toBe(true)
      })
    })
  }
})

// Confirms the fault cases above really exercised the runtime path (not a silent no-op).
describe('browser launch failure', () => {
  let verdict: Verdict

  beforeAll(async () => {
    const dir = await faultyCopy('e2e002-launch', async () => {})
    verdict = await verify(dir, { ...process.env, PLAYWRIGHT_BROWSERS_PATH: join(tmpdir(), 'no-such-browsers') })
  }, 900_000)

  it('exits non-zero in the render phase', () => {
    expect(verdict.code).not.toBe(0)
    expect(verdict.output).toContain('FAIL render')
  })

  it('still stops the preview server it started before the launch failed', async () => {
    expect(verdict.previewUrl).not.toBeNull()
    expect(await isClosed(verdict.previewUrl as string)).toBe(true)
  })
})

describe('fault injection points exist in the committed sample', () => {
  it('has the scene and navigation text that the injections replace', async () => {
    const scene = await readFile(join(process.cwd(), SAMPLE, 'SampleScene.tsx'), 'utf8')
    expect(scene).toContain("import { AnimatePresence } from 'motion/react'")
    const nav = await readFile(join(process.cwd(), 'src/presentation-kit/usePresentationNav.ts'), 'utf8')
    expect(nav).toContain('setIndex((i) => clamp(i + 1, last))')
  })
})
