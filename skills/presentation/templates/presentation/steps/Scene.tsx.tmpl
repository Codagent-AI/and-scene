import { Box, Label, SceneLayer, type SceneProps } from '../../../presentation-kit'
import { ENTITIES } from '../entities'

export interface ScenePayload {
  /** 1-based step number: entities introduced at or before it are on screen. */
  step: number
}

/**
 * The single evolving scene. Every step renders this same instance with a new payload, so entities
 * already on screen stay mounted (and morph in place); only the step's newcomers (`enter`) fade in.
 */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      {ENTITIES.filter((e) => e.appearsAt <= payload.step).map((e) => (
        e.kind === 'box' ? (
          <Box key={e.id} id={e.id} enter={e.appearsAt === payload.step} x={e.x} y={e.y} width={e.width} height={e.height} label={e.text} />
        ) : (
          <Label key={e.id} id={e.id} enter={e.appearsAt === payload.step} x={e.x} y={e.y} width={e.width} height={e.height}>
            {e.text}
          </Label>
        )
      ))}
    </SceneLayer>
  )
}
