import { Fragment, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import {
  appearMotion, Arrow, Box, Frame, Label, LAYOUT_T, SceneLayer, SymbolChip,
  type SceneProps,
} from '../../presentation-kit/index.ts'
import {
  CARD_IDS, CHAT_ARROW, LINKS, MODIFY_ARC, RECTS, type EntityId,
} from './entities.ts'
import { newcomerKeys, type SceneState } from './state.ts'

const at = (id: EntityId) => ({
  position: 'absolute' as const,
  left: RECTS[id].x,
  top: RECTS[id].y,
  width: RECTS[id].w,
  height: RECTS[id].h,
})

/** Motion props for the entity with this key; see `appearMotion`. */
type MotionFor = (key: string) => ReturnType<typeof appearMotion>

/** The entities visible in a state, in paint order, each with the key that keeps it stable. */
function entities(state: SceneState, motionFor: MotionFor): [string, ReactNode][] {
  const out: [string, ReactNode][] = []
  const add = (key: string, node: ReactNode) => out.push([key, node])
  const m = motionFor

  add('you', <Box id="you" style={at('you')} {...m('you')}>you</Box>)
  add('prompt', <Box id="prompt" style={at('prompt')} {...m('prompt')}>prompt</Box>)
  if (state.skill) {
    add('skill', <Box id="skill" style={at('skill')} {...m('skill')}>skill</Box>)
    add('chat', <Arrow id="chat" twoWay from={CHAT_ARROW.from} to={CHAT_ARROW.to} {...m('chat')} />)
    add('question', <SymbolChip id="question" style={at('question')} {...m('question')}>question</SymbolChip>)
  }
  if (state.control) add('control', <Box id="control" style={at('control')} {...m('control')}>partial ↔ full</Box>)
  if (state.cards > 0) add('tray', <Box id="tray" style={at('tray')} {...m('tray')} />)
  CARD_IDS.slice(0, state.cards).forEach((id) =>
    add(id, (
      <Box id={id} style={at(id)} {...m(id)}>
        <Label id={`${id}-title`}>title</Label>
        <Label id={`${id}-caption`}>caption</Label>
        <Label id={`${id}-visual`}>visual</Label>
      </Box>
    )),
  )
  if (state.ghost) add('ghost', <Box id="ghost" style={at('ghost')} {...m('ghost')}>unspecified</Box>)
  LINKS.slice(0, state.links).forEach((link) => {
    add(link.id, <Arrow id={link.id} from={link.from} to={link.to} {...m(link.id)} />)
    if (link.label) {
      add(`${link.id}-label`, (
        <Label id={`${link.id}-label`} style={{ position: 'absolute', left: link.from.x, top: link.from.y - 22, width: link.to.x - link.from.x }} {...m(`${link.id}-label`)}>
          {link.label}
        </Label>
      ))
    }
  })
  if (state.kit) add('kit', <Box id="kit" style={at('kit')} {...m('kit')}>scene kit</Box>)
  if (state.verify) {
    add('verify', <Box id="verify" style={at('verify')} {...m('verify')}>verify</Box>)
    add('check-build', <SymbolChip id="check-build" style={at('check-build')} {...m('check-build')}>build</SymbolChip>)
    add('check-render', <SymbolChip id="check-render" style={at('check-render')} {...m('check-render')}>render</SymbolChip>)
    add('pass', (
      <SymbolChip id="pass" data-presentation-state="pass" style={at('pass')} {...m('pass')}>
        <Check aria-label="pass" data-presentation-icon="" />
      </SymbolChip>
    ))
  }
  if (state.modify) {
    add('modify-arc', (
      <motion.svg width={880} height={380} aria-hidden="true" data-presentation-entity="modify-arc"
                  style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
                  {...m('modify-arc')}>
        <motion.path d={MODIFY_ARC} fill="none" stroke="currentColor"
                     initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={LAYOUT_T} />
      </motion.svg>
    ))
    add('modify', <Label id="modify" style={at('modify')} {...m('modify')}>modify</Label>)
    add('flag', <SymbolChip id="flag" style={at('flag')} {...m('flag')}>edited</SymbolChip>)
  }
  if (state.frame) {
    add('frame', <Frame id="frame" style={at('frame')} {...m('frame')} />)
    add('frame-label', <Label id="frame-label" style={at('frame-label')} {...m('frame-label')}>you are looking at one</Label>)
  }
  return out
}

const noMotion: MotionFor = () => appearMotion(false)

/**
 * Which entities are newcomers: those that were not on screen in the previous render, as opposed to
 * the authored predecessor step. Navigating back or jumping across steps therefore treats exactly
 * what appears as new, and what stays as continuing.
 */
function useNewcomers(keys: string[]): ReadonlySet<string> {
  const [seen, setSeen] = useState(() => ({ keys, newcomers: newcomerKeys([], keys) }))
  if (seen.keys.join('|') !== keys.join('|')) {
    setSeen({ keys, newcomers: newcomerKeys(seen.keys, keys) })
  }
  return seen.newcomers
}

/**
 * One persistent scene. Each entity keeps one element for as long as it is on screen: newcomers
 * carry their entrance as motion props, so no wrapper is ever added to or removed from a continuing
 * entity (which would remount it and drop its morph).
 */
export function SampleScene({ payload }: SceneProps<SceneState>) {
  const newcomers = useNewcomers(entities(payload, noMotion).map(([key]) => key))
  return (
    <SceneLayer>
      <AnimatePresence>
        {entities(payload, (key) => appearMotion(newcomers.has(key))).map(([key, node]) => (
          <Fragment key={key}>{node}</Fragment>
        ))}
      </AnimatePresence>
    </SceneLayer>
  )
}
