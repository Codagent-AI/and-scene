import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { ENTITIES } from '../entities'

/**
 * One continuously evolving scene shared by all nine steps (same groupKey +
 * Scene component). Every step only flips more flags to `true`; nothing here
 * is ever hidden or rearranged once it appears.
 */
export interface ScenePayload {
  showPrompt: boolean
  showSkill: boolean
  showQuestionChip: boolean
  cardCount: number
  showGhostCard: boolean
  showPartialControl: boolean
  showKitSocket: boolean
  showVerifyNode: boolean
  verifyPassed: boolean
  showModifyArc: boolean
  editedCardFlagged: boolean
  showRevealFrame: boolean
}

interface StepCardProps {
  layoutId: string
  cardTitle: string
  cardCaption: string
  cardVisual: string
  flagged?: boolean
}

function StepCard({ layoutId, cardTitle, cardCaption, cardVisual, flagged }: StepCardProps) {
  return (
    <Box layoutId={layoutId} className={`htmasp-step-card${flagged ? ' htmasp-step-card--edited' : ''}`}>
      <Label className="htmasp-step-card-title">{cardTitle}</Label>
      <Label className="htmasp-step-card-caption">{cardCaption}</Label>
      <Label className="htmasp-step-card-visual">{cardVisual}</Label>
      {flagged ? <Label className="htmasp-step-card-edited-tag">edited</Label> : null}
    </Box>
  )
}

function GhostCard() {
  return (
    <Box layoutId={ENTITIES.ghostCard} className="htmasp-ghost-card">
      <Label className="htmasp-ghost-label">unspecified step</Label>
    </Box>
  )
}

function VerifyNode({ passed }: { passed: boolean }) {
  return (
    <Box layoutId={ENTITIES.verifyNode} className="htmasp-verify-node">
      <Label className="htmasp-verify-label">verify</Label>
      {passed ? (
        <Emphasis layoutId={ENTITIES.verifyCheck} active className="htmasp-verify-check">
          pass
        </Emphasis>
      ) : null}
    </Box>
  )
}

export function Scene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer className="htmasp-scene">
      <div className="htmasp-conversation-row">
        <div className="htmasp-you-column">
          <Box layoutId={ENTITIES.you} className="htmasp-you-box">
            you
          </Box>
          {payload.showPrompt ? (
            <Appear className="htmasp-prompt-wrap">
              <Label layoutId={ENTITIES.prompt} className="htmasp-prompt-bubble">
                &ldquo;build me a presentation&rdquo;
              </Label>
            </Appear>
          ) : null}
          {payload.showPartialControl ? (
            <Appear className="htmasp-partial-control-wrap">
              <SymbolChip layoutId={ENTITIES.partialControl} className="htmasp-partial-control">
                partial ↔ full
              </SymbolChip>
            </Appear>
          ) : null}
        </div>

        {payload.showSkill ? (
          <>
            <div className="htmasp-conversation-link">
              {payload.showQuestionChip ? (
                <Appear className="htmasp-question-chip-wrap">
                  <SymbolChip layoutId={ENTITIES.questionChip} className="htmasp-question-chip">
                    topic? style? steps?
                  </SymbolChip>
                </Appear>
              ) : null}
              <Arrow layoutId={ENTITIES.conversationArrow} className="htmasp-conversation-arrow" />
            </div>
            <Appear className="htmasp-skill-wrap">
              <Box layoutId={ENTITIES.skill} className="htmasp-skill-box">
                skill
              </Box>
            </Appear>
          </>
        ) : null}
      </div>

      {payload.showModifyArc ? (
        <Appear className="htmasp-modify-arc-wrap">
          <Arrow layoutId={ENTITIES.modifyArc} className="htmasp-modify-arc" />
        </Appear>
      ) : null}

      {payload.cardCount > 0 ? (
        <div className="htmasp-tray-row">
          <StepCard
            layoutId={ENTITIES.card1}
            cardTitle="You have a topic"
            cardCaption="the ask"
            cardVisual="you + prompt"
          />
          {payload.cardCount >= 2 ? (
            <StepCard
              layoutId={ENTITIES.card2}
              cardTitle="The skill interviews you"
              cardCaption="the ask"
              cardVisual="you ↔ skill"
              flagged={payload.editedCardFlagged}
            />
          ) : null}
          {payload.cardCount >= 3 ? (
            <StepCard
              layoutId={ENTITIES.card3}
              cardTitle="Answers become steps"
              cardCaption="the gathering"
              cardVisual="step card"
            />
          ) : null}
          {payload.showGhostCard ? <GhostCard /> : null}
          {payload.showVerifyNode ? <VerifyNode passed={payload.verifyPassed} /> : null}
        </div>
      ) : null}

      {payload.showKitSocket ? (
        <Appear className="htmasp-kit-socket-wrap">
          <SymbolChip layoutId={ENTITIES.kitSocket} className="htmasp-kit-socket">
            scene kit
          </SymbolChip>
        </Appear>
      ) : null}

      {payload.showRevealFrame ? (
        <Frame layoutId={ENTITIES.revealFrame} className="htmasp-reveal-frame">
          <Label className="htmasp-reveal-label">you&rsquo;re looking at one</Label>
        </Frame>
      ) : null}
    </SceneLayer>
  )
}
