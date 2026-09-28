// @vitest-environment node
// E2E-001: the reference sample passes production verification.
// E2E-002: injected faults each fail `npm run verify` with an actionable, phase-specific message.
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { leftoverPreviews, makeCopy, run } from './copy'

const SLUG = 'how-to-make-a-presentation'
const copies: string[] = []
const fresh = (name: string) => {
  const dir = makeCopy(`and-scene-${name}`)
  copies.push(dir)
  return dir
}
const edit = (dir: string, file: string, change: (text: string) => string) => {
  const path = join(dir, file)
  const before = readFileSync(path, 'utf8')
  const after = change(before)
  expect(after, `fault did not change ${file}`).not.toBe(before)
  writeFileSync(path, after)
}
const verify = (dir: string) => run('npm', ['run', 'verify'], dir, 300_000)

afterAll(() => copies.forEach((dir) => rmSync(dir, { recursive: true, force: true })))

describe('E2E-001 reference sample passes production verification', () => {
  it('builds, renders all nine steps on 127.0.0.1, and exits zero', () => {
    const dir = fresh('verify-ok')
    const { status, output } = verify(dir)
    expect(status, output).toBe(0)
    expect(output).toContain('verify: build ok')
    expect(output).toMatch(/verify: preview ready at http:\/\/127\.0\.0\.1:\d+/)
    expect(output).toContain(`verify: ${SLUG} rendered 9 steps ok`)
    expect(output).toContain('VERIFY PASS')
    expect(output).not.toContain('VERIFY FAIL')
    expect(leftoverPreviews(dir)).toBe('')
  }, 300_000)
})

describe('E2E-002 verification failures are actionable', () => {
  const faults: Array<{ name: string; phase: string; mention?: string[]; inject: (dir: string) => void }> = [
    {
      name: 'build error',
      phase: 'build',
      inject: (dir) => edit(dir, `src/presentations/${SLUG}/entities.ts`, (t) => `${t}\nexport const broken: number = 'not a number'\n`),
    },
    {
      name: 'missing sample',
      phase: 'sample',
      mention: [SLUG],
      inject: (dir) =>
        edit(dir, 'src/presentations/index.ts', (t) => t.replace(/= \[[\s\S]*\]\s*$/, '= []\n')),
    },
    {
      name: 'out-of-order sample',
      phase: 'sample',
      mention: ['step 1 (index 0)', 'You have a topic'],
      inject: (dir) =>
        edit(dir, `src/presentations/${SLUG}/steps/index.ts`, (t) =>
          t.replace("title: 'You have a topic'", "title: 'The skill interviews you'").replace("title: 'The skill interviews you',\n    caption: 'One", "title: 'You have a topic',\n    caption: 'One"),
        ),
    },
    {
      name: 'console error on a step',
      phase: 'render',
      mention: ['step 4 (index 3)', 'injected fault'],
      inject: (dir) =>
        edit(dir, `src/presentations/${SLUG}/Scene.tsx`, (t) =>
          t.replace('const items: ReactNode[] = []', "const items: ReactNode[] = []\n  if (beat === 4) console.error('injected fault')"),
        ),
    },
    {
      name: 'transition that never advances',
      phase: 'render',
      mention: ['step 3 (index 2)', 'transition to step 4 (index 3) failed'],
      inject: (dir) =>
        edit(dir, 'src/presentation-kit/Presentation.tsx', (t) => t.replace('data-step-index={nav.index}', 'data-step-index={Math.min(nav.index, 2)}')),
    },
  ]

  for (const fault of faults) {
    it(`fails on ${fault.name}`, () => {
      const dir = fresh('verify-fault')
      fault.inject(dir)
      const { status, output } = verify(dir)
      expect(status, output).not.toBe(0)
      expect(output).toContain(`VERIFY FAIL [${fault.phase}]`)
      expect(output).not.toContain('VERIFY PASS')
      for (const text of fault.mention ?? []) expect(output).toContain(text)
      expect(leftoverPreviews(dir)).toBe('')
    }, 300_000)
  }
})
