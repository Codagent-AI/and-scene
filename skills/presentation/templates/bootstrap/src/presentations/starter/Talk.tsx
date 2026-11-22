import { Presentation, Label } from '../../presentation-kit'
import type { Step, SceneProps } from '../../presentation-kit'
function Scene({ payload }: SceneProps<string>) { return <Label id="starter:idea">{payload}</Label> }
const steps: readonly Step<string>[] = [{ id: 'idea', era: 'begin', title: 'Your first scene', caption: 'Replace this starter with your story.', Scene, payload: 'An idea', groupKey: 'idea' }]
export default function Talk() { return <Presentation title="Your first scene" steps={steps} /> }
