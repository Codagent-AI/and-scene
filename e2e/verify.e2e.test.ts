import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { copyRepo, portIsFree, repoRoot, run } from './helpers'

describe('E2E-001: reference presentation passes production verification', () => {
  it('exits 0 with a clear PASS', async () => {
    const { code, output } = await run('npm', ['run', 'verify'], repoRoot)
    expect(output).toContain('VERIFY PASS')
    expect(output).toMatch(/PASS {2}render — 9 steps rendered at http:\/\/127\.0\.0\.1:\d+/)
    expect(output).not.toMatch(/localhost/)
    expect(code).toBe(0)
  })
})

function edit(dir: string, file: string, fn: (s: string) => string) {
  const p = path.join(dir, file)
  writeFileSync(p, fn(readFileSync(p, 'utf8')))
}

const SCENE = 'src/presentations/how-to-make-a-presentation/TalkScene.tsx'

const faults: { name: string; apply: (dir: string) => void; phase: string; step?: number; match: RegExp }[] = [
  {
    name: 'type error breaks the build',
    apply: (d) => edit(d, 'src/main.tsx', (s) => `${s}\nexport const broken: number = 'nope'\n`),
    phase: 'build',
    match: /error TS2322/,
  },
  {
    name: 'sample missing from the registry',
    apply: (d) => edit(d, 'src/presentations/index.ts', (s) => s.replace(/slug: 'how-to-make-a-presentation'/, "slug: 'renamed'")),
    phase: 'sample',
    match: /not registered/,
  },
  {
    name: 'sample titles out of order',
    apply: (d) =>
      edit(d, 'src/presentations/how-to-make-a-presentation/outline.ts', (s) =>
        s.replace('You have a topic', '@@').replace('The skill interviews you', 'You have a topic').replace('@@', 'The skill interviews you'),
      ),
    phase: 'sample',
    match: /out of order/,
  },
  {
    name: 'a step emits console.error',
    apply: (d) =>
      edit(d, SCENE, (s) =>
        s.replace('const cards =', "if (n === 5) console.error('injected failure')\n  const cards ="),
      ),
    phase: 'render',
    step: 4,
    match: /injected failure/,
  },
  {
    name: 'a transition does not advance',
    apply: (d) =>
      edit(d, SCENE, (s) =>
        s
          .replace("import { Appear", "import { useEffect } from 'react'\nimport { Appear")
          .replace(
            'const cards =',
            "useEffect(() => {\n    if (n !== 4) return\n    const block = (e: KeyboardEvent) => e.key === 'ArrowRight' && e.stopImmediatePropagation()\n    window.addEventListener('keydown', block, true)\n    return () => window.removeEventListener('keydown', block, true)\n  }, [n])\n  const cards =",
          ),
      ),
    phase: 'render',
    step: 3,
    match: /did not advance/,
  },
]

describe('E2E-002: verification failures are actionable', () => {
  for (const fault of faults) {
    it(`${fault.name} -> fails in phase "${fault.phase}"`, async () => {
      const dir = copyRepo()
      fault.apply(dir)
      const port = 40000 + Math.floor(Math.random() * 20000)
      const { code, output } = await run('node', ['scripts/verify.mjs'], dir, { PREVIEW_PORT: String(port) })
      expect(code).not.toBe(0)
      expect(output).not.toContain('VERIFY PASS')
      expect(output).toContain(`VERIFY FAIL: phase "${fault.phase}"`)
      if (fault.step !== undefined) expect(output).toContain(`at step index ${fault.step}`)
      expect(output).toMatch(fault.match)
      expect(await portIsFree(port)).toBe(true)
    })
  }
})
