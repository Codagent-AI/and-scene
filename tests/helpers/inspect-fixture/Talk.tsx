// Controlled presentation for INT-002. Copied into a throwaway project as
// src/presentations/inspect-fixture/Talk.tsx, so the kit import is relative to that location.
import { Box, Presentation, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'

interface Payload {
  variant: 'baseline' | 'collision' | 'allowed' | 'plain'
  moverX: number
  polish?: boolean
}

const POLISH_CSS = `
[data-presentation-progress-item], [data-presentation-toc-item] { background: #ddd; border: 1px solid #999; width: 14px; height: 14px; }
[data-presentation-toc-item] { width: auto; height: auto; }
[data-presentation-active="true"] { background: #111; color: #fff; font-weight: 700; }
[data-presentation-attribution] { font-size: 14px; color: #0a5; font-family: Georgia, serif; text-decoration: none; }
`

function Scene({ payload }: SceneProps<Payload>) {
  const allow = payload.variant === 'allowed' ? { 'data-presentation-allow-overlap': '' } : {}
  return (
    <>
      <SceneLayer>
        <Box id="mover" x={payload.moverX} y={220} w={120} h={80} style={{ background: 'rgb(255, 0, 0)' }} />
        {payload.variant === 'collision' || payload.variant === 'allowed' ? (
          <>
            <Box id="alpha" x={300} y={40} w={200} h={50} label="Alpha collision" {...allow} />
            <Box id="bravo" x={320} y={48} w={200} h={50} label="Bravo collision" {...allow} />
          </>
        ) : null}
      </SceneLayer>
      {payload.polish ? <style>{POLISH_CSS}</style> : null}
    </>
  )
}

const step = (id: string, era: string, title: string, payload: Payload): Step<Payload> => ({
  id,
  era,
  title,
  caption: `${title} caption`,
  Scene,
  groupKey: 'main',
  payload,
})

const STEPS: Step<Payload>[] = [
  step('baseline', 'first', 'Baseline', { variant: 'baseline', moverX: 40 }),
  step('collision', 'first', 'Unmarked collision', { variant: 'collision', moverX: 40 }),
  step('allowed', 'second', 'Allowed overlap', { variant: 'allowed', moverX: 40 }),
  step('moved', 'second', 'Mover animates', { variant: 'plain', moverX: 640 }),
  step('settled', 'second', 'Settled and polished', { variant: 'plain', moverX: 640, polish: true }),
]

export default function Talk() {
  return <Presentation steps={STEPS} title="Inspect fixture" initialMode="browse" />
}
