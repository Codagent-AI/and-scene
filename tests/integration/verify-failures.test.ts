import { readFileSync, writeFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { cleanup, copyRepo, ROOT, run } from './helpers.ts'

afterAll(cleanup)

const SAMPLE = 'src/presentations/how-to-make-a-presentation'

function portOpen(port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port }, () => {
      socket.destroy()
      resolve(true)
    })
    socket.on('error', () => resolve(false))
  })
}

async function verifyCopy(edit: (file: (rel: string, change: (text: string) => string) => void) => void) {
  const dir = copyRepo()
  edit((rel, change) => {
    const file = path.join(dir, rel)
    const before = readFileSync(file, 'utf8')
    const after = change(before)
    if (after === before) throw new Error(`fault injection did not change ${rel}`)
    writeFileSync(file, after)
  })
  const result = run('node', ['scripts/verify.mjs'], dir)
  const port = /preview on http:\/\/127\.0\.0\.1:(\d+)/.exec(result.output)?.[1]
  if (port) expect(await portOpen(Number(port)), 'preview process must be cleaned up').toBe(false)
  return result
}

// E2E-001: the real repository passes its production verification.
describe('reference presentation verification', () => {
  it('passes with a clear result, using 127.0.0.1 throughout', () => {
    const result = run('node', ['scripts/verify.mjs'], ROOT)
    expect(result.status, result.output).toBe(0)
    expect(result.output).toMatch(/PASS\s*$/)
    expect(result.output).toContain('how-to-make-a-presentation: rendered 9 steps')
    expect(result.output).toMatch(/preview on http:\/\/127\.0\.0\.1:\d+/)
    expect(result.output).not.toContain('localhost')
  })
})

// E2E-002: each fault in a throwaway copy fails verification with an actionable message.
describe('verification failures', () => {
  it('fails the build phase on a type error anywhere in the app', async () => {
    const result = await verifyCopy((file) => file('src/Landing.tsx', (t) => `${t}\nexport const broken: number = 'not a number'\n`))
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('FAIL [build]')
    expect(result.output).not.toContain('PASS')
  })

  it('fails the sample phase when the sample is not registered', async () => {
    const result = await verifyCopy((file) =>
      file('src/presentations/index.ts', (t) => t.replace("slug: 'how-to-make-a-presentation'", "slug: 'renamed'")),
    )
    expect(result.status).not.toBe(0)
    expect(result.output).toContain('FAIL [sample]')
    expect(result.output).toContain('how-to-make-a-presentation')
  })

  it('fails the sample phase when steps are out of order', async () => {
    const result = await verifyCopy((file) =>
      file(`${SAMPLE}/steps/index.ts`, (t) =>
        t.replace('"You have a topic"', '"@@"').replace('"The skill interviews you"', '"You have a topic"').replace('"@@"', '"The skill interviews you"'),
      ),
    )
    expect(result.status).not.toBe(0)
    expect(result.output).toMatch(/FAIL \[sample\] step 0/)
  })

  it('fails the sample phase when a caption is malformed', async () => {
    const result = await verifyCopy((file) => file(`${SAMPLE}/steps/index.ts`, (t) => t.replace('mild overconfidence.', 'mild overconfidence!')))
    expect(result.output).toMatch(/FAIL \[sample\] step 0.*caption/)
    expect(result.status).not.toBe(0)
  })

  it.each([
    ['a console error', 'useEffect(() => { if (stepIndex === 2) console.error("boom") }, [stepIndex])', 2],
    ['an uncaught page error', 'useEffect(() => { if (stepIndex === 3) setTimeout(() => { throw new Error("uncaught") }, 0) }, [stepIndex])', 3],
    ['a step that throws while rendering', 'useEffect(() => {}, []); if (stepIndex === 4) throw new Error("render crash")', 4],
  ])('fails the render phase and names the step for %s', async (_name, injected, step) => {
    const result = await verifyCopy((file) =>
      file(`${SAMPLE}/steps/scene.tsx`, (t) =>
        t.replace("import { Appear }", "import { useEffect } from 'react'\nimport { Appear }").replace('  return (\n    <SceneLayer>', `  ${injected}\n  return (\n    <SceneLayer>`),
      ),
    )
    expect(result.status).not.toBe(0)
    expect(result.output).toMatch(new RegExp(`FAIL \\[render\\] step ${step}:`))
  })

  it('fails the transition phase when the step index does not advance', async () => {
    const result = await verifyCopy((file) =>
      file('src/presentation-kit/usePresentationNav.ts', (t) =>
        t.replace('const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])', 'const next = useCallback(() => setIndex((i) => (i === 5 ? i : clampIndex(i + 1, count))), [count])'),
      ),
    )
    expect(result.status).not.toBe(0)
    expect(result.output).toMatch(/FAIL \[transition\] step 6:/)
  })
})
