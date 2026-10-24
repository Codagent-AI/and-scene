import { AnimatePresence } from 'motion/react'
import { Check, MessageCircle, User, Wand2 } from 'lucide-react'
import {
  Appear,
  Arrow,
  Box,
  Emphasis,
  Frame,
  Label,
  SceneLayer,
  SymbolChip,
} from '../../../presentation-kit/index.ts'
import type { SceneProps } from '../../../presentation-kit/index.ts'
import { AT, CARD_RIGHT, CHAIN_Y, ENT } from '../entities.ts'

export interface SamplePayload {
  /** Index of the active beat; entities accumulate up to it. */
  beat: number
}

const chain = (from: keyof typeof AT, to: keyof typeof AT) => ({
  from: { x: CARD_RIGHT(AT[from]), y: CHAIN_Y },
  to: { x: AT[to].x, y: CHAIN_Y },
})

/** One persistent scene for the whole talk; only `payload.beat` changes between steps. */
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  const { beat } = payload
  return (
    <SceneLayer>
      <AnimatePresence>
        {beat >= 0 && (
          <Appear key="ask">
            <Box id={ENT.you} at={AT.you} Icon={User}>
              <Label id={`${ENT.you}-label`}>you</Label>
            </Box>
            <Box id={ENT.prompt} at={AT.prompt} variant="bubble">
              <Label id={`${ENT.prompt}-label`}>prompt</Label>
            </Box>
          </Appear>
        )}
        {beat >= 1 && (
          <Appear key="interview">
            <Box id={ENT.skill} at={AT.skill} Icon={Wand2}>
              <Label id={`${ENT.skill}-label`}>skill</Label>
            </Box>
            <Arrow
              id={ENT.link}
              from={{ x: 172, y: 48 }}
              to={{ x: 708, y: 48 }}
              bidirectional
            />
            <SymbolChip id={ENT.question} at={AT.question} variant="question">
              <MessageCircle aria-hidden="true" data-presentation-icon="" /> which topic?
            </SymbolChip>
          </Appear>
        )}
        {beat >= 2 && (
          <Appear key="tray">
            <Frame id={ENT.tray} at={AT.tray} variant="tray" />
            <Box id={ENT.card1} at={AT.card1} variant="step-card">
              <span data-part="title">title</span>
              <span data-part="caption">caption</span>
              <span data-part="visual">visual</span>
            </Box>
            <Arrow id={ENT.morph1} {...chain('card1', 'card2')} variant="morph" />
            <Label id={ENT.morphLabel} at={AT.morphLabel} variant="morph">
              morphs
            </Label>
          </Appear>
        )}
      {beat >= 3 && (
<Appear key="b3">
        <Box id={ENT.card2} at={AT.card2} variant="step-card">
          <span data-part="title">step 2</span>
        </Box>
        <Box id={ENT.card3} at={AT.card3} variant="step-card">
          <span data-part="title">step 3</span>
        </Box>
        <Arrow id={ENT.morph2} {...chain('card2', 'card3')} variant="morph" />
      </Appear>
)}
      {beat >= 4 && (
<Appear key="b4">
        <Box id={ENT.ghost} at={AT.ghost} variant="ghost">
          <span data-part="title">?</span>
        </Box>
        <Arrow id={ENT.ghostLink} {...chain('card3', 'ghost')} variant="ghost" />
        <SymbolChip id={ENT.depth} at={AT.depth} variant="depth">
          partial ⇄ full
        </SymbolChip>
      </Appear>
)}
      {beat >= 5 && (
<Appear key="b5">
        <Box id={ENT.kit} at={AT.kit} variant="scene-kit">
          <Label id={`${ENT.kit}-label`}>scene kit</Label>
        </Box>
        <Arrow
          id={ENT.kitLink}
          from={{ x: 440, y: AT.kit.y }}
          to={{ x: 440, y: AT.tray.y + 4 }}
          variant="socket"
        />
      </Appear>
)}
      {beat >= 6 && (
<Appear key="b6">
        <Box id={ENT.verify} at={AT.verify} variant="verify">
          <Label id={`${ENT.verify}-label`}>verify</Label>
        </Box>
        <Arrow id={ENT.verifyLink} {...chain('ghost', 'verify')} />
        <SymbolChip id={ENT.pass} at={AT.pass} variant="pass">
          <Check aria-hidden="true" data-presentation-icon="" />
        </SymbolChip>
      </Appear>
)}
      {beat >= 7 && (
<Appear key="b7">
        <Arrow
          id={ENT.modify}
          from={{ x: 760, y: 80 }}
          to={{ x: 290, y: AT.card2.y - 2 }}
          bend={60}
          variant="modify"
        />
        <Emphasis id={ENT.edited} at={AT.edited} variant="edited">
          edited
        </Emphasis>
      </Appear>
)}
      {beat >= 8 && (
<Appear key="b8">
        <Frame id={ENT.reveal} at={AT.reveal} variant="reveal">
          <Label id={`${ENT.reveal}-label`} variant="reveal-label" at={{ x: 640, y: 350, w: 220, h: 20 }}>
            built by the skill
          </Label>
        </Frame>
      </Appear>
)}
      </AnimatePresence>
    </SceneLayer>
  )
}
