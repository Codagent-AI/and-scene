import type { Step } from '../../../presentation-kit'
import Scene from './Scene'

export const step: Step<null> = {
  id: 'opening',
  era: 'Opening',
  title: 'A clear one-line idea',
  caption: 'A short browse-mode explanation of this beat.',
  scene: Scene,
  payload: null,
}
