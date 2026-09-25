import { motion } from 'motion/react'
import type { SceneProps } from '../../../presentation-kit/types'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Label } from '../../../presentation-kit/nodes/Label'
import { Arrow } from '../../../presentation-kit/nodes/Arrow'
import { Frame } from '../../../presentation-kit/nodes/Frame'
import { Emphasis } from '../../../presentation-kit/nodes/Emphasis'
import { SymbolChip } from '../../../presentation-kit/nodes/SymbolChip'
import { Presence } from '../../../presentation-kit/nodes/Presence'
import { EXIT } from '../../../presentation-kit/constants'
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
      <Presence>{index >= 1 && <Box key="skill" id={entity('skill')} className="person skill"><span className="eyebrow">THE GUIDE</span><strong>skill</strong></Box>}</Presence>
      {index >= 0 && <SymbolChip id={entity('prompt')} className="prompt">A topic</SymbolChip>}
      <Presence>
        {index >= 1 && <Arrow key="conversation-arrow" id={entity('conversation-arrow')} className="conversation-arrow" />}
        {index >= 1 && <SymbolChip key="question" id={entity('question')} className="question">one question at a time</SymbolChip>}
      </Presence>
    </div>
    <Presence>
      {index >= 2 && <motion.div key="route-label" className="route-label" exit={EXIT}><span>THE STORY ROUTE</span><span>answers become a scene <i>↘</i></span></motion.div>}
      {index >= 2 && <motion.div key="tray" className="tray" exit={EXIT}>
        <svg className="card-links" viewBox="0 0 780 78" aria-hidden="true"><defs><marker id="card-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5" /></marker></defs>
          <Presence>
            {Array.from({ length: Math.max(0, visibleCards - 1) }, (_, link) => <motion.path key={link} d={`M ${link * 120 + 104} 39 H ${link * 120 + 120}`} markerEnd="url(#card-arrow)" exit={EXIT} />)}
            {index >= 6 && <motion.path key="verify-link" d="M 584 39 H 600" markerEnd="url(#card-arrow)" exit={EXIT} />}
          </Presence>
        </svg>
        <Presence>
          {cardCopy.slice(0, completeCards > 0 ? completeCards : 1).map(([tag, copy], cardIndex) => <motion.div key={tag} layout exit={EXIT} className="step-card" data-card={cardIndex}>
            <span>{tag}</span><strong>{copy}</strong>
          </motion.div>)}
          {index >= 4 && <motion.div key="ghost" layout exit={EXIT} className="step-card ghost" data-card="ghost"><span>{cardCopy[4][0]}</span><strong>{cardCopy[4][1]}</strong><small>OPEN DETAIL</small></motion.div>}
        </Presence>
        <Presence>
          {index >= 5 && <motion.div key="kit-socket" className="kit-socket" exit={EXIT}><span className="socket-line" /><Box id={entity('kit')} className="kit-chip">SCENE KIT <b>boxes · arrows · motion</b></Box></motion.div>}
          {index >= 6 && <motion.div key="verify-node" className="verify-node" exit={EXIT}><span>VERIFY</span><strong>build + render</strong><i className="pass-mark" aria-label="Build and render passed">✓</i></motion.div>}
        </Presence>
      </motion.div>}
      {index >= 4 && <Emphasis key="depth-link" id={entity('depth-link')} className="depth-link" />}
      {index >= 4 && <SymbolChip key="depth-control" id={entity('depth-control')} className="depth-control"><b>YOU CHOOSE</b><span>partial <i>↔</i> full</span></SymbolChip>}
      {index >= 7 && <motion.svg key="modify-arc" className="modify-arc" viewBox="0 0 880 380" aria-hidden="true" exit={EXIT}><path d="M 115 106 C 130 225, 215 255, 282 278" /></motion.svg>}
      {index >= 7 && <Label key="modify-label" id={entity('modify-label')} className="modify-label">EDIT IN PLACE ↶</Label>}
      {index >= 7 && <Emphasis key="edited-card" id={entity('edited-card')} className="edited-card" />}
      {index >= 8 && <Frame key="reveal-frame" id={entity('reveal-frame')} className="reveal-frame" />}
      {index >= 8 && <Label key="reveal-label" id={entity('reveal-label')} className="reveal-label">A PRESENTATION MADE WITH THIS SKILL</Label>}
    </Presence>
  </div>
}
