import { Presentation, Box, SceneLayer } from '../../presentation-kit'
import type { Step, SceneProps } from '../../presentation-kit'
function Scene({ payload }: SceneProps<string>) { return <SceneLayer><Box id="starter:idea" style={{ position: 'absolute', left: 200, top: 100 }}>{payload}</Box></SceneLayer> }
const steps: Step<string>[] = ['Start with an idea', 'Let it evolve'].map((title, i) => ({ id: String(i), era: 'the idea', title, caption: title, Scene, payload: title, groupKey: 'starter' }))
export default function Talk() { return <Presentation steps={steps} title="Starter" /> }
