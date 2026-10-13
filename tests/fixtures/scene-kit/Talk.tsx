import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Presentation } from '../../../src/presentation-kit/Presentation'
import type { SceneProps, Step } from '../../../src/presentation-kit/types'
import { Box } from '../../../src/presentation-kit/nodes/Box'
import { Label } from '../../../src/presentation-kit/nodes/Label'
import { Arrow } from '../../../src/presentation-kit/nodes/Arrow'
import { Frame } from '../../../src/presentation-kit/nodes/Frame'
import { Emphasis } from '../../../src/presentation-kit/nodes/Emphasis'
import { SymbolChip } from '../../../src/presentation-kit/nodes/SymbolChip'
import { Appear } from '../../../src/presentation-kit/nodes/Appear'
import { SceneLayer } from '../../../src/presentation-kit/nodes/SceneLayer'

type Payload = { beat: number }
function Diagram({ payload: { beat } }: SceneProps<Payload>) {
  const [instance] = useState(() => crypto.randomUUID())
  return <SceneLayer data-scene-instance={instance}>
    <Label layoutId="fixture:label" style={{ position: 'absolute', left: 60, top: 28 }}>CONTINUITY / {beat + 1}</Label>
    <Box layoutId="fixture:anchor" data-testid="anchor" style={{ position: 'absolute', left: beat ? 310 : 90, top: 140, width: 220, height: 90 }}>One idea persists</Box>
    <AnimatePresence>
      {beat === 0 && <Appear key="depart" style={{ position: 'absolute', left: 580, top: 160 }}><SymbolChip layoutId="fixture:depart" data-testid="depart">Starting point</SymbolChip></Appear>}
      {beat >= 1 && <Appear key="new" data-testid="new" style={{ position: 'absolute', left: 620, top: 150 }}><Box layoutId="fixture:new" style={{ width: 170, height: 70 }}>New connection</Box></Appear>}
      {beat === 2 && <Appear key="dense" style={{ position: 'absolute', inset: 0 }}>
        <Arrow layoutId="fixture:arrow" style={{ position: 'absolute', left: 555, top: 164 }}>→</Arrow>
        <Frame layoutId="fixture:frame" style={{ position: 'absolute', left: 50, top: 100, width: 780, height: 200 }} />
        <Emphasis layoutId="fixture:emphasis" style={{ position: 'absolute', left: 85, top: 240 }}>One canvas. Stable identities.</Emphasis>
      </Appear>}
    </AnimatePresence>
  </SceneLayer>
}
function Closing() {
  return <SceneLayer data-scene-instance="closing">
    <Label layoutId="fixture:label" style={{ position: 'absolute', left: 60, top: 28 }}>THE FINAL BEAT</Label>
    <Box layoutId="fixture:anchor" data-testid="anchor" style={{ position: 'absolute', left: 330, top: 120, width: 220, height: 120 }}>A story unfolds.</Box>
  </SceneLayer>
}
const steps: Step<Payload>[] = [
  { id: 'start', era: 'the idea', title: 'Begin with one idea', caption: 'A stable entity anchors the scene. This fixture exercises the reusable kit without registering a sample.', Scene: Diagram, groupKey: 'diagram', payload: { beat: 0 } },
  { id: 'connect', era: 'the idea', title: 'Make a connection', caption: 'The anchor moves in place. A newcomer appears only after that motion settles, and the starting point leaves.', Scene: Diagram, groupKey: 'diagram', payload: { beat: 1 } },
  { id: 'compose', era: 'the composition', title: 'Let the diagram grow', caption: 'Labels, an arrow, a frame, and emphasis share the fixed canvas. The composition stays intact at narrower widths.', Scene: Diagram, groupKey: 'diagram', payload: { beat: 2 } },
  { id: 'close', era: 'the close', title: 'Carry the idea through', caption: 'A separate scene closes the story. Shared entity identities connect the final transition.', Scene: Closing, payload: { beat: 3 } },
]
export default function Talk() {
  const empty = new URLSearchParams(window.location.search).has('empty')
  return <Presentation steps={empty ? [] : steps} title="Scene kit exercise" initialMode="browse" className="fixture" />
}
