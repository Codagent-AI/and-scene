import { Presentation, SceneLayer, Label } from '../../presentation-kit'
import type { Step, SceneProps } from '../../presentation-kit'
function Scene({ payload }: SceneProps<string>) {
  return <SceneLayer><Label id="starter:topic" style={{ position: 'absolute', left: 200, top: 160 }}>{payload}</Label></SceneLayer>
}
const steps: Step<string>[] = [{ id: 'begin', era: 'begin', title: 'Your topic', caption: 'Replace this structural example with your presentation.', groupKey: 'starter', Scene, payload: 'Your topic' }]
export default function Talk() { return <Presentation steps={steps} title="Your presentation" /> }
