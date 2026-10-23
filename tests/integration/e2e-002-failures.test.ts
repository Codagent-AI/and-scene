import { appendFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { addPresentation } from '../../skills/presentation/scripts/scaffold.mjs'
import { cleanupTmp, copyRepo, portIsClosed, run } from '../helpers/proc'

afterAll(cleanupTmp)

const SLUG = 'how-to-make-a-presentation'
const stepsFile = (dir: string) => path.join(dir, 'src/presentations', SLUG, 'steps/index.ts')
const edit = (file: string, fn: (text: string) => string) => writeFileSync(file, fn(readFileSync(file, 'utf8')))
const prependNoCheck = (file: string) => edit(file, (t) => `// @ts-nocheck\n${t}`)

/** Replace the Scene of step `i` (0-based) with a faulty wrapper around the real one. */
function breakStep(dir: string, i: number, body: string) {
  prependNoCheck(stepsFile(dir))
  appendFileSync(
    stepsFile(dir),
    `\nimport { createElement } from 'react'\nconst Real = STEPS[${i}].Scene\nSTEPS[${i}] = { ...STEPS[${i}], Scene: (p) => { ${body}; return createElement(Real, p) } }\n`,
  )
}

interface Fault {
  name: string
  setup: (dir: string) => void
  phase: 'build' | 'sample' | 'render'
  expectOutput: RegExp[]
}

const faults: Fault[] = [
  {
    name: 'a type error inside the sample breaks the build',
    setup: (d) => appendFileSync(stepsFile(d), "\nexport const broken: number = 'not a number'\n"),
    phase: 'build',
    expectOutput: [/npm run build exited with code/],
  },
  {
    name: 'a type error outside the sample breaks the build',
    setup: (d) => writeFileSync(path.join(d, 'src/elsewhere.ts'), "export const x: number = 'nope'\n"),
    phase: 'build',
    expectOutput: [/npm run build exited with code/],
  },
  {
    name: 'an absent reference sample fails the sample phase',
    setup: (d) => {
      addPresentation(d, { slug: 'other', title: 'Other' })
      rmSync(path.join(d, 'src/presentations', SLUG), { recursive: true })
      edit(path.join(d, 'src/presentations/index.ts'), (t) => t.split('\n').filter((l) => !l.includes(SLUG)).join('\n'))
    },
    phase: 'sample',
    expectOutput: [/reference presentation "how-to-make-a-presentation" is not registered/],
  },
  {
    name: 'out-of-order sample steps fail the sample phase',
    setup: (d) => {
      prependNoCheck(stepsFile(d))
      appendFileSync(stepsFile(d), '\n;[STEPS[2], STEPS[3]] = [STEPS[3], STEPS[2]]\n')
    },
    phase: 'sample',
    expectOutput: [/step 3 title/, /step 4 title/],
  },
  {
    name: 'a wrong caption fails the sample phase',
    setup: (d) => {
      prependNoCheck(stepsFile(d))
      appendFileSync(stepsFile(d), "\nSTEPS[6] = { ...STEPS[6], caption: 'Something else entirely.' }\n")
    },
    phase: 'sample',
    expectOutput: [/step 7 caption/],
  },
  {
    name: 'a truncated sample fails the sample phase',
    setup: (d) => {
      prependNoCheck(stepsFile(d))
      appendFileSync(stepsFile(d), '\nSTEPS.pop()\n')
    },
    phase: 'sample',
    expectOutput: [/expected 9 steps, found 8/],
  },
  {
    name: 'a console error while stepping fails the render phase and names the step',
    setup: (d) => breakStep(d, 4, "console.error('INJECTED console error')"),
    phase: 'render',
    expectOutput: [/step index 4 \(step 5 of 9\)/, /INJECTED console error/],
  },
  {
    name: 'an uncaught page error while stepping fails the render phase and names the step',
    setup: (d) => breakStep(d, 6, "setTimeout(() => { throw new Error('INJECTED uncaught error') }, 0)"),
    phase: 'render',
    expectOutput: [/step index 6 \(step 7 of 9\)/, /INJECTED uncaught error/],
  },
  {
    name: 'a step that throws while rendering fails the render phase and names the step',
    setup: (d) => breakStep(d, 5, "throw new Error('INJECTED render failure')"),
    phase: 'render',
    expectOutput: [/step index 5 \(step 6 of 9\)/, /INJECTED render failure/],
  },
  {
    name: 'a transition that does not advance the step index fails the render phase',
    setup: (d) =>
      edit(path.join(d, 'src/presentation-kit/navigation.ts'), (t) =>
        t.replace('Math.min(Math.max(index, 0), count - 1)', 'Math.min(Math.max(index, 0), Math.min(count - 1, 4))'),
      ),
    phase: 'render',
    expectOutput: [/step index 5 \(step 6 of 9\)/, /did not advance data-step-index to 5/],
  },
]

// E2E-002: verification failures are actionable. Each fault runs in its own
// disposable copy of the repository, so the source checkout is never touched.
describe('E2E-002: `npm run verify` fails clearly on injected faults', () => {
  it.concurrent.each(faults)('$name', async ({ setup, phase, expectOutput }) => {
    const dir = copyRepo('e2e002')
    setup(dir)
    const result = await run('node', ['scripts/verify.mjs'], { cwd: dir, timeoutMs: 400000 })
    const out = result.stdout + result.stderr
    expect(result.code, out).not.toBe(0)
    expect(result.stderr, out).toContain(`FAIL [${phase}]`)
    expect(out).not.toMatch(/PASS/)
    for (const re of expectOutput) expect(out).toMatch(re)

    // phases stop at the first failure
    expect(out.includes('build: ok')).toBe(phase !== 'build')
    expect(out.includes('render: opening')).toBe(phase === 'render')

    // the preview is cleaned up after a failure
    const probe = /preview host 127\.0\.0\.1 port (\d+)/.exec(out)
    if (phase === 'render') {
      expect(probe, out).not.toBeNull()
      expect(await portIsClosed(Number(probe![1]))).toBe(true)
    }
  })
})
