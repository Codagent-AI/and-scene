/* eslint-disable react-refresh/only-export-components */
import type { CSSProperties } from 'react'
import type { Step } from '../../presentation-kit'
import { Arrow, Box, Frame, Label, SceneLayer, SymbolChip } from '../../presentation-kit'
import { ENTITY } from './entities'

type Payload = { cards: number; skill: boolean; question: boolean; partial: boolean; kit: boolean; verify: boolean; modify: boolean; reveal: boolean }

const cardContent = [
  ['01', 'Topic'], ['02', 'Look'], ['03', 'Beats'], ['04', 'Scene'], ['05', 'Polish'],
]
const pos = (left: number, top: number, width: number, height: number): CSSProperties => ({ position: 'absolute', left, top, width, height })

function Scene({ payload }: { payload: Payload }) {
  return <SceneLayer className="sample-scene"><div className="sample-scene-content">
    <div className="sample-conversation" style={pos(50, 25, 780, 100)}>
      <Box entityId={ENTITY.you} className="sample-person" style={pos(0, 10, 150, 62)}><Label entityId="sample-you-label">you</Label><span className="sample-sub">the person with an idea</span></Box>
      <Arrow entityId={ENTITY.conversation} className="sample-link" style={pos(167, 26, 78, 25)}>↔</Arrow>
      {payload.skill && <Box entityId={ENTITY.skill} className="sample-skill" style={pos(260, 10, 170, 62)}><Label entityId="sample-skill-label">the skill</Label><span className="sample-sub">your scene partner</span></Box>}
      {!payload.skill && <Box entityId={ENTITY.prompt} className="sample-prompt" style={pos(260, 10, 315, 62)}><Label entityId="sample-prompt-label">“I have a topic…”</Label></Box>}
      {payload.question && <SymbolChip className="sample-question" style={pos(166, -5, 88, 24)}>one question</SymbolChip>}
    </div>

    {payload.cards > 0 && <div className="sample-tray" style={pos(50, 150, 780, 155)}>
      <p className="sample-tray-label">THE STORY TAKES SHAPE</p>
      {cardContent.slice(0, payload.cards).map(([number, label], index) => <Box key={number} entityId={`sample-card-${number}`} className={`sample-card ${payload.modify && index === 2 ? 'sample-card--edited' : ''}`} style={pos((index % 5) * 151, 24 + Math.floor(index / 5) * 64, 137, 52)}>
        <span className="sample-card__number">{number}</span><span className="sample-card__title">{label}</span>
        <span className="sample-card__meta">title · caption · visual</span>
      </Box>)}
      {payload.cards >= 3 && <Arrow entityId="sample-morph-link" className="sample-morph" style={pos(303, 83, 78, 20)}>morphs</Arrow>}
      {payload.kit && <>
        <div className="sample-socket" style={pos(18, 133, 230, 15)} />
        <Box entityId={ENTITY.kit} className="sample-kit" style={pos(18, 146, 250, 40)}><span>SCENE KIT</span><small>shared boxes · arrows · motion</small></Box>
      </>}
      {payload.verify && <>
        <Arrow entityId="sample-verify-arrow" className="sample-verify-arrow" style={pos(620, 89, 45, 22)}>→</Arrow>
        <Box entityId={ENTITY.verify} className="sample-verify" style={pos(665, 82, 105, 44)}><span>✓ PASS</span><small>build + render</small></Box>
      </>}
    </div>}

    {payload.partial && <>
      <div className="sample-partial" style={pos(77, 101, 104, 34)}><span>partial</span><span className="sample-partial__switch">↔</span><span>full</span></div>
      <div className="sample-ghost" style={pos(660, 22, 135, 54)}>… next beats</div>
    </>}
    {payload.modify && <>
      <div className="sample-modify-arc" aria-hidden="true" />
      <SymbolChip className="sample-modify-chip" style={pos(735, 128, 92, 25)}>edit in place</SymbolChip>
    </>}
    {payload.reveal && <Frame data-entity-id={ENTITY.reveal} data-presentation-allow-overlap="" className="sample-reveal" style={pos(18, 8, 844, 335)}><span>BUILT WITH THE SAME SKILL</span></Frame>}
  </div></SceneLayer>
}

const payload = (cards: number, flags: Partial<Payload> = {}): Payload => ({ cards, skill: cards > 0, question: false, partial: false, kit: false, verify: false, modify: false, reveal: false, ...flags })
const groupKey = 'one-evolving-scene'
export const STEPS: readonly Step<Payload>[] = [
  { id: 'topic', era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.', groupKey, payload: payload(0), Scene },
  { id: 'interview', era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.', groupKey, payload: payload(0, { skill: true, question: true }), Scene },
  { id: 'answers', era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', groupKey, payload: payload(1), Scene },
  { id: 'deck', era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.', groupKey, payload: payload(3), Scene },
  { id: 'depth', era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', groupKey, payload: payload(3, { partial: true }), Scene },
  { id: 'assemble', era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', groupKey, payload: payload(4, { kit: true }), Scene },
  { id: 'verify', era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.', groupKey, payload: payload(5, { kit: true, verify: true }), Scene },
  { id: 'modify', era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', groupKey, payload: payload(5, { kit: true, verify: true, modify: true }), Scene },
  { id: 'reveal', era: 'the reveal', title: 'You’re looking at one', caption: 'This presentation was built exactly this way. Thanks for watching.', groupKey, payload: payload(5, { kit: true, verify: true, modify: true, reveal: true }), Scene },
]
