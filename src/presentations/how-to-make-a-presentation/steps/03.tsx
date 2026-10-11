import type { Step } from '../../../presentation-kit'
import { Scene, type Payload } from '../Scene'

export const step03: Step<Payload> = {
  id: 'answers', era: 'the gathering', title: 'Answers become steps',
  caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  diagram: { scene: Scene, groupKey: 'how-to-make-a-presentation', payload: { beat: 3 } },
}
