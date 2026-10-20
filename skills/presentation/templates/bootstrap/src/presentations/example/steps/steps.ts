import type { Step } from '../../../presentation-kit/index.ts'
import { ExampleScene, type SceneState } from '../Scene.tsx'

const step = (
  id: string, era: string, title: string, caption: string, payload: SceneState,
): Step<SceneState> => ({ id, era, title, caption, groupKey: 'example', Scene: ExampleScene, payload })

export const STEPS: Step<SceneState>[] = [
  step('one', 'start', 'Start with one box', 'A single entity appears on the canvas.', { second: false, moved: false }),
  step('two', 'start', 'Add a neighbour', 'A second entity enters and an arrow connects the two.', { second: true, moved: false }),
  step('three', 'finish', 'Move the first box', 'The first entity keeps its identity and morphs in place.', { second: true, moved: true }),
]
