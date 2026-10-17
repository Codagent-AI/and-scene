import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { listProcesses, materialize, repoRoot, run, scaffoldScript, type Workspace } from './helpers'

// INT-002: the project-local inspection helper, driven against a controlled app whose
// registered fixture presentations each contain one known visual defect (or none).

const LIB = `
import { Appear, Box, Label, Presence, Presentation, SceneLayer, defineStep, type SceneProps } from '../presentation-kit'

export interface Variant {
  collision?: 'unmarked' | 'marked' | 'mixed'
  attribution?: false
  animated?: boolean
}

interface Payload { stage: number; variant: Variant }

function FixtureScene({ payload }: SceneProps<Payload>) {
  const { stage, variant } = payload
  const pair = (a: string, b: string, y: number) => (
    <>
      <Label id={a} x={100} y={y} w={160} h={30}>{a} text</Label>
      <Label id={b} x={120} y={y + 10} w={160} h={30}>{b} text</Label>
    </>
  )
  return (
    <SceneLayer>
      <Presence>
        <Appear key="base"><Box id="base" x={500} y={200} w={200} h={60}>base {stage}</Box></Appear>
      </Presence>
      {stage === 2 && variant.collision === 'unmarked' ? pair('c1', 'c2', 100) : null}
      {stage === 2 && variant.collision === 'marked' ? (
        <div data-presentation-allow-overlap="" style={{ position: 'absolute', inset: 0 }}>{pair('m1', 'm2', 100)}</div>
      ) : null}
      {stage === 2 && variant.collision === 'mixed' ? (
        <div data-presentation-allow-overlap="" style={{ position: 'absolute', inset: 0 }}>{pair('m1', 'm2', 100)}</div>
      ) : null}
      {stage === 3 && variant.collision === 'mixed' ? pair('u1', 'u2', 220) : null}
      {variant.animated ? <div key={stage} className="pulse" style={{ position: 'absolute', left: 20, top: 20, width: 40, height: 40 }} /> : null}
    </SceneLayer>
  )
}

export function makeTalk(variant: Variant) {
  const steps = [1, 2, 3].map((stage) =>
    defineStep({ id: 'f' + stage, era: stage === 1 ? 'one' : 'two', title: 'Fixture ' + stage, caption: 'Caption ' + stage, Scene: FixtureScene, groupKey: 'fx', payload: { stage, variant } }),
  )
  return function Talk() {
    return <Presentation className="fx" steps={steps} title="Fixture" initialMode="browse" attribution={variant.attribution === false ? false : undefined} />
  }
}
`

const BASE = `
.fx { font-family: Arial, sans-serif; font-size: 16px; }
.fx [data-presentation-caption] { margin: 0; }
`
const PROGRESS = `
.fx [data-presentation-progress-item] { width: 12px; height: 12px; border: 1px solid #888; border-radius: 6px; background: transparent; padding: 0; }
.fx [data-presentation-progress-item][data-presentation-active='true'] { width: 28px; background: #e0bd5b; border-color: #e0bd5b; }
`
const TOC = `
.fx [data-presentation-toc-entry] { border: 0; background: transparent; padding: 4px 8px; }
.fx [data-presentation-toc-entry][data-presentation-active='true'] { font-weight: 700; background: #eee; }
`
const attribution = (css: string) => `.fx [data-presentation-attribution] { ${css} }\n`
const POLISHED = attribution('color: #444; font-size: 14px; text-decoration: none; padding: 4px 8px; margin: 0 16px 8px 0;')
const PULSE = `@keyframes pulse { from { opacity: 0.2; } to { opacity: 1; } } .pulse { background: #888; animation: pulse 700ms 1 forwards; }`

interface Fixture {
  slug: string
  variant: string
  css: string
}

const FIXTURES: Fixture[] = [
  { slug: 'fx-clean', variant: '{}', css: BASE + PROGRESS + TOC + POLISHED },
  { slug: 'fx-collision', variant: "{ collision: 'unmarked' }", css: BASE + PROGRESS + TOC + POLISHED },
  { slug: 'fx-allowed', variant: "{ collision: 'marked' }", css: BASE + PROGRESS + TOC + POLISHED },
  { slug: 'fx-mixed', variant: "{ collision: 'mixed' }", css: BASE + PROGRESS + TOC + POLISHED },
  { slug: 'fx-indistinct', variant: '{}', css: BASE + POLISHED },
  { slug: 'fx-indistinct-toc', variant: '{}', css: BASE + PROGRESS + POLISHED },
  { slug: 'fx-indistinct-progress', variant: '{}', css: BASE + TOC + POLISHED },
  { slug: 'fx-att-font', variant: '{}', css: BASE + PROGRESS + TOC + attribution('font-size: 10px; padding: 6px 8px; color: #444; text-decoration: none;') },
  { slug: 'fx-att-fontok', variant: '{}', css: BASE + PROGRESS + TOC + attribution('font-size: 11px; padding: 6px 8px; color: #444; text-decoration: none;') },
  { slug: 'fx-att-hit', variant: '{}', css: BASE + PROGRESS + TOC + attribution('font-size: 14px; line-height: 14px; padding: 0; color: #444; text-decoration: none;') },
  { slug: 'fx-att-hitok', variant: '{}', css: BASE + PROGRESS + TOC + attribution('font-size: 14px; line-height: 16px; padding: 0; color: #444; text-decoration: none;') },
  { slug: 'fx-att-default', variant: '{}', css: PROGRESS + TOC },
  { slug: 'fx-att-missing', variant: '{ attribution: false }', css: BASE + PROGRESS + TOC },
  { slug: 'fx-att-hidden', variant: '{}', css: BASE + PROGRESS + TOC + attribution('display: none;') },
  { slug: 'fx-delayed', variant: '{ animated: true }', css: BASE + PROGRESS + TOC + POLISHED + PULSE },
]

interface Warning {
  step: number
  kind: string
  message: string
}
interface Capture {
  index: number
  observedIndex: number
  file: string
  transitionAt: number
  capturedAt: number
  runningAnimations: number
}
interface Report {
  settleMs: number
  viewport: { width: number; height: number }
  captures: Capture[]
  warnings: Warning[]
}

let app: Workspace

beforeAll(async () => {
  app = await materialize({ linkModules: true })
  writeFileSync(join(app.dir, 'src/presentations/fixture-lib.tsx'), LIB)
  for (const fixture of FIXTURES) {
    const created = await run('node', [scaffoldScript, 'presentation', '--dir', app.dir, '--slug', fixture.slug, '--title', fixture.slug], repoRoot)
    expect(created.code, created.output).toBe(0)
    const folder = join(app.dir, 'src/presentations', fixture.slug)
    writeFileSync(join(folder, 'Talk.tsx'), `import { makeTalk } from '../fixture-lib'\nimport './style.css'\nexport default makeTalk(${fixture.variant})\n`)
    writeFileSync(join(folder, 'style.css'), fixture.css)
  }
  // the sample's own registration check does not apply to fixtures
  const built = await run('npm', ['run', 'build'], app.dir)
  expect(built.code, built.output).toBe(0)
})

afterAll(() => {
  if (process.env.KEEP_APP) console.log("KEPT", app.dir)
  else app?.cleanup()
})

async function inspect(slug: string, extra: string[] = [], env: Record<string, string> = {}) {
  const result = await run('node', ['scripts/inspect-presentation.mjs', slug, '--no-build', '--settle', '150', ...extra], app.dir, env)
  let report: Report | undefined
  try {
    report = JSON.parse(readFileSync(join(app.dir, '.inspection', slug, 'report.json'), 'utf8'))
  } catch {
    report = undefined
  }
  return { ...result, report }
}

const kinds = (warnings: Warning[], kind: string) => warnings.filter((w) => w.kind === kind)

function pngSize(path: string) {
  const bytes = readFileSync(path)
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), signature: bytes.subarray(1, 4).toString() }
}

describe('screenshot capture', () => {
  it('writes one distinct PNG per step at the desktop viewport and exits zero', async () => {
    const { code, output, report } = await inspect('fx-clean')
    expect(code, output).toBe(0)
    expect(report!.captures.map((c) => c.file)).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
    const hashes = new Set<string>()
    for (const capture of report!.captures) {
      const path = join(app.dir, '.inspection/fx-clean', capture.file)
      expect(pngSize(path)).toEqual({ width: 1440, height: 900, signature: 'PNG' })
      hashes.add(createHash('sha1').update(readFileSync(path)).digest('hex'))
      expect(capture.observedIndex).toBe(capture.index)
    }
    expect(hashes.size).toBe(3)
    expect(output).toContain('3 screenshots')
    expect(report!.warnings).toEqual([])
  })

  it('fails operationally, without false success, for an unknown route; and cleans up its preview', async () => {
    const { code, output } = await inspect('does-not-exist')
    expect(code).not.toBe(0)
    expect(output).toContain('FAIL')
    expect(output).not.toContain('done:')
    expect(listProcesses(`${app.dir}/node_modules/vite/bin/vite.js preview`)).toEqual([])
  })

  it('captures the committed sample step by step with no advisory warnings', async () => {
    const result = await run('npm', ['run', 'inspect', '--', 'how-to-make-a-presentation', '--no-build', '--settle', '200'], repoRoot)
    expect(result.code, result.output).toBe(0)
    const report: Report = JSON.parse(readFileSync(join(repoRoot, '.inspection/how-to-make-a-presentation/report.json'), 'utf8'))
    expect(report.captures).toHaveLength(9)
    expect(report.captures.map((c) => c.file)[8]).toBe('step-09.png')
    const hashes = new Set(report.captures.map((c) => createHash('sha1').update(readFileSync(join(repoRoot, '.inspection/how-to-make-a-presentation', c.file))).digest('hex')))
    expect(hashes.size).toBe(9)
    expect(report.warnings).toEqual([])
  })
})

describe('settled captures', () => {
  it('waits the full settle interval before every capture, including the first', async () => {
    const { report } = await inspect('fx-delayed', ['--settle', '1000'])
    expect(report!.settleMs).toBe(1000)
    for (const capture of report!.captures) {
      expect(capture.capturedAt - capture.transitionAt).toBeGreaterThanOrEqual(1000)
      expect(capture.runningAnimations).toBe(0)
    }
  })

  it('would catch mid-animation frames with a short interval (the instrumentation is live)', async () => {
    const { report } = await inspect('fx-delayed', ['--settle', '50'])
    expect(report!.captures.slice(1).some((c) => c.runningAnimations > 0)).toBe(true)
  })

  it('honors INSPECT_SETTLE_MS and lets the flag win', async () => {
    const viaEnv = await run('node', ['scripts/inspect-presentation.mjs', 'fx-clean', '--no-build'], app.dir, { INSPECT_SETTLE_MS: '120' })
    expect(viaEnv.output).toContain('settle 120 ms')
    const viaFlag = await run('node', ['scripts/inspect-presentation.mjs', 'fx-clean', '--no-build', '--settle', '80'], app.dir, { INSPECT_SETTLE_MS: '120' })
    expect(viaFlag.output).toContain('settle 80 ms')
  })
})

describe('overlap diagnostics', () => {
  it('names the step and both elements of an unmarked text collision, and nothing else', async () => {
    const { code, report } = await inspect('fx-collision')
    expect(code).toBe(0)
    const overlaps = kinds(report!.warnings, 'overlap')
    expect(overlaps.length).toBeGreaterThan(0)
    for (const warning of overlaps) {
      expect(warning.step).toBe(1)
      expect(warning.message).toContain('c1')
      expect(warning.message).toContain('c2')
    }
    expect(report!.warnings.filter((w) => w.kind !== 'overlap')).toEqual([])
  })

  it('exempts an explicitly allowed overlap', async () => {
    const { report } = await inspect('fx-allowed')
    expect(report!.warnings).toEqual([])
  })

  it('still reports an unmarked collision elsewhere when another overlap is marked', async () => {
    const { report } = await inspect('fx-mixed')
    const overlaps = kinds(report!.warnings, 'overlap')
    expect(overlaps.length).toBeGreaterThan(0)
    for (const warning of overlaps) {
      expect(warning.step).toBe(2)
      expect(warning.message).toMatch(/u1/)
      expect(warning.message).not.toMatch(/m1|m2/)
    }
  })
})

describe('active chrome diagnostics', () => {
  it('reports indistinct progress and ToC independently, per step', async () => {
    const both = (await inspect('fx-indistinct')).report!.warnings.filter((w) => w.kind === 'active-chrome')
    for (let step = 0; step < 3; step++) {
      expect(both.filter((w) => w.step === step).map((w) => /progress|toc/.exec(w.message)![0]).sort()).toEqual(['progress', 'toc'])
    }
    const tocOnly = (await inspect('fx-indistinct-toc')).report!.warnings.filter((w) => w.kind === 'active-chrome')
    expect(tocOnly.length).toBe(3)
    expect(tocOnly.every((w) => w.message.includes('toc'))).toBe(true)
    const progressOnly = (await inspect('fx-indistinct-progress')).report!.warnings.filter((w) => w.kind === 'active-chrome')
    expect(progressOnly.length).toBe(3)
    expect(progressOnly.every((w) => w.message.includes('progress'))).toBe(true)
  })

  it('stays quiet when active items are visibly distinct', async () => {
    const { report } = await inspect('fx-clean')
    expect(kinds(report!.warnings, 'active-chrome')).toEqual([])
  })
})

describe('attribution diagnostics', () => {
  const attribution = async (slug: string) => kinds((await inspect(slug)).report!.warnings, 'attribution')

  it('warns below the font-size boundary and not at it', async () => {
    const small = await attribution('fx-att-font')
    expect(small.length).toBeGreaterThan(0)
    expect(small.every((w) => w.message.includes('font size') && w.message.includes('data-presentation-attribution'))).toBe(true)
    expect(await attribution('fx-att-fontok')).toEqual([])
  })

  it('warns below the hit-box boundary and not at it', async () => {
    const short = await attribution('fx-att-hit')
    expect(short.length).toBeGreaterThan(0)
    expect(short.every((w) => w.message.includes('hit box') && w.message.includes('data-presentation-attribution'))).toBe(true)
    expect(await attribution('fx-att-hitok')).toEqual([])
  })

  it('warns about a browser-default link look', async () => {
    const plain = await attribution('fx-att-default')
    expect(plain.some((w) => w.message.includes('browser-default'))).toBe(true)
    expect(plain.every((w) => w.message.includes('data-presentation-attribution'))).toBe(true)
  })

  it('warns when the attribution is missing or hidden', async () => {
    for (const slug of ['fx-att-missing', 'fx-att-hidden']) {
      const warnings = await attribution(slug)
      expect(warnings.length, slug).toBe(3)
      expect(warnings.map((w) => w.step)).toEqual([0, 1, 2])
      expect(warnings[0].message, slug).toContain('missing or hidden')
    }
    const missing = await inspect('fx-att-missing')
    expect(missing.code).toBe(0)
    expect(missing.report!.captures).toHaveLength(3)
  })

  it('treats warnings as advisory: screenshots are complete and the exit status is zero', async () => {
    const { code, report } = await inspect('fx-collision')
    expect(report!.warnings.length).toBeGreaterThan(0)
    expect(code).toBe(0)
    expect(report!.captures).toHaveLength(3)
    mkdirSync(join(app.dir, '.inspection'), { recursive: true })
  })
})
