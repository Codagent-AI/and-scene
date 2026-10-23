// Copied into a disposable app by INT-002. Each variant is a registered
// presentation with a known visual defect (or none), styled by an inline <style>
// so the page for one slug never inherits another's CSS.
import { useEffect, useState } from 'react'
import { Appear, Box, Label, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit/index.ts'

export type Variant = 'clean' | 'collision' | 'allowed' | 'chrome' | 'attribution-small' | 'attribution-default' | 'settle'

interface Payload {
  stage: number
}

const POLISHED_CHROME = `
[data-presentation-dot][data-presentation-active='true'] { width: 24px; background: #0a7; }
[data-presentation-toc-entry][data-presentation-active='true'] { font-weight: 700; background: #def; }
`
const POLISHED_ATTRIBUTION = `[data-presentation-attribution] { font-size: 13px; color: #456; text-decoration: none; }`
const BASE = 'h1, p, ol { margin: 0; padding: 0; } ol { list-style: none; } [data-presentation-header-title] { font-size: 16px; } body { background: #fff; color: #111; font-family: sans-serif; } [data-presentation-box], [data-presentation-label] { font-size: 16px; }'

const CSS: Record<Variant, string> = {
  clean: BASE + POLISHED_CHROME + POLISHED_ATTRIBUTION,
  collision: BASE + POLISHED_CHROME + POLISHED_ATTRIBUTION,
  allowed: BASE + POLISHED_CHROME + POLISHED_ATTRIBUTION,
  chrome: BASE + POLISHED_ATTRIBUTION,
  'attribution-small': BASE + POLISHED_CHROME + `[data-presentation-attribution] { font-size: 9px; color: #456; text-decoration: none; }`,
  'attribution-default': BASE + POLISHED_CHROME,
  settle: BASE + POLISHED_CHROME + POLISHED_ATTRIBUTION,
}

const A = { x: 100, y: 100, w: 200, h: 30 }
const B = { x: 150, y: 110, w: 200, h: 30 } // overlaps A
const C = { x: 500, y: 200, w: 200, h: 30 }
const D = { x: 550, y: 205, w: 200, h: 30 } // overlaps C

function Scene({ payload, variant }: SceneProps<Payload> & { variant: Variant }) {
  const [moved, setMoved] = useState(false)
  useEffect(() => setMoved(payload.stage >= 2), [payload.stage])
  const s = payload.stage
  const pair = (first: typeof A, second: typeof A, texts: [string, string], allowed = false) => {
    const inner = (
      <>
        <Label rect={first}>{texts[0]}</Label>
        <Label rect={second}>{texts[1]}</Label>
      </>
    )
    return allowed ? <div data-presentation-allow-overlap="">{inner}</div> : inner
  }
  return (
    <SceneLayer>
      <Appear key="base">
        <Box rect={{ x: 20, y: 20, w: 200, h: 40 }}>Base entity</Box>
      </Appear>
      {variant === 'collision' && s === 2 ? <Appear key="pair">{pair(A, B, ['Alpha text', 'Beta text'])}</Appear> : null}
      {variant === 'allowed' && s === 2 ? <Appear key="pair">{pair(A, B, ['Alpha text', 'Beta text'], true)}</Appear> : null}
      {variant === 'allowed' && s === 3 ? <Appear key="other">{pair(C, D, ['Gamma text', 'Delta text'])}</Appear> : null}
      {variant === 'settle' ? (
        <div
          data-testid="mover"
          style={{ position: 'absolute', top: 200, left: moved ? 600 : 0, width: 80, height: 80, background: '#c0392b', transition: 'left 800ms linear' }}
        />
      ) : null}
    </SceneLayer>
  )
}

export function makeTalk(variant: Variant) {
  const steps: Step<Payload>[] = [1, 2, 3].map((n) => ({
    id: `s${n}`,
    era: n < 3 ? 'first' : 'second',
    title: `Step ${n}`,
    caption: `Caption ${n}`,
    Scene: (props: SceneProps<Payload>) => <Scene {...props} variant={variant} />,
    payload: { stage: n },
    groupKey: variant,
  }))
  // One Scene function per variant keeps the grouped instance stable across steps.
  const Shared = steps[0].Scene
  steps.forEach((s) => (s.Scene = Shared))
  return function Talk() {
    return (
      <>
        <style>{CSS[variant]}</style>
        <Presentation steps={steps} title={variant} initialMode="browse" />
      </>
    )
  }
}
