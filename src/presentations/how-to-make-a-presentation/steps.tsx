/* The scene and its data intentionally share this module so every beat stays auditable together. */
/* eslint-disable react-refresh/only-export-components */
import { Appear, Arrow, Box, Frame, Label, SceneLayer, SymbolChip, type SceneProps, type Step } from '../../presentation-kit'
import { entities } from './entities'

export type SamplePayload = {
  cards: number
  interviewed?: boolean
  depth?: boolean
  assembled?: boolean
  verified?: boolean
  modified?: boolean
  revealed?: boolean
}

const cards = [
  { id: entities.cardOne, title: '1. topic', detail: 'title · caption · visual' },
  { id: entities.cardTwo, title: '2. look', detail: 'same shapes · new beat' },
  { id: entities.cardThree, title: '3. build', detail: 'what morphs →' },
  { id: entities.cardFour, title: '4. reveal', detail: 'one evolving scene' },
] as const

function StepCard({ card, index, edited }: { card: (typeof cards)[number]; index: number; edited: boolean }) {
  return (
    <Box
      layoutId={card.id}
      className="how-card"
      style={{ left: 48 + index * 152, position: 'absolute', top: 218 }}
    >
      <strong>{card.title}</strong>
      <span>{card.detail}</span>
      {edited && index === 2 ? <SymbolChip layoutId={entities.edited} className="how-edited">edited</SymbolChip> : null}
    </Box>
  )
}

function SampleScene({ payload }: SceneProps<SamplePayload>) {
  const interviewed = payload.interviewed || payload.cards > 0
  return (
    <SceneLayer className="how-scene">
      <Box layoutId={entities.you} className="how-person" style={{ left: 74, position: 'absolute', top: 58 }}>you</Box>
      <Box layoutId={entities.prompt} className="how-prompt" style={{ left: 184, position: 'absolute', top: 42 }}>a topic</Box>
      {interviewed ? (
        <Appear className="how-appear">
          <Box layoutId={entities.skill} className="how-skill" style={{ left: 620, position: 'absolute', top: 58 }}>skill</Box>
          <Arrow layoutId={entities.conversation} className="how-conversation" viewBox="0 -10 100 20" style={{ left: 306, position: 'absolute', top: 86, width: 265 }} />
          <SymbolChip layoutId={entities.question} className="how-question" style={{ left: 383, position: 'absolute', top: 42 }}>one question at a time</SymbolChip>
        </Appear>
      ) : null}
      {payload.cards > 0 ? <Frame layoutId={entities.tray} className="how-tray" style={{ left: 28, position: 'absolute', top: 190, width: 672 }} /> : null}
      {cards.slice(0, payload.cards).map((card, index) => <StepCard key={card.id} card={card} index={index} edited={Boolean(payload.modified)} />)}
      {payload.depth ? (
        <Appear className="how-appear">
          <Box layoutId={entities.ghost} className="how-ghost" style={{ left: 656, position: 'absolute', top: 218 }}>…</Box>
          <SymbolChip layoutId={entities.depth} className="how-depth" style={{ left: 54, position: 'absolute', top: 132 }}>you: partial ↔ full</SymbolChip>
        </Appear>
      ) : null}
      {payload.assembled ? (
        <Appear className="how-appear">
          <Box layoutId={entities.sceneKit} className="how-kit" style={{ left: 266, position: 'absolute', top: 326 }}>scene-kit socket · boxes + arrows + motion</Box>
        </Appear>
      ) : null}
      {payload.verified ? (
        <Appear className="how-appear">
          <Box layoutId={entities.verify} className="how-verify" style={{ left: 714, position: 'absolute', top: 218 }}>verify</Box>
          <Label layoutId={entities.pass} className="how-pass" style={{ left: 722, position: 'absolute', top: 270 }}>build + render ✓</Label>
        </Appear>
      ) : null}
      {payload.modified ? (
        <Appear className="how-appear">
          <Arrow layoutId={entities.modify} className="how-modify" viewBox="0 -10 100 20" style={{ left: 154, position: 'absolute', top: 150, transform: 'rotate(55deg)', width: 132 }} />
          <Label layoutId="how-to-make-a-presentation:modify-label" className="how-modify-label" style={{ left: 238, position: 'absolute', top: 162 }}>point, ask, edit in place</Label>
        </Appear>
      ) : null}
      {payload.revealed ? (
        <Appear className="how-appear">
          <Frame layoutId={entities.reveal} className="how-reveal" style={{ left: 10, position: 'absolute', top: 10, width: 858 }}>you are looking at one</Frame>
        </Appear>
      ) : null}
    </SceneLayer>
  )
}

const sharedScene = {
  groupKey: 'how-to-make-a-presentation',
  Scene: SampleScene,
} as const

const allCards = { cards: 4 } as const
const depthSelected = { ...allCards, depth: true } as const
const assembledScene = { ...depthSelected, assembled: true } as const
const verifiedScene = { ...assembledScene, verified: true } as const
const modifiedScene = { ...verifiedScene, modified: true } as const

export const STEPS: readonly Step<SamplePayload>[] = [
  { id: 'topic', era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.', ...sharedScene, payload: { cards: 0 } },
  { id: 'interview', era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.', ...sharedScene, payload: { cards: 0, interviewed: true } },
  { id: 'answers', era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', ...sharedScene, payload: { cards: 1 } },
  { id: 'growth', era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.', ...sharedScene, payload: allCards },
  { id: 'depth', era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', ...sharedScene, payload: depthSelected },
  { id: 'assemble', era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', ...sharedScene, payload: assembledScene },
  { id: 'verify', era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.', ...sharedScene, payload: verifiedScene },
  { id: 'loop', era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', ...sharedScene, payload: modifiedScene },
  { id: 'reveal', era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.', ...sharedScene, payload: { ...modifiedScene, revealed: true } },
]
