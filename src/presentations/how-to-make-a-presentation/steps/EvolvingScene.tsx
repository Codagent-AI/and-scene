import { Arrow, Box, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { ReferencePayload } from './index'

const cardCopy = ['01 · ASK', '02 · INTERVIEW', '03 · OUTLINE', '04 · GROW', '05 · DEPTH', '06 · ASSEMBLE', '07 · VERIFY']

export function EvolvingScene({ payload }: { payload: ReferencePayload }) {
  const through = payload.through
  return <SceneLayer className="reference-scene">
    <Box key="ref-you" entityId="ref-you" className="person-node you-node" style={{ left: 70, top: 24 }}><span className="node-kicker">YOUR SIDE</span><strong>you</strong><small>curious human</small></Box>
    <Box key="ref-prompt" entityId="ref-prompt" className="prompt-node" style={{ left: 205, top: 34 }}><span className="node-kicker">THE STARTING POINT</span><strong>A topic, please</strong></Box>
    {through >= 2 && <Box key="ref-skill" entityId="ref-skill" className="person-node skill-node" style={{ left: 610, top: 24 }}><span className="node-kicker">YOUR GUIDE</span><strong>skill</strong><small>presentation maker</small></Box>}
    {through >= 2 && <Arrow key="ref-interview" entityId="ref-interview" className="conversation-link" style={{ left: 354, top: 55, width: 240 }} />}
    {through >= 2 && <SymbolChip key="ref-question" entityId="ref-question" className="question-chip" style={{ left: 425, top: 20 }}>one question at a time</SymbolChip>}
    {through >= 2 && <Label key="ref-reply" entityId="ref-reply" className="reply-label" style={{ left: 430, top: 81 }}>answer ↔ follow-up</Label>}
    {through >= 3 && <div key="ref-tray" className="card-tray" data-entity-id="ref-tray" aria-label="Accumulating step cards">
      {cardCopy.slice(0, Math.min(through - 2, 5)).map((copy, i) => <Box key={copy} entityId={`ref-card-${i + 1}`} className={`step-card ${i === 4 && through >= 5 ? 'selected-card' : ''}`}><span>{copy}</span><strong>{['Title', 'Caption', 'Visual'][i % 3]}</strong><small>{i === 0 ? 'what changes next →' : 'same scene, next beat'}</small></Box>)}
      {through >= 5 && <Box key="ref-ghost" entityId="ref-ghost" className="ghost-card"><span>OPEN SPACE</span><strong>your next beat</strong><small>partial detail is okay</small></Box>}
    </div>}
    {through >= 5 && <Box key="ref-depth" entityId="ref-depth" className="depth-control" style={{ left: 720, top: 110 }}><span className="node-kicker">YOU CHOOSE</span><strong>partial <i>↔</i> full</strong></Box>}
    {through >= 5 && <Arrow key="ref-depth-link" entityId="ref-depth-link" className="depth-link" style={{ left: 785, top: 100, width: 0, height: 10 }} />}
    {through >= 6 && <Box key="ref-kit" entityId="ref-kit" className="kit-socket" style={{ left: 378, top: 277 }}><span className="node-kicker">SHARED SCENE KIT</span><strong>boxes · arrows · motion</strong></Box>}
    {through >= 6 && <Arrow key="ref-kit-plug" entityId="ref-kit-plug" className="kit-plug" style={{ left: 454, top: 250, width: 0, height: 27 }} />}
    {through >= 7 && <Box key="ref-verify" entityId="ref-verify" className="verify-node" style={{ left: 625, top: 277 }}><span className="node-kicker">SELF CHECK</span><strong>build + render <b>✓ PASS</b></strong></Box>}
    {through >= 7 && <Arrow key="ref-verify-link" entityId="ref-verify-link" className="verify-link" style={{ left: 568, top: 302, width: 57 }} />}
    {through >= 7 && <Label key="ref-verify-label" entityId="ref-verify-label" className="verify-label" style={{ left: 585, top: 280 }}>pipeline</Label>}
    {through >= 8 && <path key="ref-modify-arc" className="modify-arc" d="M152 103 C220 144 290 157 365 165" fill="none" />}
    {through >= 8 && <SymbolChip key="ref-edit" entityId="ref-edit" className="edit-chip" style={{ left: 570, top: 130 }}>edit in place ↺</SymbolChip>}
    {through >= 8 && <Label key="ref-flag" entityId="ref-flag" className="edited-flag" style={{ left: 670, top: 177 }}>EDITED</Label>}
    {through >= 9 && <Frame key="ref-reveal-frame" entityId="ref-reveal-frame" className="reveal-frame" data-presentation-allow-overlap=""><span>ONE EVOLVING SCENE · MADE WITH THE PRESENTATION SKILL</span></Frame>}
  </SceneLayer>
}
