import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit/nodes/index.ts'
import type { SceneProps } from '../../../presentation-kit/types.ts'
import { ENTITY, STEP_CARD_IDS } from '../entities.ts'
import './scene.css'

const CARD_TITLES = ['The ask', 'Gather', 'Build', 'Review', 'Reveal']

export interface HowToPayload { through: number }

export function HowToScene({ payload }: SceneProps<HowToPayload>) {
  const step = payload.through
  return <SceneLayer className="howto-scene">
    {step >= 1 && <>
      <Box id={ENTITY.you} className="howto-person" style={{ left: 76, top: 40 }}><small>YOU</small><strong>A topic</strong></Box>
      <Box id={ENTITY.prompt} className="howto-prompt" style={{ left: 264, top: 4 }}><span>“I have an idea…”</span></Box>
    </>}
    {step >= 2 && <>
      <Box id={ENTITY.skill} className="howto-person howto-skill" style={{ left: 684, top: 40 }}><small>THE SKILL</small><strong>Presentation guide</strong></Box>
      <Arrow id={ENTITY.conversation} className="howto-conversation" style={{ left: 196, top: 96, width: 488 }}>↔</Arrow>
      <SymbolChip id={ENTITY.question} className="howto-question" style={{ left: 380, top: 106 }}>one question at a time</SymbolChip>
    </>}
    {step >= 3 && <>
      <Label id={ENTITY.trayLabel} className="howto-tray-label" style={{ left: 72, top: 150 }}>YOUR STORY TAKES SHAPE</Label>
      <Frame id={ENTITY.tray} className="howto-tray" style={{ left: 72, top: 177, width: 736, height: 130 }}> </Frame>
      {STEP_CARD_IDS.slice(0, step - 2).map((id, index) => {
        const edited = step === 8 && index === 3
        return <Box key={id} id={id} className={`howto-card${edited ? ' howto-edited' : ''}`} style={{ left: 84 + index * 112, top: 190 }}>
          <small>STEP {String(index + 1).padStart(2, '0')}</small>
          <strong>{CARD_TITLES[index]}</strong>
          {index === 0 && <span className="howto-parts">title · caption · visual</span>}
          {edited && <Emphasis id={ENTITY.edited} className="howto-edited-flag">EDITED</Emphasis>}
        </Box>
      })}
      {step <= 5 && <div className="howto-links" aria-label="What changes between steps"><span>state changes</span><b>↗</b><b>↗</b><b>↗</b></div>}
    </>}
    {step === 5 && <>
      <Box id={STEP_CARD_IDS[3]} className="howto-card howto-ghost" style={{ left: 420, top: 190 }}><small>…</small><strong>More?</strong></Box>
      <SymbolChip id={ENTITY.depth} className="howto-depth" style={{ left: 76, top: 318 }}>partial <span>↔</span> full</SymbolChip>
    </>}
    {step >= 6 && <>
      <Arrow id={ENTITY.kitPlug} className="howto-kit-plug" style={{ left: 420, top: 294 }} />
      <Box id={ENTITY.kit} className="howto-kit" style={{ left: 345, top: 310 }}><small>SHARED ENGINE</small><strong>Scene kit</strong><span>boxes · arrows · motion</span></Box>
    </>}
    {step >= 7 && <Box id={ENTITY.verify} className="howto-verify" style={{ left: 650, top: 223 }}><small>FINAL CHECK</small><strong>Build + render</strong><span>✓ Pass</span></Box>}
    {step >= 8 && <>
      <svg className="howto-modify-svg" viewBox="0 0 880 380" aria-hidden="true"><path className="howto-modify-path" d="M120 108 C120 280 270 300 420 247" /></svg>
      <Label id={ENTITY.modify} className="howto-modify" style={{ left: 248, top: 294 }}>edit in place ↗</Label>
    </>}
    {step >= 9 && <>
      <Frame id={ENTITY.reveal} className="howto-reveal" style={{ left: 34, top: 18, width: 812, height: 360 }}> </Frame>
      <Label id={ENTITY.revealLabel} className="howto-reveal-label" style={{ left: 604, top: 4 }}>This presentation was made this way</Label>
    </>}
  </SceneLayer>
}
