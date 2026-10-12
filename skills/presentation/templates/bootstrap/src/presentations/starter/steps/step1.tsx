import type { SceneProps, Step } from '../../../presentation-kit/types'

function StarterScene(_props: SceneProps<unknown>) {
  return null
}

export const step: Step = {
  id: 'starter',
  section: 'Start',
  title: 'Starter',
  caption: 'Replace this starter with the presentation you requested.',
  Scene: StarterScene,
  payload: null,
}
