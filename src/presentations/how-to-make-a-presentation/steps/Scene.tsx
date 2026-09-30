import { MessageSquare, Sparkles, User, Wrench, CheckCircle2, RotateCcw } from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import { entities } from '../entities'
import type { SceneProps } from '../../../presentation-kit'
import type { Payload } from './payload'

/**
 * The single, continuously evolving scene for this presentation. Every step
 * renders this same component with a growing payload — entities are added,
 * never rearranged or redrawn.
 */
export function Scene({ payload }: SceneProps<Payload>) {
  const diagram = (
    <>
      {payload.showConversation ? (
        <div className="htmap-conversation-row">
          <Appear>
            <Box layoutId={entities.you} Icon={User} className="htmap-box htmap-box--you">
              you
            </Box>
          </Appear>
          {payload.showQuestionChip ? (
            <Appear>
              <SymbolChip
                layoutId={entities.questionChip}
                label="what's the topic?"
                Icon={MessageSquare}
                className="htmap-chip"
              />
            </Appear>
          ) : (
            <Appear>
              <Box layoutId={entities.prompt} className="htmap-box htmap-box--prompt">
                a topic
              </Box>
            </Appear>
          )}
          {payload.showSkillNode ? (
            <>
              <Arrow layoutId={entities.conversationArrow} className="htmap-arrow htmap-arrow--conversation" />
              <Appear>
                <Box layoutId={entities.skill} Icon={Sparkles} className="htmap-box htmap-box--skill">
                  skill
                </Box>
              </Appear>
            </>
          ) : null}
          {payload.showModifyArc ? (
            <Appear>
              <Arrow layoutId={entities.modifyArc} className="htmap-arrow htmap-arrow--modify" />
            </Appear>
          ) : null}
        </div>
      ) : null}

      {payload.cards.length > 0 ? (
        <div className="htmap-tray" data-testid="htmap-tray">
          {payload.cards.map((card) => (
            <Appear key={card.id}>
              <Box
                layoutId={card.id}
                className={[
                  'htmap-card',
                  card.ghost ? 'htmap-card--ghost' : '',
                  card.flagged ? 'htmap-card--flagged' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Label className="htmap-card-title">{card.label}</Label>
              </Box>
            </Appear>
          ))}
          {payload.showDepthControl ? (
            <Appear>
              <SymbolChip
                layoutId={entities.depthControl}
                label="partial ↔ full"
                className="htmap-chip htmap-chip--depth"
              />
            </Appear>
          ) : null}
          {payload.showSceneKit ? (
            <Appear>
              <SymbolChip
                layoutId={entities.sceneKit}
                label="scene kit"
                Icon={Wrench}
                className="htmap-chip htmap-chip--scene-kit"
              />
            </Appear>
          ) : null}
          {payload.showVerify ? (
            <Appear>
              <Box layoutId={entities.verify} className="htmap-box htmap-box--verify">
                verify
                {payload.verifyPassed ? (
                  <CheckCircle2 aria-hidden="true" data-testid="htmap-verify-pass" className="htmap-verify-pass" />
                ) : null}
              </Box>
            </Appear>
          ) : null}
        </div>
      ) : null}
    </>
  )

  return (
    <SceneLayer className="htmap-scene">
      {payload.showReveal ? (
        <Appear className="htmap-reveal-appear">
          <Frame className="htmap-reveal-frame">
            <Label className="htmap-reveal-label">
              <RotateCcw aria-hidden="true" className="htmap-reveal-icon" />
              <Emphasis active>you're looking at one</Emphasis>
            </Label>
            <div className="htmap-reveal-body">{diagram}</div>
          </Frame>
        </Appear>
      ) : (
        diagram
      )}
    </SceneLayer>
  )
}
