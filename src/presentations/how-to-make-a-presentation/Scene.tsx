import { Check, CircleHelp, MessageSquare, Pencil, SlidersHorizontal, User, Bot, Blocks, ShieldCheck, Layers } from 'lucide-react'
import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit'
import { CARD_X, ENTITY, GHOST_X, LINK_Y, RECT, VERIFY_X } from './entities'

export interface SceneState {
  /** 1-based beat; entities from earlier beats stay on screen. */
  step: number
}

const CARD_W = RECT.card1.width

const LINKS = [
  { entity: ENTITY.link12, labelEntity: ENTITY.linkLabel12, x1: CARD_X[0], x2: CARD_X[1] },
  { entity: ENTITY.link23, labelEntity: ENTITY.linkLabel23, x1: CARD_X[1], x2: CARD_X[2] },
]

function Card({ entity, rect, edited = false }: { entity: string; rect: (typeof RECT)[string]; edited?: boolean }) {
  return (
    <Box entity={entity} appear style={rect} className="step-card" data-edited={edited ? 'true' : undefined} Icon={Layers}>
      <span data-card-part="title">title</span>
      <span data-card-part="caption">caption</span>
      <span data-card-part="visual">visual</span>
    </Box>
  )
}

/** One persistent Scene: the payload's beat decides which entities are on screen. */
export function SampleScene({ payload }: SceneProps<SceneState>) {
  const n = payload.step
  const cards = n >= 4 ? 3 : n >= 3 ? 1 : 0
  return (
    <SceneLayer>
      <Box key={ENTITY.you} entity={ENTITY.you} appear className="actor" style={RECT.you} Icon={User}>you</Box>
      {n >= 1 && (
        <Box key={ENTITY.prompt} entity={ENTITY.prompt} appear className="bubble" style={RECT.prompt} Icon={MessageSquare}>
          a topic
        </Box>
      )}
      {n >= 2 && (
        <Box key={ENTITY.skill} entity={ENTITY.skill} appear className="actor" style={RECT.skill} Icon={Bot}>skill</Box>
      )}
      {n >= 2 && (
        <Arrow key={ENTITY.dialog} entity={ENTITY.dialog} appear bidirectional className="dialog" from={{ x: 172, y: 40 }} to={{ x: 708, y: 40 }} />
      )}
      {n >= 2 && (
        <SymbolChip key={ENTITY.question} entity={ENTITY.question} appear className="chip" style={RECT.question} Icon={CircleHelp}>
          question
        </SymbolChip>
      )}
      {n >= 3 && (
        <Label key={ENTITY.tray} entity={ENTITY.tray} appear className="tray-label" style={RECT.tray}>steps</Label>
      )}
      {cards >= 1 && <Card key={ENTITY.card1} entity={ENTITY.card1} rect={RECT.card1} />}
      {cards >= 3 && <Card key={ENTITY.card2} entity={ENTITY.card2} rect={RECT.card2} edited={n >= 8} />}
      {cards >= 3 && <Card key={ENTITY.card3} entity={ENTITY.card3} rect={RECT.card3} />}
      {cards >= 3 && LINKS.map((link) => (
        <Arrow key={link.entity} entity={link.entity} appear className="card-link" from={{ x: link.x1 + CARD_W + 2, y: LINK_Y }} to={{ x: link.x2 - 2, y: LINK_Y }} />
      ))}
      {cards >= 3 && LINKS.map((link) => (
        <Label key={link.labelEntity} entity={link.labelEntity} appear className="link-label" style={{ left: link.x1 + CARD_W, top: LINK_Y - 26, width: link.x2 - link.x1 - CARD_W, height: 16 }}>
          morphs
        </Label>
      ))}
      {n >= 5 && (
        <Box key={ENTITY.ghost} entity={ENTITY.ghost} appear className="step-card ghost" style={RECT.ghost} data-ghost="true">
          unspecified
        </Box>
      )}
      {n >= 5 && (
        <Box key={ENTITY.depth} entity={ENTITY.depth} appear className="control" style={RECT.depth} Icon={SlidersHorizontal}>
          partial ↔ full
        </Box>
      )}
      {n >= 6 && (
        <Arrow key={ENTITY.plug} entity={ENTITY.plug} appear className="plug" from={{ x: 440, y: 282 }} to={{ x: 440, y: 304 }} />
      )}
      {n >= 6 && (
        <Box key={ENTITY.socket} entity={ENTITY.socket} appear className="socket" style={RECT.socket} Icon={Blocks}>
          shared scene kit: boxes, arrows, motion
        </Box>
      )}
      {n >= 7 && (
        <Arrow key={ENTITY.linkVerify} entity={ENTITY.linkVerify} appear className="card-link" from={{ x: GHOST_X + CARD_W + 2, y: LINK_Y }} to={{ x: VERIFY_X - 2, y: LINK_Y }} />
      )}
      {n >= 7 && (
        <Box key={ENTITY.verify} entity={ENTITY.verify} appear className="verify" style={RECT.verify} Icon={ShieldCheck}>
          <span data-card-part="title">verify</span>
          <span data-card-part="caption">build + render</span>
        </Box>
      )}
      {n >= 7 && (
        <SymbolChip key={ENTITY.pass} entity={ENTITY.pass} appear className="pass" style={RECT.pass} Icon={Check} data-state="pass" />
      )}
      {n >= 8 && (
        <Arrow key={ENTITY.modify} entity={ENTITY.modify} appear bend={-60} className="modify" from={{ x: 440, y: 110 }} to={{ x: 270, y: 176 }} />
      )}
      {n >= 8 && (
        <Label key={ENTITY.modifyLabel} entity={ENTITY.modifyLabel} appear className="modify-label" style={{ left: 336, top: 112, width: 80, height: 18 }}>
          modify
        </Label>
      )}
      {n >= 8 && (
        <Emphasis key={ENTITY.edited} entity={ENTITY.edited} appear className="edited-flag" style={RECT.edited}>
          <Pencil aria-hidden="true" data-presentation-icon="" /> edited
        </Emphasis>
      )}
      {n >= 9 && <Frame key={ENTITY.frame} entity={ENTITY.frame} appear className="reveal-frame" style={RECT.frame} />}
      {n >= 9 && (
        <Label key={ENTITY.frameLabel} entity={ENTITY.frameLabel} appear className="reveal-label" style={RECT.frameLabel}>
          this presentation, built this way
        </Label>
      )}
    </SceneLayer>
  )
}
