import { Check, ClipboardPenLine, Component, MessageCircleQuestion, Sparkles, UserRound, WandSparkles } from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entities } from '../entities'

export interface SamplePayload {
  phase: number
}

const cards = [
  { id: entities.cardOne, title: '01', body: 'title · caption · visual', className: 'sample-card-one' },
  { id: entities.cardTwo, title: '02', body: 'next beat · morph', className: 'sample-card-two' },
  { id: entities.cardThree, title: '03', body: 'story keeps growing', className: 'sample-card-three' },
] as const

function StepCard({ card }: { card: (typeof cards)[number] }) {
  return (
    <Box layoutId={card.id} className={`sample-step-card ${card.className}`}>
      <strong>step {card.title}</strong>
      <span>{card.body}</span>
    </Box>
  )
}

export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  const { phase } = payload
  const cardCount = phase < 4 ? 1 : 3

  return (
    <SceneLayer className="sample-scene">
      <Box layoutId={entities.you} className="sample-person sample-you" Icon={UserRound}>you</Box>
      <Box layoutId={entities.prompt} className="sample-prompt" Icon={Sparkles}>a topic</Box>

      {phase >= 2 && (
        <Appear key="skill">
          <Box layoutId={entities.skill} className="sample-person sample-skill" Icon={WandSparkles}>skill</Box>
          <Arrow layoutId={entities.conversation} className="sample-conversation">↔</Arrow>
          <SymbolChip layoutId={entities.question} className="sample-question" Icon={MessageCircleQuestion}>
            one question at a time
          </SymbolChip>
        </Appear>
      )}

      {phase >= 3 && (
        <Appear key="tray" className="sample-tray">
          <Label layoutId={entities.tray} className="sample-tray-label">answers become an evolving scene</Label>
          <div className="sample-tray-track" aria-hidden="true" />
          {cards.slice(0, cardCount).map((card) => <StepCard key={card.id} card={card} />)}
          {phase >= 4 && (
            <Arrow layoutId={`${entities.cardOne}:morph`} className="sample-morph sample-morph-one">morphs</Arrow>
          )}
          {phase >= 4 && (
            <Arrow layoutId={`${entities.cardTwo}:morph`} className="sample-morph sample-morph-two">morphs</Arrow>
          )}
        </Appear>
      )}

      {phase >= 5 && (
        <Appear key="depth">
          <Box layoutId={entities.ghostCard} className="sample-ghost-card">… your outline</Box>
          <SymbolChip layoutId={entities.depth} className="sample-depth" Icon={ClipboardPenLine}>partial ↔ full</SymbolChip>
        </Appear>
      )}

      {phase >= 6 && (
        <Appear key="kit">
          <Box layoutId={entities.sceneKit} className="sample-kit" Icon={Component}>shared scene kit</Box>
        </Appear>
      )}

      {phase >= 7 && (
        <Appear key="verify">
          <Arrow layoutId={`${entities.verify}:chain`} className="sample-verify-chain">→</Arrow>
          <Box layoutId={entities.verify} className="sample-verify" Icon={Check}>build + render <b>pass</b></Box>
        </Appear>
      )}

      {phase >= 8 && (
        <Appear key="modify">
          <Arrow layoutId={entities.modify} className="sample-modify-arc">↘ edit in place</Arrow>
          <span data-presentation-allow-overlap>
            <Emphasis layoutId={`${entities.cardTwo}:edited`} className="sample-edited">edited</Emphasis>
          </span>
        </Appear>
      )}

      {phase >= 9 && (
        <Appear key="reveal">
          <div data-presentation-allow-overlap>
            <Frame layoutId={entities.reveal} className="sample-reveal-frame">
              <span>this is the skill’s own output</span>
            </Frame>
          </div>
        </Appear>
      )}
    </SceneLayer>
  )
}
