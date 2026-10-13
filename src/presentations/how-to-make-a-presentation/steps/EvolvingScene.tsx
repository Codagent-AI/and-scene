import type { SceneProps } from '../../../presentation-kit/types'
import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import { entity } from '../entities'

interface Payload { count: number }
const at = (left: number, top: number, width?: number) => ({ position: 'absolute' as const, left, top, width })

export function EvolvingScene({ payload }: SceneProps<Payload>) {
  const n = payload.count
  const cards = Math.max(0, n - 2)
  return <SceneLayer data-presentation-sample-scene="true">
    <Box layoutId={entity('you')} className="sample-node you" style={at(112, 38, 145)}>you</Box>
    {n >= 1 && <SymbolChip layoutId={entity('prompt')} className="sample-chip" style={at(118, 8, 130)} data-presentation-allow-overlap="true">topic: make a presentation</SymbolChip>}
    {n >= 2 && <>
      <Box layoutId={entity('skill')} className="sample-node skill" style={at(620, 38, 145)}>skill</Box>
      <Arrow layoutId={entity('conversation')} className="sample-arrow" style={at(278, 66, 320)}>↔</Arrow>
      <SymbolChip layoutId={entity('question')} className="sample-chip" style={at(385, 25, 112)} data-presentation-allow-overlap="true">one question at a time</SymbolChip>
    </>}
    {cards > 0 && <div className="sample-tray" data-presentation-tray>
      {Array.from({ length: Math.min(cards, 6) }, (_, i) => <Box key={i} layoutId={entity(`step-${i + 1}`)} className={`sample-card ${i === 0 ? 'sample-card-detail' : ''}`} style={at(0, 0, 98)} data-presentation-card={String(i + 1)}>
        <strong>step {i + 1}</strong>{i === 0 && <small>title · caption · visual</small>}
      </Box>)}
      {Array.from({ length: Math.max(0, Math.min(cards, 6) - 1) }, (_, i) => <Arrow key={`morph-${i}`} layoutId={entity(`morph-${i + 1}`)} className="sample-card-link" style={{ position: 'absolute', left: 105 + i * 108, top: 83, width: 95 }}>↝ morphs</Arrow>)}
      {n >= 5 && <Box layoutId={entity('ghost')} className="sample-card ghost" style={at(0, 0, 98)} data-presentation-ghost>…</Box>}
      {n >= 7 && <Box layoutId={entity('verify')} className="sample-card verify" style={at(0, 0, 98)} data-presentation-verify>✓<small>build + render</small></Box>}
    </div>}
    {n >= 5 && <Label layoutId={entity('depth')} className="sample-depth" style={at(112, 104, 165)}>partial ↔ full</Label>}
    {n >= 6 && <>
      <Arrow layoutId={entity('kit-link')} className="sample-plug" style={at(360, 259, 155)} data-presentation-allow-overlap="true">⌁</Arrow>
      <Box layoutId={entity('kit')} className="sample-kit" style={at(365, 286, 150)}>scene kit</Box>
    </>}
    {n >= 8 && <>
      <Arrow layoutId={entity('modify')} className="sample-modify" style={at(112, 130, 250)}>↘ edit in place ↗</Arrow>
      <Emphasis layoutId={entity('edited')} className="sample-edited" style={at(404, 138, 50)} data-presentation-allow-overlap="true">edited</Emphasis>
    </>}
    {n >= 9 && <Frame layoutId={entity('reveal')} className="sample-frame" style={{ ...at(0, 0, 880), height: 380 }} data-presentation-reveal data-presentation-allow-overlap="true">one evolving scene · made with the skill</Frame>}
  </SceneLayer>
}

