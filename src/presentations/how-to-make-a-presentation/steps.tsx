import { Check, Layers3, PencilLine, SlidersHorizontal, Sparkles, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import type { SceneProps, Step } from '../../presentation-kit'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../presentation-kit'
import { entities } from './entities'

interface SamplePayload {
  cards: number
  interview?: boolean
  depth?: boolean
  kit?: boolean
  verify?: boolean
  modify?: boolean
  reveal?: boolean
}

const cards = [
  ['1', 'title', 'caption', 'visual'],
  ['2', 'beat', 'morph', '→'],
  ['3', 'rhythm', 'detail', 'scene'],
  ['4', 'finish', 'check', 'share'],
] as const
const cardLayoutIds = [entities.cardOne, entities.cardTwo, entities.cardThree, entities.cardFour]

function SceneConnector({ layoutId, className, children }: { layoutId: string; className: string; children: ReactNode }) {
  return <Arrow layoutId={layoutId} className={className} viewBox="0 0 880 380" preserveAspectRatio="none">{children}</Arrow>
}

export function HowToMakeAPresentationScene({ payload }: SceneProps<SamplePayload>) {
  return (
    <SceneLayer className="how-scene">
      <Box layoutId={entities.you} Icon={UserRound} className="how-person how-you">you</Box>
      <Box layoutId={entities.prompt} className="how-prompt">a topic</Box>

      {payload.interview ? <Appear className="how-interview">
        <Box layoutId={entities.skill} Icon={Sparkles} className="how-person how-skill">skill</Box>
        <SceneConnector layoutId={entities.conversation} className="how-conversation"><path d="M248 70 H636" /></SceneConnector>
        <SymbolChip layoutId={entities.question} className="how-question">one question at a time</SymbolChip>
      </Appear> : null}

      {payload.cards > 0 ? <Appear className="how-tray" aria-label="Accumulating presentation steps">
        <Label layoutId="how-to-make-a-presentation:tray-label" className="how-tray-label">your evolving scene</Label>
        {cards.slice(0, payload.cards).map(([number, ...parts], index) => (
          <Box key={number} layoutId={cardLayoutIds[index]!} className={`how-step-card how-step-card-${index + 1}`}>
            <strong>{number}</strong>
            {parts.map((part) => <span key={part}>{part}</span>)}
          </Box>
        ))}
        {payload.cards > 1 ? <>
          <SceneConnector layoutId={entities.cardLinks} className="how-card-connections"><path d="M195 206 H207 M311 206 H323 M427 206 H439" /></SceneConnector>
          <Label layoutId={entities.morphLabel} className="how-morph-label">what morphs →</Label>
        </> : null}
      </Appear> : null}

      {payload.depth ? <Appear className="how-depth">
        <Box layoutId={entities.ghostCard} className="how-ghost-card">…</Box>
        <SymbolChip layoutId={entities.depthControl} Icon={SlidersHorizontal} className="how-depth-control">partial ↔ full</SymbolChip>
      </Appear> : null}

      {payload.kit ? <Appear className="how-kit-wrap">
        <SceneConnector layoutId="how-to-make-a-presentation:kit-wire" className="how-kit-wire"><path d="M430 253 V323" /></SceneConnector>
        <Box layoutId={entities.sceneKit} Icon={Layers3} className="how-kit">shared scene kit</Box>
      </Appear> : null}

      {payload.verify ? <Appear className="how-verify-wrap">
        <SceneConnector layoutId="how-to-make-a-presentation:verify-wire" className="how-verify-wire"><path d="M543 206 H615" /></SceneConnector>
        <Box layoutId={entities.verify} Icon={Check} className="how-verify">verify <small>build + render</small></Box>
        <SymbolChip layoutId={entities.verificationPass} className="how-pass">passed ✓</SymbolChip>
      </Appear> : null}

      {payload.modify ? <Appear>
        <SceneConnector layoutId={entities.modifyArc} className="how-modify-arc"><path d="M676 88 C760 110 758 262 510 262" /></SceneConnector>
        <Emphasis layoutId={entities.editedFlag} className="how-edited-flag"><PencilLine aria-hidden="true" /> edited</Emphasis>
      </Appear> : null}

      {payload.reveal ? <Appear className="how-reveal-wrap">
        <Frame layoutId={entities.reveal} className="how-reveal-frame"><span>this is the skill’s output</span></Frame>
      </Appear> : null}
    </SceneLayer>
  )
}

// The scene and its serializable step data intentionally live together so every beat
// keeps the same grouped scene component and stable layout identities.
// eslint-disable-next-line react-refresh/only-export-components
export const STEPS = [
  { id: 'topic', era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.', payload: { cards: 0 } },
  { id: 'interview', era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.', payload: { cards: 0, interview: true } },
  { id: 'answers', era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', payload: { cards: 1, interview: true } },
  { id: 'grows', era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.', payload: { cards: 4, interview: true } },
  { id: 'depth', era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', payload: { cards: 4, interview: true, depth: true } },
  { id: 'assemble', era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', payload: { cards: 4, interview: true, depth: true, kit: true } },
  { id: 'verify', era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.', payload: { cards: 4, interview: true, depth: true, kit: true, verify: true } },
  { id: 'loop', era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', payload: { cards: 4, interview: true, depth: true, kit: true, verify: true, modify: true } },
  { id: 'reveal', era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.', payload: { cards: 4, interview: true, depth: true, kit: true, verify: true, modify: true, reveal: true } },
].map((step) => ({ ...step, Scene: HowToMakeAPresentationScene, groupKey: 'how-to-make-a-presentation:scene' })) satisfies readonly Step<SamplePayload>[]
