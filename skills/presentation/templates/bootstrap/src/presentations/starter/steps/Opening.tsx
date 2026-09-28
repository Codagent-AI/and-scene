import { Box, Label, SceneLayer, type SceneProps } from '../../../presentation-kit'
import { ENTITY } from '../entities'

export function Opening({ step }: SceneProps<Record<string, never>>) {
  return <SceneLayer className="starter-scene">
    <Label id={ENTITY.opening} className="starter-eyebrow" style={{ left: 88, top: 82 }}>A first beat</Label>
    <Box id={ENTITY.next} className="starter-card" style={{ left: 88, top: 126 }} label={step.title}>
      <p>Replace this starter scene with your presentation.</p>
    </Box>
  </SceneLayer>
}
