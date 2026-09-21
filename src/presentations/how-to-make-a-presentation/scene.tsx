import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../presentation-kit'
import { entities } from './entities'
import type { ReferencePayload } from './steps/types'

export function ReferenceScene({ payload }: { payload: ReferencePayload }) {
  return <SceneLayer className="reference-scene">
    <Box entityId={entities.you} className="reference-node reference-you">you</Box>
    {payload.prompt ? <Box entityId={entities.prompt} className="reference-prompt">a topic</Box> : null}
    {payload.skill ? <>
      <Arrow entityId="reference:conversation" className="reference-arrow" />
      <Box entityId={entities.skill} className="reference-node reference-skill">skill</Box>
      <SymbolChip entityId={entities.question} className="reference-chip">question</SymbolChip>
    </> : null}
    {payload.tray ? <Emphasis entityId={entities.tray} className="reference-tray" /> : null}
    {payload.cards.map((card, index) => <Box key={card.id} entityId={card.id} className={`reference-card reference-card-${index + 1}`}>
      <span className="reference-card-number">0{index + 1}</span><strong>{card.title}</strong><small>{card.detail}</small>
    </Box>)}
    {payload.ghost ? <Box entityId={entities.ghost} className="reference-card reference-ghost">+ sketch later</Box> : null}
    {payload.depth ? <SymbolChip entityId={entities.depth} className="reference-chip reference-depth">partial ↔ full</SymbolChip> : null}
    {payload.kit ? <><Arrow entityId="reference:kit-connector" className="reference-kit-arrow" /><Box entityId={entities.kit} className="reference-kit">scene kit <small>ready-made motion</small></Box></> : null}
    {payload.verify ? <><Arrow entityId="reference:verify-connector" className="reference-verify-arrow" /><Box entityId={entities.verify} className="reference-verify">✓ build + render pass</Box></> : null}
    {payload.modify ? <><Arrow entityId={entities.modify} className="reference-modify">↘</Arrow><Box entityId={entities.edited} className="reference-card reference-edited">edited beat</Box></> : null}
    {payload.reveal ? <Frame entityId={entities.reveal} className="reference-reveal"><Label entityId="reference:reveal-label">one evolving scene · yours</Label></Frame> : null}
  </SceneLayer>
}
