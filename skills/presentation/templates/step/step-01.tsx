import { Box, SceneLayer, type SceneProps } from '../../../presentation-kit'

export function ExampleScene({ step }: SceneProps<void>) {
  return <SceneLayer className="example-scene" aria-label={step.title}><Box id="example-topic" className="example-scene__topic">Your topic</Box></SceneLayer>
}
