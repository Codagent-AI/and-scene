import { useState } from 'react'
import { Arrow, Box, Label, SceneLayer, type SceneProps } from '../../presentation-kit'
import { ARROWS, layoutIdFor, rectStyle, type ArrowId, type BoxId, type EntityId } from './entities'
import type { SceneState } from './payload'

/**
 * The one scene every step shares. Only its payload changes between steps. An entity enters when
 * it was not on screen in the previous step, whichever direction the viewer moved.
 */
export function Scene({ payload }: SceneProps<SceneState>) {
  const ids = payload.entities.map((entity) => entity.id)
  const [shown, setShown] = useState<{ ids: readonly EntityId[]; entering: ReadonlySet<EntityId> }>({
    ids: [],
    entering: new Set(),
  })
  let entering = shown.entering
  if (!sameIds(ids, shown.ids)) {
    const previous = new Set(shown.ids)
    entering = new Set(ids.filter((id) => !previous.has(id)))
    setShown({ ids, entering })
  }
  return (
    <SceneLayer name="diagram">{payload.entities.map((entity) => renderEntity(entity.id, entering.has(entity.id)))}</SceneLayer>
  )
}

function sameIds(a: readonly EntityId[], b: readonly EntityId[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index])
}

function isArrow(id: EntityId): id is ArrowId {
  return id in ARROWS
}

function renderEntity(id: EntityId, entering: boolean) {
  const node = isArrow(id) ? (
    <Arrow key={id} layoutId={layoutIdFor(id)} data-presentation-entity={id} entering={entering} {...ARROWS[id]} />
  ) : (
    <Box key={id} layoutId={layoutIdFor(id)} data-presentation-entity={id} entering={entering} style={rectStyle(id as BoxId)}>
      <Label>{id}</Label>
    </Box>
  )
  // A newcomer fades in after persisting entities settle. The node keeps the same key either way,
  // so a continuing entity is never remounted; it simply has no entry.
  return node
}
