import { Fragment } from 'react'
import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import { ENTITY } from '../entities'
import './presentation.css'

const cards = [
  ['01', 'Ask', 'You bring a topic'], ['02', 'Gather', 'Shape each beat'], ['03', 'Build', 'One scene evolves'],
  ['04', 'Check', 'Render every step'], ['05', 'Refine', 'Edit in place'],
]

export function Scene({ index }: { index: number }) {
  const count = Math.min(Math.max(index - 1, 0), 5)
  return <SceneLayer className="howto-scene" data-howto-scene="true">
    <Label key="you" id={ENTITY.you} className="entity you" style={{ left: 30, top: 26 }}>YOU</Label>
    <Box key="prompt" id={ENTITY.prompt} className="entity prompt" style={{ left: 144, top: 22 }}>“I have a topic…”</Box>
    {index >= 1 && <Fragment key="conversation">
      <Box id={ENTITY.skill} className="entity skill" style={{ left: 672, top: 22 }}>PRESENTATION SKILL</Box>
      <Arrow id={ENTITY.link} className="entity conversation" style={{ left: 338, top: 34, width: 304 }} aria-label="Conversation connects you and the skill" />
      <SymbolChip className="entity question" style={{ left: 446, top: 2 }}>one question at a time</SymbolChip>
    </Fragment>}
    {index >= 2 && <SceneLayer key="tray" className="card-tray">{cards.slice(0, count).map(([number, title, detail], i) =>
      <Box key={number} id={`howto-card-${number}`} className={`step-card entity${index === 7 && i === 1 ? ' edited' : ''}`} style={{ left: 20 + i * 138, top: 116 }}>
        <small>{number} / STEP</small><strong>{title}</strong><span>{detail}</span>
        <em>title · caption · visual</em>
      </Box>)}
      {count >= 2 && cards.slice(0, count - 1).map(([, title], i) => <SymbolChip key={`morph-${i}`} className="entity morph-link" style={{ left: 138 + i * 138, top: 154 }} data-presentation-morph-link="true" data-morph-label={`Morph link between consecutive steps ${title}`}>↝</SymbolChip>)}
    </SceneLayer>}
    {index === 4 && <Fragment key="depth">
      <Box id="howto-ghost" className="step-card ghost entity" style={{ left: 696, top: 116 }}>… your next beat</Box>
      <SymbolChip className="depth-control entity" style={{ left: 35, top: 242 }}>YOU CHOOSE · outline ↔ detail</SymbolChip>
    </Fragment>}
    {index >= 5 && <Fragment key="kit">
      <Arrow id="howto-kit-connector" className="kit-connector entity" style={{ left: 420, top: 220, height: 28 }} aria-label="Shared scene kit plugs into the tray" />
      <Box id={ENTITY.kit} className="kit-socket entity" style={{ left: 330, top: 250 }}>◈ &nbsp; SHARED SCENE KIT</Box>
    </Fragment>}
    {index >= 6 && <Fragment key="verify">
      <Arrow id="howto-verify-arrow" className="verify-arrow entity" style={{ left: 700, top: 155, width: 42 }} aria-label="Step cards chain into verification" />
      <Box id={ENTITY.verify} className="verify-node entity" style={{ left: 755, top: 128 }}>✓ &nbsp; BUILD + RENDER</Box>
    </Fragment>}
    {index >= 7 && <Emphasis key="modify" id={ENTITY.modify} className="modify-arc entity" style={{ left: 352, top: 314 }}>↶ &nbsp; CHANGE A BEAT · EDIT IN PLACE</Emphasis>}
    {index >= 8 && <Frame key="reveal" className="reveal-frame entity" data-presentation-node="reveal-frame" data-presentation-allow-overlap="true"><span>YOU ARE INSIDE THE EXAMPLE</span></Frame>}
    <div key="baseline" className="scene-baseline" aria-hidden="true" />
  </SceneLayer>
}
