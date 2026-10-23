import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { copyRepository, output, REPO, removeScratch, replaceInFile, run } from '../support'

// E2E-001 and E2E-002: the verification gate (`npm run verify`), run against the repository and
// against throwaway copies, each seeded with one representative fault.

const SAMPLE = 'src/presentations/how-to-make-a-presentation'
const REGISTRY = 'src/presentations/index.ts'

function previewUrl(text: string): string | undefined {
  return /phase preview: serving (http:\/\/127\.0\.0\.1:\d+)/.exec(text)?.[1]
}

async function isListening(url: string): Promise<boolean> {
  try {
    await fetch(url)
    return true
  } catch {
    return false
  }
}

describe('E2E-001: the reference presentation passes production verification', () => {
  it('exits zero with a clear pass, rendering nine steps on 127.0.0.1 with no leftover preview', async () => {
    const result = run('npm', ['run', 'verify'], { cwd: REPO, timeout: 500_000 })
    const text = output(result)
    expect(result.status, text).toBe(0)
    expect(text).toContain('VERIFY PASSED: 9 steps of /how-to-make-a-presentation')
    expect(text).toContain('phase render: 9 steps rendered without runtime or console errors')
    expect(text).toContain('phase outline: every step matches the reference outline')
    expect(text).not.toContain('localhost')
    const url = previewUrl(text)
    expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
    expect(await isListening(url!)).toBe(false)
  }, 600_000)
})

type Seed = (root: string) => void

/** Replaces the `STEPS` export of the sample with a version that adds one scene-level fault. */
function seedStepsFault(wrapper: string): Seed {
  return (root) => {
    const file = join(root, SAMPLE, 'steps/index.ts')
    replaceInFile(file, 'export const STEPS: readonly Step<SampleState>[] = buildSteps()', wrapper)
  }
}

// The fault replaces the sample's STEPS export. The file already imports SampleScene and
// SampleState, so each fault adds only the names it needs.
const CONSOLE_FAULT = `import { createElement, useEffect } from 'react'
import type { SceneProps } from '../../../presentation-kit'

function FaultScene(props: SceneProps<SampleState>) {
  useEffect(() => {
    console.error('injected console fault')
  }, [])
  return createElement(SampleScene, props)
}

export const STEPS: readonly Step<SampleState>[] = buildSteps().map((step, index) =>
  index === 2 ? { ...step, Scene: FaultScene } : step,
)`

const PAGE_FAULT = `import { createElement } from 'react'
import type { SceneProps } from '../../../presentation-kit'

function FaultScene(props: SceneProps<SampleState>) {
  if (props.payload.entities.length === 10) throw new Error('injected page fault')
  return createElement(SampleScene, props)
}

export const STEPS: readonly Step<SampleState>[] = buildSteps().map((step, index) =>
  index === 3 ? { ...step, Scene: FaultScene } : step,
)`

const faults: Array<{ name: string; phase: string; step?: number; seed: Seed }> = [
  {
    name: 'a type error in the sample fails the build phase',
    phase: 'build',
    seed: (root) => {
      const file = join(root, SAMPLE, 'Talk.tsx')
      writeFileSync(file, `${readFileSync(file, 'utf8')}\nexport const broken: number = 'not a number'\n`)
    },
  },
  {
    name: 'a type error in a non-sample presentation fails the build phase',
    phase: 'build',
    seed: (root) => {
      mkdirSync(join(root, 'src/presentations/broken'), { recursive: true })
      writeFileSync(join(root, 'src/presentations/broken/Talk.tsx'), "export default function Talk() { const n: number = 'x'; return n }\n")
      replaceInFile(
        join(root, REGISTRY),
        'export const PRESENTATIONS: readonly PresentationEntry[] = [',
        "export const PRESENTATIONS: readonly PresentationEntry[] = [\n  { slug: 'broken', title: 'Broken', load: () => import('./broken/Talk') },",
      )
    },
  },
  {
    name: 'a missing sample fails the sample phase',
    phase: 'sample',
    seed: (root) => replaceInFile(join(root, REGISTRY), "slug: 'how-to-make-a-presentation'", "slug: 'renamed-away'"),
  },
  {
    name: 'an out-of-order sample fails the outline phase at the first wrong step',
    phase: 'outline',
    step: 1,
    seed: (root) =>
      replaceInFile(join(root, SAMPLE, 'Talk.tsx'), 'steps={STEPS}', 'steps={[STEPS[1], STEPS[0], ...STEPS.slice(2)]}'),
  },
  {
    name: 'a console error on step 3 fails the render phase and names that step',
    phase: 'render',
    step: 3,
    seed: seedStepsFault(CONSOLE_FAULT),
  },
  {
    name: 'an uncaught page error on step 4 fails the render phase and names that step',
    phase: 'render',
    step: 4,
    seed: seedStepsFault(PAGE_FAULT),
  },
  {
    name: 'a transition that stalls after step 5 fails the transition phase',
    phase: 'transition',
    step: 5,
    seed: (root) =>
      replaceInFile(
        join(root, 'src/presentation-kit/usePresentationNav.ts'),
        'const next = useCallback(() => setIndex((i) => Math.min(last, i + 1)), [last])',
        'const next = useCallback(() => setIndex((i) => (i === 4 ? i : Math.min(last, i + 1))), [last])',
      ),
  },
]

describe('E2E-002: verification failures are actionable', () => {
  it.each(faults)('$name', async ({ phase, step, seed }) => {
    // Each fault gets a fresh copy, so one seed never leaks into another run or the repository.
    const copy = copyRepository('fault-run')
    try {
      seed(copy)
      const result = run('node', [join(copy, 'scripts/verify.mjs')], { cwd: copy, timeout: 500_000 })
      const text = output(result)
      expect(result.status, text).not.toBe(0)
      expect(text).not.toContain('VERIFY PASSED')
      const stepText = step === undefined ? '' : ` \\(step ${step}\\)`
      expect(text).toMatch(new RegExp(`VERIFY FAILED \\[${phase}\\]${stepText}: `))
      const url = previewUrl(text)
      if (url) expect(await isListening(url), 'preview process stopped after the failure').toBe(false)
    } finally {
      removeScratch(copy)
    }
  }, 600_000)
})

