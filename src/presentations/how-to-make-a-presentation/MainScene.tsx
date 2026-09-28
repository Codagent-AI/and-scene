import type { ReactNode } from 'react'
import { MessageCircle, User, Wrench, CheckCircle2, Pencil } from 'lucide-react'
import { Arrow, Box, Frame, Label, SceneLayer } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import { entities } from './entities'

export interface ScenePayload {
  /** Steps accumulate monotonically: step N implies every effect from step < N is still on screen. */
  step: number
}

const CARD_TOP = 150

/** A tray step-card showing the parts every step carries. */
function StepCard({ layoutId, left, children }: { layoutId: string; left: number; children?: ReactNode }) {
  return (
    <Box
      layoutId={layoutId}
      className="htmap-card"
      style={{ position: 'absolute', left, top: CARD_TOP, width: 84, height: 80 }}
    >
      <Label className="htmap-card-title">title</Label>
      <Label className="htmap-card-caption">caption</Label>
      <Label className="htmap-card-visual">visual</Label>
      {children}
    </Box>
  )
}

/** The "what morphs" marker drawn on the link between two consecutive cards. */
function MorphLink({ layoutId, left }: { layoutId: string; left: number }) {
  return (
    <Label layoutId={layoutId} className="htmap-morph-link" style={{ position: 'absolute', left, top: 182, width: 26 }}>
      ↺
    </Label>
  )
}

/**
 * The one persistent diagram for this talk. Every step renders this same
 * component (shared `groupKey`) with a higher `step` in its payload — nothing
 * is ever rearranged or redrawn, only added to.
 */
export function MainScene({ payload }: SceneProps<ScenePayload>) {
  const { step } = payload

  const showSkill = step >= 2
  const showTray = step >= 3
  const showCards = step >= 4
  const showDepthControl = step >= 5
  const showGhost = step >= 5
  const showSceneKit = step >= 6
  const showVerify = step >= 7
  const showModify = step >= 8
  const showReveal = step >= 9

  return (
    <SceneLayer className="htmap-scene">
      {/* Conversation row */}
      <Box
        layoutId={entities.you}
        icon={User}
        className="htmap-box htmap-you"
        style={{ position: 'absolute', left: 40, top: 24, width: 110, height: 60 }}
      >
        you
      </Box>

      <Box
        layoutId={entities.prompt}
        className="htmap-chip htmap-prompt"
        style={{ position: 'absolute', left: 40, top: 96, width: 170, height: 34 }}
      >
        “build a talk about this skill”
      </Box>

      {showSkill ? (
        <Box
          layoutId={entities.skill}
          icon={Wrench}
          className="htmap-box htmap-skill"
          style={{ position: 'absolute', left: 730, top: 24, width: 110, height: 60 }}
        >
          skill
        </Box>
      ) : null}

      {showSkill ? (
        <Arrow layoutId={entities.chatArrow} className="htmap-arrow" from={{ x: 150, y: 54 }} to={{ x: 730, y: 54 }} />
      ) : null}

      {showSkill ? (
        <Box
          layoutId={entities.questionChip}
          icon={MessageCircle}
          className="htmap-chip htmap-question-chip"
          style={{ position: 'absolute', left: 330, top: 0, width: 220, height: 30 }}
        >
          one question at a time
        </Box>
      ) : null}

      {/*
        Depth control docks on "you" once the human can choose partial vs.
        full detail — the overlap with the "you" box corner is intentional
        (it reads as attached to it), so it carries the allow-overlap marker.
      */}
      {showDepthControl ? (
        <Box
          layoutId={entities.depthToggle}
          className="htmap-chip htmap-depth-toggle"
          style={{ position: 'absolute', left: 130, top: 68, width: 90, height: 26 }}
          data-presentation-allow-overlap=""
        >
          partial ↔ full
        </Box>
      ) : null}

      {/* Tray of accumulating step-cards */}
      {showTray ? <StepCard layoutId={entities.card1} left={40} /> : null}

      {showCards ? (
        <>
          <MorphLink layoutId={entities.morphLink1} left={124} />
          <StepCard layoutId={entities.card2} left={150}>
            {showModify ? (
              <Box layoutId={entities.flagBadge} icon={Pencil} className="htmap-flag-badge" data-presentation-allow-overlap="" />
            ) : null}
          </StepCard>
          <MorphLink layoutId={entities.morphLink2} left={234} />
          <StepCard layoutId={entities.card3} left={260} />
        </>
      ) : null}

      {showGhost ? (
        <Box
          layoutId={entities.ghostCard}
          className="htmap-card htmap-ghost-card"
          style={{ position: 'absolute', left: 370, top: CARD_TOP, width: 84, height: 80 }}
        >
          <Label className="htmap-card-visual">tbd…</Label>
        </Box>
      ) : null}

      {showSceneKit ? (
        <Arrow
          layoutId={entities.sceneKitArrow}
          className="htmap-arrow"
          from={{ x: 192, y: 230 }}
          to={{ x: 192, y: 256 }}
        />
      ) : null}

      {showSceneKit ? (
        <Box
          layoutId={entities.sceneKitChip}
          className="htmap-chip htmap-scene-kit-chip"
          style={{ position: 'absolute', left: 137, top: 258, width: 110, height: 30 }}
        >
          scene kit
        </Box>
      ) : null}

      {showVerify ? (
        <Arrow
          layoutId={entities.verifyArrow}
          className="htmap-arrow"
          from={{ x: 344, y: 190 }}
          to={{ x: 480, y: 190 }}
        />
      ) : null}

      {showVerify ? (
        <Box
          layoutId={entities.verifyCard}
          icon={CheckCircle2}
          className="htmap-card htmap-verify-card"
          style={{ position: 'absolute', left: 480, top: CARD_TOP, width: 84, height: 80 }}
        >
          <Label className="htmap-card-title">verify</Label>
        </Box>
      ) : null}

      {/*
        Routed from the skill node (not "you") so the arc and its chip cross
        open canvas space instead of the prompt bubble beneath "you".
      */}
      {showModify ? (
        <Arrow
          layoutId={entities.modifyArc}
          className="htmap-arrow htmap-modify-arc"
          from={{ x: 785, y: 84 }}
          to={{ x: 216, y: 150 }}
        />
      ) : null}

      {showModify ? (
        <Box
          layoutId={entities.modifyChip}
          className="htmap-chip htmap-modify-chip"
          style={{ position: 'absolute', left: 420, top: 110, width: 90, height: 26 }}
        >
          modify
        </Box>
      ) : null}

      {/*
        The reveal frame is a sibling overlay, not a DOM wrapper, so adding it
        on the last step never reparents (and therefore never remounts) every
        entity that already accumulated above it.
      */}
      {showReveal ? (
        <Frame
          layoutId={entities.revealFrame}
          className="htmap-reveal-frame"
          style={{ position: 'absolute', left: 8, top: 0, width: 864, height: 376 }}
        />
      ) : null}

      {showReveal ? (
        <Label layoutId={entities.revealLabel} className="htmap-reveal-label" style={{ position: 'absolute', left: 16, top: 4 }}>
          you're looking at one
        </Label>
      ) : null}
    </SceneLayer>
  )
}
