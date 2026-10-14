import { Appear, Arrow, Box, Frame, Label, SceneLayer, SymbolChip, Emphasis } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import { E } from './entities'

/** Payload = the active step number (1-based); the scene shows every entity introduced so far. */
export interface TalkPayload {
  step: number
}

const CARD_X = (i: number) => 56 + i * 116
const CARD_Y = 172
const SLOT = { w: 100, h: 100 }
const at = (left: number, top: number, w?: number, h?: number) => ({
  position: 'absolute' as const,
  left,
  top,
  ...(w ? { width: w } : {}),
  ...(h ? { height: h } : {}),
})

function StepCard({ i, edited }: { i: number; edited: boolean }) {
  return (
    <Appear style={at(CARD_X(i), CARD_Y, SLOT.w, SLOT.h)}>
      <Box id={E.card(i)} className="htp-card" data-edited={edited ? 'true' : undefined}>
        <span className="htp-card-n">step {i + 1}</span>
        <span className="htp-card-row">title</span>
        <span className="htp-card-row">caption</span>
        <span className="htp-card-row htp-card-visual">visual</span>
      </Box>
    </Appear>
  )
}

export function TalkScene({ payload }: SceneProps<TalkPayload>) {
  const n = payload.step
  const cards = n >= 4 ? 4 : n >= 3 ? 1 : 0

  return (
    <SceneLayer className="htp-scene">
      {/* 9: reveal frame around the whole diagram */}
      <Appear show={n >= 9} style={at(4, 0, 872, 376)}>
        <Frame id={E.frame} className="htp-frame" />
      </Appear>
      <Appear show={n >= 9} style={at(560, 326, 300, 30)}>
        <Label id={E.frameLabel} className="htp-frame-label">
          this deck: built by the skill it describes
        </Label>
      </Appear>

      {/* 1: you + prompt */}
      <Appear style={at(40, 20, 120, 52)}>
        <Box id={E.you} className="htp-node htp-you">you</Box>
      </Appear>
      <Appear show={n >= 1 && n < 3} style={at(40, 84, 170, 40)}>
        <Box id={E.prompt} className="htp-bubble">a topic, please?</Box>
      </Appear>

      {/* 2: skill, two-way arrow, question chip */}
      <Appear show={n >= 2} style={at(720, 20, 120, 52)}>
        <Box id={E.skill} className="htp-node htp-skill">skill</Box>
      </Appear>
      <Appear show={n >= 2} style={{ position: 'absolute', inset: 0 }}>
        <Arrow id={E.arrowOut} from={{ x: 168, y: 38 }} to={{ x: 712, y: 38 }} className="htp-arrow" />
        <Arrow id={E.arrowBack} from={{ x: 712, y: 56 }} to={{ x: 168, y: 56 }} className="htp-arrow" />
      </Appear>
      <Appear show={n >= 2 && n < 3} style={at(370, 4, 140, 24)}>
        <SymbolChip id={E.question} symbol="? one question" className="htp-chip" />
      </Appear>

      {/* 3: tray, step cards, links */}
      <Appear show={n >= 3} style={at(40, 150, 800, 140)}>
        <Frame id={E.tray} className="htp-tray" />
      </Appear>
      {Array.from({ length: cards }, (_, i) => (
        <StepCard key={i} i={i} edited={n >= 8 && i === 2} />
      ))}
      {n >= 4 &&
        [0, 1, 2].map((i) => (
          <Appear key={i} show style={at(CARD_X(i) + 100, CARD_Y + 38, 16, 22)}>
            <SymbolChip id={E.link(i)} symbol="↝" className="htp-link" />
          </Appear>
        ))}
      <Appear show={n >= 4} style={at(56, 274, 300, 14)}>
        <Label id={E.linkNote} className="htp-note">↝ link = what morphs between steps</Label>
      </Appear>

      {/* 5: ghost card + depth control */}
      <Appear show={n >= 5} style={at(CARD_X(4) - 0, CARD_Y, SLOT.w, SLOT.h)}>
        <Box id={E.ghost} className="htp-card htp-ghost">…more steps</Box>
      </Appear>
      <Appear show={n >= 5} style={at(40, 84, 150, 34)}>
        <SymbolChip id={E.depth} symbol="partial ↔ full" className="htp-chip htp-depth" />
      </Appear>

      {/* 6: scene-kit socket on the tray's bottom edge */}
      <Appear show={n >= 6} style={at(432, 290, 16, 24)}>
        <SymbolChip id={E.kitPlug} symbol="⏚" className="htp-plug" />
      </Appear>
      <Appear show={n >= 6} style={at(340, 316, 200, 40)}>
        <Box id={E.kit} className="htp-node htp-kit">scene kit</Box>
      </Appear>

      {/* 7: verify node chained in the tray row */}
      <Appear show={n >= 7} style={at(CARD_X(5), CARD_Y, SLOT.w, SLOT.h)}>
        <Box id={E.verify} className="htp-node htp-verify">
          <span>verify</span>
          <span className="htp-verify-sub">build + render</span>
          <SymbolChip id={E.verifyCheck} symbol="✓ pass" className="htp-pass" />
        </Box>
      </Appear>

      {/* 8: modify arc into the route; edited card flagged */}
      <Appear show={n >= 8} style={{ position: 'absolute', inset: 0 }}>
        <Arrow id={E.modifyArc} from={{ x: 164, y: 66 }} to={{ x: CARD_X(2) + 30, y: CARD_Y - 4 }} className="htp-modify" />
      </Appear>
      <Appear show={n >= 8} style={at(150, 128, 70, 20)}>
        <Label id={E.modifyTag} className="htp-modify-tag">
          <Emphasis>modify</Emphasis>
        </Label>
      </Appear>
    </SceneLayer>
  )
}
