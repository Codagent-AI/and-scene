// Source of the controlled presentation the screenshot helper is exercised against. It is written
// into a disposable project copy (never into this repository) and registered once per variant.
export const VARIANTS = ['clean', 'collision', 'allowed', 'indistinct', 'attribution'] as const
export type Variant = (typeof VARIANTS)[number]

export const slugOf = (v: Variant) => `fx-${v}`

export const FIXTURE_TSX = `import { Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
import './fixture.css'

export type Variant = 'clean' | 'collision' | 'allowed' | 'indistinct' | 'attribution'
interface Payload { n: number; variant: Variant }

function Scene({ payload }: SceneProps<Payload>) {
  const { n, variant } = payload
  const second = n === 1
  const overlapping = second && (variant === 'collision' || variant === 'allowed')
  return (
    <SceneLayer>
      <Label key="a" id="a" x={40} y={40} width={300} height={30}>Alpha label</Label>
      {second && (
        <Label
          key="b"
          id="b"
          x={overlapping ? 60 : 40}
          y={overlapping ? 46 : 200}
          width={300}
          height={30}
          {...(variant === 'allowed' ? { 'data-presentation-allow-overlap': '' } : {})}
        >
          {overlapping ? 'Colliding label' : 'Separate label'}
        </Label>
      )}
    </SceneLayer>
  )
}

export default function Fixture({ variant }: { variant: Variant }) {
  const steps: Step<Payload>[] = [0, 1, 2].map((n) => ({
    id: 's' + n,
    era: n < 2 ? 'first era' : 'second era',
    title: 'Step ' + (n + 1),
    caption: 'Caption for step ' + (n + 1),
    Scene,
    payload: { n, variant },
    groupKey: 'g',
  }))
  return <Presentation steps={steps} title="Fixture" className={'fx fx-' + variant} />
}
`

export const talkTsx = (v: Variant) =>
  `import Fixture from '../Fixture'\n\nexport default function Talk() {\n  return <Fixture variant="${v}" />\n}\n`

// Plain presentation-owned CSS. The 'indistinct' variant omits the active-state rules and the
// 'attribution' variant omits the attribution rules.
export const FIXTURE_CSS = `.fx { background: #fff; color: #111; font-family: sans-serif; }
.fx h1, .fx p { margin: 0; font-size: 18px; }
.fx [data-presentation-header], .fx [data-presentation-footer], .fx [data-presentation-toc] { padding: 0 24px; gap: 12px; }
.fx [data-presentation-progress] { gap: 6px; }
.fx [data-presentation-progress-item] { width: 10px; height: 10px; padding: 0; border: 0; border-radius: 999px; background: #bbb; }
.fx [data-presentation-toc-entry], .fx [data-presentation-prev], .fx [data-presentation-next] { padding: 4px 10px; background: #eee; color: #111; border: 1px solid #ccc; }
.fx-clean [data-presentation-progress-item][data-presentation-active='true'],
.fx-collision [data-presentation-progress-item][data-presentation-active='true'],
.fx-allowed [data-presentation-progress-item][data-presentation-active='true'],
.fx-attribution [data-presentation-progress-item][data-presentation-active='true'] { width: 24px; background: #06c; }
.fx-clean [data-presentation-toc-entry][data-presentation-active='true'],
.fx-collision [data-presentation-toc-entry][data-presentation-active='true'],
.fx-allowed [data-presentation-toc-entry][data-presentation-active='true'],
.fx-attribution [data-presentation-toc-entry][data-presentation-active='true'] { background: #06c; color: #fff; }
.fx-clean [data-presentation-attribution],
.fx-collision [data-presentation-attribution],
.fx-allowed [data-presentation-attribution],
.fx-indistinct [data-presentation-attribution] { padding: 0 24px; font-size: 12px; color: #555; text-decoration: none; }
`
