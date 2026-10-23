// INT-002: the project-local screenshot helper writes one settled PNG per step and
// reports advisory warnings for each controlled fixture variant, in a copy of the repo.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { copyRepo, exists, removeDir, run } from './support'

const FIXTURE_CSS = `
.fx-clean [data-presentation-progress][data-presentation-active='true'], .fx-allowed [data-presentation-progress][data-presentation-active='true'] { background: #2f6fd6; }
.fx-clean [data-presentation-toc-entry][data-presentation-active='true'], .fx-allowed [data-presentation-toc-entry][data-presentation-active='true'] { font-weight: 700; color: #2f6fd6; }
.fx-clean [data-presentation-attribution], .fx-allowed [data-presentation-attribution] { font-size: 12px; color: #6b6558; text-decoration: none; }
.fx-clean [data-presentation-footer], .fx-allowed [data-presentation-footer] { padding-bottom: 34px; }
.fx-chrome [data-presentation-step-title] { position: fixed; top: 0; left: 0; }
.fx-chrome [data-presentation-progress][data-presentation-active='true'] { background: #2f6fd6; }
.fx-chrome [data-presentation-toc-entry][data-presentation-active='true'] { font-weight: 700; }
.fx-chrome [data-presentation-attribution] { font-size: 12px; color: #6b6558; text-decoration: none; }
.fx-chrome [data-presentation-footer] { padding-bottom: 34px; }
.fx-small [data-presentation-attribution] { font-size: 9px; }
.fx-small [data-presentation-progress][data-presentation-active='true'] { background: #2f6fd6; }
.fx-small [data-presentation-toc-entry][data-presentation-active='true'] { font-weight: 700; }
`

const VARIANTS = [
  { slug: 'fx-clean', component: 'Clean', expect: [] as string[] },
  { slug: 'fx-collide', component: 'Collide', expect: ['overlap'] },
  { slug: 'fx-chrome', component: 'Chrome', expect: ['overlap'] },
  { slug: 'fx-allowed', component: 'Allowed', expect: ['overlap'] },
  { slug: 'fx-indistinct', component: 'Indistinct', expect: ['active-chrome'] },
  { slug: 'fx-small', component: 'Small', expect: ['attribution'] },
  { slug: 'fx-default', component: 'Default', expect: ['attribution', 'active-chrome'] },
  { slug: 'fx-missing', component: 'Missing', expect: ['attribution'] },
]

// Fixture presentations: three steps, one scene, presentation-owned CSS per variant.
const FIXTURES = `import type { ReactElement } from 'react'
import { Presentation, Box, Label, SceneLayer, type Step, type SceneProps } from '../../presentation-kit'
import './fixtures.css'

type Payload = { mode: 'plain' | 'collide' | 'allowed' }

function Scene({ payload }: SceneProps<Payload>) {
  return (
    <SceneLayer name="fixture">
      {payload.mode === 'plain' ? <Box id="plain" x={40} y={40} width={200} height={60}>Alpha</Box> : null}
      {payload.mode === 'collide' ? (
        <>
          <Label id="a" x={40} y={40} width={200} height={40}>Alpha</Label>
          <Label id="b" x={60} y={50} width={200} height={40}>Beta</Label>
        </>
      ) : null}
      {payload.mode === 'allowed' ? (
        <>
          <Label id="a" x={40} y={40} width={200} height={40} allowOverlap>Alpha</Label>
          <Label id="b" x={60} y={50} width={200} height={40} allowOverlap>Beta</Label>
          <Label id="c" x={400} y={40} width={200} height={40}>Gamma</Label>
          <Label id="d" x={420} y={50} width={200} height={40}>Delta</Label>
          <Box id="e" x={680} y={40} width={150} height={40} allowOverlap><span>Epsilon</span></Box>
          <Label id="f" x={690} y={50} width={150} height={40}>Zeta</Label>
        </>
      ) : null}
    </SceneLayer>
  )
}

function steps(mode: Payload['mode']): Step<Payload>[] {
  return ['one', 'two', 'three'].map((id, index) => ({
    id,
    era: 'era',
    title: \`Step \${index + 1}\`,
    caption: \`Caption \${index + 1}\`,
    groupKey: 'fixture',
    scene: Scene,
    payload: { mode },
  }))
}

function variant(mode: Payload['mode'], className: string, attribution: boolean) {
  return function Variant(): ReactElement {
    return (
      <div className={className}>
        <Presentation steps={steps(mode)} title="Fixture" initialMode="browse" attribution={attribution} />
      </div>
    )
  }
}

export const Clean = variant('plain', 'fx-clean', true)
export const Collide = variant('collide', 'fx-collide', true)
export const Chrome = variant('plain', 'fx-chrome', true)
export const Allowed = variant('allowed', 'fx-allowed', true)
export const Indistinct = variant('plain', 'fx-indistinct', true)
export const Small = variant('plain', 'fx-small', true)
export const Default = variant('plain', 'fx-default', true)
export const Missing = variant('plain', 'fx-missing', false)
`

let repo: string
const outputs = new Map<string, { code: number | null; output: string }>()

beforeAll(async () => {
  repo = await copyRepo('int002')
  const fixtures = join(repo, 'src', 'presentations', 'fixtures')
  await mkdir(fixtures, { recursive: true })
  await writeFile(join(fixtures, 'variants.tsx'), FIXTURES)
  await writeFile(join(fixtures, 'fixtures.css'), FIXTURE_CSS)
  const registryPath = join(repo, 'src', 'presentations', 'index.ts')
  const registry = await readFile(registryPath, 'utf8')
  const entries = VARIANTS.map(
    (v) => `  { slug: '${v.slug}', title: '${v.slug}', load: () => import('./fixtures/variants').then((m) => ({ default: m.${v.component} })) },`,
  ).join('\n')
  await writeFile(registryPath, registry.replace(/\]\s*$/m, `${entries}\n]`))
  for (const variant of VARIANTS) {
    outputs.set(variant.slug, await run(process.execPath, ['scripts/inspect-presentation.mjs', variant.slug], repo, 300_000))
  }
}, 900_000)

afterAll(async () => {
  if (repo) await removeDir(repo)
})

const warningsFor = (slug: string) =>
  (outputs.get(slug)?.output ?? '').split('\n').filter((line) => line.startsWith('WARN '))

describe('screenshot artifacts', () => {
  for (const variant of VARIANTS) {
    it(`${variant.slug}: writes one settled PNG per step and exits zero`, async () => {
      const result = outputs.get(variant.slug)
      expect(result?.code, result?.output).toBe(0)
      expect(result?.output).toMatch(/captured 3 screenshots/)
      for (const step of ['01', '02', '03']) {
        const file = join(repo, '.inspection', variant.slug, `step-${step}.png`)
        expect(await exists(file)).toBe(true)
        const bytes = await readFile(file)
        expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG')
        expect(bytes.length).toBeGreaterThan(1000)
      }
      expect(result?.output).toMatch(/step 01 captured after 2000 ms settle/)
    }, 300_000)
  }
})

describe('advisory warnings', () => {
  for (const variant of VARIANTS) {
    it(`${variant.slug}: reports step-specific warnings for exactly its defect`, () => {
      const lines = warningsFor(variant.slug)
      for (const kind of variant.expect) {
        expect(lines.some((line) => line.includes(` ${kind}:`)), lines.join('\n')).toBe(true)
      }
      if (variant.expect.length === 0) expect(lines).toEqual([])
      for (const line of lines) expect(line).toMatch(/^WARN step \d\d /)
    })
  }

  it('names the overlapping text elements of an unmarked collision', () => {
    const overlap = warningsFor('fx-collide').find((line) => line.includes('overlap'))
    expect(overlap).toContain('"Alpha"')
    expect(overlap).toContain('"Beta"')
  })

  it('reports text/chrome collisions, not just scene text', () => {
    const overlap = warningsFor('fx-chrome').find((line) => line.includes('overlap'))
    expect(overlap).toMatch(/Step 1/)
  })

  it('points attribution warnings at the styling hook and warns for a missing link', () => {
    expect(warningsFor('fx-small').join('\n')).toContain('[data-presentation-attribution]')
    expect(warningsFor('fx-missing').join('\n')).toContain('attribution link missing')
  })

  it('exempts a marked overlap but still warns for an unrelated, unmarked collision', () => {
    const overlaps = warningsFor('fx-allowed').filter((line) => line.includes(' overlap:'))
    expect(overlaps.length).toBeGreaterThan(0)
    expect(overlaps.every((line) => !line.includes('Alpha') && !line.includes('Beta'))).toBe(true)
    expect(overlaps.some((line) => line.includes('Gamma') && line.includes('Delta'))).toBe(true)
    expect(overlaps.some((line) => line.includes('Epsilon') || line.includes('Zeta'))).toBe(false)
  })
})

describe('the helper reports advisories without failing', () => {
  it('exits zero for every variant despite warnings', () => {
    for (const variant of VARIANTS) expect(outputs.get(variant.slug)?.code).toBe(0)
  })
})

