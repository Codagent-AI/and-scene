import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyProject, isListening, previewPort, remove, run, write } from '../helpers/project.ts'

// E2E-002: `npm run verify` against disposable copies with one fault each.
// The baseline case mirrors E2E-001's assertions on an unmodified copy.
const SAMPLE = 'src/presentations/how-to-make-a-presentation'
const copies: string[] = []

async function verifyWith(mutate: (dir: string) => void, env: NodeJS.ProcessEnv = {}) {
  const dir = copyProject()
  copies.push(dir)
  mutate(dir)
  const result = await run('npm', ['run', 'verify'], { cwd: dir, env: { VERIFY_STEP_TIMEOUT_MS: '2000', ...env } })
  return { dir, ...result, output: `${result.stdout}\n${result.stderr}` }
}

afterAll(() => copies.forEach(remove))

const edit = (dir: string, rel: string, fn: (text: string) => string) => {
  const file = path.join(dir, rel)
  write(dir, rel, fn(readFileSync(file, 'utf8')))
}

function expectFailure(r: { code: number | null; output: string }, phase: string) {
  expect(r.code).not.toBe(0)
  expect(r.output).toContain(`VERIFY FAILED: ${phase}`)
  expect(r.output).not.toContain('VERIFY PASSED')
}

async function expectPreviewStopped(output: string) {
  const port = previewPort(output)
  expect(port, 'a preview was started').not.toBeNull()
  expect(await isListening(port!)).toBe(false)
}

describe('baseline copy (E2E-001 assertions)', () => {
  it('passes with one clear result, IPv4 loopback and no surviving preview', async () => {
    const r = await verifyWith(() => {})
    expect(r.code).toBe(0)
    expect(r.output.match(/VERIFY PASSED/g)).toHaveLength(1)
    expect(r.output).not.toContain('VERIFY FAILED')
    expect(r.output).toMatch(/\[sample-outline\] 9 steps match/)
    expect(r.output).toMatch(/\[render\] preview http:\/\/127\.0\.0\.1:\d+\//)
    expect(r.output).not.toMatch(/localhost/)
    for (let i = 0; i < 9; i++) expect(r.output).toContain(`step index ${i} ok (${i + 1}/9)`)
    await expectPreviewStopped(r.output)
  })
})

describe('build phase', () => {
  it('fails on a type error in a non-sample presentation', async () => {
    const r = await verifyWith((dir) => {
      write(dir, 'src/presentations/broken/Talk.tsx', "const n: number = 'not a number'\nexport default function Talk() { return <p>{n}</p> }\n")
      edit(dir, 'src/presentations/index.ts', (t) => t.replace(/\n\]/, "\n  { slug: 'broken', title: 'Broken', load: () => import('./broken/Talk.tsx') },\n]"))
    })
    expectFailure(r, 'build')
    expect(r.output).toMatch(/npm run build failed/)
    expect(r.output).toMatch(/not assignable to type 'number'|TS2322/)
  })
})

describe('sample-outline phase', () => {
  it('fails when the sample is missing from the registry although the app still compiles', async () => {
    const r = await verifyWith((dir) => edit(dir, 'src/presentations/index.ts', (t) => t.replace(/\n {2}\{[\s\S]*?\n {2}\},/, '')))
    expectFailure(r, 'sample-outline')
    expect(r.output).toMatch(/"how-to-make-a-presentation" is not registered/)
  })

  it('fails when two steps are out of order', async () => {
    const r = await verifyWith((dir) =>
      edit(dir, `${SAMPLE}/outline.ts`, (t) => {
        const blocks = t.split('  {\n    id: ')
        ;[blocks[3], blocks[4]] = [blocks[4], blocks[3]]
        return blocks.join('  {\n    id: ')
      }),
    )
    expectFailure(r, 'sample-outline')
    expect(r.output).toMatch(/step 3 title/)
  })

  it('fails when a caption is altered', async () => {
    const r = await verifyWith((dir) => edit(dir, `${SAMPLE}/outline.ts`, (t) => t.replace('Thanks for watching.', 'Goodbye.')))
    expectFailure(r, 'sample-outline')
    expect(r.output).toMatch(/step 9 caption/)
  })

  it('fails when the reference outline data is missing instead of skipping the check', async () => {
    const r = await verifyWith((dir) => remove(path.join(dir, 'scripts/reference-outline.json')))
    expectFailure(r, 'sample-outline')
    expect(r.output).toMatch(/reference outline scripts\/reference-outline\.json is missing/)
  })

  it('fails when the config declares neither a reference sample nor an opt-out', async () => {
    const r = await verifyWith((dir) => write(dir, 'presentation.config.json', '{}'))
    expectFailure(r, 'config')
  })
})

describe('render phase', () => {
  it('fails with the offending step when a console error appears mid-way', async () => {
    const r = await verifyWith((dir) =>
      edit(dir, `${SAMPLE}/steps/Scene.tsx`, (t) =>
        t
          .replace("import { Check,", "import { useEffect } from 'react'\nimport { Check,")
          .replace('export function Scene({ payload }: SceneProps<ScenePayload>) {', "export function Scene({ payload }: SceneProps<ScenePayload>) {\n  useEffect(() => {\n    if (payload.stage === 5) console.error('boom at stage five')\n  }, [payload.stage])"),
      ),
    )
    expectFailure(r, 'render (step index 4, step 5)')
    expect(r.output).toContain('boom at stage five')
    await expectPreviewStopped(r.output)
  })

  it('fails with the offending step on an uncaught page error', async () => {
    const r = await verifyWith((dir) =>
      edit(dir, `${SAMPLE}/steps/Scene.tsx`, (t) =>
        t
          .replace("import { Check,", "import { useEffect } from 'react'\nimport { Check,")
          .replace('export function Scene({ payload }: SceneProps<ScenePayload>) {', "export function Scene({ payload }: SceneProps<ScenePayload>) {\n  useEffect(() => {\n    if (payload.stage === 3) setTimeout(() => { throw new Error('late failure') }, 0)\n  }, [payload.stage])"),
      ),
    )
    expectFailure(r, 'render (step index 2, step 3)')
    expect(r.output).toContain('uncaught page error: late failure')
    await expectPreviewStopped(r.output)
  })

  it('fails when a transition does not advance the public step index', async () => {
    const r = await verifyWith((dir) =>
      edit(dir, `${SAMPLE}/steps/Scene.tsx`, (t) =>
        t
          .replace("import { Check,", "import { useEffect } from 'react'\nimport { Check,")
          .replace('export function Scene({ payload }: SceneProps<ScenePayload>) {', "export function Scene({ payload }: SceneProps<ScenePayload>) {\n  useEffect(() => {\n    if (payload.stage !== 4) return\n    const block = (e: KeyboardEvent) => e.stopImmediatePropagation()\n    window.addEventListener('keydown', block, true)\n    return () => window.removeEventListener('keydown', block, true)\n  }, [payload.stage])"),
      ),
    )
    expectFailure(r, 'render (step index 4, step 5)')
    expect(r.output).toMatch(/transition did not advance: data-step-index is 3, expected 4 within 2000ms/)
    await expectPreviewStopped(r.output)
  })

  it('fails when a registered presentation other than the sample errors on its first step', async () => {
    const r = await verifyWith((dir) => {
      write(dir, 'src/presentations/other/Talk.tsx', "export default function Talk() { console.error('first step broke'); return <p>hi</p> }\n")
      edit(dir, 'src/presentations/index.ts', (t) => t.replace(/\n\]/, "\n  { slug: 'other', title: 'Other', load: () => import('./other/Talk.tsx') },\n]"))
    })
    expectFailure(r, 'render')
    expect(r.output).toMatch(/no \[data-step-count\] hook rendered|first step broke/)
    await expectPreviewStopped(r.output)
  })
})

beforeAll(() => {
  // Fail fast with a clear message when dependencies are not installed.
  readFileSync(path.join(process.cwd(), 'node_modules/vite/package.json'))
})
