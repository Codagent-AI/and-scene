import { Fragment } from 'react'
import { Blocks, Bot, CircleCheck, User, type LucideIcon } from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit'
import { ENTITIES, type DiagramState, type Entity, type EntityId, type IconName } from './entities'

const ICONS: Record<IconName, LucideIcon> = { User, Bot, Blocks, CircleCheck }

function renderEntity(id: EntityId, entity: Entity, emphasized: boolean) {
  const icon = 'icon' in entity && entity.icon ? ICONS[entity.icon] : undefined
  const className = `talk-${entity.variant}`
  switch (entity.kind) {
    case 'box':
      return (
        <Box id={id} geometry={entity.geometry} icon={icon} className={className} emphasized={emphasized}>
          {entity.text}
        </Box>
      )
    case 'label':
      return (
        <Label id={id} geometry={entity.geometry} className={className}>
          {entity.text}
        </Label>
      )
    case 'chip':
      return (
        <SymbolChip id={id} geometry={entity.geometry} icon={icon} className={className}>
          {entity.text}
        </SymbolChip>
      )
    case 'arrow':
      return (
        <Arrow
          id={id}
          x={entity.x}
          y={entity.y}
          length={entity.length}
          angle={entity.angle}
          twoWay={entity.twoWay}
          className={className}
        />
      )
    case 'frame':
      return (
        <Frame id={id} geometry={entity.geometry} className={className}>
          <span>{entity.text}</span>
        </Frame>
      )
    case 'emphasis':
      return <Emphasis id={id} geometry={entity.geometry} className={className} />
  }
}

/**
 * The one scene component every step renders. Continuing entities mount unwrapped
 * and morph through their shared layoutIds; newcomers wrap in Appear so they enter
 * after the persisting entities have moved.
 */
export function Diagram({ payload }: SceneProps<DiagramState>) {
  return (
    <SceneLayer>
      {payload.visible.map((id) => {
        const node = renderEntity(id, ENTITIES[id], payload.emphasized.includes(id))
        return payload.added.includes(id) ? (
          <Appear key={id}>{node}</Appear>
        ) : (
          <Fragment key={id}>{node}</Fragment>
        )
      })}
    </SceneLayer>
  )
}
