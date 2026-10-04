import { Box, Label, SceneLayer } from '../../presentation-kit'
import { ENTITY } from '../entities'

export function ExampleStep() {
  return <SceneLayer className="{{SLUG_CLASS}}__scene">
    <Box entityId={ENTITY.example} className="{{SLUG_CLASS}}__box">
      <Label entityId={`${ENTITY.example}:label`}>Replace with this beat's visual</Label>
    </Box>
  </SceneLayer>
}
