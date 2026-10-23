import { AnimatePresence } from 'motion/react'
import { Check, Plug, ShieldCheck, Sparkles, User } from 'lucide-react'
import type { ReactElement } from 'react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit'
import { layoutIdFor } from './entities'
import { RECT } from './geometry'
import { visibleEntities, type EntityId, type SamplePayload, type SampleState } from './state'

const CARD_RECTS = { 'card-1': RECT.card1, 'card-2': RECT.card2, 'card-3': RECT.card3 } as const

/** Renders one entity. Every element carries its layoutId and a React key of the same id. */
function entity(id: EntityId, state: SampleState): ReactElement {
  const lid = layoutIdFor(id)
  switch (id) {
    case 'you':
      return (
        <Box key={id} id={lid} {...RECT.you} icon={User} className="sample-node sample-you">
          <span className="sample-text">you</span>
        </Box>
      )
    case 'control':
      return (
        <SymbolChip key={id} id={lid} {...RECT.control} allowOverlap className="sample-control">
          <span className="sample-text">partial ↔ full</span>
        </SymbolChip>
      )
    case 'prompt':
      return (
        <Box key={id} id={lid} {...RECT.prompt} className="sample-bubble">
          <span className="sample-text">“a topic”</span>
        </Box>
      )
    case 'skill':
      return (
        <Box key={id} id={lid} {...RECT.skill} icon={Sparkles} className="sample-node sample-skill">
          <span className="sample-text">skill</span>
        </Box>
      )
    case 'link':
      return <Arrow key={id} id={lid} from={RECT.link.from} to={RECT.link.to} bidirectional className="sample-link" />
    case 'question':
      return (
        <SymbolChip key={id} id={lid} {...RECT.question} className="sample-question">
          <span className="sample-text">your topic?</span>
        </SymbolChip>
      )
    case 'card-1':
    case 'card-2':
    case 'card-3':
      return (
        <Box key={id} id={lid} {...CARD_RECTS[id]} className="sample-card">
          <span className="sample-card-title">title</span>
          <span className="sample-card-caption">caption</span>
          <span className="sample-card-visual" />
        </Box>
      )
    case 'morph-arrow':
      return <Arrow key={id} id={lid} from={RECT.morphArrow.from} to={RECT.morphArrow.to} className="sample-morph" />
    case 'morph-label':
      return (
        <Label key={id} id={lid} {...RECT.morphLabel} className="sample-morph-label">
          <span className="sample-text">morphs</span>
        </Label>
      )
    case 'ghost':
      return (
        <Box key={id} id={lid} {...RECT.ghost} className="sample-card sample-ghost">
          <span className="sample-text">unspecified</span>
        </Box>
      )
    case 'socket':
      return (
        <Box key={id} id={lid} {...RECT.socket} icon={Plug} className="sample-socket">
          <span className="sample-text">shared scene kit</span>
        </Box>
      )
    case 'chain':
      return <Arrow key={id} id={lid} from={RECT.chain.from} to={RECT.chain.to} className="sample-link" />
    case 'verify':
      return (
        <Box key={id} id={lid} {...RECT.verify} icon={ShieldCheck} className="sample-node sample-verify">
          <span className="sample-text">verify</span>
          {state.verifyPassed ? (
            <span className="sample-pass" style={{ position: 'absolute', left: 36, top: 84, width: 80, height: 24 }}>
              <Check aria-hidden="true" />
              <span className="sample-text">pass</span>
            </span>
          ) : null}
        </Box>
      )
    case 'modify-arc':
      return (
        <Arrow key={id} id={lid} from={RECT.modifyArc.from} to={RECT.modifyArc.to} className="sample-modify" />
      )
    case 'modify-label':
      return (
        <Label key={id} id={lid} {...RECT.modifyLabel} className="sample-modify-label">
          <span className="sample-text">modify</span>
        </Label>
      )
    case 'flag':
      return <Emphasis key={id} id={lid} {...RECT.flag} allowOverlap className="sample-flag" />
    case 'reveal':
      return (
        <Frame key={id} id={lid} {...RECT.reveal} allowOverlap className="sample-reveal">
          <span className="sample-reveal-label">this presentation</span>
        </Frame>
      )
  }
}

/**
 * The reference sample's one evolving scene. Entities accumulate on the canvas:
 * continuing entities keep their layoutIds and morph; only `entering` ones fade in.
 */
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  const { state, entering } = payload
  const fresh = new Set<EntityId>(entering)
  return (
    <SceneLayer name="sample">
      <AnimatePresence>
        {visibleEntities(state).map((id) => {
          const node = entity(id, state)
          return (
            <Appear key={id} entering={fresh.has(id)}>
              {node}
            </Appear>
          )
        })}
      </AnimatePresence>
    </SceneLayer>
  )
}
