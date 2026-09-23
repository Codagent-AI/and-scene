import type { ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entity } from '../entities'
import './scene.css'

export interface ReferencePayload { through: number }

const cards = [
  ['Topic', 'prompt + intent'], ['Interview', 'question + answer'], ['First step', 'title · caption · visual'],
  ['Grow the scene', 'same shapes, next beat'], ['Choose depth', 'partial ↔ full'], ['Assemble', 'shared scene kit'],
  ['Edit in place', 'preserve stable entities'], ['Reveal', 'made with the skill'],
]

export function ReferenceScene({ payload }: SceneProps<ReferencePayload>) {
  const through = payload.through
  const cardCount = through < 2 ? 0 : through === 2 ? 1 : through === 3 ? 3 : through === 4 ? 5 : through <= 6 ? 6 : through === 7 ? 7 : 8
  return <SceneLayer className="reference-scene">
    <div className="conversation">
      <Box id={entity('you')} className="ref-person ref-you" style={{ left: 36, top: 22 }}>you</Box>
      <Box id={entity('prompt')} className="ref-prompt" style={{ left: 150, top: 26 }}>“I have a topic…”</Box>
      <Enter name="interview" show={through >= 1}>
        <Box id={entity('skill')} className="ref-person ref-skill" style={{ left: 672, top: 22 }}>skill</Box>
        <Arrow id={entity('conversation-link')} className="ref-link" style={{ left: 382, top: 49 }} label="Two-way conversation" />
        <SymbolChip id={entity('question')} className="ref-question" style={{ left: 394, top: 4 }}>one question at a time</SymbolChip>
      </Enter>
    </div>

    <div className="step-tray" aria-label="Accumulating presentation steps">
      <AnimatePresence>
        {cards.slice(0, cardCount).map(([title, detail], index) => (
          <Appear key={index} className="ref-appear">
            <Box id={entity(`step-${index + 1}`)} className={`ref-card ${index === through ? 'ref-card-current' : ''}`} style={{ left: 34 + (index % 3) * 276, top: 108 + Math.floor(index / 3) * 67 }}>
              <span className="ref-card-number">0{index + 1}</span><strong>{title}</strong><small>{detail}</small>
            </Box>
          </Appear>
        ))}
      </AnimatePresence>
      <Enter name="links" show={through >= 3}>
        <Arrow id={entity('morph-link')} className="ref-morph-link" style={{ left: 242, top: 139 }} label="What morphs between adjacent steps" />
        <Arrow id={entity('extend-link')} className="ref-morph-link" style={{ left: 518, top: 139 }} label="The story extends" />
      </Enter>
      <Enter name="depth" show={through === 4}>
        <Emphasis id={entity('ghost-card')} className="ref-ghost" style={{ left: 586, top: 175 }}>… next beat</Emphasis>
        <SymbolChip id={entity('depth-control')} className="ref-depth" style={{ left: 34, top: 80 }}>partial ↔ full</SymbolChip>
      </Enter>
      <Enter name="kit" show={through >= 5}>
        <div className="kit-socket" data-presentation-allow-overlap>
          <Arrow id={entity('kit-plug')} className="ref-plug" style={{ left: 356, top: 304 }} direction="down" />
          <SymbolChip id={entity('scene-kit')} className="ref-kit" style={{ left: 324, top: 328 }}>shared scene kit</SymbolChip>
        </div>
      </Enter>
      <Enter name="verify" show={through >= 6}>
        <div className="verify-node" style={{ left: 545, top: 338 }}>
          <Arrow id={entity('verify-chain')} className="ref-plug" style={{ left: -30, top: 5 }} />
          <Box id={entity('verify')} className="ref-verify">build + render <b>✓</b></Box>
        </div>
      </Enter>
      <Enter name="loop" show={through >= 7}>
        <Arrow id={entity('modify-arc')} className="ref-modify" style={{ left: 754, top: 75 }} direction="down" label="Modify a step in place" />
        <Emphasis id={entity('edited-card')} className="ref-edited" style={{ left: 150, top: 232 }}>edited</Emphasis>
      </Enter>
      <Enter name="reveal" show={through >= 8}>
        <Frame id={entity('reveal')} className="ref-reveal" label="a presentation made with this skill"><Label id={entity('reveal-note')}>one evolving scene · nine named steps</Label></Frame>
      </Enter>
    </div>
  </SceneLayer>
}

/** Newcomers fade in after continuing entities settle; departing ones fade out. */
function Enter({ name, show, children }: { name: string; show: boolean; children: ReactNode }) {
  return <AnimatePresence>{show && <Appear key={name} className="ref-appear">{children}</Appear>}</AnimatePresence>
}
