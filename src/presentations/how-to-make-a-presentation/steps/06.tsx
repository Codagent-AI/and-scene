import type { Step } from '../../../presentation-kit'
import { Scene, type Payload } from '../Scene'

export const step06: Step<Payload> = {
  id: 'assemble', era: 'the build', title: 'It assembles the scene',
  caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  diagram: { scene: Scene, groupKey: 'how-to-make-a-presentation', payload: { beat: 6 } },
}
