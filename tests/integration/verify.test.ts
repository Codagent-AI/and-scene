import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { ROOT, copyRepo, removeDir, run, write } from './helpers.ts'

describe('E2E-001: reference presentation passes production verification', () => {
  it('builds, previews on 127.0.0.1, steps all nine steps, and exits zero with a pass result', () => {
    const res = run('npm', ['run', 'verify'], ROOT)
    expect(res.out).toContain('[verify] PASS')
    expect(res.out).toMatch(/phase render: http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation/)
    expect(res.out).toContain('9 steps rendered without errors')
    expect(res.out).not.toContain('localhost')
    expect(res.code).toBe(0)
  })
})

const copies: string[] = []
afterEach(() => copies.splice(0).forEach(removeDir))

/** Copies the repo, applies one fault, runs verify, and checks no preview server is left behind. */
function verifyWithFault(edit: (dir: string, read: (rel: string) => string) => void) {
  const dir = copyRepo()
  copies.push(dir)
  edit(dir, (rel) => readFileSync(join(dir, rel), 'utf8'))
  const res = run('node', ['scripts/verify.mjs'], dir)
  const leftover = run('pgrep', ['-f', join(dir, 'node_modules/vite/bin/vite.js')], ROOT)
  expect(leftover.out.trim(), 'preview process cleaned up').toBe('')
  return res
}

const replaceIn = (dir: string, rel: string, from: string | RegExp, to: string) => {
  const text = readFileSync(join(dir, rel), 'utf8')
  const next = text.replace(from, to)
  expect(next, `fault anchor in ${rel}`).not.toBe(text)
  write(dir, rel, next)
}

describe('E2E-002: verification failures are actionable', () => {
  it('fails the build phase on a type error', () => {
    const res = verifyWithFault((dir, read) => write(dir, 'src/Landing.tsx', `${read('src/Landing.tsx')}\nexport const broken: number = 'not a number'\n`))
    expect(res.code).not.toBe(0)
    expect(res.out).toContain('[verify] FAIL phase=build')
    expect(res.out).not.toContain('[verify] PASS')
  })

  it('fails the reference phase when the sample is not registered', () => {
    const res = verifyWithFault((dir) => replaceIn(dir, 'src/presentations/index.ts', / {2}\{[^}]*how-to-make-a-presentation[^}]*\},\n/s, ''))
    expect(res.code).not.toBe(0)
    expect(res.out).toMatch(/FAIL phase=reference: reference presentation "how-to-make-a-presentation" is not registered/)
  })

  it('fails the reference phase when the sample steps are out of order, naming the step', () => {
    const res = verifyWithFault((dir) => {
      const steps = 'src/presentations/how-to-make-a-presentation/steps.ts'
      replaceIn(dir, steps, "title: 'You have a topic'", "title: '@@'")
      replaceIn(dir, steps, "title: 'The skill interviews you'", "title: 'You have a topic'")
      replaceIn(dir, steps, "title: '@@'", "title: 'The skill interviews you'")
    })
    expect(res.code).not.toBe(0)
    expect(res.out).toMatch(/FAIL phase=reference step=1: reference step 1 mismatch/)
  })

  it('fails the render phase on a console error, naming the step', () => {
    const res = verifyWithFault((dir) =>
      replaceIn(dir, 'src/presentations/how-to-make-a-presentation/Scene.tsx', 'const { beat } = payload\n', "const { beat } = payload\n  if (beat === 4) console.error('boom at four')\n"),
    )
    expect(res.code).not.toBe(0)
    expect(res.out).toMatch(/FAIL phase=render step=4: .*console\.error: boom at four/)
  })

  it('fails the render phase when a transition does not advance the step index', () => {
    const res = verifyWithFault((dir) => replaceIn(dir, 'src/presentation-kit/usePresentationNav.ts', 'const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])', 'const next = useCallback(() => setIndex((i) => clampIndex(i, count)), [count])'))
    expect(res.code).not.toBe(0)
    expect(res.out).toMatch(/FAIL phase=render step=2: .*transition did not advance/)
  })

  it('fails the render phase on an error that fires after the last step\'s animations start', () => {
    const res = verifyWithFault((dir) => {
      const scene = 'src/presentations/how-to-make-a-presentation/Scene.tsx'
      replaceIn(dir, scene, "import { ArrowLeftRight, Check } from 'lucide-react'", "import { useEffect } from 'react'\nimport { ArrowLeftRight, Check } from 'lucide-react'")
      replaceIn(
        dir,
        scene,
        'const { beat } = payload\n',
        "const { beat } = payload\n  useEffect(() => {\n    if (beat !== 9) return\n    const t = setTimeout(() => console.error('late failure'), 1100)\n    return () => clearTimeout(t)\n  }, [beat])\n",
      )
    })
    expect(res.code).not.toBe(0)
    expect(res.out).toMatch(/FAIL phase=render step=9: .*late failure/)
  })

  it('reports a browser launch failure and still stops the preview server', () => {
    const dir = copyRepo()
    copies.push(dir)
    const res = run('node', ['scripts/verify.mjs'], dir, { PLAYWRIGHT_BROWSERS_PATH: join(dir, 'no-browsers') })
    expect(res.code).not.toBe(0)
    expect(res.out).toMatch(/FAIL phase=browser: could not launch Chromium/)
    expect(run('pgrep', ['-f', join(dir, 'node_modules/vite/bin/vite.js')], ROOT).out.trim()).toBe('')
  })
})
