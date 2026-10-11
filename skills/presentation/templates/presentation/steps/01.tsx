import type { Step } from '../../../presentation-kit'
import { Scene, type Payload } from '../Scene'

export const step01: Step<Payload> = {
  id: 'introduction', era: 'Introduction', title: 'Introduce the idea',
  caption: 'State the first useful idea in one clear sentence.',
  diagram: { scene: Scene, groupKey: 'story', payload: { message: 'The central idea' } },
}
