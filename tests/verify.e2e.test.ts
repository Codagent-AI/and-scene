import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { copyRepo, node } from './helpers'

const edit = (dir: string, rel: string, fn: (s: string) => string) => {
  const f = path.join(dir, rel)
  const before = fs.readFileSync(f, 'utf8')
  const after = fn(before)
  expect(after, `${rel} fault was applied`).not.toBe(before)
  fs.writeFileSync(f, after)
}
const SAMPLE = 'src/presentations/how-to-make-a-presentation'

const faults: { name: string; apply: (dir: string) => void; expect: RegExp }[] = [
  {
    name: 'build failure',
    apply: (d) => edit(d, `${SAMPLE}/Talk.tsx`, (s) => `${s}\nexport const broken: number = 'text'\n`),
    expect: /VERIFY FAILED phase=build/,
  },
  {
    name: 'sample unregistered',
    apply: (d) =>
      edit(d, 'src/presentations/index.ts', (s) => s.replace(/\s*\{\s*slug: 'how-to-make-a-presentation'[\s\S]*?\},\n/, '\n')),
    expect: /VERIFY FAILED phase=sample.*not registered/,
  },
  {
    name: 'steps out of order',
    apply: (d) =>
      edit(d, `${SAMPLE}/steps/index.ts`, (s) =>
        s.replace("'You have a topic'", "'TMP'").replace("'The skill interviews you'", "'You have a topic'").replace("'TMP'", "'The skill interviews you'"),
      ),
    expect: /VERIFY FAILED phase=sample step=0/,
  },
  {
    name: 'console error at a step',
    apply: (d) =>
      edit(d, `${SAMPLE}/steps/Scene.tsx`, (s) =>
        s.replace('const { n } = payload', "const { n } = payload\n  if (n === 3) console.error('boom at step 3')"),
      ),
    expect: /VERIFY FAILED phase=render step=2: console.error: boom at step 3/,
  },
  {
    name: 'transition that does not advance',
    apply: (d) =>
      edit(d, 'src/presentation-kit/usePresentationNav.ts', (s) =>
        s.replace('setIndex((i) => clamp(i + 1, count))', 'setIndex((i) => Math.min(i + 1, 1))'),
      ),
    expect: /VERIFY FAILED phase=transition step=2/,
  },
]

// E2E-002: verification failures are actionable, each in an independent throwaway copy.
describe('E2E-002 verification failures', () => {
  it.each(faults)('fails on $name', ({ apply, expect: re }) => {
    const dir = copyRepo()
    apply(dir)
    const r = node(dir, ['scripts/verify.mjs'])
    expect(r.code).not.toBe(0)
    expect(r.out).toMatch(re)
    expect(r.out).not.toContain('VERIFY PASSED')
    const left = spawnSync('pgrep', ['-f', path.join(dir, 'node_modules/.bin/vite')], { encoding: 'utf8' })
    expect(left.stdout.trim(), 'preview process cleaned up').toBe('')
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('passes on an unmodified copy (E2E-001 path) using 127.0.0.1', () => {
    const dir = copyRepo()
    const r = node(dir, ['scripts/verify.mjs'])
    expect(r.code, r.out).toBe(0)
    expect(r.out).toContain('VERIFY PASSED')
    expect(r.out).toContain('9 steps rendered without errors on 127.0.0.1')
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('uses only the IPv4 loopback address for preview and browser URLs', () => {
    const lib = fs.readFileSync(path.join(__dirname, '../scripts/lib.mjs'), 'utf8')
    expect(lib).toContain("HOST = '127.0.0.1'")
    for (const f of ['lib.mjs', 'verify.mjs', 'inspect-presentation.mjs']) {
      expect(fs.readFileSync(path.join(__dirname, '../scripts', f), 'utf8')).not.toContain('localhost')
    }
  })
})
