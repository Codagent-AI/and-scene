import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyProject, processesIn, removeDir, run } from './helpers.mjs'

const dirs = []
afterAll(() => dirs.forEach(removeDir))

function edit(dir, file, change) {
  const target = path.join(dir, file)
  const before = readFileSync(target, 'utf8')
  const after = change(before)
  if (after === before) throw new Error(`fault injection changed nothing in ${file}`)
  writeFileSync(target, after)
}

async function verifyIn(dir, env = {}) {
  const result = await run('npm', ['run', 'verify'], { cwd: dir, env })
  expect(processesIn(dir), 'preview or browser processes left running').toEqual([])
  return result
}

describe('E2E-001: reference presentation passes production verification', () => {
  let result
  beforeAll(async () => {
    const dir = copyProject('e2e-pass')
    dirs.push(dir)
    result = await verifyIn(dir)
  })

  it('exits zero with a clear pass after build, sample, and render', () => {
    expect(result.code, result.output).toBe(0)
    expect(result.output).toMatch(/PASS verify: build, sample, render/)
    expect(result.output).not.toMatch(/FAIL/)
  })

  it('renders the registered sample through all nine steps on 127.0.0.1', () => {
    expect(result.output).toMatch(/render: how-to-make-a-presentation: 9 steps \(http:\/\/127\.0\.0\.1:\d+\)/)
    expect(result.output).not.toMatch(/localhost/)
  })
})

describe('E2E-002: verification failures are actionable', () => {
  const faulty = async (name, mutate, env) => {
    const dir = copyProject(`e2e-${name}`)
    dirs.push(dir)
    mutate(dir)
    return verifyIn(dir, env)
  }
  const SAMPLE = 'src/presentations/how-to-make-a-presentation'

  it('fails the build phase on a type error', async () => {
    const result = await faulty('build', (dir) => edit(dir, 'src/Landing.tsx', (s) => `${s}\nexport const broken: number = 'text'\n`))
    expect(result.code).toBe(1)
    expect(result.output).toMatch(/FAIL verify: build phase failed/)
    expect(result.output).toMatch(/TS2322/)
    expect(result.output).not.toMatch(/PASS/)
  })

  it('fails the sample phase when the sample is not registered', async () => {
    const result = await faulty('unregistered', (dir) =>
      edit(dir, 'src/presentations/index.ts', (s) => s.replace(/\[\s*\{[\s\S]*\}\s*,?\s*\]/, '[]')),
    )
    expect(result.code).toBe(1)
    expect(result.output).toMatch(/FAIL verify: sample phase failed/)
    expect(result.output).toMatch(/is not registered/)
    expect(result.output).not.toMatch(/PASS/)
  })

  it('fails the sample phase when the steps are out of order', async () => {
    const result = await faulty('order', (dir) =>
      edit(dir, `${SAMPLE}/outline.ts`, (s) => s.replace("title: 'You have a topic'", "title: 'The skill interviews you'")),
    )
    expect(result.code).toBe(1)
    expect(result.output).toMatch(/FAIL verify: sample phase failed/)
    expect(result.output).toMatch(/step 1 title/)
    expect(result.output).not.toMatch(/PASS/)
  })

  it('fails the sample phase or render phase when an actual step era differs from the outline', async () => {
    const result = await faulty('era', (dir) =>
      edit(dir, `${SAMPLE}/steps/index.ts`, (s) => s.replace('...beat,', "...beat,\n  era: index === 4 ? 'wrong era' : beat.era,")),
    )
    expect(result.code).toBe(1)
    expect(result.output).toMatch(/FAIL verify: render phase failed \(step index 4\)/)
    expect(result.output).toMatch(/era is "wrong era", expected "the gathering"/)
  })

  it('renders other registered presentations too, so a broken new presentation fails verification', async () => {
    const result = await faulty('second', (dir) => {
      mkdirSync(path.join(dir, 'src/presentations/broken'), { recursive: true })
      writeFileSync(path.join(dir, 'src/presentations/broken/Talk.tsx'), "export default function Talk(): never {\n  throw new Error('broken presentation')\n}\n")
      edit(dir, 'src/presentations/index.ts', (s) => s.replace(/\n\]/, "\n  { slug: 'broken', title: 'Broken', load: () => import('./broken/Talk') },\n]"))
    })
    expect(result.code).toBe(1)
    expect(result.output).toMatch(/FAIL verify: render phase failed/)
    expect(result.output).toMatch(/broken: the presentation did not render a step/)
    expect(result.output).toMatch(/broken presentation/)
  })

  it('fails the render phase and names the step when a step logs a console error', async () => {
    const result = await faulty('console', (dir) =>
      edit(dir, `${SAMPLE}/steps/SampleScene.tsx`, (s) =>
        s
          .replace("import { Arrow,", "import { useEffect } from 'react'\nimport { Arrow,")
          .replace("export function SampleScene({ payload }: SceneProps<SampleState>) {", "export function SampleScene({ payload }: SceneProps<SampleState>) {\n  useEffect(() => {\n    if (payload.step === 4) console.error('injected console fault')\n  }, [payload.step])"),
      ),
    )
    expect(result.code).toBe(1)
    expect(result.output).toMatch(/FAIL verify: render phase failed \(step index 3\)/)
    expect(result.output).toMatch(/injected console fault/)
    expect(result.output).not.toMatch(/PASS/)
  })

  it('fails the render phase and names the step on an uncaught page error', async () => {
    const result = await faulty('pageerror', (dir) =>
      edit(dir, `${SAMPLE}/steps/SampleScene.tsx`, (s) =>
        s
          .replace("import { Arrow,", "import { useEffect } from 'react'\nimport { Arrow,")
          .replace("export function SampleScene({ payload }: SceneProps<SampleState>) {", "export function SampleScene({ payload }: SceneProps<SampleState>) {\n  useEffect(() => {\n    if (payload.step === 5) setTimeout(() => { throw new Error('injected page fault') })\n  }, [payload.step])"),
      ),
    )
    expect(result.code).toBe(1)
    expect(result.output).toMatch(/FAIL verify: render phase failed \(step index 4\)/)
    expect(result.output).toMatch(/uncaught error: injected page fault/)
  })

  it('fails within a bounded time when a transition never advances the step index', async () => {
    const started = Date.now()
    const result = await faulty(
      'stall',
      (dir) => edit(dir, 'src/presentation-kit/usePresentationNav.ts', (s) => s.replace('Math.min(last, Math.min(i, last) + 1)', '(i === 2 ? i : Math.min(last, i + 1))')),
      { VERIFY_STEP_TIMEOUT_MS: '1500' },
    )
    expect(result.code).toBe(1)
    expect(result.output).toMatch(/FAIL verify: render phase failed \(step index 3\)/)
    expect(result.output).toMatch(/transition did not advance to step index 3/)
    expect(result.output).not.toMatch(/PASS/)
    expect(Date.now() - started).toBeLessThan(180_000)
  })
})
