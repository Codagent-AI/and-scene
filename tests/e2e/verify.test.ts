import { spawnSync } from 'node:child_process'
import { afterAll, describe, expect, it } from 'vitest'
import { REPO, cleanupTmp, copyRepo, read, run, write } from '../helpers'

afterAll(cleanupTmp)

const SAMPLE = 'src/presentations/how-to-make-a-presentation'
const verify = (cwd: string) => run('npm', ['run', 'verify'], cwd)
const leftoverPreviews = (cwd: string) => spawnSync('pgrep', ['-f', `${cwd}/node_modules/vite/bin`], { encoding: 'utf8' }).stdout.trim()

describe('E2E-001: reference presentation passes production verification', () => {
  it('builds, registers, and renders all nine steps on 127.0.0.1 and exits zero', () => {
    const res = verify(REPO)
    expect(res.status, res.out).toBe(0)
    expect(res.out).toContain('[verify] PASS')
    expect(res.out).toContain('how-to-make-a-presentation: 9 steps rendered cleanly')
    expect(res.out).toMatch(/preview ready at http:\/\/127\.0\.0\.1:\d+/)
    expect(res.out).not.toMatch(/localhost|\[::1\]/)
  })
})

describe('E2E-002: verification failures are actionable', () => {
  const faults: { name: string; expect: RegExp; edit: (dir: string) => void }[] = [
    {
      name: 'build-breaking edit',
      expect: /FAIL phase=build/,
      edit: (d) => write(d, `${SAMPLE}/entities.ts`, `${read(d, `${SAMPLE}/entities.ts`)}\nexport const broken: number = 'not a number'\n`),
    },
    {
      name: 'missing sample',
      expect: /FAIL phase=registry/,
      edit: (d) => write(d, 'src/presentations/index.ts', read(d, 'src/presentations/index.ts').replace(/\{\s*slug: 'how-to[\s\S]*?\},\n/, '')),
    },
    {
      name: 'out-of-order sample',
      expect: /FAIL phase=sample step=2/,
      edit: (d) => {
        const meta = read(d, `${SAMPLE}/steps/meta.ts`)
        write(d, `${SAMPLE}/steps/meta.ts`, meta.replace("'Answers become steps'", 'TMP').replace("'The deck grows'", "'Answers become steps'").replace('TMP', "'The deck grows'"))
      },
    },
    {
      name: 'step that emits a browser error',
      expect: /FAIL phase=render step=3: .*boom/,
      edit: (d) => {
        const f = `${SAMPLE}/steps/Scene.tsx`
        write(
          d,
          f,
          read(d, f)
            .replace("import { AnimatePresence } from 'motion/react'", "import { useEffect } from 'react'\nimport { AnimatePresence } from 'motion/react'")
            .replace('const { n } = payload', "const { n } = payload\n  useEffect(() => {\n    if (n === 4) console.error('boom')\n  }, [n])"),
        )
      },
    },
    {
      name: 'error emitted after a slow entrance',
      expect: /FAIL phase=render step=8: .*late reveal failure/,
      edit: (d) => {
        write(d, 'src/presentation-kit/constants.ts', read(d, 'src/presentation-kit/constants.ts').replace('ENTER_DELAY = LAYOUT_T', 'ENTER_DELAY = 1.8'))
        const f = `${SAMPLE}/steps/Scene.tsx`
        write(
          d,
          f,
          read(d, f)
            .replace("import { AnimatePresence } from 'motion/react'", "import { useEffect } from 'react'\nimport { AnimatePresence } from 'motion/react'")
            .replace('const { n } = payload', "const { n } = payload\n  useEffect(() => {\n    if (n !== 9) return\n    const t = setTimeout(() => console.error('late reveal failure'), 2000)\n    return () => clearTimeout(t)\n  }, [n])"),
        )
      },
    },
    {
      name: 'transition that does not advance',
      expect: /FAIL phase=transition step=3/,
      edit: (d) => write(d, 'src/presentation-kit/navigation.ts', read(d, 'src/presentation-kit/navigation.ts').replace('Math.min(count - 1, index)', 'Math.min(count - 1, 2, index)')),
    },
  ]

  for (const fault of faults) {
    it(`fails with a named phase for: ${fault.name}`, () => {
      const dir = copyRepo()
      fault.edit(dir)
      const res = verify(dir)
      expect(res.status, res.out).not.toBe(0)
      expect(res.out).toMatch(fault.expect)
      expect(res.out).not.toContain('[verify] PASS')
      expect(leftoverPreviews(dir)).toBe('')
    })
  }
})
