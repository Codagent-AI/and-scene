import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type Overlap = 'none' | 'unmarked' | 'allowed' | 'mixed' | 'svg' | 'nested'
export interface Variant {
  slug: string
  overlap: Overlap
  /** CSS classes on the presentation root that restore polish. */
  polish: string[]
}

export const VARIANTS: Variant[] = [
  { slug: 'fx-clean', overlap: 'none', polish: ['fx-active', 'fx-attr'] },
  { slug: 'fx-collision', overlap: 'unmarked', polish: ['fx-active', 'fx-attr'] },
  { slug: 'fx-allowed', overlap: 'allowed', polish: ['fx-active', 'fx-attr'] },
  { slug: 'fx-mixed', overlap: 'mixed', polish: ['fx-active', 'fx-attr'] },
  { slug: 'fx-svg-text', overlap: 'svg', polish: ['fx-active', 'fx-attr'] },
  { slug: 'fx-nested-text', overlap: 'nested', polish: ['fx-active', 'fx-attr'] },
  { slug: 'fx-indistinct', overlap: 'none', polish: ['fx-attr'] },
  { slug: 'fx-attr-default', overlap: 'none', polish: ['fx-active'] },
  { slug: 'fx-attr-tiny', overlap: 'none', polish: ['fx-active', 'fx-attr-tiny'] },
]

const ALLOW = "{ 'data-presentation-allow-overlap': '' }"

const FIXTURE_CSS = `
.late-marker { position: fixed; left: 0; bottom: 0; width: 60px; height: 60px; background: #0000ff; animation: late 0s linear 1.2s forwards; }
@keyframes late { to { background: #ff0000; } }
.fx-active [data-presentation-progress-item][data-presentation-active] { width: 30px; background: #e8c76a; }
.fx-active [data-presentation-toc-item][data-presentation-active] { font-weight: 700; background: #e8c76a; color: #000; }
.fx-attr [data-presentation-attribution] { color: #e8c76a; font-size: 14px; font-weight: 600; text-decoration: none; }
.fx-attr-tiny [data-presentation-attribution] { color: #e8c76a; font-size: 8px; }
.fx-clean-box { border: 1px solid #888; }
`

function talk(v: Variant) {
  const pair = (a: string, b: string, y: number, props: string) => `
          <Label key="${a}" id="${a}" enter={payload.step === 2} x={40} y={${y}} width={300} height={30} ${props}>${a} text</Label>
          <Label key="${b}" id="${b}" enter={payload.step === 2} x={60} y={${y + 8}} width={300} height={30} ${props}>${b} text</Label>`
  const overlap =
    v.overlap === 'unmarked' ? pair('Alpha', 'Beta', 100, '')
    : v.overlap === 'allowed' ? pair('Alpha', 'Beta', 100, `hooks={${ALLOW}}`)
    : v.overlap === 'mixed' ? pair('Alpha', 'Beta', 100, `hooks={${ALLOW}}`) + pair('Gamma', 'Delta', 200, '')
    : v.overlap === 'svg' ? `
          <Label key="Plain" id="Plain" enter={payload.step === 2} x={40} y={100} width={300} height={30}>Plain text</Label>
          <svg key="Svg" style={{ position: 'absolute', left: 0, top: 0, width: 400, height: 200 }}><text x={50} y={118}>Svg text</text></svg>`
    : v.overlap === 'nested' ? `
          <Label key="Parent" id="Parent" enter={payload.step === 2} x={40} y={100} width={300} height={30}>Parent text<span style={{ position: 'absolute', left: 4, top: 2 }}>Child text</span></Label>`
    : ''
  return `import { Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
import './fixture.css'

interface Payload { step: number }

function FxScene({ payload }: SceneProps<Payload>) {
  return (
    <SceneLayer>
      <Label key="intro" id="intro" enter={payload.step === 1} x={40} y={20} width={300} height={30}>Intro line</Label>
      {payload.step >= 2 && (<>${overlap}
      </>)}
      <div key={'late-' + payload.step} className="late-marker" />
    </SceneLayer>
  )
}

const STEPS: Step<Payload>[] = [1, 2, 3].map((n) => ({
  id: 's' + n,
  era: n === 1 ? 'first' : 'later',
  title: 'Step ' + n,
  caption: 'Caption ' + n,
  Scene: FxScene,
  groupKey: 'g',
  payload: { step: n },
}))

export default function Talk() {
  return <Presentation className="${v.polish.join(' ')}" title="${v.slug}" steps={STEPS} />
}
`
}

/** Write the fixture presentations into a copy of the repository and register them. */
export async function installFixtures(root: string) {
  const dir = path.join(root, 'src/presentations')
  for (const v of VARIANTS) {
    await mkdir(path.join(dir, v.slug), { recursive: true })
    await writeFile(path.join(dir, v.slug, 'Talk.tsx'), talk(v))
    await writeFile(path.join(dir, v.slug, 'fixture.css'), FIXTURE_CSS)
  }
  // Fixture imports of the kit are one level up from each fixture folder.
  const entries = VARIANTS.map((v) => `  { slug: '${v.slug}', title: '${v.slug}', load: () => import('./${v.slug}/Talk') },`).join('\n')
  const index = path.join(dir, 'index.ts')
  const source = await readFile(index, 'utf8')
  await writeFile(index, source.replace(/\n\]\s*$/, `\n${entries}\n]\n`))
}
