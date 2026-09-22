import { AnimatePresence } from 'motion/react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../presentation-kit'
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
  // Newcomers wait in <Appear> until continuing entities finish their layout morph;
  // AnimatePresence/SceneLayer keep departing entities mounted long enough to fade out.
  return <section className="sample-scene" aria-label="An evolving presentation scene">
    <SceneLayer>
      <div key="conversation" className="conversation">
        <Box id="you" className="person you"><span className="eyebrow">THE AUTHOR</span><strong>You</strong><small>one good question</small></Box>
        <AnimatePresence initial={false}>
          {n >= 1 && <Appear key="skill"><Box id="skill" className="person skill"><span className="eyebrow">YOUR CO-PILOT</span><strong>The skill</strong><small>asks, builds, checks</small></Box></Appear>}
        </AnimatePresence>
        {/* Absolutely positioned overlays stay out of the flex row. */}
        <SceneLayer>
          {n >= 1 && <Appear key="exchange"><Arrow id="conversation-arrow" className="conversation-arrow">↔</Arrow><SymbolChip id="question" className="question-chip">QUESTION {n > 1 ? '· ANSWERED' : '· ASKED'}</SymbolChip></Appear>}
          {n === 0 && <Appear key="prompt"><Box id="prompt" className="prompt">“I have a topic…”</Box></Appear>}
          {n >= 7 && <Appear key="modify"><Arrow id="modify-arc" className="modify-arc">↘ modify</Arrow></Appear>}
          {n >= 4 && <Appear key="depth"><Box id="depth-control" className="depth-control">YOU SET THE DEPTH <b>partial ↔ full</b></Box></Appear>}
        </SceneLayer>
      </div>
      {n >= 2 && <Appear key="tray"><div className="step-tray" aria-label="Steps accumulate">
        <AnimatePresence initial={false}>
          {cards.slice(0, n - 1).map(([num, title, caption, visual], i) => <Appear key={num}><div className="card-slot">
            {i > 0 && <Arrow id={`morph-${num}`} className="morph-link">↗</Arrow>}
            <Box id={`card-${num}`} className={`step-card ${i === n - 2 ? 'new-card' : ''} ${n >= 7 && i === 2 ? 'edited-card' : ''}`}>
              <span className="card-number">{num}</span><strong>{title}</strong><span>{caption}</span><small>{visual}</small>
            </Box>
          </div></Appear>)}
          {n === 4 && <Appear key="ghost"><Emphasis id="ghost-card" className="ghost-card">… room for your next idea</Emphasis></Appear>}
        </AnimatePresence>
      </div></Appear>}
      {n >= 5 && <Appear key="kit"><div className="kit-socket"><Arrow id="kit-plug" className="kit-plug">↓</Arrow><Box id="kit" className="kit-label"><i>✳</i><span><b>SCENE KIT</b><small>boxes · arrows · motion</small></span></Box></div></Appear>}
      {n >= 6 && <Appear key="verify"><Box id="verify" className="verify-node"><span>BUILD + RENDER</span><b>✓</b><strong>All clear</strong></Box></Appear>}
      {n >= 8 && <Appear key="reveal"><div data-presentation-allow-overlap=""><Frame id="reveal-frame" className="reveal-frame"><span>MADE WITH THE SKILL</span></Frame></div></Appear>}
      <Label key="footnote" className="scene-footnote">A story that keeps its shape while the idea grows.</Label>
    </SceneLayer>
  </section>
}
