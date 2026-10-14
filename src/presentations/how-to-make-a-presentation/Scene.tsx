import { AnimatePresence, motion } from 'motion/react'
import { Boxes, Check, Sparkles, User, type LucideIcon } from 'lucide-react'
import {
  Appear,
  Arrow,
  Box,
  EASE,
  ENTER_DELAY,
  ENTER_T,
  Frame,
  HOOK,
  hookAttrs,
  Label,
  type SceneProps,
} from '../../presentation-kit'
import { ENTITY } from './entities'

/** One beat of the talk. Each step advances `stage` by one; the scene reads it to decide what exists. */
export interface TalkPayload {
  stage: number
}

// Card row geometry shared by every step card, the ghost card, and the verify node.
const CARD_Y = 140
const CARD_W = 120
const CARD_H = 128
const CARD_X = [40, 212, 384, 556, 728] as const

/**
 * The whole talk is one diagram. Every step renders this same component (one
 * shared layer), so an entity that exists in consecutive steps is never remounted:
 * it keeps its layout id and morphs in place. Newcomers wrap in Appear and so enter
 * after the persisting entities settle. Nothing is rearranged after it lands.
 */
export function EvolvingScene({ payload }: SceneProps<TalkPayload>) {
  const { stage } = payload
  return (
    <>
      {stage >= 1 ? (
        <Appear>
          <Box id={ENTITY.you} x={40} y={40} width={140} height={56} Icon={User} className="pn-person">
            you
          </Box>
        </Appear>
      ) : null}
      {stage >= 1 ? (
        <Appear>
          <Box id={ENTITY.prompt} x={210} y={14} width={160} height={30} className="pn-bubble">
            a topic
          </Box>
        </Appear>
      ) : null}

      <AnimatePresence>
        {stage === 2 ? (
          <motion.div
            key={ENTITY.question}
            {...hookAttrs(HOOK.node, 'chip')}
            {...hookAttrs(HOOK.nodeId, ENTITY.question)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: ENTER_T, delay: ENTER_DELAY, ease: EASE }}
            className="pn-chip"
            style={{ position: 'absolute', left: 400, top: 14, width: 200, height: 26 }}
          >
            what&apos;s the topic?
          </motion.div>
        ) : null}
      </AnimatePresence>

      {stage >= 2 ? (
        <Appear>
          <Box id={ENTITY.skill} x={680} y={40} width={160} height={56} Icon={Sparkles} className="pn-person">
            skill
          </Box>
        </Appear>
      ) : null}
      {stage >= 2 ? (
        <Appear>
          <Arrow id={ENTITY.ask} x1={184} y1={54} x2={676} y2={54} className="pn-arrow" />
        </Appear>
      ) : null}
      {stage >= 2 ? (
        <Appear>
          <Arrow id={ENTITY.answer} x1={676} y1={68} x2={184} y2={68} className="pn-arrow" />
        </Appear>
      ) : null}

      {stage >= 3 ? (
        <Appear>
          <Frame id={ENTITY.tray} x={24} y={124} width={832} height={152} className="pn-tray" />
        </Appear>
      ) : null}
      {stage >= 3 ? (
        <Appear>
          <StepCard id={ENTITY.card1} x={CARD_X[0]} title="Opening" caption="A line the viewer reads." Icon={Sparkles} />
        </Appear>
      ) : null}

      {stage >= 4 ? (
        <Appear>
          <StepCard id={ENTITY.card2} x={CARD_X[1]} title="The question" caption="What the skill asked." Icon={Sparkles} flagged={stage >= 8} />
        </Appear>
      ) : null}
      {stage >= 4 ? (
        <Appear>
          <StepCard id={ENTITY.card3} x={CARD_X[2]} title="Story beat" caption="One beat, one card." Icon={Sparkles} />
        </Appear>
      ) : null}
      {stage >= 4 ? (
        <Appear>
          <Arrow id={ENTITY.link1} x1={166} y1={204} x2={206} y2={204} className="pn-arrow" />
        </Appear>
      ) : null}
      {stage >= 4 ? (
        <Appear>
          <Label x={160} y={184} width={52} height={16} className="pn-morph">
            morph
          </Label>
        </Appear>
      ) : null}
      {stage >= 4 ? (
        <Appear>
          <Arrow id={ENTITY.link2} x1={338} y1={204} x2={378} y2={204} className="pn-arrow" />
        </Appear>
      ) : null}
      {stage >= 4 ? (
        <Appear>
          <Label x={332} y={184} width={52} height={16} className="pn-morph">
            morph
          </Label>
        </Appear>
      ) : null}

      {stage >= 5 ? (
        <Appear>
          <Box id={ENTITY.ghost} x={CARD_X[3]} y={CARD_Y} width={CARD_W} height={CARD_H} className="pn-card pn-ghost">
            <span className="pn-card-title">unspecified</span>
            <span className="pn-card-caption">the skill fills this in from your story</span>
          </Box>
        </Appear>
      ) : null}
      {stage >= 5 ? (
        <Appear>
          <Box id={ENTITY.depth} x={40} y={100} width={140} height={18} className="pn-depth">
            <span className="pn-depth-on">full</span>
            <span>partial</span>
          </Box>
        </Appear>
      ) : null}

      {stage >= 6 ? (
        <Appear>
          <Box id={ENTITY.kit} x={330} y={306} width={220} height={40} Icon={Boxes} className="pn-kit">
            shared scene kit
          </Box>
        </Appear>
      ) : null}
      {stage >= 6 ? (
        <Appear>
          <Arrow id={ENTITY.plug} x1={440} y1={306} x2={440} y2={278} className="pn-arrow pn-plug" />
        </Appear>
      ) : null}

      {stage >= 7 ? (
        <Appear>
          <Arrow id={ENTITY.chain} x1={680} y1={204} x2={724} y2={204} className="pn-arrow" />
        </Appear>
      ) : null}
      {stage >= 7 ? (
        <Appear>
          <Box id={ENTITY.verify} x={CARD_X[4]} y={CARD_Y} width={CARD_W} height={CARD_H} Icon={Check} className="pn-card pn-verify">
            <span className="pn-card-title">verify</span>
            <span className="pn-card-caption">build and render every step</span>
            <span className="pn-pass">pass</span>
          </Box>
        </Appear>
      ) : null}

      {stage >= 8 ? (
        <Appear>
          <Arrow id={ENTITY.modify} x1={700} y1={100} x2={272} y2={136} className="pn-arrow pn-modify" />
        </Appear>
      ) : null}
      {stage >= 8 ? (
        <Appear>
          <Label x={400} y={80} width={130} height={16} className="pn-modify-label">
            change one card
          </Label>
        </Appear>
      ) : null}

      {stage >= 9 ? (
        <Appear>
          <Frame id={ENTITY.reveal} x={8} y={4} width={864} height={372} className="pn-reveal" />
        </Appear>
      ) : null}
      {stage >= 9 ? (
        <Appear>
          <Label id={ENTITY.revealLabel} x={24} y={350} width={260} height={18} className="pn-reveal-label">
            this deck, built with this skill
          </Label>
        </Appear>
      ) : null}
    </>
  )
}

interface StepCardProps {
  id: string
  x: number
  title: string
  caption: string
  Icon: LucideIcon
  flagged?: boolean
}

/** A step card carries the three parts every step has: title, caption, and visual. */
function StepCard({ id, x, title, caption, Icon, flagged = false }: StepCardProps) {
  return (
    <Box id={id} x={x} y={CARD_Y} width={CARD_W} height={CARD_H} className={flagged ? 'pn-card pn-card-flagged' : 'pn-card'}>
      <span className="pn-card-title">{title}</span>
      <span className="pn-card-caption">{caption}</span>
      <Icon aria-hidden="true" className="pn-card-visual" />
      {flagged ? <span className="pn-flag">edited</span> : null}
    </Box>
  )
}
