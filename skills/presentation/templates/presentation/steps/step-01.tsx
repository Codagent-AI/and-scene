import { Box, SceneLayer, type SceneProps } from '../../../presentation-kit'
import { entity } from '../entities'

export function ExampleScene({ step }: SceneProps<void>) {
  return <SceneLayer className="example-scene" aria-label={step.title}><Box id={entity.topic} className="example-scene__topic">Your topic</Box></SceneLayer>
}
