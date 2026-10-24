import { execFileSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { copyRepo, edit, exec, processesMatching } from './helpers.ts'

const copies: string[] = []
afterAll(() => copies.forEach((c) => rmSync(c, { recursive: true, force: true })))

const SAMPLE = 'src/presentations/how-to-make-a-presentation'

async function verifyWithFault(fault: (dir: string) => void) {
  const dir = copyRepo()
  copies.push(dir)
  fault(dir)
  const result = await exec('npm', ['run', 'verify'], dir)
  return { dir, ...result }
}

describe('npm run verify', () => {
  it('passes on the pristine reference sample using the IPv4 loopback address', async () => {
    const { dir, code, output } = await verifyWithFault(() => {})
    expect(output).toContain('VERIFY PASSED')
    expect(output).toMatch(/preview at http:\/\/127\.0\.0\.1:\d+/)
    expect(output).toContain('9 steps rendered without errors')
    expect(code).toBe(0)
    expect(processesMatching(path.join(dir, 'node_modules/vite/bin/vite.js'))).toEqual([])
  })

  it('also passes when several presentations are registered', async () => {
    const { code, output } = await verifyWithFault((d) =>
      execFileSync(process.execPath, ['skills/presentation/scripts/scaffold.mjs', 'create', '.', 'second', 'Second'], { cwd: d }),
    )
    expect(output).toContain('second: 3 steps rendered without errors')
    expect(output).toContain('how-to-make-a-presentation: 9 steps rendered without errors')
    expect(code).toBe(0)
  })

  const faults: Array<[string, string, string, (dir: string) => void]> = [
    ['a build error', 'build', 'npm run build failed', (d) => edit(path.join(d, 'src/presentation-kit/constants.ts'), 'export const DESIGN_W = 880', "export const DESIGN_W: number = 'x'")],
    ['a missing sample registration', 'sample', 'is not registered', (d) => edit(path.join(d, 'src/presentations/index.ts'), "slug: 'how-to-make-a-presentation'", "slug: 'something-else'")],
    ['an out-of-order sample', 'render', 'step 0: title', (d) => {
      const file = path.join(d, SAMPLE, 'steps/meta.ts')
      edit(file, "title: 'You have a topic'", "title: 'The skill interviews you'")
    }],
    ['a console error at one step', 'render', 'step 3: console error', (d) =>
      edit(path.join(d, SAMPLE, 'steps/Scene.tsx'), '  const { beat } = payload\n', "  const { beat } = payload\n  if (beat === 3) console.error('boom at step three')\n")],
    ['an uncaught exception at one step', 'render', 'step 5: uncaught exception', (d) =>
      edit(path.join(d, SAMPLE, 'steps/Scene.tsx'), '  const { beat } = payload\n', "  const { beat } = payload\n  if (beat === 5) throw new Error('kaboom')\n")],
    ['a transition that does not advance', 'render', 'step 2: transition failed', (d) =>
      edit(path.join(d, 'src/presentation-kit/nav.ts'), 'index: clampIndex(state.index + 1, count)', 'index: clampIndex(Math.min(state.index + 1, 2), count)')],
    ['a console error in a second registered presentation', 'render', 'second: step 1: console error', (d) => {
      execFileSync(process.execPath, ['skills/presentation/scripts/scaffold.mjs', 'create', '.', 'second', 'Second'], { cwd: d })
      edit(path.join(d, 'src/presentations/second/steps/Scene.tsx'), '  const { beat } = payload\n', "  const { beat } = payload\n  if (beat === 1) console.error('second route boom')\n")
    }],
  ]

  it.each(faults)('fails and names the phase and step for %s', async (_name, phase, message, fault) => {
    const { dir, code, output } = await verifyWithFault(fault)
    expect(code).not.toBe(0)
    expect(output).toContain(`VERIFY FAILED [${phase}]`)
    expect(output).toContain(message)
    expect(output).not.toContain('VERIFY PASSED')
    expect(processesMatching(path.join(dir, 'node_modules/vite/bin/vite.js'))).toEqual([])
  })
})
