import {
  Appear,
  Arrow,
  Box,
  DESIGN_H,
  DESIGN_W,
  Label,
  SceneLayer,
  type SceneProps,
} from '../../../presentation-kit'
import { E } from '../entities'

export interface ScenePayload {
  /** Number of the active step. Entities appear once `n` reaches theirs. */
  n: number
}

/**
 * One scene for every step. The scene instance persists (shared group key), so
 * entities already on screen stay mounted and morph; newcomers fade in via
 * `Appear`. Replace these placeholder entities with the real diagram.
 */
export function Scene({ payload: { n } }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      {n >= 1 && (
        <Appear key="topic">
          <Box id={E.topic} x={80} y={150} w={200} h={80} className="entity topic">
            topic
          </Box>
        </Appear>
      )}
      {n >= 2 && (
        <Appear key="detail">
          <Arrow id={E.link} from={[284, 190]} to={[596, 190]} width={DESIGN_W} height={DESIGN_H} className="link" />
          <Box id={E.detail} x={600} y={150} w={200} h={80} className="entity detail">
            detail
          </Box>
        </Appear>
      )}
      {n >= 3 && (
        <Appear key="note">
          <Label id={E.note} x={290} y={240} w={300} h={28} className="note">
            the whole story, one scene
          </Label>
        </Appear>
      )}
    </SceneLayer>
  )
}
