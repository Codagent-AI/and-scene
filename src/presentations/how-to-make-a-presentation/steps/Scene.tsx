import { AnimatePresence } from 'motion/react'
import { Check, CircleHelp, Flag, Puzzle, ShieldCheck, Shuffle, SlidersHorizontal, User, Bot } from 'lucide-react'
import type { ReactNode } from 'react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { AT, FIRST_STEP, ID, TRAY_WIDE } from '../entities'
import type { Box as Geometry } from '../entities'

export interface ScenePayload {
  /** 1-based step number whose accumulated diagram is shown. */
  n: number
}

const place = (g: Geometry) => ({ position: 'absolute', left: g.x, top: g.y }) as const
const size = (g: Geometry) => ({ width: g.w, height: g.h })

/** Newcomer wrapper: positions the entity and fades it in after persisting ones settle. */
function Placed({ at, delay, children }: { at: Geometry; delay?: number; children: ReactNode }) {
  return (
    <Appear style={place(at)} transition={delay === undefined ? undefined : { delay }}>
      {children}
    </Appear>
  )
}

function CardParts({ n }: { n: number }) {
  return (
    <>
      <strong>step {n}</strong>
      <span data-part="title">title</span>
      <span data-part="caption">caption</span>
      <span data-part="visual">visual</span>
    </>
  )
}

export function SampleScene({ payload }: SceneProps<ScenePayload>) {
  const { n } = payload
  const on = (k: keyof typeof ID) => n >= FIRST_STEP[k]
  const tray = { ...AT.tray, w: n >= 7 ? TRAY_WIDE : AT.tray.w }
  const link1 = { ...AT.link1, w: n >= 4 ? AT.link1.w : 22 }

  return (
    <SceneLayer>
      <AnimatePresence>
        {on('you') && (
          <Placed key="you" at={AT.you}>
            <Box id={ID.you} kind="actor" Icon={User} style={size(AT.you)}>you</Box>
          </Placed>
        )}
        {on('prompt') && (
          <Placed key="prompt" at={AT.prompt}>
            <SymbolChip id={ID.prompt} kind="prompt" style={size(AT.prompt)}>a topic, vaguely</SymbolChip>
          </Placed>
        )}
        {on('skill') && (
          <Placed key="skill" at={AT.skill}>
            <Box id={ID.skill} kind="actor" Icon={Bot} style={size(AT.skill)}>skill</Box>
          </Placed>
        )}
        {on('converse') && (
          <Placed key="converse" at={AT.converse}>
            <Arrow id={ID.converse} bidirectional style={size(AT.converse)} />
          </Placed>
        )}
        {on('question') && (
          <Placed key="question" at={AT.question}>
            <SymbolChip id={ID.question} kind="question" Icon={CircleHelp} style={size(AT.question)}>
              what is the topic?
            </SymbolChip>
          </Placed>
        )}
        {on('tray') && (
          <Placed key="tray" at={tray}>
            <Box id={ID.tray} kind="tray" style={size(tray)} />
          </Placed>
        )}
        {on('card1') && (
          <Placed key="card1" at={AT.card1}>
            <Box id={ID.card1} kind="card" style={size(AT.card1)}><CardParts n={1} /></Box>
          </Placed>
        )}
        {on('link1') && (
          <Placed key="link1" at={link1}>
            <Arrow id={ID.link1} variant={n >= 4 ? 'solid' : 'stub'} style={size(link1)} />
          </Placed>
        )}
        {on('morph1') && (
          <Placed key="morph1" at={AT.morph1}>
            <SymbolChip id={ID.morph1} kind="morph" Icon={Shuffle} aria-label="what morphs" style={size(AT.morph1)} />
          </Placed>
        )}
        {on('card2') && (
          <Placed key="card2" at={AT.card2}>
            <Box id={ID.card2} kind="card" style={size(AT.card2)}><CardParts n={2} /></Box>
          </Placed>
        )}
        {on('link2') && (
          <Placed key="link2" at={AT.link2}>
            <Arrow id={ID.link2} variant="solid" style={size(AT.link2)} />
          </Placed>
        )}
        {on('morph2') && (
          <Placed key="morph2" at={AT.morph2}>
            <SymbolChip id={ID.morph2} kind="morph" Icon={Shuffle} aria-label="what morphs" style={size(AT.morph2)} />
          </Placed>
        )}
        {on('card3') && (
          <Placed key="card3" at={AT.card3}>
            <Box id={ID.card3} kind="card" style={size(AT.card3)}><CardParts n={3} /></Box>
          </Placed>
        )}
        {on('ghost') && (
          <Placed key="ghost" at={AT.ghost}>
            <Box id={ID.ghost} kind="ghost" style={size(AT.ghost)}>not spelled out</Box>
          </Placed>
        )}
        {on('depth') && (
          <Placed key="depth" at={AT.depth}>
            <SymbolChip id={ID.depth} kind="depth" Icon={SlidersHorizontal} style={size(AT.depth)}>
              partial ↔ full
            </SymbolChip>
          </Placed>
        )}
        {on('plug') && (
          <Placed key="plug" at={AT.plug}>
            <Emphasis id={ID.plug} kind="plug" style={size(AT.plug)} />
          </Placed>
        )}
        {on('socket') && (
          <Placed key="socket" at={AT.socket}>
            <Box id={ID.socket} kind="socket" Icon={Puzzle} style={size(AT.socket)}>shared scene kit</Box>
          </Placed>
        )}
        {on('verifyLink') && (
          <Placed key="verifyLink" at={AT.verifyLink}>
            <Arrow id={ID.verifyLink} variant="solid" style={size(AT.verifyLink)} />
          </Placed>
        )}
        {on('verify') && (
          <Placed key="verify" at={AT.verify}>
            <Box id={ID.verify} kind="verify" Icon={ShieldCheck} style={size(AT.verify)}>
              <span>build</span>
              <span>render</span>
            </Box>
          </Placed>
        )}
        {on('pass') && (
          <Placed key="pass" at={AT.pass} delay={1.1}>
            <Emphasis id={ID.pass} kind="pass" aria-label="checks pass" style={size(AT.pass)}>
              <Check aria-hidden="true" />
            </Emphasis>
          </Placed>
        )}
        {on('modify') && (
          <Placed key="modify" at={AT.modify}>
            <Arrow id={ID.modify} variant="arc" style={size(AT.modify)} />
          </Placed>
        )}
        {on('modifyLabel') && (
          <Placed key="modifyLabel" at={AT.modifyLabel}>
            <Label id={ID.modifyLabel} style={size(AT.modifyLabel)}>modify</Label>
          </Placed>
        )}
        {on('flag') && (
          <Placed key="flag" at={AT.flag}>
            <Emphasis id={ID.flag} kind="flag" style={size(AT.flag)}>
              <Flag aria-hidden="true" />
              edited
            </Emphasis>
          </Placed>
        )}
        {on('frame') && (
          <Placed key="frame" at={AT.frame}>
            <Frame id={ID.frame} style={size(AT.frame)} />
          </Placed>
        )}
        {on('frameLabel') && (
          <Placed key="frameLabel" at={AT.frameLabel}>
            <Label id={ID.frameLabel} style={size(AT.frameLabel)}>this presentation, built this way</Label>
          </Placed>
        )}
      </AnimatePresence>
    </SceneLayer>
  )
}
