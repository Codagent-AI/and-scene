// E2E-002: verification failures are actionable. Each case runs verify.mjs in an
// independent throwaway copy of the repo (node_modules symlinked, never modified).
import { spawn } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, mkdirSync } from 'node:fs'
import net from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const SOURCE = resolve(import.meta.dirname, '..')
const copies: string[] = []

function makeCopy(): string {
  const dir = mkdtempSync(join(tmpdir(), 'and-scene-verify-'))
  copies.push(dir)
  cpSync(SOURCE, dir, {
    recursive: true,
    filter: (src) => !/(^|\/)(node_modules|dist|\.git|openspec|validator_logs)(\/|$)/.test(src.slice(SOURCE.length)),
  })
  symlinkSync(join(SOURCE, 'node_modules'), join(dir, 'node_modules'), 'dir')
  return dir
}

function edit(dir: string, file: string, fn: (s: string) => string) {
  const p = join(dir, file)
  const before = readFileSync(p, 'utf8')
  const after = fn(before)
  if (after === before) throw new Error(`fault injection did not change ${file}`)
  writeFileSync(p, after)
}

interface Run { code: number | null; out: string }

function runVerify(dir: string, args: string[] = []): Promise<Run> {
  return new Promise((res) => {
    const child = spawn(process.execPath, [join(dir, 'scripts/verify.mjs'), ...args], { cwd: dir })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('close', (code) => res({ code, out }))
  })
}

function portClosed(port: number): Promise<boolean> {
  return new Promise((res) => {
    const s = net.connect(port, '127.0.0.1')
    s.once('connect', () => { s.destroy(); res(false) })
    s.once('error', () => res(true))
  })
}

async function expectFailure(run: Run, summary: RegExp) {
  expect(run.code, run.out).not.toBe(0)
  expect(run.out).not.toMatch(/^PASS$/m)
  expect(run.out).toMatch(/^FAIL: /m)
  expect(run.out).toMatch(summary)
  const m = run.out.match(/preview http:\/\/127\.0\.0\.1:(\d+)/)
  if (m) expect(await portClosed(Number(m[1])), 'preview process left running').toBe(true)
}

const SCENE = 'src/presentations/how-to-make-a-presentation/Scene.tsx'

const brokenTalk = (failAt: number) => `import { useEffect } from 'react'
import { Presentation, type SceneProps, type Step } from '../../presentation-kit'

function S({ index }: SceneProps) {
  useEffect(() => {
    if (index === ${failAt}) console.error('broken on purpose')
  }, [index])
  return <div>step {index}</div>
}

const steps: Step[] = [0, 1, 2].map((i) => ({ id: 's' + i, era: 'e', title: 'T' + i, caption: 'C' + i, Scene: S }))

export default function Talk() {
  return <Presentation steps={steps} title="Broken" />
}
`

function addBroken(dir: string) {
  mkdirSync(join(dir, 'src/presentations/broken-talk'))
  writeFileSync(join(dir, 'src/presentations/broken-talk/Talk.tsx'), brokenTalk(1))
  edit(dir, 'src/presentations/index.ts', (s) =>
    s.replace(
      'export const presentations: PresentationEntry[] = [',
      "export const presentations: PresentationEntry[] = [\n  { slug: 'broken-talk', title: 'Broken', load: () => import('./broken-talk/Talk') },",
    ),
  )
}

afterAll(() => {
  for (const d of copies) rmSync(d, { recursive: true, force: true })
})

describe('verify failure reporting (E2E-002)', () => {
  it('passes cleanly on the unmodified sample, ignoring unselected broken presentations (E2E-001 shape)', async () => {
    const dir = makeCopy()
    addBroken(dir)
    const run = await runVerify(dir)
    expect(run.code, run.out).toBe(0)
    expect(run.out).toMatch(/^PASS$/m)
    expect(run.out).toContain('http://127.0.0.1:')
    expect(run.out).not.toMatch(/localhost/)
    const slugRun = await runVerify(dir, ['--slug', 'broken-talk'])
    await expectFailure(slugRun, /FAIL: render \(slug "broken-talk", step index 1\)/)
  })

  it('fails the build phase on a type error', async () => {
    const dir = makeCopy()
    edit(dir, 'src/presentations/how-to-make-a-presentation/entities.ts', (s) => s + "\nexport const bad: number = 'x'\n")
    await expectFailure(await runVerify(dir), /FAIL: build/)
  })

  it('fails the sample phase when the sample is not registered', async () => {
    const dir = makeCopy()
    edit(dir, 'src/presentations/index.ts', (s) => s.replace(/slug: 'how-to-make-a-presentation'/, "slug: 'renamed-talk'"))
    await expectFailure(await runVerify(dir), /FAIL: sample/)
  })

  it('fails the sample phase on an unregistered --slug', async () => {
    await expectFailure(await runVerify(makeCopy(), ['--slug', 'nope']), /FAIL: sample \(slug "nope"\)/)
  })

  it('fails the sample phase when steps are out of order or mis-titled', async () => {
    const dir = makeCopy()
    const a = 'src/presentations/how-to-make-a-presentation/steps/01-topic.tsx'
    edit(dir, a, (s) => s.replace('You have a topic', 'You have a subject'))
    const run = await runVerify(dir)
    await expectFailure(run, /FAIL: sample/)
    expect(run.out).toMatch(/step 1 title is "You have a subject"/)
  })

  it('fails the render phase naming the step when a step emits a console error', async () => {
    const dir = makeCopy()
    edit(dir, SCENE, (s) =>
      s.replace(
        'const n = payload.stage',
        "const n = payload.stage\n  __ue(() => { if (n === 4) console.error('boom at four') }, [n])",
      ).replace("import { motion } from 'motion/react'", "import { motion } from 'motion/react'\nimport { useEffect as __ue } from 'react'"),
    )
    const run = await runVerify(dir)
    await expectFailure(run, /FAIL: render \(slug "how-to-make-a-presentation", step index 3\)/)
    expect(run.out).toContain('boom at four')
  })

  it('fails the render phase naming the step when a step throws', async () => {
    const dir = makeCopy()
    edit(dir, SCENE, (s) => s.replace('const n = payload.stage', "const n = payload.stage\n  if (n === 3) throw new Error('kaboom')"))
    await expectFailure(await runVerify(dir), /FAIL: render \(slug "how-to-make-a-presentation", step index 2\)/)
  })

  it('fails the render phase when a transition never advances the step index', async () => {
    const dir = makeCopy()
    edit(dir, 'src/presentation-kit/Presentation.tsx', (s) => s.replace('data-step-index={nav.index}', 'data-step-index={Math.min(nav.index, 2)}'))
    const run = await runVerify(dir)
    await expectFailure(run, /FAIL: render \(slug "how-to-make-a-presentation", step index 3\)/)
    expect(run.out).toMatch(/transition failed/)
  })
})
