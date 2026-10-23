import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { browserProcessAlive, cleanupTempDirs, copyRepo, freePort, isListening, previewProcessAlive, run } from '../support/workspace.ts'

// E2E-002: verification failures are actionable. One representative fault per
// phase, each in its own disposable copy of the repository.
afterAll(cleanupTempDirs)

const SAMPLE = 'src/presentations/how-to-make-a-presentation'

function edit(dir: string, file: string, change: (src: string) => string) {
  const p = path.join(dir, file)
  const before = readFileSync(p, 'utf8')
  const after = change(before)
  if (after === before) throw new Error(`fault injection did not change ${file}`)
  writeFileSync(p, after)
}

async function verifyFaulty(inject: (dir: string) => void) {
  const dir = copyRepo()
  inject(dir)
  const port = await freePort()
  const result = await run('npm', ['run', 'verify', '--', '--port', String(port)], dir)
  return { ...result, port, dir }
}

async function expectCleanFailure(r: { code: number | null; out: string; port: number }) {
  expect(r.code, r.out).not.toBe(0)
  expect(r.out).toMatch(/verify: FAIL \[/)
  expect(r.out).not.toMatch(/verify: PASS/)
  expect(await isListening(r.port)).toBe(false)
  expect(previewProcessAlive(r.port)).toBe(false)
  expect(browserProcessAlive()).toBe(false)
}

describe('E2E-002 verification failures are actionable', () => {
  it('fails the build phase on a type error anywhere in the app', async () => {
    const r = await verifyFaulty((d) => edit(d, 'src/Landing.tsx', (s) => s + "\nexport const broken: number = 'not a number'\n"))
    expect(r.out).toMatch(/verify: FAIL \[build\]/)
    expect(r.out).toMatch(/Landing\.tsx/)
    expect(r.out).not.toMatch(/preview ready/) // never got as far as the browser
    expect(r.code).not.toBe(0)
  })

  it('fails the sample phase when the reference sample is not registered', async () => {
    const r = await verifyFaulty((d) =>
      edit(d, 'src/presentations/index.ts', (s) => s.replace(/ {2}\{\n {4}slug: 'how-to-make-a-presentation'[\s\S]*?\n {2}\},\n/, '')),
    )
    expect(r.out).toMatch(/verify: FAIL \[sample\].*"how-to-make-a-presentation" is not registered/)
    await expectCleanFailure(r)
  })

  it('fails the sample phase when the reference outline is missing or malformed', async () => {
    const missing = await verifyFaulty((d) => rmSync(path.join(d, SAMPLE, 'outline.json')))
    expect(missing.out).toMatch(/verify: FAIL \[sample\].*outline.*missing/)
    await expectCleanFailure(missing)
    const malformed = await verifyFaulty((d) => writeFileSync(path.join(d, SAMPLE, 'outline.json'), '{ not json'))
    expect(malformed.out).toMatch(/verify: FAIL \[sample\].*malformed/)
    await expectCleanFailure(malformed)
  })

  it('fails the sample phase when steps are out of order, naming the mismatching step', async () => {
    const r = await verifyFaulty((d) =>
      edit(d, `${SAMPLE}/steps/steps.ts`, (s) =>
        s.replace("title: 'The skill interviews you'", "title: 'TMP'").replace("title: 'Answers become steps'", "title: 'The skill interviews you'").replace("title: 'TMP'", "title: 'Answers become steps'"),
      ),
    )
    expect(r.out).toMatch(/verify: FAIL \[sample\]/)
    expect(r.out).toMatch(/step 2 title: expected "The skill interviews you" but rendered "Answers become steps"/)
    expect(r.out).toMatch(/step 3 title/)
    await expectCleanFailure(r)
  })

  it('fails the render phase on a console error, naming the offending step', async () => {
    const r = await verifyFaulty((d) =>
      edit(d, `${SAMPLE}/scene.tsx`, (s) =>
        s.replace('  const ids = Object.keys(ENTITIES)', "  if (payload.index === 3) console.error('injected console fault')\n  const ids = Object.keys(ENTITIES)"),
      ),
    )
    expect(r.out).toMatch(/verify: FAIL \[render\] step index 3: console\.error: .*injected console fault/)
    await expectCleanFailure(r)
  })

  it('fails the render phase on an uncaught page error, naming the offending step', async () => {
    const r = await verifyFaulty((d) => {
      edit(d, `${SAMPLE}/scene.tsx`, (s) =>
        s
          .replace("import { Check,", "import { useEffect } from 'react'\nimport { Check,")
          .replace(
            '  const ids = Object.keys(ENTITIES)',
            "  useEffect(() => {\n    if (payload.index === 5) setTimeout(() => { throw new Error('injected page fault') })\n  }, [payload.index])\n  const ids = Object.keys(ENTITIES)",
          ),
      )
    })
    expect(r.out).toMatch(/verify: FAIL \[render\] step index 5: uncaught exception: injected page fault/)
    await expectCleanFailure(r)
  })

  it('fails the transition phase when the public step index does not advance', async () => {
    const r = await verifyFaulty((d) =>
      edit(d, 'src/presentation-kit/usePresentationNav.ts', (s) =>
        s.replace('const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])', 'const next = useCallback(() => setIndex((i) => (i === 4 ? i : clampIndex(i + 1, count))), [count])'),
      ),
    )
    expect(r.out).toMatch(/verify: FAIL \[transition\] step index 4: step index did not advance from 4 to 5/)
    await expectCleanFailure(r)
  })
})
