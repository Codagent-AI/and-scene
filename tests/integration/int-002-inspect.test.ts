import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import { previewProcesses, run, type RunResult } from '../helpers/process.ts'

// INT-002: the project-local screenshot helper, driven against a production preview in Chromium.
const dir = inject('templateDir')

const SCENE = (body: string) => `import { AnimatePresence } from 'motion/react'
import { Appear, Label, SceneLayer, type SceneProps } from '../../presentation-kit/index.ts'

export interface SceneState {
  n: number
}

const at = (left: number, top: number) => ({ position: 'absolute' as const, left, top })

export function VariantScene({ payload }: SceneProps<SceneState>) {
  return (
    <SceneLayer>
      <Label id="alpha" style={at(60, 60)}>alpha-heading</Label>
${body}
    </SceneLayer>
  )
}
`

const NEWCOMER = (id: string, text: string, left: number, top: number) =>
  `<Appear key="${id}"><Label id="${id}" style={at(${left}, ${top})}>${text}</Label></Appear>`

const STEP2 = (inner: string) => `      <AnimatePresence>{payload.n >= 2 && (<>${inner}</>)}</AnimatePresence>`

const ACTIVE_CSS = `[data-presentation-progress-dot][data-presentation-active='true'] { background: #d6b25e; width: 24px; }
[data-presentation-toc-entry][data-presentation-active='true'] { font-weight: 700; color: #d6b25e; }
`
const ATTRIBUTION_CSS = `[data-presentation-attribution] { font-size: 13px; color: #d6b25e; font-family: sans-serif; text-decoration: none; }
`

interface Variant {
  slug: string
  scene: string
  css: string
}

const VARIANTS: Variant[] = [
  { slug: 'clean', scene: SCENE(STEP2(NEWCOMER('beta', 'beta-separate', 400, 200))), css: ACTIVE_CSS + ATTRIBUTION_CSS },
  { slug: 'collision', scene: SCENE(STEP2(NEWCOMER('beta', 'beta-collides', 70, 62))), css: ACTIVE_CSS + ATTRIBUTION_CSS },
  {
    slug: 'allowed',
    scene: SCENE(STEP2(`<Appear key="beta"><div data-presentation-allow-overlap="" style={{ position: 'absolute', inset: 0 }}><Label id="beta" style={at(70, 62)}>beta-allowed</Label></div></Appear>`)),
    css: ACTIVE_CSS + ATTRIBUTION_CSS,
  },
  {
    slug: 'mixed',
    scene: SCENE(
      STEP2(`<Appear key="gamma"><Label id="gamma" style={at(300, 200)}>gamma-free</Label></Appear><Appear key="delta"><Label id="delta" style={at(305, 202)}>delta-free</Label></Appear>`) +
        `\n      <div data-presentation-allow-overlap="" style={{ position: 'absolute', inset: 0 }}>
        <Label id="m1" style={at(500, 100)}>marked-one</Label>
        <Label id="m2" style={at(505, 102)}>marked-two</Label>
      </div>`,
    ),
    css: ACTIVE_CSS + ATTRIBUTION_CSS,
  },
  { slug: 'indistinct', scene: SCENE(STEP2(NEWCOMER('beta', 'beta-separate', 400, 200))), css: ATTRIBUTION_CSS },
  { slug: 'attribution', scene: SCENE(STEP2(NEWCOMER('beta', 'beta-separate', 400, 200))), css: ACTIVE_CSS },
]

const STEPS = `import type { Step } from '../../../presentation-kit/index.ts'
import { VariantScene, type SceneState } from '../Scene.tsx'

const step = (id: string, title: string, n: number): Step<SceneState> => ({
  id, era: 'era ' + n, title, caption: 'caption ' + title, groupKey: 'v', Scene: VariantScene, payload: { n },
})

export const STEPS = [step('one', 'First', 1), step('two', 'Second', 2)]
`

function writeVariants() {
  for (const v of VARIANTS) {
    const base = join(dir, 'src/presentations', v.slug)
    mkdirSync(join(base, 'steps'), { recursive: true })
    writeFileSync(join(base, 'Scene.tsx'), v.scene)
    writeFileSync(join(base, 'steps/steps.ts'), STEPS)
    writeFileSync(join(base, 'styles.css'), v.css || '/* intentionally empty */\n')
    writeFileSync(join(base, 'Talk.tsx'), `import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps/steps.ts'
import './styles.css'

export default function Talk() {
  return <Presentation steps={STEPS} title="${v.slug}" initialMode="browse" />
}
`)
  }
  const entries = VARIANTS.map((v) => `  { slug: '${v.slug}', title: '${v.slug}', load: () => import('./${v.slug}/Talk.tsx') },`).join('\n')
  const index = readFileSync(join(dir, 'src/presentations/index.ts'), 'utf8')
  if (!index.includes("slug: 'clean'")) {
    writeFileSync(join(dir, 'src/presentations/index.ts'), index.replace('export const PRESENTATIONS: PresentationEntry[] = [', `export const PRESENTATIONS: PresentationEntry[] = [\n${entries}`))
  }
}

function removeVariants(originalIndex: string) {
  for (const v of VARIANTS) rmSync(join(dir, 'src/presentations', v.slug), { recursive: true, force: true })
  writeFileSync(join(dir, 'src/presentations/index.ts'), originalIndex)
  for (const out of ['inspection', 'inspection-long', 'inspection-zero', 'dist']) rmSync(join(dir, out), { recursive: true, force: true })
}

const inspect = (slug: string, ...flags: string[]) =>
  run(process.execPath, [join(dir, 'scripts/inspect-presentation.mjs'), slug, '--no-build', ...flags], dir)

const warnings = (result: RunResult, kind: string) => result.stdout.split('\n').filter((l) => l.startsWith(`WARN [${kind}]`))
const shot = (slug: string, n: number, out = 'inspection') => join(dir, out, slug, `step-0${n}.png`)

function pngSize(file: string) {
  const bytes = readFileSync(file)
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)]
}

describe('INT-002: screenshot helper emits faithful artifacts and advisory warnings', () => {
  const results = new Map<string, RunResult>()
  let startedAt = 0
  const originalIndex = readFileSync(join(dir, 'src/presentations/index.ts'), 'utf8')

  // The materialized app is shared with the bootstrap test: leave it as it was found.
  afterAll(() => removeVariants(originalIndex))

  beforeAll(async () => {
    rmSync(join(dir, 'inspection'), { recursive: true, force: true })
    writeVariants()
    const build = await run('npm', ['run', 'build'], dir)
    expect(build.code, build.stdout + build.stderr).toBe(0)
    startedAt = Date.now()
    for (const v of VARIANTS) results.set(v.slug, await inspect(v.slug))
  })

  it('writes exactly one decodable desktop screenshot per step at the predictable path', () => {
    for (const v of VARIANTS) {
      const result = results.get(v.slug)!
      expect(result.code, result.stdout + result.stderr).toBe(0)
      for (const n of [1, 2]) {
        expect(pngSize(shot(v.slug, n))).toEqual([1440, 900])
        expect(statSync(shot(v.slug, n)).mtimeMs).toBeGreaterThanOrEqual(startedAt - 1000)
      }
      expect(existsSync(shot(v.slug, 3))).toBe(false)
      expect(result.stdout).toContain(`wrote 2 screenshots to ${join(dir, 'inspection', v.slug)}`)
    }
  })

  it('captures distinct states, not repeated first-step images', () => {
    expect(readFileSync(shot('clean', 1)).equals(readFileSync(shot('clean', 2)))).toBe(false)
  })

  it('captures only after transitions settle: the default interval matches a much longer one, zero does not', async () => {
    await inspect('clean', '--settle', '3500', '--out', 'inspection-long')
    await inspect('clean', '--settle', '0', '--out', 'inspection-zero')
    const same = [1, 2].map((n) => readFileSync(shot('clean', n)).equals(readFileSync(shot('clean', n, 'inspection-long'))))
    const zero = [1, 2].map((n) => readFileSync(shot('clean', n)).equals(readFileSync(shot('clean', n, 'inspection-zero'))))
    expect(same).toEqual([true, true])
    expect(zero).not.toEqual([true, true])
  })

  it('reports no warnings for a clean presentation', () => {
    expect(results.get('clean')!.stdout).not.toContain('WARN')
    expect(results.get('clean')!.stdout).toContain('0 advisory warning(s)')
  })

  it('warns about an unmarked collision on the step where it occurs, naming both elements', () => {
    const lines = warnings(results.get('collision')!, 'overlap')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatch(/step 2: .*alpha-heading.*overlaps.*beta-collides|step 2: .*beta-collides.*overlaps.*alpha-heading/)
  })

  it('does not warn about an overlap inside an allow-overlap subtree', () => {
    expect(warnings(results.get('allowed')!, 'overlap')).toEqual([])
  })

  it('still warns about unrelated unmarked collisions while exempting the marked subtree', () => {
    const lines = warnings(results.get('mixed')!, 'overlap')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('step 2')
    expect(lines[0]).toMatch(/gamma-free|delta-free/)
    expect(lines.join('\n')).not.toMatch(/marked-one|marked-two/)
  })

  it('warns about indistinct active progress and table-of-contents chrome on each step', () => {
    const lines = warnings(results.get('indistinct')!, 'active-nav')
    for (const n of [1, 2]) {
      expect(lines.some((l) => l.includes(`step ${n}:`) && l.includes('progress indicator'))).toBe(true)
      expect(lines.some((l) => l.includes(`step ${n}:`) && l.includes('table-of-contents'))).toBe(true)
    }
    expect(warnings(results.get('clean')!, 'active-nav')).toEqual([])
  })

  it('warns about browser-default attribution on each step and points at the styling hook', () => {
    const lines = warnings(results.get('attribution')!, 'attribution')
    for (const n of [1, 2]) expect(lines.some((l) => l.includes(`step ${n}:`) && l.includes('data-presentation-attribution'))).toBe(true)
    expect(lines.join('\n')).toContain('browser-default')
    expect(warnings(results.get('clean')!, 'attribution')).toEqual([])
  })

  it('treats every warning as advisory: exit status stays zero', () => {
    for (const slug of ['collision', 'mixed', 'indistinct', 'attribution']) {
      expect(results.get(slug)!.code, slug).toBe(0)
      expect(results.get(slug)!.stdout).toMatch(/[1-9]\d* advisory warning/)
    }
  })

  it('fails (non-zero) for an unregistered slug and leaves no preview behind', async () => {
    const missing = await inspect('does-not-exist')
    expect(missing.code).not.toBe(0)
    expect(missing.stderr).toContain('FAIL inspect')
    expect(await previewProcesses(dir)).toEqual([])
  })
})
