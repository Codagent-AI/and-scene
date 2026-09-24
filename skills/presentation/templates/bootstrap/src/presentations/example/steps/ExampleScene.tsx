import { Box, SceneLayer } from '../../../presentation-kit'
import { entities } from '../entities'

export default function ExampleScene() {
  return <SceneLayer><Box entityId={entities.idea} className="example-idea">An idea evolves</Box></SceneLayer>
}
