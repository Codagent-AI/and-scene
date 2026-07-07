import { AnimatePresence, motion } from 'motion/react'
import {
  Boxes,
  CheckCircle2,
  MessageCircle,
  Pencil,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
} from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, ENTER_T, LAYOUT_T, SceneLayer } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import { ENTITIES } from './entities'

/**
 * Per-step state of the one evolving diagram. Every step renders the same
 * scene; the payload only says which pieces are on stage. Pieces accumulate —
 * nothing is ever rearranged, so each step reads as "one new thing happened
 * to the picture I was already looking at".
 */
export type RefPayload = {
  /** The skill node + conversation link are on stage. */
  skill?: boolean
  /** The opening prompt bubble (step 1 only; it morphs into the question chip). */
  bubble?: boolean
  /** Current interview question, shown in the chip above the conversation arrow. */
  question?: string
  /** How many step cards have landed in the tray (0–3). */
  cards?: number
  /** A dashed placeholder card marks the steps you left unspecified. */
  ghost?: boolean
  /** The partial↔full control docked on You. */
  depth?: boolean
  /** The tray is framed as a route and the scene kit plugs into it. */
  route?: boolean
  /** Verify chain (arrow → verify → pass) attached to the route. */
  verify?: boolean
  /** The modify arrow looping from the route back to the conversation. */
  loop?: boolean
  /** Outer frame drawn around everything: the self-reference reveal. */
  reveal?: boolean
}

const CARDS = [
  { id: ENTITIES.stepCard1, label: 'Step 1', subtitle: 'title + caption' },
  { id: ENTITIES.stepCard2, label: 'Step 2', subtitle: 'the visual' },
  { id: ENTITIES.stepCard3, label: 'Step 3', subtitle: 'what morphs' },
] as const

/** You, the interview chip + arrow, and the skill. Anchors the top band. */
function ConversationRow({ p }: { p: RefPayload }) {
  return (
    <div className="ref-convo">
      <div className="ref-you-slot">
        <Box
          layoutId={ENTITIES.you}
          Icon={User}
          label="You"
          subtitle="topic in hand"
          accent="amber"
          className="ref-box"
        />
        <div className="ref-depth-slot" data-allow-overlap>
          <AnimatePresence>
            {p.depth && (
              <Appear key="depth">
                <Emphasis layoutId={ENTITIES.depthChip} accent="amber" className="ref-chip">
                  <SlidersHorizontal size={13} aria-hidden />
                  partial ↔ full
                </Emphasis>
              </Appear>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="ref-convo-link">
        <AnimatePresence>
          {p.bubble && (
            <motion.div key="bubble" exit={{ opacity: 0, transition: LAYOUT_T }}>
              <Emphasis layoutId={ENTITIES.prompt} accent="cyan" className="ref-bubble">
                <MessageCircle className="ref-bubble-icon" size={20} aria-hidden />
                &ldquo;I need a presentation about&hellip;&rdquo;
              </Emphasis>
            </motion.div>
          )}
          {p.skill && (
            <motion.div
              key="link"
              className="ref-link-column"
              exit={{ opacity: 0, transition: LAYOUT_T }}
            >
              <div className="ref-question-slot">
                <AnimatePresence>
                  {p.question && (
                    <Appear key="question">
                      <Emphasis layoutId={ENTITIES.questionChip} accent="cyan" className="ref-chip">
                        {p.question}
                      </Emphasis>
                    </Appear>
                  )}
                </AnimatePresence>
              </div>
              <Appear delay={0.15}>
                <Arrow layoutId={ENTITIES.convoArrow} className="ref-arrow ref-arrow--convo">
                  ↔
                </Arrow>
              </Appear>
              <div className="ref-question-slot" aria-hidden />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {p.skill && (
          <Appear key="skill">
            <Box
              layoutId={ENTITIES.skill}
              Icon={Sparkles}
              label="Skill"
              subtitle="asks, then builds"
              accent="cyan"
              className="ref-box"
            />
          </Appear>
        )}
      </AnimatePresence>
    </div>
  )
}

/** The scene-kit plug straddling the route frame's top edge. */
function KitSocket() {
  return (
    <div className="ref-socket-slot" data-allow-overlap>
      <motion.div
        layoutId={ENTITIES.kitSocket}
        transition={LAYOUT_T}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: ENTER_T }}
        exit={{ opacity: 0, transition: LAYOUT_T }}
        className="ref-socket"
      >
        <Boxes size={15} aria-hidden />
        scene kit
      </motion.div>
    </div>
  )
}

/** The tray of step cards; framed as the presentation route once assembled. */
function Tray({ p }: { p: RefPayload }) {
  const count = p.cards ?? 0
  return (
    <motion.div
      layoutId={ENTITIES.tray}
      transition={LAYOUT_T}
      className="ref-tray"
      data-route={p.route || undefined}
    >
      <div className="ref-route-label-slot" data-allow-overlap>
        <AnimatePresence>
          {p.route && (
            <Appear key="route-label">
              <span className="ref-route-label">{p.reveal ? '/how-to-make-a-presentation' : '/your-talk'}</span>
            </Appear>
          )}
        </AnimatePresence>
      </div>
      <div className="ref-cards">
        <AnimatePresence>
          {CARDS.slice(0, count).map((card) => {
            const edited = p.loop && card.id === ENTITIES.stepCard2
            return (
              <motion.div
                key={card.id}
                className="ref-card-slot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: ENTER_T }}
                exit={{ opacity: 0, transition: LAYOUT_T }}
              >
                <Box
                  layoutId={card.id}
                  label={card.label}
                  subtitle={card.subtitle}
                  accent={edited ? 'amber' : 'gray'}
                  className="ref-box ref-card"
                />
                <div className="ref-edit-slot" data-allow-overlap>
                  <AnimatePresence>
                    {edited && (
                      <Appear key="edit">
                        <Emphasis layoutId={ENTITIES.editBadge} accent="amber" className="ref-chip ref-chip--edit">
                          <Pencil size={11} aria-hidden />
                          edited
                        </Emphasis>
                      </Appear>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
          {p.ghost && (
            <motion.div
              key="ghost"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: ENTER_T }}
              exit={{ opacity: 0, transition: LAYOUT_T }}
            >
              <Box
                layoutId={ENTITIES.ghostCard}
                label="Step 4…"
                subtitle="up to you"
                accent="gray"
                className="ref-box ref-card ref-card--ghost"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>{p.route && <KitSocket key="socket" />}</AnimatePresence>
    </motion.div>
  )
}

/** Arrow → verify; the green check lands on the verify node once it passes. */
function VerifyChain() {
  return (
    <motion.div className="ref-verify" exit={{ opacity: 0, transition: LAYOUT_T }}>
      <Appear>
        <Arrow layoutId={ENTITIES.verifyArrow} className="ref-arrow" />
      </Appear>
      <div className="ref-verify-slot">
        <Appear delay={0.15}>
          <Box
            layoutId={ENTITIES.verifyNode}
            Icon={ShieldCheck}
            label="verify"
            subtitle="build + render"
            accent="cyan"
            className="ref-box ref-card"
          />
        </Appear>
        <div className="ref-pass-slot" data-allow-overlap>
          <Appear delay={0.7}>
            <Emphasis layoutId={ENTITIES.greenCheck} accent="green" className="ref-chip ref-chip--pass">
              <CheckCircle2 size={13} aria-hidden />
              pass
            </Emphasis>
          </Appear>
        </div>
      </div>
    </motion.div>
  )
}

/** The modify loop: a dashed arc from the conversation down to the edited card. */
function LoopArc() {
  return (
    <motion.div
      className="ref-loop"
      data-allow-overlap
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: ENTER_T }}
      exit={{ opacity: 0, transition: LAYOUT_T }}
      aria-hidden
    >
      <svg className="ref-loop-svg" viewBox="0 0 130 90" fill="none">
        <path
          className="ref-loop-dash"
          d="M 120 5 Q 30 15 13 78"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <path d="M 13 78 l -6 -12 M 13 78 l 12 -8" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span className="ref-loop-label">
        <Pencil size={12} aria-hidden />
        modify
      </span>
    </motion.div>
  )
}

/** The self-reference reveal: an outline drawn around the whole diagram. */
function RevealOutline() {
  return (
    <motion.div
      className="ref-reveal"
      data-allow-overlap
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1, transition: ENTER_T }}
      exit={{ opacity: 0, transition: LAYOUT_T }}
    >
      <span className="ref-reveal-label">this presentation</span>
    </motion.div>
  )
}

export function ReferenceScene({ step }: SceneProps<RefPayload>) {
  const p = step.payload ?? {}
  return (
    <SceneLayer>
      <div className="ref-stage">
        <ConversationRow p={p} />
        <AnimatePresence>
          {(p.cards ?? 0) > 0 && (
            <motion.div
              key="band"
              className="ref-band"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: ENTER_T }}
              exit={{ opacity: 0, transition: LAYOUT_T }}
            >
              <Tray p={p} />
              <AnimatePresence>{p.verify && <VerifyChain key="verify" />}</AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>{p.loop && <LoopArc key="loop" />}</AnimatePresence>
        <AnimatePresence>{p.reveal && <RevealOutline key="reveal" />}</AnimatePresence>
      </div>
    </SceneLayer>
  )
}
