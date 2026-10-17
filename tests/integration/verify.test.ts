import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { copyRepository, listProcesses, repoRoot, run, scaffoldScript, type Workspace } from './helpers'

// E2E-001 (on an isolated copy) and E2E-002: `scripts/verify.mjs` against throwaway copies of
// the repository, each carrying one fault. The source checkout is never modified.

const SAMPLE = 'src/presentations/how-to-make-a-presentation'
const copies: Workspace[] = []

afterEach(() => {
  for (const copy of copies.splice(0)) copy.cleanup()
})

function fresh(): Workspace {
  const copy = copyRepository()
  copies.push(copy)
  return copy
}

function edit(copy: Workspace, file: string, change: (text: string) => string) {
  const path = join(copy.dir, file)
  const before = readFileSync(path, 'utf8')
  const after = change(before)
  expect(after, `fault not applied to ${file}`).not.toBe(before)
  writeFileSync(path, after)
}

const verify = (copy: Workspace) => run('node', ['scripts/verify.mjs'], copy.dir, { VERIFY_SETTLE_MS: '700' })

function expectFailure(result: { code: number | null; output: string }, phase: string, detail?: RegExp) {
  expect(result.code, result.output).not.toBe(0)
  expect(result.output).toMatch(new RegExp(`\\[verify\\] FAIL phase=${phase}:`))
  expect(result.output).not.toMatch(/\[verify\] PASS/)
  if (detail) expect(result.output).toMatch(detail)
}

function noPreviewLeft(copy: Workspace) {
  expect(listProcesses(`${copy.dir}/node_modules/vite/bin/vite.js`)).toEqual([])
}

describe('E2E-001: reference presentation passes production verification', () => {
  it('builds, registers, and steps through all nine steps on 127.0.0.1', async () => {
    const copy = fresh()
    const result = await verify(copy)
    expect(result.code, result.output).toBe(0)
    const lines = result.output.split('\n')
    expect(lines.at(-2)).toMatch(/\[verify\] PASS$/)
    for (const phase of ['build', 'sample-registration', 'render']) expect(result.output).toContain(`phase ${phase}: PASS`)
    const stepLines = lines.filter((line) => /step index \d+: ok/.test(line))
    expect(stepLines.map((line) => Number(/step index (\d+)/.exec(line)![1]))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    const probe = /preview probe (http:\/\/[^\s]+)/.exec(result.output)![1]
    const bound = /preview bound (http:\/\/[^\s]+)/.exec(result.output)![1]
    const browserUrl = /browser url (http:\/\/[^\s]+)/.exec(result.output)![1]
    for (const url of [probe, bound, browserUrl]) expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+/)
    expect(new URL(browserUrl).pathname).toBe('/how-to-make-a-presentation')
    expect(result.output).not.toMatch(/localhost/)
    noPreviewLeft(copy)
  })
})

describe('E2E-002: build faults', () => {
  it('fails the build phase on a type error in the sample', async () => {
    const copy = fresh()
    edit(copy, `${SAMPLE}/entities.ts`, (t) => t + "\nexport const broken: number = 'not a number'\n")
    expectFailure(await verify(copy), 'build', /npm run build exited/)
    noPreviewLeft(copy)
  })

  it('fails the build phase on a type error in a non-sample presentation', async () => {
    const copy = fresh()
    const created = await run('node', [scaffoldScript, 'presentation', '--dir', copy.dir, '--slug', 'other-talk', '--title', 'Other'], repoRoot)
    expect(created.code, created.output).toBe(0)
    edit(copy, 'src/presentations/other-talk/entities.ts', (t) => t + "\nexport const broken: number = 'x'\n")
    expectFailure(await verify(copy), 'build')
  })

  it('fails the build phase on a bundling error that type-checks', async () => {
    const copy = fresh()
    edit(copy, `${SAMPLE}/Talk.tsx`, (t) => t.replace("import './style.css'", "import './style.css'\nimport './does-not-exist.css'"))
    expectFailure(await verify(copy), 'build')
  })
})

describe('E2E-002: missing or malformed sample', () => {
  it('fails sample-registration when the sample is not registered although it builds', async () => {
    const copy = fresh()
    edit(copy, 'src/presentations/index.ts', (t) => t.replace(/\s*\{\s*slug: 'how-to-make-a-presentation'[\s\S]*?\},\n/, '\n'))
    expectFailure(await verify(copy), 'sample-registration', /not registered/)
  })

  it('fails sample-registration when the sample files and entry are gone', async () => {
    const copy = fresh()
    rmSync(join(copy.dir, SAMPLE), { recursive: true })
    rmSync(join(copy.dir, 'src/presentations/__tests__'), { recursive: true })
    edit(copy, 'src/presentations/index.ts', (t) => t.replace(/\s*\{\s*slug: 'how-to-make-a-presentation'[\s\S]*?\},\n/, '\n'))
    expectFailure(await verify(copy), 'sample-registration')
  })

  it('fails sample-registration when the registered outline file is missing', async () => {
    const copy = fresh()
    rmSync(join(copy.dir, 'src/presentations/__tests__'), { recursive: true })
    rmSync(join(copy.dir, SAMPLE, 'outline.ts'))
    writeFileSync(join(copy.dir, SAMPLE, 'steps/index.ts'), "export const STEPS = []\n")
    expectFailure(await verify(copy), 'sample-registration', /outline is missing/)
  })

  it('fails sample-registration when steps are reordered', async () => {
    const copy = fresh()
    edit(copy, `${SAMPLE}/outline.ts`, (t) => {
      const entries = t.split(/(?<=\n {2}\},)\n/)
      return t.replace(entries[1], '@@').replace(entries[2], entries[1]).replace('@@', entries[2])
    })
    expectFailure(await verify(copy), 'sample-registration', /step index 1 (era|title|caption)/)
  })

  it('fails sample-registration when a step is missing', async () => {
    const copy = fresh()
    edit(copy, `${SAMPLE}/outline.ts`, (t) => t.replace(/,\n {2}\{\n {4}id: 'step-9'[\s\S]*?\n {2}\}\n\]/, '\n]'))
    expectFailure(await verify(copy), 'sample-registration', /expected 9 steps but found 8/)
  })

  it.each([
    ['era', "era: 'the reveal'", "era: 'the finale'"],
    ['title', "title: 'The deck grows'", "title: 'The deck shrinks'"],
    ['caption', 'Thanks for watching.', 'Thanks for watching!'],
  ])('fails sample-registration when a %s is altered', async (field, from, to) => {
    const copy = fresh()
    edit(copy, `${SAMPLE}/outline.ts`, (t) => t.replace(from, to))
    expectFailure(await verify(copy), 'sample-registration', new RegExp(`step index \\d ${field}`))
  })
})

describe('E2E-002: browser faults', () => {
  const scene = `${SAMPLE}/steps/scene.tsx`
  const inject = (code: string) => (t: string) =>
    t.replace('export function SampleScene({ payload }: SceneProps<SamplePayload>) {', `export function SampleScene({ payload }: SceneProps<SamplePayload>) {\n  ${code}`)

  it.each([
    ['console.error on the first step', 1, "useEffect(() => { if (payload.stage === 1) console.error('first boom') }, [payload.stage])", 0],
    ['console.error on a later step', 5, "useEffect(() => { if (payload.stage === 5) console.error('later boom') }, [payload.stage])", 4],
    ['an uncaught exception after the transition settles', 3, "useEffect(() => { if (payload.stage === 3) setTimeout(() => { throw new Error('late boom') }, 450) }, [payload.stage])", 2],
  ])('fails render and names the step for %s', async (_label, _stage, code, index) => {
    const copy = fresh()
    edit(copy, scene, (t) => inject(code)(t).replace("import type { ReactNode } from 'react'", "import { useEffect, type ReactNode } from 'react'"))
    const result = await verify(copy)
    expectFailure(result, 'render', new RegExp(`step index ${index}: browser error`))
    noPreviewLeft(copy)
  })

  it('fails render and names the step when a scene throws while rendering', async () => {
    const copy = fresh()
    edit(copy, scene, inject("if (payload.stage === 4) throw new Error('render boom')"))
    expectFailure(await verify(copy), 'render', /step index 3/)
    noPreviewLeft(copy)
  })

  it('fails render within the bounded timeout when a transition never advances the step index', async () => {
    const copy = fresh()
    edit(copy, 'src/presentation-kit/usePresentationNav.ts', (t) =>
      t.replace('index: clampIndex(clampIndex(s.index, count) + 1, count)', 'index: Math.min(3, clampIndex(clampIndex(s.index, count) + 1, count))'),
    )
    const started = Date.now()
    const result = await verify(copy)
    expectFailure(result, 'render', /step index 4: transition did not advance/)
    expect(Date.now() - started).toBeLessThan(120_000)
    noPreviewLeft(copy)
  })

  it('does not report a presentation that never renders as success', async () => {
    const copy = fresh()
    edit(copy, 'src/route.ts', (t) => t.replace('candidate.slug === slug)', "candidate.slug === slug + '-x')"))
    expectFailure(await verify(copy), 'render', /step index 0: presentation did not render/)
  })
})

describe('E2E-002: cleanup', () => {
  it('stops the preview server when verification is interrupted', async () => {
    const copy = fresh()
    const child = spawn('node', ['scripts/verify.mjs'], { cwd: copy.dir, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (c) => (output += c))
    child.stderr.on('data', (c) => (output += c))
    const exited = new Promise<number | null>((done) => child.on('close', done))
    const deadline = Date.now() + 180_000
    while (!output.includes('preview probe') && Date.now() < deadline) await new Promise((r) => setTimeout(r, 100))
    expect(output).toContain('preview probe')
    expect(listProcesses(`${copy.dir}/node_modules/vite/bin/vite.js preview`).length).toBeGreaterThan(0)
    child.kill('SIGTERM')
    const code = await exited
    expect(code).not.toBe(0)
    await new Promise((r) => setTimeout(r, 500))
    noPreviewLeft(copy)
    expect(output).not.toContain('[verify] PASS')
  })
})
