import type { Step } from '../../../presentation-kit'
import { Box, SceneLayer } from '../../../presentation-kit'
import { ENTITY } from '../entities'

type Payload = { detail: string }
function Scene({ payload }: { payload: Payload }) {
  return <SceneLayer className="starter-scene"><Box entityId={ENTITY.origin} className="starter-node">A starting point</Box><Box entityId={ENTITY.idea} className="starter-node starter-idea">{payload.detail}</Box></SceneLayer>
}
export const STEPS: Step<Payload>[] = [
  { id: 'begin', era: 'Introduction', title: 'A starting point', caption: 'Introduce the topic in one clear sentence.', groupKey: 'starter', Scene, payload: { detail: 'The first idea' } },
  { id: 'develop', era: 'Development', title: 'Add a connection', caption: 'Explain how the next idea grows from the first.', groupKey: 'starter', Scene, payload: { detail: 'A connected idea' } },
  { id: 'close', era: 'Conclusion', title: 'Show the outcome', caption: 'Finish with what the audience should remember.', groupKey: 'starter', Scene, payload: { detail: 'The takeaway' } },
]
