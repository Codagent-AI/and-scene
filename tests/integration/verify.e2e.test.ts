import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { copyProject, exec, gone, previewPid, removeDir, repoRoot, tempDir } from './helpers.ts'

const copies: string[] = []
afterAll(() => copies.forEach(removeDir))

describe('E2E-001: reference presentation passes production verification', () => {
  it('builds, previews on 127.0.0.1, steps through all nine steps and reports PASS', async () => {
    const result = await exec('npm', ['run', 'verify'], repoRoot)
    expect(result.output).toContain('build: ok')
    expect(result.output).toContain('sample: ok')
    expect(result.output).toMatch(/render: ok \(9 steps at http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation\)/)
    expect(result.output).toMatch(/\nPASS\n/)
    expect(result.output).not.toMatch(/FAIL|localhost/)
    expect(result.code).toBe(0)
    const endpoints = [...result.output.matchAll(/https?:\/\/[^\s)]+/g)].map((m) => m[0])
    expect(endpoints.length).toBeGreaterThan(0)
    for (const endpoint of endpoints) expect(new URL(endpoint).hostname).toBe('127.0.0.1')
    const pid = previewPid(result.output)
    expect(pid).not.toBeNull()
    expect(await gone(pid!)).toBe(true)
  })
})

interface Fault {
  name: string
  phase: string
  detail: RegExp
  startsPreview: boolean
  apply: (dir: string) => void
}

const edit = (dir: string, rel: string, change: (source: string) => string) => {
  const file = path.join(dir, rel)
  const before = readFileSync(file, 'utf8')
  const after = change(before)
  if (after === before) throw new Error(`fault did not change ${rel}`)
  writeFileSync(file, after)
}
const sample = 'src/presentations/how-to-make-a-presentation'

const faults: Fault[] = [
  {
    name: 'a type error outside the sample',
    phase: 'build',
    detail: /error TS2322/,
    startsPreview: false,
    apply: (dir) => edit(dir, 'src/Landing.tsx', (s) => `${s}\nexport const broken: number = 'not a number'\n`),
  },
  {
    name: 'a sample that is not registered',
    phase: 'sample',
    detail: /"how-to-make-a-presentation" is not registered/,
    startsPreview: false,
    apply: (dir) => edit(dir, 'src/presentations/index.ts', (s) => s.replace("slug: 'how-to-make-a-presentation'", "slug: 'renamed'")),
  },
  {
    name: 'steps out of order',
    phase: 'sample',
    detail: /step 2 \(index 1\): era is/,
    startsPreview: true,
    apply: (dir) =>
      edit(dir, `${sample}/modules.ts`, (s) => s.replace('[s1, s2, s3,', '[s1, s3, s2,')),
  },
  {
    name: 'a console error while rendering a step',
    phase: 'render',
    detail: /step 3 \(index 2\): console\.error: boom/,
    startsPreview: true,
    apply: (dir) =>
      edit(dir, `${sample}/steps/03-answers.tsx`, (s) => s.replace('export const entities = () => [', "export const entities = () => {\n  console.error('boom')\n  return entities_()\n}\nconst entities_ = () => [")),
  },
  {
    name: 'an uncaught exception while rendering a step',
    phase: 'render',
    detail: /step 5 \(index 4\): .*(kaput|uncaught|console\.error)/s,
    startsPreview: true,
    apply: (dir) =>
      edit(dir, `${sample}/steps/05-depth.tsx`, (s) => s.replace('export const entities = () => [', "export const entities = () => {\n  throw new Error('kaput')\n}\nexport const unused = () => [")),
  },
  {
    name: 'a transition that does not advance the step index',
    phase: 'render',
    detail: /step 4 \(index 3\): transition from step 2 did not advance: expected index 3, observed index 2/,
    startsPreview: true,
    apply: (dir) => edit(dir, 'src/presentation-kit/usePresentationNav.ts', (s) => s.replace('Math.min(last, i + 1)', 'i === 2 ? i : Math.min(last, i + 1)')),
  },
]

describe('E2E-002: verification failures are actionable', () => {
  for (const fault of faults) {
    it(`fails on ${fault.name}, naming the phase${fault.phase === 'render' ? ' and step' : ''}`, async () => {
      const dir = tempDir('verify-fault')
      copies.push(dir)
      copyProject(dir)
      fault.apply(dir)
      const result = await exec('node', ['scripts/verify.mjs'], dir)
      expect(result.code).not.toBe(0)
      expect(result.output).toMatch(new RegExp(`FAIL ${fault.phase}:`))
      expect(result.output).toMatch(fault.detail)
      expect(result.output).not.toMatch(/\nPASS/)
      const pid = previewPid(result.output)
      if (fault.startsPreview) {
        expect(pid).not.toBeNull()
        expect(await gone(pid!)).toBe(true)
      } else {
        expect(pid).toBeNull()
      }
    })
  }
})
