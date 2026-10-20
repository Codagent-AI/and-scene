import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Appear, Arrow, Box, Emphasis, Frame, Label, LAYOUT_T, SceneLayer, SymbolChip,
  type SceneProps,
} from '../../presentation-kit/index.ts'
import {
  CARD_IDS, CHAT_ARROW, FOCUS_PAD, LINKS, MODIFY_ARC, RECTS, type EntityId,
} from './entities.ts'
import type { SceneState } from './state.ts'

const at = (id: EntityId) => ({
  position: 'absolute' as const,
  left: RECTS[id].x,
  top: RECTS[id].y,
  width: RECTS[id].w,
  height: RECTS[id].h,
})

function focusStyle(id: EntityId) {
  const r = RECTS[id]
  return {
    position: 'absolute' as const,
    left: r.x - FOCUS_PAD,
    top: r.y - FOCUS_PAD,
    width: r.w + FOCUS_PAD * 2,
    height: r.h + FOCUS_PAD * 2,
  }
}

/** The entities visible in a state, in paint order, each with the key that keeps it stable. */
function entities(state: SceneState): [string, ReactNode][] {
  const out: [string, ReactNode][] = []
  const add = (key: string, node: ReactNode) => out.push([key, node])

  add('you', <Box id="you" style={at('you')}>you</Box>)
  add('prompt', <Box id="prompt" style={at('prompt')}>prompt</Box>)
  if (state.skill) {
    add('skill', <Box id="skill" style={at('skill')}>skill</Box>)
    add('chat', <Arrow id="chat" twoWay from={CHAT_ARROW.from} to={CHAT_ARROW.to} />)
    add('question', <SymbolChip id="question" style={at('question')}>question</SymbolChip>)
  }
  if (state.control) add('control', <Box id="control" style={at('control')}>partial ↔ full</Box>)
  CARD_IDS.slice(0, state.cards).forEach((id) =>
    add(id, (
      <Box id={id} style={at(id)}>
        <Label id={`${id}-title`}>title</Label>
        <Label id={`${id}-caption`}>caption</Label>
        <Label id={`${id}-visual`}>visual</Label>
      </Box>
    )),
  )
  if (state.ghost) add('ghost', <Box id="ghost" style={at('ghost')}>unspecified</Box>)
  LINKS.slice(0, state.links).forEach((link) => {
    add(link.id, <Arrow id={link.id} from={link.from} to={link.to} />)
    if (link.label) {
      add(`${link.id}-label`, (
        <Label id={`${link.id}-label`} style={{ position: 'absolute', left: link.from.x, top: link.from.y - 22, width: link.to.x - link.from.x }}>
          {link.label}
        </Label>
      ))
    }
  })
  if (state.kit) add('kit', <Box id="kit" style={at('kit')}>scene kit</Box>)
  if (state.verify) {
    add('verify', <Box id="verify" style={at('verify')}>verify</Box>)
    add('check-build', <SymbolChip id="check-build" style={at('check-build')}>build</SymbolChip>)
    add('check-render', <SymbolChip id="check-render" style={at('check-render')}>render</SymbolChip>)
    add('pass', (
      <SymbolChip id="pass" data-presentation-state="pass" style={at('pass')}>
        <Check aria-label="pass" data-presentation-icon="" />
      </SymbolChip>
    ))
  }
  if (state.modify) {
    add('modify-arc', (
      <svg width={880} height={380} aria-hidden="true" data-presentation-entity="modify-arc"
           style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
        <motion.path d={MODIFY_ARC} fill="none" stroke="currentColor"
                     initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={LAYOUT_T} />
      </svg>
    ))
    add('modify', <Label id="modify" style={at('modify')}>modify</Label>)
    add('flag', <SymbolChip id="flag" style={at('flag')}>edited</SymbolChip>)
  }
  if (state.frame) {
    add('frame', <Frame id="frame" style={at('frame')} />)
    add('frame-label', <Label id="frame-label" style={at('frame-label')}>you are looking at one</Label>)
  }
  if (state.focus) add('focus', <Emphasis id="focus" style={focusStyle(state.focus)} />)
  return out
}

/** One persistent scene: entities keep their ids across steps, so they morph in place. */
export function SampleScene({ payload }: SceneProps<SceneState>) {
  return (
    <SceneLayer>
      <AnimatePresence>
        {entities(payload).map(([key, node]) => (
          <Appear key={key}>{node}</Appear>
        ))}
      </AnimatePresence>
    </SceneLayer>
  )
}
