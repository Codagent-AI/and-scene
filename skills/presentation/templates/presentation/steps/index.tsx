/* A step module exports both its scene component and scene-state data. */
/* eslint-disable react-refresh/only-export-components */
import type { Step } from '../../../presentation-kit'
import { Box } from '../../../presentation-kit'
import { ENTITY } from '../entities'

type Payload = { label: string }

function Scene({ payload }: { payload: Payload }) {
  return <div className="example-scene">
    <Box entityId={ENTITY.example} className="example-box">{payload.label}</Box>
  </div>
}

export const STEPS: Step<Payload>[] = [
  { id: 'introduction', era: 'Introduction', title: 'A concise step title', caption: 'Explain the idea in a short, useful paragraph.', groupKey: 'example-scene', Scene, payload: { label: 'Start here' } },
  { id: 'development', era: 'Development', title: 'The idea develops', caption: 'Continue the explanation while retaining stable scene entities.', groupKey: 'example-scene', Scene, payload: { label: 'Build on the idea' } },
]
