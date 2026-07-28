/**
 * The single evolving Scene component shared by every step of this
 * presentation. Nothing is ever rearranged or redrawn: every render paints
 * the *entire* accumulated diagram (every entity visible so far), driven by
 * the cumulative flags in `BeatPayload`. `introduced` names only the
 * entities that are genuinely new *at this exact beat*, so only those get
 * wrapped in `Appear` — everything else renders plainly and morphs in place
 * via its stable `layoutId`.
 */
import type { CSSProperties, ReactNode } from 'react'
import { User, Bot, MessageSquare, HelpCircle, LayoutTemplate, CheckCircle2, RotateCcw, Eye } from 'lucide-react'
import type { SceneProps } from '../../../presentation-kit/types'
import { SceneLayer, Box, Label, Arrow, Frame, Emphasis, SymbolChip, Appear } from '../../../presentation-kit/nodes'
import { entities } from '../entities'

export interface BeatPayload {
  visible: {
    you: boolean
    prompt: boolean
    skill: boolean
    link: boolean
    cardCount: 0 | 1 | 2 | 3 | 4
    ghost: boolean
    depthControl: boolean
    kitSocket: boolean
    verifyNode: boolean
    verifyPass: boolean
    modifyArc: boolean
    editedCardIndex: 0 | 1 | 2 | 3 | null
    revealFrame: boolean
  }
  /** Entity keys that first appear at this exact step; only these get `Appear`. */
  introduced: string[]
}

/**
 * Every entity switched off. Steps spread this and name only what they turn
 * on, so adding an entity to `BeatPayload` is one edit here rather than one
 * per step file.
 */
export const NONE_VISIBLE: BeatPayload['visible'] = {
  you: false,
  prompt: false,
  skill: false,
  link: false,
  cardCount: 0,
  ghost: false,
  depthControl: false,
  kitSocket: false,
  verifyNode: false,
  verifyPass: false,
  modifyArc: false,
  editedCardIndex: null,
  revealFrame: false,
}

function pos(left: number, top: number, width: number, height: number): CSSProperties {
  return { position: 'absolute', left, top, width, height }
}

const CARD_SLOTS = [
  { left: 40, layoutId: entities.card1, introduceKey: 'card1' },
  { left: 180, layoutId: entities.card2, introduceKey: 'card2' },
  { left: 320, layoutId: entities.card3, introduceKey: 'card3' },
  { left: 460, layoutId: entities.card4, introduceKey: 'card4' },
]
const CARD_TOP = 160
const CARD_W = 90
const CARD_H = 64
const GHOST_LEFT = 600
const VERIFY_LEFT = 740

const CARD_TITLES = ['topic', 'look', 'beat one', 'beat two']
const CARD_CAPTIONS = ['what it is about', 'how it should feel', 'first answer lands', 'story keeps going']

const LINK_SLOTS = [
  { left: 130, layoutId: entities.cardLink12, introduceKey: 'cardLink12' },
  { left: 270, layoutId: entities.cardLink23, introduceKey: 'cardLink23' },
  { left: 410, layoutId: entities.cardLink34, introduceKey: 'cardLink34' },
]

export function Scene({ payload }: SceneProps<BeatPayload>) {
  const { visible, introduced } = payload
  const isNew = (key: string) => introduced.includes(key)
  const wrap = (key: string, node: ReactNode) => (isNew(key) ? <Appear key={key}>{node}</Appear> : node)

  return (
    <SceneLayer className="ahs-scene">
      {/* conversation row */}
      {visible.you &&
        wrap(
          'you',
          <Box layoutId={entities.you} Icon={User} className="ahs-box ahs-box--you" style={pos(40, 40, 120, 56)}>
            you
          </Box>,
        )}
      {visible.prompt &&
        wrap(
          'prompt',
          <Box
            layoutId={entities.prompt}
            Icon={MessageSquare}
            className="ahs-box ahs-box--prompt"
            style={pos(170, 0, 170, 32)}
          >
            "build me a talk"
          </Box>,
        )}
      {visible.skill &&
        wrap(
          'skill',
          <Box layoutId={entities.skill} Icon={Bot} className="ahs-box ahs-box--skill" style={pos(720, 40, 120, 56)}>
            skill
          </Box>,
        )}
      {visible.link &&
        wrap(
          'link',
          <Frame layoutId={entities.conversationLink} className="ahs-conversation-link" style={pos(172, 60, 528, 16)}>
            <Arrow rotation={180} className="ahs-conversation-link__arrow ahs-conversation-link__arrow--left" />
            <Arrow className="ahs-conversation-link__arrow ahs-conversation-link__arrow--right" />
          </Frame>,
        )}
      {visible.link &&
        wrap(
          'questionChip',
          <SymbolChip
            layoutId={entities.questionChip}
            Icon={HelpCircle}
            label="one question at a time"
            className="ahs-question-chip"
            style={pos(356, 32, 168, 26)}
          />,
        )}
      {visible.depthControl &&
        wrap(
          'depthControl',
          <SymbolChip
            layoutId={entities.depthControl}
            Icon={RotateCcw}
            label="partial ↔ full"
            className="ahs-depth-control"
            style={pos(40, 102, 120, 26)}
          />,
        )}

      {/* tray: step cards accumulate, never reframed as a group */}
      {CARD_SLOTS.map((slot, index) => {
        if (index >= visible.cardCount) return null
        const isEdited = visible.editedCardIndex === index
        return (
          <div key={slot.layoutId}>
            {wrap(
              slot.introduceKey,
              <Box
                layoutId={slot.layoutId}
                className="ahs-box ahs-card"
                style={pos(slot.left, CARD_TOP, CARD_W, CARD_H)}
              >
                <span className="ahs-card__title">{CARD_TITLES[index]}</span>
                <span className="ahs-card__caption">{CARD_CAPTIONS[index]}</span>
              </Box>,
            )}
            {isEdited &&
              wrap(
                'editedFlag',
                <Emphasis
                  layoutId={entities.editedFlag}
                  active
                  className="ahs-edited-flag"
                  style={pos(slot.left + CARD_W - 14, CARD_TOP - 10, 28, 20)}
                >
                  edited
                </Emphasis>,
              )}
          </div>
        )
      })}
      {LINK_SLOTS.map((slot, index) => {
        if (index + 2 > visible.cardCount) return null
        return (
          <div key={slot.layoutId}>
            {wrap(
              slot.introduceKey,
              <Label layoutId={slot.layoutId} className="ahs-card-link" style={pos(slot.left, 186, 40, 14)}>
                morphs
              </Label>,
            )}
          </div>
        )
      })}
      {visible.ghost &&
        wrap(
          'ghost',
          <Box layoutId={entities.ghostCard} className="ahs-box ahs-card ahs-card--ghost" style={pos(GHOST_LEFT, CARD_TOP, CARD_W, CARD_H)}>
            <span className="ahs-card__title">unspecified</span>
            <span className="ahs-card__caption">sketch only</span>
          </Box>,
        )}
      {visible.ghost &&
        visible.cardCount === 4 &&
        wrap(
          'ghostLink',
          <Label layoutId={entities.ghostLink} className="ahs-card-link ahs-card-link--dashed" style={pos(550, 186, 40, 14)}>
            gate
          </Label>,
        )}
      {visible.kitSocket &&
        wrap(
          'kitSocket',
          <SymbolChip
            layoutId={entities.kitSocket}
            Icon={LayoutTemplate}
            label="scene kit"
            className="ahs-kit-socket"
            style={pos(300, 244, 280, 36)}
          />,
        )}
      {visible.verifyNode &&
        wrap(
          'verifyNode',
          <SymbolChip
            layoutId={entities.verifyNode}
            Icon={CheckCircle2}
            label="verify"
            className="ahs-verify-node"
            style={pos(VERIFY_LEFT, CARD_TOP, CARD_W, CARD_H)}
          />,
        )}
      {visible.verifyNode &&
        wrap(
          'verifyLink',
          <Label layoutId={entities.verifyLink} className="ahs-card-link" style={pos(690, 186, 40, 14)}>
            checks
          </Label>,
        )}
      {visible.verifyPass &&
        wrap(
          'verifyCheck',
          <Emphasis
            layoutId={entities.verifyCheck}
            active
            className="ahs-verify-check"
            style={pos(VERIFY_LEFT + CARD_W - 16, CARD_TOP - 10, 24, 24)}
          >
            <CheckCircle2 aria-hidden="true" />
          </Emphasis>,
        )}

      {/* modify loop, reaching from the conversation down into the tray route */}
      {visible.modifyArc &&
        wrap(
          'modifyArc',
          <Frame layoutId={entities.modifyArc} className="ahs-modify-arc" style={pos(210, 100, 220, 60)}>
            <Arrow rotation={125} className="ahs-modify-arc__arrow" />
          </Frame>,
        )}
      {visible.modifyArc &&
        wrap(
          'modifyLabel',
          <Label layoutId={entities.modifyLabel} className="ahs-modify-label" style={pos(238, 102, 90, 18)}>
            modify
          </Label>,
        )}

      {/* self-reference reveal frame around the whole diagram */}
      {visible.revealFrame &&
        wrap(
          'revealFrame',
          <Frame layoutId={entities.revealFrame} className="ahs-reveal-frame" style={pos(12, 12, 856, 356)} />,
        )}
      {visible.revealFrame &&
        wrap(
          'revealLabel',
          <SymbolChip
            layoutId={entities.revealLabel}
            Icon={Eye}
            label="…and this is that presentation"
            className="ahs-reveal-label"
            style={pos(560, 340, 260, 26)}
          />,
        )}
    </SceneLayer>
  )
}
