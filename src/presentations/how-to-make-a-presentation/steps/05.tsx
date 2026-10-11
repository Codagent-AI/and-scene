import type { Step } from '../../../presentation-kit'
import { Scene, type Payload } from '../Scene'

export const step05: Step<Payload> = {
  id: 'depth', era: 'the gathering', title: 'You set the depth',
  caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  diagram: { scene: Scene, groupKey: 'how-to-make-a-presentation', payload: { beat: 5 } },
}
