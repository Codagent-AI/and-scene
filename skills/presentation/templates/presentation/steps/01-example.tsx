import type { SceneProps, Step } from '../../../presentation-kit'
import { Appear, Box, SceneLayer } from '../../../presentation-kit'
import { entities } from '../entities'
import type { Payload } from './payload'

function ExampleScene(_props: SceneProps<Payload>) {
  return (
    <SceneLayer>
      <Appear>
        <Box layoutId={entities.exampleBox}>Replace me</Box>
      </Appear>
    </SceneLayer>
  )
}

export const exampleStep: Step<Payload> = {
  id: '__SLUG__-01-example',
  era: 'Introduction',
  title: 'Replace with the one-line present-mode title',
  caption: 'Replace with the multi-line browse-mode caption for this step.',
  payload: {},
  Scene: ExampleScene,
  groupKey: '__SLUG__-example',
}
