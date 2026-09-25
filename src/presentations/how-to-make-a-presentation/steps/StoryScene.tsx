import { motion } from 'motion/react'
import type { SceneProps } from '../../../presentation-kit/types'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Label } from '../../../presentation-kit/nodes/Label'
import { Arrow } from '../../../presentation-kit/nodes/Arrow'
import { Frame } from '../../../presentation-kit/nodes/Frame'
import { Emphasis } from '../../../presentation-kit/nodes/Emphasis'
import { SymbolChip } from '../../../presentation-kit/nodes/SymbolChip'
import { entity } from '../entities'

const cardCopy = [
  ['01 · TITLE', 'A clear beat'],
  ['02 · CAPTION', 'One useful thought'],
  ['03 · VISUAL', 'What changes'],
  ['04 · NEXT', 'What morphs next'],
  ['05 · DEPTH', 'Partial or full'],
] as const

export function StoryScene({ index }: SceneProps<number>) {
  const completeCards = index >= 3 ? 4 : 1
  const visibleCards = Math.max(1, completeCards) + (index >= 4 ? 1 : 0)
  return <div className="story" data-scene-progress={index}>
    <div className="conversation">
      <Box id={entity('you')} className="person you"><span className="eyebrow">THE AUTHOR</span><strong>you</strong></Box>
      {index >= 1 && <Box id={entity('skill')} className="person skill"><span className="eyebrow">THE GUIDE</span><strong>skill</strong></Box>}
      {index >= 0 && <SymbolChip id={entity('prompt')} className="prompt">A topic</SymbolChip>}
      {index >= 1 && <><Arrow id={entity('conversation-arrow')} className="conversation-arrow" /><SymbolChip id={entity('question')} className="question">one question at a time</SymbolChip></>}
    </div>
    {index >= 2 && <div className="route-label"><span>THE STORY ROUTE</span><span>answers become a scene <i>↘</i></span></div>}
    {index >= 2 && <div className="tray">
      <svg className="card-links" viewBox="0 0 780 78" aria-hidden="true"><defs><marker id="card-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5" /></marker></defs>
        {Array.from({ length: Math.max(0, visibleCards - 1) }, (_, link) => <path key={link} d={`M ${link * 120 + 104} 39 H ${link * 120 + 120}`} markerEnd="url(#card-arrow)" />)}
        {index >= 6 && <path d="M 584 39 H 600" markerEnd="url(#card-arrow)" />}
      </svg>
      {cardCopy.slice(0, completeCards > 0 ? completeCards : 1).map(([tag, copy], cardIndex) => <motion.div key={tag} layout className="step-card" data-card={cardIndex}>
        <span>{tag}</span><strong>{copy}</strong>
      </motion.div>)}
      {index >= 4 && <motion.div layout className="step-card ghost" data-card="ghost"><span>{cardCopy[4][0]}</span><strong>{cardCopy[4][1]}</strong><small>OPEN DETAIL</small></motion.div>}
      {index >= 5 && <div className="kit-socket"><span className="socket-line" /><Box id={entity('kit')} className="kit-chip">SCENE KIT <b>boxes · arrows · motion</b></Box></div>}
      {index >= 6 && <div className="verify-node"><span>VERIFY</span><strong>build + render</strong><i className="pass-mark" aria-label="Build and render passed">✓</i></div>}
    </div>}
    {index >= 4 && <><Emphasis id={entity('depth-link')} className="depth-link" /><SymbolChip id={entity('depth-control')} className="depth-control"><b>YOU CHOOSE</b><span>partial <i>↔</i> full</span></SymbolChip></>}
    {index >= 7 && <><svg className="modify-arc" viewBox="0 0 880 380" aria-hidden="true"><path d="M 115 106 C 130 225, 215 255, 282 278" /></svg><Label id={entity('modify-label')} className="modify-label">EDIT IN PLACE ↶</Label><Emphasis id={entity('edited-card')} className="edited-card" /></>}
    {index >= 8 && <><Frame id={entity('reveal-frame')} className="reveal-frame" /><Label id={entity('reveal-label')} className="reveal-label">A PRESENTATION MADE WITH THIS SKILL</Label></>}
  </div>
}
