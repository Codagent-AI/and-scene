import type { ReactNode } from 'react'
import type { SceneProps } from '../../presentation-kit/types.ts'
import {
  Appear,
  Arrow,
  Box,
  Emphasis,
  Frame,
  Label,
  SceneLayer,
  SymbolChip,
} from '../../presentation-kit/index.ts'
import { entities } from './entities.ts'
import type { ReferencePayload } from './steps/index.tsx'

function Newcomer({ id, newcomers, children }: { id: string; newcomers: readonly string[]; children: ReactNode }) {
  return <Appear isNew={newcomers.includes(id)}>{children}</Appear>
}

export function ReferenceScene({ payload }: SceneProps<ReferencePayload>) {
  const cardEntities = payload.cards.map((card) => ({ ...card, id: entities.cards[card.index - 1] }))

  return (
    <SceneLayer className={`reference-scene reference-scene--${payload.state}`}>
      {payload.showReveal ? (
        <Frame id={entities.reveal} className="reference-reveal-frame" dataAttributes={{ 'data-reveal-frame': true, 'data-presentation-allow-overlap': true }}>
          <Label id="reference-reveal-label" className="reference-reveal-label">self-reference</Label>
        </Frame>
      ) : null}

      {payload.showYou ? (
        <Newcomer id={entities.you} newcomers={payload.newcomers}>
          <Box id={entities.you} className="reference-entity reference-you" dataAttributes={{ 'data-entity-role': 'you' }}>
            <span className="reference-node-kicker">you</span>
            <strong>the ask</strong>
          </Box>
        </Newcomer>
      ) : null}
      {payload.showPrompt ? (
        <Newcomer id={entities.prompt} newcomers={payload.newcomers}>
          <Box id={entities.prompt} className="reference-entity reference-prompt">
            <span>Make a presentation about…</span>
            <Emphasis id="reference-prompt-spark" className="reference-prompt-spark">✦</Emphasis>
          </Box>
        </Newcomer>
      ) : null}
      {payload.showSkill ? (
        <Newcomer id={entities.skill} newcomers={payload.newcomers}>
          <Box id={entities.skill} className="reference-entity reference-skill" dataAttributes={{ 'data-entity-role': 'skill' }}>
            <span className="reference-node-kicker">skill</span>
            <strong>and-scene</strong>
          </Box>
        </Newcomer>
      ) : null}
      {payload.showConversationArrow ? (
        <Arrow id={entities.conversationArrow} className="reference-conversation-arrow">↔</Arrow>
      ) : null}
      {payload.showQuestion ? (
        <Newcomer id={entities.question} newcomers={payload.newcomers}>
          <SymbolChip id={entities.question} className="reference-question">one question at a time</SymbolChip>
        </Newcomer>
      ) : null}

      {payload.showTray ? (
        <Box id={entities.tray} className="reference-tray" dataAttributes={{ 'data-tray': true, 'data-presentation-allow-overlap': true }}>
          <Label id="reference-tray-label" className="reference-tray-label">the evolving scene</Label>
        </Box>
      ) : null}
      {cardEntities.map((card) => (
        <Newcomer key={card.id} id={card.id} newcomers={payload.newcomers}>
          <Box
            id={card.id}
            className={`reference-entity reference-card reference-card--${card.index}`}
            dataAttributes={{ 'data-card-index': card.index }}
          >
            <span className="reference-card-number">0{card.index}</span>
            <strong>{card.title}</strong>
            <span>{card.caption}</span>
            <small>{card.visual}</small>
          </Box>
        </Newcomer>
      ))}
      {payload.showMorph ? (
        <Arrow id={entities.morph} className="reference-morph-arrow" dataAttributes={{ 'data-morph-link': true }}>↗ morphs</Arrow>
      ) : null}
      {payload.showGhost ? (
        <Newcomer id={entities.ghost} newcomers={payload.newcomers}>
          <Box id={entities.ghost} className="reference-entity reference-ghost-card">
            <span>…</span>
            <strong>your depth</strong>
          </Box>
        </Newcomer>
      ) : null}
      {payload.showDepth ? (
        <Newcomer id={entities.depth} newcomers={payload.newcomers}>
          <SymbolChip id={entities.depth} className="reference-depth">partial ↔ full</SymbolChip>
        </Newcomer>
      ) : null}
      {payload.showSceneKit ? (
        <Newcomer id={entities.sceneKit} newcomers={payload.newcomers}>
          <Box id={entities.sceneKit} className="reference-entity reference-scene-kit">
            <span className="reference-node-kicker">socket</span>
            <strong>scene kit</strong>
            <span>boxes · arrows · motion</span>
          </Box>
        </Newcomer>
      ) : null}
      {payload.showVerify ? (
        <Newcomer id={entities.verify} newcomers={payload.newcomers}>
          <Box id={entities.verify} className="reference-entity reference-verify">
            <span className="reference-node-kicker">pipeline</span>
            <strong>verify</strong>
            <span>build + render</span>
          </Box>
        </Newcomer>
      ) : null}
      {payload.showPass ? (
        <Newcomer id={entities.pass} newcomers={payload.newcomers}>
          <Emphasis id={entities.pass} className="reference-pass" dataAttributes={{ 'data-pass': true }}>✓ pass</Emphasis>
        </Newcomer>
      ) : null}
      {payload.showModify ? (
        <Newcomer id={entities.modify} newcomers={payload.newcomers}>
          <Arrow id={entities.modify} className="reference-modify-arc">⌒ edit in place</Arrow>
        </Newcomer>
      ) : null}
      {payload.showModified ? (
        <Newcomer id={entities.modified} newcomers={payload.newcomers}>
          <Emphasis id={entities.modified} className="reference-modified" dataAttributes={{ 'data-modified-card': true, 'data-presentation-allow-overlap': true }}>changed</Emphasis>
        </Newcomer>
      ) : null}
    </SceneLayer>
  )
}
