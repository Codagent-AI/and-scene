import { rmSync } from 'node:fs'
import { dirname } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { append, copyRepo, edit } from '../helpers/copy.ts'
import { previewProcesses, run, type RunResult } from '../helpers/process.ts'

// E2E-002: each verification phase fails loudly, from independent throwaway copies of the repository.
const copies: string[] = []
const SAMPLE = 'src/presentations/how-to-make-a-presentation'

async function verifyFaulty(fault: (dir: string) => void): Promise<{ result: RunResult; dir: string }> {
  const dir = copyRepo()
  copies.push(dir)
  fault(dir)
  return { result: await run('npm', ['run', 'verify'], dir), dir }
}

afterAll(() => {
  for (const dir of copies) rmSync(dirname(dir), { recursive: true, force: true })
})

function expectFailure({ result }: { result: RunResult }, phase: string, ...mentions: string[]) {
  const output = result.stdout + result.stderr
  expect(result.code, output).not.toBe(0)
  expect(output).toContain(`FAIL verify [${phase}]`)
  expect(output).not.toContain('PASS verify')
  for (const text of mentions) expect(output).toContain(text)
}

describe('E2E-002: verification failures are actionable', () => {
  it('fails in the build phase for a type error', async () => {
    const run1 = await verifyFaulty((dir) => append(dir, 'src/main.tsx', "\nexport const broken: number = 'not a number'\n"))
    expectFailure(run1, 'build', 'main.tsx')
    expect(run1.result.stdout).not.toContain('verify: preview on')
  })

  it('fails in the registry phase when the sample is not registered', async () => {
    expectFailure(
      await verifyFaulty((dir) => edit(dir, 'src/presentations/index.ts', (s) => s.replace("slug: 'how-to-make-a-presentation'", "slug: 'renamed'"))),
      'registry',
      'is not registered',
    )
  })

  it('fails in the registry phase when the registered sample is missing its sources', async () => {
    const outcome = await verifyFaulty((dir) => rmSync(`${dir}/${SAMPLE}/Talk.tsx`))
    expectFailure(outcome, 'registry', 'missing its entry file')
    expect(outcome.result.stdout).not.toContain('verify: build ok')
  })

  it('fails in the outline phase when the verify data is malformed', async () => {
    expectFailure(await verifyFaulty((dir) => edit(dir, 'scripts/verify.config.json', (s) => s.replace('"steps"', '"stepz"'))), 'outline', 'malformed')
  })

  it('fails in the render phase when the sample is out of order, naming the step', async () => {
    const swap = (s: string) =>
      s.replace("'You have a topic'", '@@').replace("'The skill interviews you'", "'You have a topic'").replace('@@', "'The skill interviews you'")
    expectFailure(await verifyFaulty((dir) => edit(dir, `${SAMPLE}/steps/steps.ts`, swap)), 'render', 'step 1: title')
  })

  it('fails in the render phase when a step emits a browser error, naming that step', async () => {
    const outcome = await verifyFaulty((dir) =>
      append(dir, 'src/main.tsx', `
let fired = false
new MutationObserver(() => {
  const root = document.querySelector('[data-presentation-root]')
  if (!fired && root?.getAttribute('data-step-index') === '3') {
    fired = true
    console.error('injected failure on the fourth step')
  }
}).observe(document, { subtree: true, attributes: true, childList: true })
`),
    )
    expectFailure(outcome, 'render', 'step 4: console.error: injected failure on the fourth step')
    expect(outcome.result.stdout).toContain('step 2/9')
    expect(outcome.result.stdout).not.toContain('step 4/9')
  })

  it('fails in the render phase for an uncaught page error, naming that step', async () => {
    expectFailure(
      await verifyFaulty((dir) =>
        append(dir, 'src/main.tsx', `
let thrown = false
new MutationObserver(() => {
  const root = document.querySelector('[data-presentation-root]')
  if (!thrown && root?.getAttribute('data-step-index') === '5') {
    thrown = true
    setTimeout(() => { throw new Error('uncaught on the sixth step') })
  }
}).observe(document, { subtree: true, attributes: true, childList: true })
`),
      ),
      'render',
      'step 6: pageerror: uncaught on the sixth step',
    )
  })

  it('fails in the transition phase when a step does not advance, naming the step', async () => {
    const outcome = await verifyFaulty((dir) =>
      append(dir, 'src/main.tsx', `
window.addEventListener('keydown', (event) => {
  if (document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === '2') event.stopImmediatePropagation()
}, true)
`),
    )
    expectFailure(outcome, 'transition', 'step 3', 'expected 3')
  })

  it('cleans up every preview subprocess after the faulty runs', async () => {
    for (const dir of copies) expect(await previewProcesses(dir)).toEqual([])
  })
})
