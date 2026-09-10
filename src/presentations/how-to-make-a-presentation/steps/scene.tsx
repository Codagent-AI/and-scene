import { Arrow, Appear, Box, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../../presentation-kit'
import { Check, MessageCircleQuestion, Sparkles, WandSparkles } from 'lucide-react'
import { entities } from '../entities'

export type ReferencePayload = {
  cards: number
  skill?: boolean
  question?: boolean
  tray?: boolean
  depth?: boolean
  kit?: boolean
  verify?: boolean
  modify?: boolean
  reveal?: boolean
}

const cardLabels = ['title · caption · visual', 'next beat', 'story grows', 'refine', 'publish']

export function ReferenceScene({ payload }: SceneProps<ReferencePayload>) {
  return (
    <SceneLayer className="reference-scene">
      <svg className="reference-wires" viewBox="0 0 880 380" aria-hidden="true">
        {payload.skill && <Arrow id={entities.conversation} d="M 186 75 C 253 75 283 75 347 75" className="reference-line" />}
        {payload.tray && <Arrow id={entities.tray} d="M 128 172 H 750" className="reference-tray-line" />}
        {payload.cards > 1 && <Arrow id={`${entities.card(1)}:link`} d="M 245 212 H 262" className="reference-link" />}
        {payload.cards > 2 && <Arrow id={`${entities.card(2)}:link`} d="M 365 212 H 382" className="reference-link" />}
        {payload.cards > 3 && <Arrow id={`${entities.card(3)}:link`} d="M 485 212 H 502" className="reference-link" />}
        {payload.modify && <Arrow id={entities.modify} d="M 124 102 C 80 170 112 302 267 292" className="reference-modify-line" />}
      </svg>
      <Box id={entities.you} className="reference-person reference-you">
        <strong>you</strong>
        <span>topic in hand</span>
      </Box>
      <Box id={entities.prompt} className="reference-prompt">“I have an idea.”</Box>
      {payload.skill && (
        <Appear className="reference-enter">
          <SymbolChip id={entities.skill} icon={Sparkles} className="reference-person reference-skill">
            <strong>the skill</strong>
            <span>asks, listens, builds</span>
          </SymbolChip>
        </Appear>
      )}
      {payload.question && (
        <Appear className="reference-enter">
          <Label id={entities.question} className="reference-question">
            <MessageCircleQuestion size={14} /> one question at a time
          </Label>
        </Appear>
      )}
      {payload.tray && (
        <Appear className="reference-enter">
          <Label id={`${entities.tray}:label`} className="reference-tray-label">answers become a route</Label>
        </Appear>
      )}
      {Array.from({ length: payload.cards }, (_, index) => (
        <Box key={index} id={entities.card(index + 1)} className={`reference-card reference-card-${index + 1}`}>
          <span className="reference-card-number">{String(index + 1).padStart(2, '0')}</span>
          <strong>{index === 0 ? 'step card' : cardLabels[index] ?? 'next beat'}</strong>
          <small>{index === 0 ? cardLabels[0] : 'same entity, next state'}</small>
        </Box>
      ))}
      {payload.depth && (
        <Appear className="reference-enter">
          <Box id={entities.ghost} className="reference-ghost">… unspecified beats</Box>
        </Appear>
      )}
      {payload.depth && (
        <Appear className="reference-enter">
          <Label id={entities.depth} className="reference-depth">partial <span>↔</span> full</Label>
        </Appear>
      )}
      {payload.kit && (
        <Appear className="reference-enter">
          <SymbolChip id={entities.kit} icon={WandSparkles} className="reference-kit">
            shared scene kit <span>plugs into the story</span>
          </SymbolChip>
        </Appear>
      )}
      {payload.verify && (
        <Appear className="reference-enter">
          <Box id={entities.verify} className="reference-verify">
            <Check size={17} /> build + render <strong>pass</strong>
          </Box>
        </Appear>
      )}
      {payload.modify && (
        <Appear className="reference-enter">
          <Label id={entities.edited} className="reference-edited">edited in place</Label>
        </Appear>
      )}
      {payload.reveal && (
        <Appear className="reference-enter">
          <Frame id={entities.reveal} className="reference-reveal"><span>this is the output</span></Frame>
        </Appear>
      )}
    </SceneLayer>
  )
}
