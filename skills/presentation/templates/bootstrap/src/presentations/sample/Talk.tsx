import { Presentation, SceneLayer } from '../../presentation-kit'
import type { Step } from '../../presentation-kit'

const steps: Step[] = [
  { id: 'start', era: 'Introduction', title: 'Start', caption: 'A first narrative beat.', payload: {}, Scene: () => <SceneLayer><div data-presentation-entity="sample:idea">Your scene</div></SceneLayer> },
  { id: 'change', era: 'Evolution', title: 'Change', caption: 'The same scene evolves.', payload: {}, Scene: () => <SceneLayer><div data-presentation-entity="sample:idea">Your scene, continued</div></SceneLayer> },
]
export default function Talk() { return <Presentation title="Sample presentation" steps={steps} /> }
