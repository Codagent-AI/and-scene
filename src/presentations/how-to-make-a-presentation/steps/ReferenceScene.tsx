import { motion } from 'motion/react'
import { Arrow, Box, Emphasis, Frame, Label, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entity } from '../entities'
import '../presentation.css'

export function ReferenceScene({ index }: SceneProps<undefined>) {
  const count = index >= 3 ? 3 : index >= 2 ? 1 : 0
  return <SceneLayer className="reference-scene">
    {index >= 8 && <Frame id={entity.reveal} className="reveal-frame"><span>YOU ARE HERE · BUILT BY THE SKILL</span></Frame>}
    <Box id={entity.you} className="person" style={{ left: 82, top: 44 }}>you</Box>
    <Box id={entity.prompt} className="prompt" style={{ left: 165, top: 42 }}>a topic <span>↗</span></Box>
    {index >= 1 && <>
      <Box id={entity.skill} className="person skill" style={{ left: 680, top: 44 }}>skill</Box>
      <Arrow id={entity.link} className="conversation-link" style={{ left: 269, top: 64, width: 395 }}>↔</Arrow>
      <Label id={entity.question} className="question" style={{ left: 400, top: 24 }}>one question at a time</Label>
    </>}
    {index >= 2 && <>
      <div className="tray" data-reference-tray="" />
      {[...Array(count)].map((_, i) => <Box key={i} id={[entity.card1, entity.card2, entity.card3][i]} entering={index === 3 && i > 0} className={`step-card card-${i + 1} ${index === 3 && i > 0 ? 'card-new' : ''}`} style={{ left: 96 + i * 171, top: 155 }}>
        <span className="card-number">0{i + 1}</span><strong>{['title', 'caption', 'visual'][i] ?? 'next beat'}</strong><small>{['what you say', 'why it matters', 'what appears'][i] ?? 'then it grows'}</small>
      </Box>)}
      {index >= 3 && <Arrow id="reference-morph-link" className="morph-link" style={{ left: 257, top: 259, width: 165 }}>same entities · new state →</Arrow>}
    </>}
    {index >= 4 && <>
      <Box id={entity.ghost} className="step-card ghost-card" style={{ left: 609, top: 282 }}>…<small>open beat</small></Box>
      <Box id={entity.depth} className="depth-control" style={{ left: 59, top: 101 }}>partial <i>↔</i> full</Box>
    </>}
    {index >= 5 && <>
      <Arrow id="reference-kit-plug" className="kit-plug" style={{ left: 420, top: 268, height: 22 }}>↓</Arrow>
      <Box id={entity.kit} className="kit-socket" style={{ left: 340, top: 292 }}>SCENE KIT <small>shared boxes · arrows · motion</small></Box>
    </>}
    {index >= 6 && <>
      <Arrow id="reference-check-chain" className="check-chain" style={{ left: 584, top: 238, width: 12 }}>→</Arrow>
      <Box id={entity.verify} className="verify-node" style={{ left: 602, top: 226 }}>build + render <b>✓ PASS</b></Box>
    </>}
    {index >= 7 && <>
      <motion.div className="modify-path" data-presentation-allow-overlap="" />
      <Label id={entity.modify} className="modify-label" style={{ left: 734, top: 170 }}>change request ↙</Label>
      <Emphasis id={entity.edited} className="edited-flag" style={{ left: 261, top: 143 }}>EDITED</Emphasis>
    </>}
    <span className="scene-footnote">ONE SCENE · ORDERED STORY</span>
  </SceneLayer>
}
