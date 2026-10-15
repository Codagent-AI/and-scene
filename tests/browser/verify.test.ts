import { readFileSync, renameSync, writeFileSync, appendFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { REPO, copyProject, processesMentioning, removeProject, run } from './helpers'

const SAMPLE_DIR = 'src/presentations/how-to-make-a-presentation'
const copies: string[] = []
afterAll(() => copies.forEach(removeProject))

function edit(file: string, fn: (s: string) => string) {
  writeFileSync(file, fn(readFileSync(file, 'utf8')))
}

async function verifyIn(dir: string) {
  return run('node', ['scripts/verify.mjs', '--root', dir], dir)
}

describe('E2E-001: reference presentation passes production verification', () => {
  it('npm run verify passes from the repository root', async () => {
    const { code, output } = await run('npm', ['run', 'verify', '--silent'], REPO)
    expect(output).toContain('PASS build')
    expect(output).toContain('PASS sample: 9 steps registered in order')
    expect(output).toMatch(/PASS render: 9 steps rendered cleanly on 127\.0\.0\.1/)
    expect(output).toContain('VERIFY PASSED')
    expect(output).not.toContain('localhost')
    expect(code).toBe(0)
  })

  it('shares the normative nine-step outline with the sample', async () => {
    const mod = await import(pathToFileURL(path.join(REPO, 'scripts/verify.mjs')).href)
    expect(mod.SAMPLE.slug).toBe('how-to-make-a-presentation')
    expect(mod.SAMPLE.steps).toHaveLength(9)
  })
})

describe('E2E-002: verification failures are actionable', () => {
  const faults: { name: string; phase: string; expect: RegExp; inject: (dir: string) => void }[] = [
    {
      name: 'build-breaking edit',
      phase: 'build',
      expect: /FAIL build/,
      inject: (dir) => appendFileSync(path.join(dir, 'src/main.tsx'), "\nexport const broken: number = 'not a number'\n"),
    },
    {
      name: 'unregistered sample',
      phase: 'sample',
      expect: /FAIL sample: sample "how-to-make-a-presentation" is not registered/,
      inject: (dir) => edit(path.join(dir, 'src/presentations/index.ts'), (s) => s.replace("slug: 'how-to-make-a-presentation'", "slug: 'renamed'")),
    },
    {
      name: 'out-of-order sample',
      phase: 'sample',
      expect: /FAIL sample: step \d+ (title|caption) is out of order/,
      inject: (dir) => {
        const steps = path.join(dir, SAMPLE_DIR, 'steps')
        renameSync(path.join(steps, '01-you-have-a-topic.tsx'), path.join(steps, '99-you-have-a-topic.tsx'))
      },
    },
    {
      name: 'step emitting a browser error',
      phase: 'render',
      expect: /FAIL render: step 3: runtime\/console error[\s\S]*\[step 3\] .*boom/,
      inject: (dir) =>
        edit(path.join(dir, SAMPLE_DIR, 'beats/04-the-deck-grows.tsx'), (s) =>
          s.replace('export function Beat4({ beat }: BeatProps) {', "export function Beat4({ beat }: BeatProps) {\n  console.error('boom')"),
        ),
    },
    {
      name: 'transition that does not advance the step index',
      phase: 'render',
      expect: /FAIL render: step 5: ArrowRight from step 4 did not advance data-step-index to 5/,
      inject: (dir) =>
        edit(path.join(dir, 'src/presentation-kit/navLogic.ts'), (s) =>
          s.replace('Math.min(index, Math.max(0, count - 1))', 'Math.min(index, count > 0 ? 4 : 0)'),
        ),
    },
  ]

  for (const fault of faults) {
    it(`fails the ${fault.phase} phase: ${fault.name}`, async () => {
      const dir = copyProject()
      copies.push(dir)
      fault.inject(dir)
      const { code, output } = await verifyIn(dir)
      expect(code).not.toBe(0)
      expect(output).toMatch(fault.expect)
      expect(output).toContain('VERIFY FAILED')
      expect(output).toContain(fault.phase)
      expect(output).not.toContain('VERIFY PASSED')
      expect(await processesMentioning(dir)).toEqual([])
    })
  }
})
