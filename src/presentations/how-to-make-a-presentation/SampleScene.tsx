import { CircleCheck, CircleHelp, Image as ImageIcon, Bot, User } from 'lucide-react'
import type { ReactElement } from 'react'
import { Appear, Arrow, Box, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit'
import { ARROWS, FRAME_STACK_ORDER, layoutIdFor, rectStyle, type ArrowId } from './entities'
import type { SampleEntity, SampleState } from './payload'

/** Positions a child inside a parent box, in the parent's own coordinates. */
const inside = (left: number, top: number, width: number, height: number) => ({ left, top, width, height })

function card(id: 'card1' | 'card2' | 'card3', entity: SampleEntity): ReactElement {
  return (
    <Box key={id} layoutId={layoutIdFor(id)} data-presentation-entity={id} data-presentation-state={entity.state} style={rectStyle(id)}>
      <Label style={inside(8, 8, 94, 20)} data-presentation-part="title">Title</Label>
      <Label style={inside(8, 34, 94, 50)} data-presentation-part="caption">Caption</Label>
      <SymbolChip style={inside(8, 92, 94, 20)} symbol="visual" Icon={ImageIcon} data-presentation-part="visual">
        Visual
      </SymbolChip>
    </Box>
  )
}

function renderEntity(entity: SampleEntity): ReactElement {
  const { id } = entity
  const shared = { layoutId: layoutIdFor(id), 'data-presentation-entity': id }
  switch (id) {
    case 'you':
      return <Box key={id} {...shared} Icon={User} style={rectStyle('you')}>you</Box>
    case 'skill':
      return <Box key={id} {...shared} Icon={Bot} style={rectStyle('skill')}>skill</Box>
    case 'prompt':
      return <Label key={id} {...shared} style={rectStyle('prompt')}>Make a talk about my topic</Label>
    case 'question':
      return (
        <SymbolChip key={id} {...shared} symbol="question" Icon={CircleHelp} style={rectStyle('question')}>
          Which topic?
        </SymbolChip>
      )
    case 'card1':
    case 'card2':
    case 'card3':
      return card(id, entity)
    case 'ghost':
      return (
        <Box key={id} {...shared} style={rectStyle('ghost')} data-presentation-state="unspecified">
          Unspecified step
        </Box>
      )
    case 'partial':
      return (
        <Box key={id} {...shared} style={rectStyle('partial')}>
          partial ↔ full
        </Box>
      )
    case 'socket':
      return (
        <Box key={id} {...shared} style={rectStyle('socket')} data-presentation-socket="">
          Shared scene kit
        </Box>
      )
    case 'verify':
      return (
        <Box key={id} {...shared} style={rectStyle('verify')} data-presentation-state={entity.state}>
          <Label style={inside(8, 8, 94, 20)}>verify</Label>
          {entity.state === 'pass' ? (
            <SymbolChip style={inside(8, 40, 94, 24)} symbol="pass" Icon={CircleCheck} data-presentation-state="pass">
              build + render
            </SymbolChip>
          ) : null}
        </Box>
      )
    case 'flag':
      return (
        <Label key={id} {...shared} style={rectStyle('flag')} data-presentation-flag="">
          edited
        </Label>
      )
    case 'modifyLabel':
      return (
        <Label key={id} {...shared} style={rectStyle('modifyLabel')}>
          modify
        </Label>
      )
    case 'route':
      return (
        <Box key={id} {...shared} style={rectStyle('route')}>
          /how-to-make-a-presentation
        </Box>
      )
    case 'frame':
      return (
        <Frame
          key={id}
          {...shared}
          style={{ ...rectStyle('frame'), zIndex: FRAME_STACK_ORDER, overflow: 'visible' }}
          data-presentation-allow-overlap=""
        >
          <Label style={inside(552, 2, 300, 20)}>made exactly this way</Label>
        </Frame>
      )
    default:
      return renderArrow(id)
  }
}

function renderArrow(id: ArrowId): ReactElement {
  const { from, to, bidirectional } = ARROWS[id]
  return (
    <Arrow
      key={id}
      layoutId={layoutIdFor(id)}
      data-presentation-entity={id}
      from={from}
      to={to}
      bidirectional={bidirectional}
    />
  )
}

/** Entering entities fade in after persisting ones settle; continuing ones are never wrapped. */
function renderSceneEntity(entity: SampleEntity): ReactElement {
  const node = renderEntity(entity)
  return entity.entering ? (
    <Appear key={entity.id} data-presentation-entering={entity.id}>
      {node}
    </Appear>
  ) : (
    node
  )
}


/** The one scene every sample step shares; only its payload changes between steps. */
export function SampleScene({ payload }: SceneProps<SampleState>) {
  return <SceneLayer name="diagram">{payload.entities.map(renderSceneEntity)}</SceneLayer>
}
