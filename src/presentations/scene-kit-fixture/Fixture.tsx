import { Presentation } from '../../presentation-kit/Presentation'
import { Box, SceneLayer } from '../../presentation-kit/nodes'
import type { SceneProps, Step } from '../../presentation-kit/types'
import './fixture.css'

type Payload = { label: string; x: number; showOutput: boolean }
function Diagram({ payload }: SceneProps<Payload>) {
  return <SceneLayer id="fixture:layer"><Box id="fixture:input" className="fixture-node fixture-input" style={{ left: 70, top: 130 }}><span>Input</span></Box><Box id="fixture:process" className="fixture-node fixture-process" style={{ left: payload.x, top: 130 }}><span>{payload.label}</span></Box>{payload.showOutput && <Box id="fixture:output" className="fixture-node fixture-output" style={{ left: 650, top: 130 }}><span>Output</span></Box>}</SceneLayer>
}
const steps: readonly Step<Payload>[] = [
  { id: 'input', era: 'Flow', title: 'Start with an input', caption: 'A shared scene gives us a stable place to begin.', groupKey: 'flow', Scene: Diagram, payload: { label: 'Shape', x: 330, showOutput: false } },
  { id: 'transform', era: 'Flow', title: 'Transform the input', caption: 'The same entity moves and changes its label in place.', groupKey: 'flow', Scene: Diagram, payload: { label: 'Transform', x: 390, showOutput: false } },
  { id: 'output', era: 'Flow', title: 'Reveal the output', caption: 'New entities enter after the continuing scene settles.', groupKey: 'flow', Scene: Diagram, payload: { label: 'Transform', x: 390, showOutput: true } },
  { id: 'finish', era: 'Result', title: 'The flow is complete', caption: 'Sections link to their first step, and navigation stops at each end.', Scene: Diagram, payload: { label: 'Transform', x: 390, showOutput: true } },
]
export default function Fixture() { return <Presentation steps={steps} title="Scene kit fixture" initialMode="browse" /> }
