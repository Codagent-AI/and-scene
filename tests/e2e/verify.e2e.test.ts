import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { copyProject, hasLeakedProcess, run } from '../helpers/project-copy'

// E2E-001 / E2E-002: `npm run verify` against isolated copies; the source checkout is never touched.
const copies: string[] = []

function freshCopy() {
  const dir = mkdtempSync(join(tmpdir(), 'and-scene-e2e-'))
  copies.push(dir)
  copyProject(dir)
  return dir
}

function edit(dir: string, file: string, from: string | RegExp, to: string) {
  const path = join(dir, file)
  const before = readFileSync(path, 'utf8')
  const after = before.replace(from, to)
  if (after === before) throw new Error(`fault injection did not change ${file}`)
  writeFileSync(path, after)
}

const verify = (dir: string) => run('npm', ['run', 'verify'], dir)

afterAll(() => {
  for (const dir of copies) rmSync(dir, { recursive: true, force: true })
})

describe('E2E-001 reference presentation passes production verification', () => {
  it('builds, registers, renders all nine steps over 127.0.0.1 and reports a clear pass', () => {
    const dir = freshCopy()
    const r = verify(dir)
    expect(r.status, r.stdout + r.stderr).toBe(0)
    expect(r.stdout).toContain('ok build')
    expect(r.stdout).toContain('ok sample (how-to-make-a-presentation)')
    expect(r.stdout).toMatch(/ok render http:\/\/127\.0\.0\.1:\d+\/how-to-make-a-presentation steps 0,1,2,3,4,5,6,7,8\n/)
    expect(r.stdout).toMatch(/PASS verify: build, sample, render \(1 presentation\(s\), 9 steps\)/)
    expect(r.stderr).not.toMatch(/FAIL/)
    // host, readiness probe and browser URL are all IPv4 loopback
    for (const [url] of (r.stdout + r.stderr).matchAll(/https?:\/\/[^\s/]+/g)) expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
    expect(hasLeakedProcess(dir)).toBe(false)
  })
})

const FAULTS: {
  name: string
  inject: (dir: string) => void
  expected: RegExp
}[] = [
  {
    name: 'a type error breaks the build',
    inject: (d) => writeFileSync(join(d, 'src/Landing.tsx'), readFileSync(join(d, 'src/Landing.tsx'), 'utf8') + "\nexport const broken: number = 'nope'\n"),
    expected: /^FAIL build: /m,
  },
  {
    name: 'the reference sample is not registered',
    inject: (d) => edit(d, 'src/presentations/index.ts', "slug: 'how-to-make-a-presentation'", "slug: 'renamed-sample'"),
    expected: /^FAIL sample: reference sample "how-to-make-a-presentation" is not registered/m,
  },
  {
    name: 'two sample steps are out of order',
    inject: (d) => {
      const f = 'src/presentations/how-to-make-a-presentation/steps/index.ts'
      edit(d, f, "'You have a topic'", "'@@A'")
      edit(d, f, "'The skill interviews you'", "'You have a topic'")
      edit(d, f, "'@@A'", "'The skill interviews you'")
    },
    expected: /^FAIL sample \(step index 0\): title is "The skill interviews you", expected "You have a topic"/m,
  },
  {
    name: 'a step emits a console error',
    inject: (d) =>
      edit(d, 'src/presentations/how-to-make-a-presentation/steps/scene.tsx', 'const { n } = payload\n', "const { n } = payload\n  if (n === 4) console.error('injected console error')\n"),
    expected: /^FAIL render \(step index 3\): console\.error: injected console error/m,
  },
  {
    name: 'a step throws an uncaught error',
    inject: (d) =>
      edit(d, 'src/presentations/how-to-make-a-presentation/steps/scene.tsx', 'const { n } = payload\n', "const { n } = payload\n  if (n === 6) throw new Error('injected crash')\n"),
    expected: /^FAIL render \(step index 5\): /m,
  },
  {
    name: 'a transition does not advance the public step index',
    inject: (d) => edit(d, 'src/presentation-kit/usePresentationNav.ts', 'Math.min(last, i + 1)', 'Math.min(Math.min(last, 2), i + 1)'),
    expected: /^FAIL render \(step index 3\): step index stayed 2 for \d+ms, expected 3/m,
  },
]

describe('E2E-002 verification failures are actionable', () => {
  it.each(FAULTS)('exits non-zero, names the phase and step, and cleans up when $name', ({ inject, expected }) => {
    const dir = freshCopy()
    inject(dir)
    const r = verify(dir)
    expect(r.status, r.stdout).not.toBe(0)
    expect(r.stderr).toMatch(expected)
    expect(r.stdout + r.stderr).not.toContain('PASS')
    expect(hasLeakedProcess(dir)).toBe(false)
  })
})
