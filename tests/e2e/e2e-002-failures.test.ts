import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyRepo, edit, pidState, portListening, previewOf, sourceSnapshot, verify } from './helpers'

const SAMPLE = 'src/presentations/how-to-make-a-presentation'

interface Fault {
  name: string
  apply: (dir: string) => void
  /** The failing line verification must print. */
  expected: RegExp
  previewStarted: boolean
}

const FAULTS: Fault[] = [
  {
    name: 'a build error outside the sample (in the host app)',
    apply: (d) => edit(d, 'src/Landing.tsx', (t) => `${t}\nexport const broken: number = 'not a number'\n`),
    expected: /^FAIL \[build\]: npm run build exited with/m,
    previewStarted: false,
  },
  {
    name: 'a missing sample (not registered)',
    apply: (d) =>
      edit(d, 'src/presentations/index.ts', (t) => t.replace(/\[\n[\s\S]*\n\]/, '[]')),
    expected: /^FAIL \[sample\]: presentation "how-to-make-a-presentation" is not registered/m,
    previewStarted: false,
  },
  {
    name: 'steps out of order',
    apply: (d) =>
      edit(d, `${SAMPLE}/steps.ts`, (t) =>
        t.replaceAll('The skill interviews you', '@@').replaceAll('Answers become steps', 'The skill interviews you').replaceAll('@@', 'Answers become steps'),
      ),
    expected: /^FAIL \[sample\] step 2 \(index 1\): title mismatch/m,
    previewStarted: true,
  },
  {
    name: 'a console error on a later step',
    apply: (d) => {
      edit(d, `${SAMPLE}/Scene.tsx`, (t) =>
        t
          .replace("import type { ReactNode } from 'react'", "import { useEffect, type ReactNode } from 'react'")
          .replace('  const edited = payload.stage >= 7\n', "  const edited = payload.stage >= 7\n  useEffect(() => {\n    if (payload.stage === 5) console.error('boom on step six')\n  }, [payload.stage])\n"),
      )
    },
    expected: /^FAIL \[render\] step 6 \(index 5\): console\.error: boom on step six/m,
    previewStarted: true,
  },
  {
    name: 'an uncaught page error on a later step',
    apply: (d) => {
      edit(d, `${SAMPLE}/Scene.tsx`, (t) =>
        t
          .replace("import type { ReactNode } from 'react'", "import { useEffect, type ReactNode } from 'react'")
          .replace('  const edited = payload.stage >= 7\n', "  const edited = payload.stage >= 7\n  useEffect(() => {\n    if (payload.stage === 3) setTimeout(() => { throw new Error('late failure') }, 0)\n  }, [payload.stage])\n"),
      )
    },
    expected: /^FAIL \[render\] step 4 \(index 3\): uncaught: late failure/m,
    previewStarted: true,
  },
  {
    name: 'a scene that throws while rendering a later step',
    apply: (d) =>
      edit(d, `${SAMPLE}/Scene.tsx`, (t) =>
        t.replace('  const edited = payload.stage >= 7\n', "  const edited = payload.stage >= 7\n  if (payload.stage === 4) throw new Error('render crash')\n"),
      ),
    expected: /^FAIL \[render\] step 5 \(index 4\): uncaught: render crash/m,
    previewStarted: true,
  },
  {
    name: 'a transition that does not advance the step index',
    apply: (d) =>
      edit(d, 'src/presentation-kit/usePresentationNav.ts', (t) =>
        t.replace('setIndex((i) => clampIndex(i + 1, last + 1))', 'setIndex((i) => (i === 3 ? i : clampIndex(i + 1, last + 1)))'),
      ),
    expected: /^FAIL \[transition\] step 5 \(index 4\): ArrowRight did not advance to index 4 \(still 3\)/m,
    previewStarted: true,
  },
]

describe('E2E-002: verification failures are actionable', () => {
  const before = sourceSnapshot()
  const copies: string[] = []

  beforeAll(() => {
    expect(before.head).toMatch(/\w{40}/)
  })

  afterAll(() => {
    for (const c of copies) fs.rmSync(c, { recursive: true, force: true })
  })

  it.each(FAULTS)('fails for $name', async ({ apply, expected, previewStarted }) => {
    const dir = copyRepo()
    copies.push(dir)
    apply(dir)
    const r = verify(dir)

    expect(r.status, r.output).not.toBe(0)
    expect(r.output).toMatch(expected)
    expect(r.output).not.toMatch(/PASS verify/)

    const preview = previewOf(r.output)
    expect(preview !== null).toBe(previewStarted)
    if (preview) {
      expect(pidState(preview.pid)).not.toBe('running')
      expect(await portListening(preview.port)).toBe(false)
    }
    expect(fs.existsSync(path.join(dir, 'package.json'))).toBe(true)
  })

  it('left the source checkout exactly as it was', () => {
    expect(sourceSnapshot()).toEqual(before)
  })
})
