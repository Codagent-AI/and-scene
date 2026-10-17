import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, copyTemplate, run, writeProjectFile } from './helpers.ts'

afterAll(cleanup)

// INT-002: the screenshot helper against controlled fixture presentations.
interface Variant {
  slug: string
  /** Text collision starting at the given zero-based step. */
  collideFrom?: number
  allowOverlap?: boolean
  css: string
  attribution?: false
}

const POLISHED_ATTRIBUTION = "[data-presentation-attribution] { font-size: 12px; color: #444; text-decoration: none; }"
const DISTINCT_ACTIVE = `[data-presentation-progress-item] { width: 10px; height: 10px; } [data-presentation-progress-item][data-presentation-active='true'] { width: 24px; background: #123456; }`
const GOOD = `${POLISHED_ATTRIBUTION} ${DISTINCT_ACTIVE}`

const VARIANTS: Variant[] = [
  { slug: 'clean', css: GOOD },
  { slug: 'collision', collideFrom: 1, css: GOOD },
  { slug: 'allowed', collideFrom: 1, allowOverlap: true, css: GOOD },
  { slug: 'indistinct', css: POLISHED_ATTRIBUTION },
  { slug: 'small-attribution', css: `${DISTINCT_ACTIVE} [data-presentation-attribution] { font-size: 8px; color: #444; text-decoration: none; }` },
  { slug: 'default-attribution', css: DISTINCT_ACTIVE },
  { slug: 'no-attribution', css: GOOD, attribution: false },
]

const talk = (v: Variant) => `import { Presentation } from '../../presentation-kit/Presentation.tsx'
import { SceneLayer } from '../../presentation-kit/nodes/SceneLayer.tsx'
import type { Step } from '../../presentation-kit/types.ts'
import './styles.css'

function Scene({ stepIndex }: { payload: null; stepIndex: number }) {
  const collide = ${v.collideFrom ?? 'Infinity'} <= stepIndex
  const overlap = (
    <>
      <span style={{ position: 'absolute', left: 100, top: 100 }}>Alpha text</span>
      <span style={{ position: 'absolute', left: 110, top: 104 }}>Beta text</span>
    </>
  )
  return (
    <SceneLayer>
      <span style={{ position: 'absolute', left: 500, top: 20 }}>Step {stepIndex + 1} scene</span>
      {collide ? ${v.allowOverlap ? '<div data-presentation-allow-overlap>{overlap}</div>' : 'overlap'} : null}
    </SceneLayer>
  )
}

const steps: Step<null>[] = [1, 2, 3].map((n) => ({ id: 's' + n, era: 'only', title: 'Title ' + n, caption: 'Caption ' + n, Scene, payload: null, groupKey: 'g' }))

export default function Talk() {
  return <Presentation steps={steps} title="Fixture" initialMode="browse" ${v.attribution === false ? 'attribution={false}' : ''} />
}
`

let project: string

beforeAll(() => {
  project = copyTemplate()
  const entries = VARIANTS.map((v) => `  { slug: '${v.slug}', title: '${v.slug}', load: () => import('./${v.slug}/Talk.tsx') },`).join('\n')
  writeProjectFile(project, 'src/presentations/index.ts', `import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

export const PRESENTATIONS: readonly PresentationEntry[] = [
${entries}
]
`)
  for (const v of VARIANTS) {
    writeProjectFile(project, `src/presentations/${v.slug}/Talk.tsx`, talk(v))
    writeProjectFile(project, `src/presentations/${v.slug}/styles.css`, v.css)
  }
  const build = run('npm', ['run', 'build'], project)
  expect(build.status, build.output).toBe(0)
})

const inspect = (slug: string, extra: string[] = []) =>
  run('node', ['scripts/inspect-presentation.mjs', slug, '--skip-build', '--settle', '300', ...extra], project)

describe('inspection helper', () => {
  it('writes one predictable screenshot per step into the project-local directory', () => {
    const result = inspect('clean')
    expect(result.status, result.output).toBe(0)
    const dir = path.join(project, 'inspection/clean')
    expect(readdirSync(dir).sort()).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
    expect(result.output).toContain('0 advisory warning(s)')
  })

  it('waits at least the settle interval before every capture', () => {
    const report = path.join(project, 'report.json')
    const result = inspect('clean', ['--settle', '700', '--report', 'report.json'])
    expect(result.status, result.output).toBe(0)
    const entries = JSON.parse(readFileSync(report, 'utf8')) as { step: number; settleMs: number; navigatedAt: number; capturedAt: number }[]
    expect(entries.map((e) => e.step)).toEqual([1, 2, 3])
    for (const e of entries) expect(e.capturedAt - e.navigatedAt).toBeGreaterThanOrEqual(700)
  })

  it('warns, per step, about an unmarked text collision and still exits zero with screenshots', () => {
    const result = inspect('collision')
    expect(result.status).toBe(0)
    const overlap = result.output.split('\n').filter((l) => l.startsWith('WARN [overlap]'))
    expect(overlap.some((l) => l.includes('step 2') && l.includes('Alpha text') && l.includes('Beta text'))).toBe(true)
    expect(overlap.some((l) => l.includes('step 3'))).toBe(true)
    expect(overlap.some((l) => l.includes('step 1:'))).toBe(false)
    expect(readdirSync(path.join(project, 'inspection/collision'))).toHaveLength(3)
  })

  it('does not warn about overlap inside an allow-overlap subtree', () => {
    const result = inspect('allowed')
    expect(result.status).toBe(0)
    expect(result.output).not.toContain('WARN [overlap]')
  })

  it('warns when the active progress item looks like the inactive ones', () => {
    const result = inspect('indistinct')
    expect(result.status).toBe(0)
    expect(result.output).toMatch(/WARN \[active-chrome\] step 1: active progress/)
    expect(inspect('clean').output).not.toContain('WARN [active-chrome]')
  })

  it.each([
    ['small-attribution', /WARN \[attribution\] step 1: attribution is too small.*\[data-presentation-attribution\]/],
    ['default-attribution', /WARN \[attribution\] step 1: attribution uses the browser-default link style.*\[data-presentation-attribution\]/],
    ['no-attribution', /WARN \[attribution\] step 1: attribution link \[data-presentation-attribution\] is missing/],
  ])('reports unpolished attribution: %s', (slug, pattern) => {
    const result = inspect(slug)
    expect(result.status).toBe(0)
    expect(result.output).toMatch(pattern)
    expect(existsSync(path.join(project, 'inspection', slug, 'step-03.png'))).toBe(true)
  })

  it('does not warn about polished attribution', () => {
    expect(inspect('clean').output).not.toContain('WARN [attribution]')
  })
})
