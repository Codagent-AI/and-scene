import { afterAll, describe, expect, it } from 'vitest'
import { addFile, copyApp, editFile, leftoverProcesses, removeApp, repoRoot, run } from './helpers.ts'

const SAMPLE = 'src/presentations/how-to-make-a-presentation'
const copies: string[] = []

async function faulty(inject: (dir: string) => Promise<void>) {
  const dir = await copyApp()
  copies.push(dir)
  await inject(dir)
  const result = await run('npm', ['run', 'verify'], dir)
  return { ...result, dir }
}

/** Runs in the page: reacts to the step index changing to `index`. */
const onStep = (index: number, body: string) => `
new MutationObserver(() => {
  const root = document.querySelector('[data-presentation-step-index="${index}"]')
  if (root && !(window as unknown as Record<string, boolean>).__fired${index}) {
    ;(window as unknown as Record<string, boolean>).__fired${index} = true
    ${body}
  }
}).observe(document.documentElement, { attributes: true, subtree: true, childList: true })
`

afterAll(async () => {
  await Promise.all(copies.map(removeApp))
})

describe('E2E-001: the reference presentation passes production verification', () => {
  it('builds, renders all nine steps on 127.0.0.1 and exits zero', async () => {
    const { code, output } = await run('npm', ['run', 'verify'], repoRoot)
    expect(output).toContain('PASS [build]')
    expect(output).toMatch(/preview: http:\/\/127\.0\.0\.1:\d+/)
    expect(output).not.toMatch(/localhost/)
    for (let step = 1; step <= 9; step++) {
      expect(output).toContain(`/how-to-make-a-presentation step ${step}/9 rendered`)
    }
    expect(output).toContain('PASS [render] /how-to-make-a-presentation: 9 steps')
    expect(output).toContain('PASS [sample] 9 steps match the reference outline')
    expect(output).toContain('VERIFY PASSED')
    expect(code).toBe(0)
  })
})

describe('E2E-002: verification failures are actionable', () => {
  it('fails on a build error and names the build phase', async () => {
    const { code, output, dir } = await faulty((d) => addFile(d, 'src/broken.ts', "export const broken: number = 'text'\n"))
    expect(code).not.toBe(0)
    expect(output).toContain('FAIL [build]')
    expect(output).toContain('VERIFY FAILED (build)')
    expect(output).not.toContain('VERIFY PASSED')
    expect(await leftoverProcesses(dir)).toBe('')
  })

  it('fails when the reference sample is missing', async () => {
    const { code, output, dir } = await faulty(async (d) => {
      await editFile(d, 'src/presentations/index.ts', (t) => t.replace(/\[\n[\s\S]*\n\]/, '[]'))
      await removeApp(`${d}/${SAMPLE}`)
    })
    expect(code).not.toBe(0)
    expect(output).toContain('FAIL [sample]')
    expect(output).toContain('is not registered')
    expect(await leftoverProcesses(dir)).toBe('')
  })

  it('fails when the sample steps are out of order and names the first mismatching step', async () => {
    const { code, output, dir } = await faulty((d) =>
      editFile(d, `${SAMPLE}/steps.ts`, (t) =>
        t.replace("'You have a topic'", "'TMP'").replace("'The skill interviews you'", "'You have a topic'").replace("'TMP'", "'The skill interviews you'"),
      ),
    )
    expect(code).not.toBe(0)
    expect(output).toMatch(/FAIL \[sample\] step 1: title\/caption mismatch/)
    expect(await leftoverProcesses(dir)).toBe('')
  })

  it('fails on a console error and names the step', async () => {
    const { code, output, dir } = await faulty((d) =>
      editFile(d, 'src/main.tsx', (t) => `${t}\n${onStep(2, "console.error('injected console failure')")}`),
    )
    expect(code).not.toBe(0)
    expect(output).toMatch(/FAIL \[render\] step 3: console error: injected console failure/)
    expect(await leftoverProcesses(dir)).toBe('')
  })

  it('fails on an uncaught page error and names the step', async () => {
    const { code, output, dir } = await faulty((d) =>
      editFile(d, 'src/main.tsx', (t) => `${t}\n${onStep(3, "setTimeout(() => { throw new Error('injected page failure') })")}`),
    )
    expect(code).not.toBe(0)
    expect(output).toMatch(/FAIL \[render\] step 4: uncaught page error: injected page failure/)
    expect(await leftoverProcesses(dir)).toBe('')
  })

  it('fails when a transition does not advance the step index and names the step', async () => {
    const { code, output, dir } = await faulty((d) =>
      editFile(
        d,
        'src/main.tsx',
        (t) => `${t}\nwindow.addEventListener('keydown', (e) => { if (document.querySelector('[data-presentation-step-index="3"]')) e.stopImmediatePropagation() }, true)\n`,
      ),
    )
    expect(code).not.toBe(0)
    expect(output).toMatch(/FAIL \[render\] step 5: transition did not advance the step index \(still 3\)/)
    expect(await leftoverProcesses(dir)).toBe('')
  })
})
