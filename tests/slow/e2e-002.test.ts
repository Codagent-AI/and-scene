import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { copyApp, discard, edit, leftoverPreviews, run } from './helpers.ts'

// E2E-002: each verification phase fails loudly, by name, with a non-zero exit.
const dirs: string[] = []
afterEach(() => {
  while (dirs.length) discard(dirs.pop()!)
})

function verifyFaulty(fault: (dir: string) => void) {
  const dir = copyApp()
  dirs.push(dir)
  fault(dir)
  const result = run('npm', ['run', 'verify'], { cwd: dir, env: { VERIFY_SETTLE_MS: '250' } })
  return { ...result, dir }
}

const kit = (dir: string, file: string) => path.join(dir, 'src/presentation-kit', file)

describe('E2E-002 verification failures are actionable', () => {
  it('fails the build phase on a type error', () => {
    const r = verifyFaulty((dir) => edit(kit(dir, 'types.ts'), 'export type Mode', "export const broken: number = 'not a number'\nexport type Mode"))
    expect(r.code).not.toBe(0)
    expect(r.output).toMatch(/VERIFY FAILED phase=build/)
    expect(r.output).not.toContain('VERIFY PASSED')
    expect(r.output).not.toContain('[verify] phase build: ok')
    expect(leftoverPreviews(r.dir)).toEqual([])
  })

  it('fails the sample phase when the reference sample is missing from the registry', () => {
    const r = verifyFaulty((dir) => edit(path.join(dir, 'src/presentations/index.ts'), "slug: 'how-to-make-a-presentation'", "slug: 'renamed'"))
    expect(r.code).not.toBe(0)
    expect(r.output).toMatch(/VERIFY FAILED phase=sample.*no entry with slug "how-to-make-a-presentation"/)
    expect(r.output).not.toContain('[preview]')
  })

  it('fails the sample phase when the steps are out of order, naming the step', () => {
    const r = verifyFaulty((dir) =>
      edit(path.join(dir, 'src/presentations/how-to-make-a-presentation/steps/index.ts'), '[step1, step2,', '[step2, step1,'),
    )
    expect(r.code).not.toBe(0)
    expect(r.output).toMatch(/VERIFY FAILED phase=sample.*step 0: title/)
    expect(r.output).not.toContain('[preview]')
  })

  const inject = (code: string) => (dir: string) => {
    edit(kit(dir, 'Presentation.tsx'), "import type { ReactNode } from 'react'", "import { useEffect } from 'react'\nimport type { ReactNode } from 'react'")
    edit(kit(dir, 'Presentation.tsx'), 'const { mode, index } = nav\n', `const { mode, index } = nav\n  ${code}\n`)
  }

  it('fails the render phase on a console error, naming the step, and reaps the preview', () => {
    const r = verifyFaulty(inject("useEffect(() => { if (index === 3) console.error('injected console fault') }, [index])"))
    expect(r.code).not.toBe(0)
    expect(r.output).toMatch(/VERIFY FAILED phase=render step=3: console\.error: injected console fault/)
    expect(r.output).not.toContain('VERIFY PASSED')
    expect(leftoverPreviews(r.dir)).toEqual([])
  })

  it('fails the render phase on an uncaught page error, naming the step', () => {
    const r = verifyFaulty(inject("useEffect(() => { if (index === 5) setTimeout(() => { throw new Error('injected page fault') }, 0) }, [index])"))
    expect(r.code).not.toBe(0)
    expect(r.output).toMatch(/VERIFY FAILED phase=render step=5: uncaught exception: .*injected page fault/)
    expect(leftoverPreviews(r.dir)).toEqual([])
  })

  it('fails the render phase when a transition never advances the public step index, within bounded time', () => {
    const started = Date.now()
    const r = verifyFaulty((dir) =>
      edit(kit(dir, 'usePresentationNav.ts'), 'setIndex((i) => Math.min(i + 1, last))', 'setIndex((i) => (i === 2 ? i : Math.min(i + 1, last)))'),
    )
    expect(r.code).not.toBe(0)
    expect(r.output).toMatch(/VERIFY FAILED phase=render step=3: transition did not advance: data-step-index is 2, expected 3/)
    expect(Date.now() - started).toBeLessThan(240_000)
    expect(leftoverPreviews(r.dir)).toEqual([])
  })
})
