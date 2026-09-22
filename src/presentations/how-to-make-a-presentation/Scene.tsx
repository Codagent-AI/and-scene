import { Arrow, Box, Emphasis, Frame, Label, SymbolChip } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'

export type SamplePayload = { index: number }
const cards = [
  ['01', 'Title', 'Caption', 'Visual'], ['02', 'Interview', 'Questions', 'Intent'],
  ['03', 'Answer', 'Step card', 'Morph'], ['04', 'New beat', 'Same shapes', 'Extend'],
  ['05', 'Partial', 'Open detail', 'Your call'], ['06', 'Scene kit', 'Shared parts', 'Motion'],
  ['07', 'Build', 'Render', 'Pass'], ['08', 'Edit', 'In place', 'Loop'], ['09', 'Reveal', 'One scene', 'Done'],
]

export function Scene({ payload }: SceneProps<SamplePayload>) {
  const n = payload.index
  return <section className="sample-scene" aria-label="An evolving presentation scene">
    <div className="conversation">
      <Box id="you" className="person you"><span className="eyebrow">THE AUTHOR</span><strong>You</strong><small>one good question</small></Box>
      {n >= 1 && <><Arrow id="conversation-arrow" className="conversation-arrow">↔</Arrow><SymbolChip id="question" className="question-chip">QUESTION {n > 1 ? '· ANSWERED' : '· ASKED'}</SymbolChip><Box id="skill" className="person skill"><span className="eyebrow">YOUR CO-PILOT</span><strong>The skill</strong><small>asks, builds, checks</small></Box></>}
      {n === 0 && <Box id="prompt" className="prompt">“I have a topic…”</Box>}
      {n >= 7 && <Arrow id="modify-arc" className="modify-arc">↘ modify</Arrow>}
      {n >= 4 && <Box id="depth-control" className="depth-control">YOU SET THE DEPTH <b>partial ↔ full</b></Box>}
    </div>
    {n >= 2 && <div className="step-tray" aria-label="Steps accumulate">
      {cards.slice(0, n - 1).map(([num, title, caption, visual], i) => <div className="card-slot" key={num}>
        {i > 0 && <Arrow id={`morph-${num}`} className="morph-link">↗</Arrow>}
        <Box id={`card-${num}`} className={`step-card ${i === n ? 'new-card' : ''} ${n >= 7 && i === 2 ? 'edited-card' : ''}`}>
          <span className="card-number">{num}</span><strong>{title}</strong><span>{caption}</span><small>{visual}</small>
        </Box>
      </div>)}
      {n === 4 && <Emphasis id="ghost-card" className="ghost-card">… room for your next idea</Emphasis>}
    </div>}
    {n >= 5 && <div className="kit-socket"><Arrow id="kit-plug" className="kit-plug">↓</Arrow><Box id="kit" className="kit-label"><i>✳</i><span><b>SCENE KIT</b><small>boxes · arrows · motion</small></span></Box></div>}
    {n >= 6 && <Box id="verify" className="verify-node"><span>BUILD + RENDER</span><b>✓</b><strong>All clear</strong></Box>}
    {n >= 8 && <div data-presentation-allow-overlap=""><Frame id="reveal-frame" className="reveal-frame"><span>MADE WITH THE SKILL</span></Frame></div>}
    <Label className="scene-footnote">A story that keeps its shape while the idea grows.</Label>
  </section>
}
