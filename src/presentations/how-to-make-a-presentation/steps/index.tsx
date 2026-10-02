import type { Step } from '../../../presentation-kit/types'
import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit/nodes'
import { ENTITY, cardId } from '../entities'
import '../style.css'

interface Payload { visible: number }

// The component shares a module with this presentation's static step table.
// eslint-disable-next-line react-refresh/only-export-components
function ReferenceScene({ payload }: { payload: Payload }) {
  const n = payload.visible
  return <SceneLayer className="reference-scene" data-reference-scene="">
    <div className="conversation">
      <Box id={ENTITY.you} className="person you" style={{ left: 110, top: 28 }}><span className="eyebrow">THE AUTHOR</span><strong>You</strong></Box>
      {n >= 2 && <Box id={ENTITY.skill} className="person skill" style={{ left: 618, top: 28 }}><span className="eyebrow">YOUR CO-PILOT</span><strong>Skill</strong></Box>}
      {n >= 1 && <SymbolChip id={ENTITY.prompt} className="prompt" style={{ left: 350, top: 98 }}>“I have a topic…”</SymbolChip>}
      {n >= 2 && <><Arrow id={ENTITY.conversation} className="conversation-arrow" style={{ left: 277, top: 57, width: 326 }}>↔</Arrow><SymbolChip id={ENTITY.question} className="question" data-allow-overlap="" style={{ left: 386, top: 24 }}>one question at a time</SymbolChip></>}
    </div>

    {n >= 3 && <div className="card-tray" data-step-tray="">
      {Array.from({ length: Math.min(n >= 4 ? n - 2 : 1, 5) }, (_, i) => <Box key={cardId(i)} id={cardId(i)} className={`step-card ${n >= 5 && i === 2 ? 'ghost-card' : ''} ${n >= 8 && i === 1 ? 'edited-card' : ''}`} style={{ left: 120 + i * 120, top: 132 }}>
        <span className="card-index">0{i + 1}</span><strong>{['Ask', 'Listen', 'Shape', 'Build', 'Revise'][i]}</strong>
        <span className="card-fields">title · caption · visual</span>
        {n >= 8 && i === 1 && <Label id="how-to.edited" className="edited-tag">EDITED</Label>}
      </Box>)}
      {n >= 4 && <Label id="how-to.morph-note" className="morph-note">same entities · new beats</Label>}
      {n >= 5 && <><SymbolChip id={ENTITY.partial} className="partial-control" style={{ left: 650, top: 232 }}>partial ↔ full</SymbolChip><Label id="how-to.ghost-note" className="ghost-note">room to decide later</Label></>}
      {n >= 6 && <><Arrow id="how-to.kit-plug" className="kit-plug" style={{ left: 402, top: 235, width: 44 }}>↓</Arrow><Box id={ENTITY.kit} className="kit-socket" style={{ left: 304, top: 274 }}>SCENE KIT <span>boxes · arrows · motion</span></Box></>}
      {n >= 7 && <><Arrow id="how-to.verify-link" className="verify-link" style={{ left: 724, top: 166, width: 30 }}>→</Arrow><Box id={ENTITY.verify} className="verify-node" style={{ left: 758, top: 132 }}><span className="eyebrow">BUILD + RENDER</span><strong>✓ Pass</strong></Box></>}
    </div>}

    {n >= 8 && <div className="modify-arc"><Arrow id={ENTITY.modify} className="modify-arrow" data-allow-overlap="" style={{ left: 274, top: 92, width: 54 }}>↙</Arrow><span>point · edit · keep going</span></div>}
    {n >= 9 && <Frame id={ENTITY.reveal} className="reveal-frame"><span>MADE WITH THE SKILL</span></Frame>}
    {n < 9 && <Emphasis id="how-to.scene-caption" className="scene-footnote">A presentation takes shape one decision at a time.</Emphasis>}
  </SceneLayer>
}

const content = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', 'You’re looking at one', 'This presentation was built exactly this way. Thanks for watching.'],
] as const

export const STEPS: Step<Payload>[] = content.map(([era, title, caption], index) => ({
  id: `step-${index + 1}`, era, title, caption, groupKey: 'reference-scene', payload: { visible: index + 1 }, Scene: ReferenceScene,
}))
