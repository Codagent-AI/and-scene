import type { SceneProps, Step } from '../../../presentation-kit'
import { Appear, Box, SceneLayer } from '../../../presentation-kit'
import { entities } from '../entities'

export interface YourPresentationPayload {
  showConnection: boolean
}

export function YourPresentationScene({ payload }: SceneProps<YourPresentationPayload>) {
  return (
    <SceneLayer className="your-presentation-scene">
      <Box layoutId={entities.subject} className="your-presentation-subject">Your audience</Box>
      <Box layoutId={entities.prompt} className="your-presentation-prompt">A stable idea</Box>
      {payload.showConnection ? <Appear className="your-presentation-connection">The next beat</Appear> : null}
    </SceneLayer>
  )
}

export const firstStep: Step<YourPresentationPayload> = {
  id: 'your-first-step',
  era: 'beginning',
  title: 'Your first beat',
  caption: 'Every step has a concise browse-mode caption.',
  Scene: YourPresentationScene,
  groupKey: 'your-presentation-scene',
  payload: { showConnection: false },
}
