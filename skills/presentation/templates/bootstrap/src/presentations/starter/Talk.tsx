import { Presentation, type SceneProps, type Step } from '../../presentation-kit'

const Scene = ({ step }: SceneProps<Record<string, never>>) => <div data-presentation-node="starter-scene">{step.title}</div>
const steps: Step<Record<string, never>>[] = [{ id: 'start', era: 'Start', title: 'Your first step', caption: 'Describe the opening idea.', Scene, payload: {} }]

export default function Talk() { return <Presentation steps={steps} title="A new presentation" /> }
