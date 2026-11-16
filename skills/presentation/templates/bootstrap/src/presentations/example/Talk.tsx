import { Presentation, Box } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
function Scene({ payload }: SceneProps<string>) { return <Box id="example:idea" style={{ position: 'absolute', left: 180, top: 140 }}>{payload}</Box> }
const steps: Step<string>[] = [{ id: 'example', era: 'example', title: 'Example', caption: 'An unstyled scene. Replace it with your presentation.', Scene, payload: 'Your idea' }]
export default function Talk() { return <Presentation title="Example" steps={steps} /> }
