import {
  Bot,
  CheckCircle2,
  CircleUser,
  GitBranch,
  MessageCircleQuestion,
  PencilLine,
  Puzzle,
} from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, type SceneProps } from '../../presentation-kit'
import { ENTITY } from './entities'

export interface HowToMakeAPresentationPayload {
  /** 1-indexed step number. Every threshold below is `step >= N`, so once an
   * entity appears it stays for the rest of the talk — nothing is ever
   * unmounted, moved, or redrawn. */
  step: number
}

/**
 * The single continuously evolving scene for "How to Use This Skill to Make
 * a Presentation". All nine steps share one groupKey and therefore one
 * mounted instance of this component: only `payload.step` changes as the
 * viewer navigates, so persisting entities morph in place via `layoutId`
 * and newcomers enter with `Appear` without anything else on screen moving.
 */
export function HowToMakeAPresentationScene({ payload }: SceneProps<HowToMakeAPresentationPayload>) {
  const { step } = payload

  return (
    <SceneLayer className="htmap-scene">
      {/* the ask */}
      <Box layoutId={ENTITY.you} icon={CircleUser} className="htmap-node htmap-you">
        <Label>You</Label>
      </Box>
      <Appear>
        <Box layoutId={ENTITY.prompt} className="htmap-bubble htmap-prompt">
          <Label>&ldquo;I want a talk about…&rdquo;</Label>
        </Box>
      </Appear>

      {step >= 2 ? (
        <Appear>
          <Box layoutId={ENTITY.skill} icon={Bot} className="htmap-node htmap-skill">
            <Label>Skill</Label>
          </Box>
        </Appear>
      ) : null}
      {step >= 2 ? (
        <Arrow layoutId={ENTITY.askArrow} d="M120,52 L760,52" className="htmap-arrow htmap-ask-arrow" />
      ) : null}
      {step >= 2 ? (
        <Appear>
          <Box
            layoutId={ENTITY.questionChip}
            icon={MessageCircleQuestion}
            className="htmap-chip htmap-question-chip"
          >
            <Label>one question at a time</Label>
          </Box>
        </Appear>
      ) : null}

      {step >= 5 ? (
        <Appear>
          <Box layoutId={ENTITY.depthControl} className="htmap-chip htmap-depth-control">
            <Label>sketch ↔ full detail</Label>
          </Box>
        </Appear>
      ) : null}

      {/* the gathering */}
      {step >= 3 ? (
        <Appear>
          <Box layoutId={ENTITY.card1} className="htmap-node htmap-card htmap-card-1">
            <Label className="htmap-card-title">Step title</Label>
            <Label className="htmap-card-caption">Step caption</Label>
            <Label className="htmap-card-visual">Step visual</Label>
          </Box>
        </Appear>
      ) : null}

      {step >= 4 ? (
        <Appear>
          <Box layoutId={ENTITY.card2} className="htmap-node htmap-card htmap-card-2">
            <Label className="htmap-card-title">Step title</Label>
            <Label className="htmap-card-caption">Step caption</Label>
            <Label className="htmap-card-visual">Step visual</Label>
            {step >= 8 ? (
              <Emphasis layoutId={ENTITY.editedFlag} className="htmap-edited-flag">
                <PencilLine aria-hidden="true" />
                <Label>edited</Label>
              </Emphasis>
            ) : null}
          </Box>
        </Appear>
      ) : null}
      {step >= 4 ? (
        <Arrow layoutId={ENTITY.cardLink} d="M180,175 L210,175" className="htmap-arrow htmap-card-link" />
      ) : null}

      {step >= 5 ? (
        <Appear>
          <Box layoutId={ENTITY.ghostCard} className="htmap-node htmap-card htmap-ghost-card">
            <Label>…and however many more you sketch</Label>
          </Box>
        </Appear>
      ) : null}

      {/* the build */}
      {step >= 6 ? (
        <Appear>
          <Box layoutId={ENTITY.sceneKitSocket} icon={Puzzle} className="htmap-node htmap-scene-kit-socket">
            <Label>shared scene kit</Label>
          </Box>
        </Appear>
      ) : null}

      {step >= 7 ? (
        <Appear>
          <Box layoutId={ENTITY.verifyNode} icon={CheckCircle2} className="htmap-node htmap-verify-node">
            <Label>build + render verified</Label>
          </Box>
        </Appear>
      ) : null}

      {/* the loop */}
      {step >= 8 ? (
        <Appear>
          <Box layoutId={ENTITY.route} icon={GitBranch} className="htmap-node htmap-route">
            <Label>/how-to-make-a-presentation</Label>
          </Box>
        </Appear>
      ) : null}
      {step >= 8 ? (
        <Arrow
          layoutId={ENTITY.modifyArc}
          d="M800,80 C 840,180 780,240 750,290"
          className="htmap-arrow htmap-modify-arc"
        />
      ) : null}

      {/* the reveal */}
      {step >= 9 ? (
        <Frame layoutId={ENTITY.revealFrame} className="htmap-reveal-frame" />
      ) : null}
      {step >= 9 ? (
        <Appear>
          <Label layoutId={ENTITY.revealLabel} className="htmap-reveal-label">
            You are looking at this skill&rsquo;s own output.
          </Label>
        </Appear>
      ) : null}
    </SceneLayer>
  )
}
