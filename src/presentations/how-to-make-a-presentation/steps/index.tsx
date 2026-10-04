/* eslint-disable react-refresh/only-export-components */
import type { Step } from '../../../presentation-kit'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import { ENTITY } from '../entities'

type Payload = { beat: number }
function Scene({ payload: { beat } }: { payload: Payload }) {
  const cards = [ENTITY.cardOne, ENTITY.cardTwo, ENTITY.cardThree, ENTITY.cardFour, ENTITY.cardFive, ENTITY.cardSix]
  return <SceneLayer className="how-scene">
    <Box id={ENTITY.you} className="person you" style={{ left: 86, top: 22 }}><Label>you</Label></Box>
    <Box id={ENTITY.prompt} className="prompt" style={{ left: 176, top: 25 }}><Label>a topic?</Label></Box>
    {beat >= 1 && <>
      <Box id={ENTITY.skill} className="person skill" style={{ left: 652, top: 22 }}><Label>skill</Label></Box>
      <Arrow id={ENTITY.conversation} className="conversation" style={{ left: 250, top: 51, width: 390 }}>↔</Arrow>
      <SymbolChip id={ENTITY.question} className="question" style={{ left: 398, top: 17 }}>one question at a time</SymbolChip>
    </>}
    {beat >= 2 && <div className="tray" aria-label="Accumulating step cards">
      {cards.slice(0, beat === 2 ? 1 : beat === 3 ? 4 : 6).map((id, index) => <Appear key={id} delay={0}>
        <Box id={id} className={`step-card ${beat === 7 && index === 3 ? 'edited' : ''}`} style={{ left: 26 + index * 100, top: 26 }}>
          <span className="card-num">0{index + 1}</span><strong>{['title', 'caption', 'visual', 'morph', 'story', 'next'][index]}</strong>
          {index < 3 && <small>{['the point', 'the narration', 'what appears'][index]}</small>}
          {index < cards.slice(0, beat === 2 ? 1 : beat === 3 ? 4 : 6).length - 1 && <span className="card-link">→</span>}
        </Box>
      </Appear>)}
    </div>}
    {beat >= 4 && <>
      <Box id={ENTITY.ghost} className="step-card ghost" style={{ left: 42, top: 250 }}><strong>…</strong><small>your call</small></Box>
      <SymbolChip id={ENTITY.depth} className="depth" style={{ left: 84, top: 78 }}>you choose: a sketch ⇄ the full story</SymbolChip>
    </>}
    {beat >= 5 && <>
      <Arrow id={ENTITY.kit} className="kit-wire" style={{ left: 423, top: 234, height: 34 }} />
      <Box className="kit" style={{ left: 330, top: 268 }}><span className="socket" aria-hidden="true" /><Label>shared scene kit</Label></Box>
    </>}
    {beat >= 6 && <>
      <Arrow id={ENTITY.verifyLink} className="verify-connector" style={{ left: 644, top: 172, width: 16 }}>→</Arrow>
      <Box id={ENTITY.verify} className="verify" style={{ left: 660, top: 130 }}><Label>✓ &nbsp; build + render pass</Label></Box>
    </>}
    {beat >= 7 && <>
      <Arrow id={ENTITY.modify} className="modify-arc" style={{ left: 400, top: 91, width: 300 }}>↘  edit a beat, keep the scene</Arrow>
      <Emphasis id={ENTITY.edited} className="edit-flag" style={{ left: 356, top: 117 }}>edited</Emphasis>
    </>}
    {beat >= 8 && <Frame id={ENTITY.reveal} className="reveal" style={{ left: 19, top: 7, width: 842, height: 344 }}><span>YOU’RE LOOKING AT AN EXAMPLE</span></Frame>}
  </SceneLayer>
}

const outline = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
] as const

export const STEPS: Step<Payload>[] = outline.map(([era, title, caption], beat) => ({
  id: `how-to-step-${beat + 1}`, era, title, caption, groupKey: 'how-to-evolving-scene', Scene, payload: { beat },
}))
