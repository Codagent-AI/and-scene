import { Presentation, defineStep } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import { ALLOW_OVERLAP, Box, Label, SceneLayer } from '../../presentation-kit'

interface Payload {
  step: number
}

// Controlled fixture for the inspect helper: no CSS on purpose, so the active
// chrome and the attribution are unstyled.
function Scene({ payload }: SceneProps<Payload>) {
  const s = payload.step
  return (
    <SceneLayer>
      <Box key="mover" id="fx/mover" x={s === 0 ? 20 : 600} y={200} width={120} height={60}>
        <span>mover</span>
      </Box>
      <Label key="clean" id="fx/clean" x={20} y={20} width={200} height={24}>
        clean label
      </Label>
      {s === 1 && (
        <Label key="collide-a" id="fx/collide-a" x={300} y={100} width={200} height={24}>
          unmarked collision A
        </Label>
      )}
      {s === 1 && (
        <Label key="collide-b" id="fx/collide-b" x={320} y={106} width={200} height={24}>
          unmarked collision B
        </Label>
      )}
      {s === 2 && (
        <div key="allowed" {...ALLOW_OVERLAP} style={{ position: 'absolute', inset: 0 }}>
          <Label id="fx/allowed-a" x={300} y={100} width={200} height={24}>
            intentional overlap A
          </Label>
          <Label id="fx/allowed-b" x={320} y={106} width={200} height={24}>
            intentional overlap B
          </Label>
        </div>
      )}
    </SceneLayer>
  )
}

const steps = [
  ['clean', 'A clean step'],
  ['collision', 'An unmarked text collision'],
  ['allowed', 'An allowed overlap'],
  ['after', 'Nothing suspicious'],
].map(([id, title], step) =>
  defineStep({ id, era: 'fixture', title, caption: `Caption for ${title}`, groupKey: 'fx', Scene, payload: { step } }),
)

export default function Talk() {
  return <Presentation steps={steps} title="Inspect fixture" initialMode="browse" />
}
