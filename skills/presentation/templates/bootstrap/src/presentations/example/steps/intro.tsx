import { Box, SceneLayer, type SceneProps } from '../../../presentation-kit'

export type IntroPayload = { label: string }
export function IntroScene({ payload }: SceneProps<IntroPayload>) {
  return <SceneLayer className="example-scene"><Box id="example-topic" className="example-topic">{payload.label}</Box></SceneLayer>
}
