import { Appear, Arrow, Box, Label, SceneLayer, type SceneProps } from '../../presentation-kit'
import { ARROWS, layoutIdFor, rectStyle, type ArrowId, type BoxId, type EntityId } from './entities'
import type { SceneState } from './payload'

/** The one scene every step shares. Only its payload changes between steps. */
export function Scene({ payload }: SceneProps<SceneState>) {
  return <SceneLayer name="diagram">{payload.entities.map((entity) => renderEntity(entity.id, entity.entering))}</SceneLayer>
}

function isArrow(id: EntityId): id is ArrowId {
  return id in ARROWS
}

function renderEntity(id: EntityId, entering: boolean) {
  const node = isArrow(id) ? (
    <Arrow key={id} layoutId={layoutIdFor(id)} data-presentation-entity={id} {...ARROWS[id]} />
  ) : (
    <Box key={id} layoutId={layoutIdFor(id)} data-presentation-entity={id} style={rectStyle(id as BoxId)}>
      <Label>{id}</Label>
    </Box>
  )
  // Newcomers fade in after persisting entities settle. Continuing entities are never wrapped.
  return entering ? <Appear key={`enter-${id}`}>{node}</Appear> : node
}
