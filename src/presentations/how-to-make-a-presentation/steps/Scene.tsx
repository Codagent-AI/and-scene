import { motion } from 'motion/react'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { Box } from '../../../presentation-kit/nodes/Box'
import { entity } from '../entities'

export function Scene({ payload: step }: { payload: number }) {
  const cardNumbers = [3, 4, 5, 6]
  return <div className="sample-scene" data-presentation-sample-scene>
    <Box id={entity('you')} className="sample-person you" style={{ left: 54, top: 30 }}>you</Box>
    <Box id={entity('prompt')} className="sample-prompt" style={{ left: 172, top: 28 }}>a topic</Box>

    <Appear present={step >= 2}><Box id={entity('skill')} className="sample-person skill" style={{ left: 728, top: 30 }}>skill</Box></Appear>
    <Appear present={step >= 2}><motion.div layout layoutId={entity('conversation-arrow')} data-presentation-entity={entity('conversation-arrow')} className="sample-arrow" style={{ left: 310, top: 55, width: 380 }}>↔</motion.div></Appear>
    <Appear present={step >= 2}><motion.div layout layoutId={entity('question')} data-presentation-entity={entity('question')} className="sample-chip" style={{ left: 465, top: 2 }}>one question at a time</motion.div></Appear>

    <Appear present={step >= 3}><motion.div layout layoutId={entity('tray')} data-presentation-entity={entity('tray')} className="sample-tray" /></Appear>
    {cardNumbers.map((number, index) => {
      const startsAt = index === 0 ? 3 : index < 3 ? 4 : 7
      return <Appear key={number} present={step >= startsAt}><Box id={entity(`card-${number}`)} className="sample-card" style={{ left: 36 + index * 180, top: 149 }}><small>0{index + 1} / STEP</small><strong>{['title', 'caption', 'visual', 'verify'][index]}</strong><span>{index === 2 ? '→ morphs →' : index === 3 ? 'build + render ✓' : 'answer lands here'}</span></Box></Appear>
    })}

    <Appear present={step >= 5}><Box id={entity('ghost-card')} className="sample-ghost" style={{ left: 756, top: 149 }}>…</Box></Appear>
    <Appear present={step >= 5}><Box id={entity('depth-control')} className="sample-chip depth-chip" style={{ left: 28, top: 94 }}>partial ↔ full</Box></Appear>
    <Appear present={step >= 6}><Box id={entity('kit')} className="sample-kit" style={{ left: 626, top: 286 }}>scene kit <span>boxes · arrows · motion</span></Box></Appear>

    <Appear present={step >= 8}><motion.svg layout layoutId={entity('modify-arc')} data-presentation-entity={entity('modify-arc')} className="sample-modify-arc" style={{ left: 148, top: 78 }} viewBox="0 0 300 90" aria-hidden="true"><defs><marker id="modify-arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" /></marker></defs><path d="M 0 0 C 60 28, 180 32, 286 61" /></motion.svg><span className="sample-modify-label" style={{ left: 205, top: 96 }}>modify</span></Appear>
    <Appear present={step >= 8}><motion.div layout layoutId={entity('flag')} data-presentation-entity={entity('flag')} data-presentation-allow-overlap className="sample-flag" style={{ left: 434, top: 136 }}>edited</motion.div></Appear>
    <Appear present={step >= 9} delay={0}><motion.div layout layoutId={entity('reveal-frame')} data-presentation-entity={entity('reveal-frame')} className="sample-reveal" /><motion.div layout layoutId={entity('reveal-label')} data-presentation-entity={entity('reveal-label')} className="sample-reveal-label">one evolving scene / one generated presentation</motion.div></Appear>
  </div>
}
