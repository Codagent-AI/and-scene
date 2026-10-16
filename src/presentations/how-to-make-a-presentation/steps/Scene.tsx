import { AnimatePresence } from 'motion/react'
import { Appear, Arrow, Box, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { ENTITY_IDS as E } from '../entities'
import '../talk.css'

/** Which beat of the story (1-9) the shared scene is showing. */
export interface SceneState {
  beat: number
}

const CARD_X = [60, 210, 360]
const at = (left: number, top: number, width: number, height: number) => ({ left, top, width, height })
const overlay = { position: 'absolute', inset: 0, pointerEvents: 'none' } as const

function StepCard({ id, x, n }: { id: string; x: number; n: number }) {
  return (
    <Box id={id} className="card" style={at(x, 160, 110, 100)}>
      <span className="card-title">Title {n}</span>
      <span className="card-caption">Caption</span>
      <span className="card-visual" />
    </Box>
  )
}

export function Scene({ payload }: SceneProps<SceneState>) {
  const b = payload.beat
  return (
    <SceneLayer className="scene">
      <AnimatePresence>
        {b >= 9 && (
          <Appear key={E.reveal} style={overlay} data-presentation-allow-overlap="">
            <Frame id={E.reveal} className="reveal-frame" style={at(6, 4, 868, 368)} />
            <Label id={E.revealLabel} className="reveal-label" style={at(240, 328, 400, 30)}>
              You are looking at one
            </Label>
          </Appear>
        )}
      </AnimatePresence>

      <Box id={E.you} className="actor" style={at(150, 34, 140, 60)}>you</Box>

      <AnimatePresence>
        {b === 1 && (
          <Appear key={E.prompt} style={overlay}>
            <Box id={E.prompt} className="bubble" style={at(320, 44, 220, 40)}>“Make me a talk about…”</Box>
          </Appear>
        )}
        {b >= 2 && (
          <Appear key="skill" style={overlay}>
            <Box id={E.skill} className="actor" style={at(590, 34, 140, 60)}>skill</Box>
          </Appear>
        )}
        {b >= 2 && (
          <Appear key="conversation" order={0.2} style={overlay}>
            <Arrow id={E.arrowAsk} className="arrow" from={[294, 52]} to={[586, 52]} />
            <Arrow id={E.arrowReply} className="arrow" from={[586, 78]} to={[294, 78]} />
            <SymbolChip id={E.question} className="chip chip-float" style={at(412, 16, 66, 24)}>question?</SymbolChip>
          </Appear>
        )}
        {b >= 3 && (
          <Appear key={E.tray} style={overlay}>
            <Box id={E.tray} className="tray" style={at(40, 140, 800, 140)} />
          </Appear>
        )}
        {b >= 3 && (
          <Appear key={E.card1} order={0.2} style={overlay}>
            <StepCard id={E.card1} x={CARD_X[0]} n={1} />
          </Appear>
        )}
        {b >= 4 && (
          <Appear key="cards-more" order={0.2} style={overlay}>
            <StepCard id={E.card2} x={CARD_X[1]} n={2} />
            <StepCard id={E.card3} x={CARD_X[2]} n={3} />
            <Arrow id={E.link1} className="arrow arrow-link" from={[174, 224]} to={[206, 224]} />
            <Arrow id={E.link2} className="arrow arrow-link" from={[324, 224]} to={[356, 224]} />
            <SymbolChip id={E.linkMark1} className="chip chip-small chip-float chip-link" style={at(180, 196, 20, 20)}>~</SymbolChip>
            <SymbolChip id={E.linkMark2} className="chip chip-small chip-float chip-link" style={at(330, 196, 20, 20)}>~</SymbolChip>
          </Appear>
        )}
        {b >= 5 && (
          <Appear key="depth" order={0.2} style={overlay}>
            <Box id={E.ghost} className="card card-ghost" style={at(510, 160, 110, 100)}>
              <span className="card-title">?</span>
            </Box>
            <Box id={E.depth} className="control" style={at(20, 44, 124, 40)}>partial ↔ full</Box>
          </Appear>
        )}
        {b >= 6 && (
          <Appear key={E.kit} style={overlay} data-presentation-allow-overlap="">
            <Box id={E.kit} className="socket" style={at(300, 264, 240, 44)}>scene kit: boxes · arrows · motion</Box>
          </Appear>
        )}
        {b >= 7 && (
          <Appear key={E.verify} style={overlay}>
            <Box id={E.verify} className="card verify" style={at(660, 160, 130, 100)}>
              <span className="card-title">verify</span>
              <span className="check-row">
                <SymbolChip id={E.verifyBuild} className="chip chip-small">build</SymbolChip>
                <SymbolChip id={E.verifyRender} className="chip chip-small">render</SymbolChip>
              </span>
              <SymbolChip id={E.verifyPass} className="pass">✓ pass</SymbolChip>
            </Box>
          </Appear>
        )}
        {b === 8 && (
          <Appear key="modify" style={overlay} data-presentation-allow-overlap="">
            <Arrow id={E.modify} className="arrow arrow-modify" from={[240, 98]} to={[265, 156]} />
            <Label id={E.modifyLabel} className="note" style={at(268, 108, 120, 22)}>edit this step</Label>
            <SymbolChip id={E.edited} className="chip chip-float chip-flag" style={at(232, 148, 66, 20)}>edited</SymbolChip>
          </Appear>
        )}
      </AnimatePresence>
    </SceneLayer>
  )
}
