import { AnimatePresence } from 'motion/react'
import {
  CircleHelp,
  Check,
  Pencil,
  Plug,
  Shuffle,
  Sparkles,
  ToggleLeft,
  User,
} from 'lucide-react'
import {
  Appear,
  Arrow,
  Box,
  Emphasis,
  Frame,
  Label,
  SceneLayer,
  SymbolChip,
  type SceneProps,
} from '../../../presentation-kit'
import { CARD_H, CARD_W, CARD_Y, EDITED_CARD, ID, slotX } from '../entities'

export interface Payload {
  /** 1-based number of the beat being shown. */
  n: number
}

const CARDS = [0, 1, 2]
const CARD_MID = CARD_Y + CARD_H / 2

function StepCard({ i }: { i: number }) {
  return (
    <Box id={ID.card(i)} className="card" x={slotX(i)} y={CARD_Y} w={CARD_W} h={CARD_H}>
      <span data-part="title">title</span>
      <span data-part="caption">caption</span>
      <span data-part="visual">visual</span>
    </Box>
  )
}

/** The whole talk is this one scene; `payload.n` decides which entities are on screen. */
export function Scene({ payload }: SceneProps<Payload>) {
  const { n } = payload
  return (
    <SceneLayer name="sample">
      <AnimatePresence>
        {n >= 1 && (
          <Appear key="ask">
            <Label id={ID.prompt} className="bubble" x={60} y={8} w={190} h={36}>
              “Explain how a CDN works”
            </Label>
            <Box id={ID.you} className="you" Icon={User} x={60} y={56} w={145} h={56}>
              you
            </Box>
          </Appear>
        )}
        {n >= 2 && (
          <Appear key="interview">
            <Box id={ID.skill} className="skill" Icon={Sparkles} x={675} y={56} w={145} h={56}>
              skill
            </Box>
            <Arrow id={ID.link} className="link" twoWay from={[210, 84]} to={[670, 84]} />
            <SymbolChip id={ID.question} className="chip" Icon={CircleHelp} x={375} y={50} h={26}>
              which topic?
            </SymbolChip>
          </Appear>
        )}
        {n >= 3 && (
          <Appear key="tray">
            <Box id={ID.tray} className="tray" x={40} y={160} w={800} h={140} />
            <Label id={ID.trayLabel} className="tray-label" x={56} y={164}>
              {n >= 4 ? 'steps · 3' : 'steps · 1'}
            </Label>
          </Appear>
        )}
        {CARDS.filter((i) => n >= (i === 0 ? 3 : 4)).map((i) => (
          <Appear key={`card-${i}`}>
            <StepCard i={i} />
          </Appear>
        ))}
        {n >= 4 &&
          [0, 1].map((i) => (
            <Appear key={`morph-${i}`} delay={0.9}>
              <Arrow
                id={ID.cardLink(i)}
                className="link"
                from={[slotX(i) + CARD_W + 3, CARD_MID]}
                to={[slotX(i + 1) - 3, CARD_MID]}
              />
              <SymbolChip
                id={ID.morph(i)}
                className="chip morph"
                Icon={Shuffle}
                x={slotX(i) + CARD_W + 8}
                y={CARD_MID - 28}
              />
            </Appear>
          ))}
        {n >= 5 && (
          <Appear key="depth">
            <Box id={ID.ghost} className="card ghost" x={slotX(3)} y={CARD_Y} w={CARD_W} h={CARD_H}>
              <span data-part="title">not yet specified</span>
            </Box>
            <Box id={ID.depth} className="depth" Icon={ToggleLeft} x={60} y={120} w={145} h={24}>
              partial ⇄ full
            </Box>
          </Appear>
        )}
        {n >= 6 && (
          <Appear key="socket">
            <Box id={ID.socket} className="socket" Icon={Plug} x={360} y={300} w={160} h={36}>
              scene kit
            </Box>
          </Appear>
        )}
        {n >= 7 && (
          <Appear key="verify">
            <Box id={ID.verify} className="card verify" x={slotX(4)} y={CARD_Y} w={CARD_W} h={CARD_H}>
              <span data-part="title">verify</span>
              <span data-part="caption">build · render</span>
            </Box>
            <Arrow
              id={ID.verifyLink}
              className="link"
              from={[slotX(3) + CARD_W + 2, CARD_MID]}
              to={[slotX(4) - 2, CARD_MID]}
            />
            <SymbolChip id={ID.pass} className="chip pass" Icon={Check} x={slotX(4) + 30} y={CARD_Y + 66}>
              pass
            </SymbolChip>
          </Appear>
        )}
        {n >= 8 && (
          <Appear key="loop">
            <Arrow
              id={ID.modify}
              className="link modify"
              from={[750, 116]}
              to={[slotX(EDITED_CARD) + CARD_W / 2, CARD_Y - 2]}
            />
            <Label id={ID.modifyLabel} className="modify-label" x={520} y={128}>
              modify
            </Label>
            <Emphasis
              id={ID.ring}
              className="ring"
              x={slotX(EDITED_CARD) - 6}
              y={CARD_Y - 6}
              w={CARD_W + 12}
              h={CARD_H + 12}
            />
            <SymbolChip id={ID.flag} className="chip flag" Icon={Pencil} x={slotX(EDITED_CARD) - 6} y={CARD_Y - 25}>
              edited
            </SymbolChip>
          </Appear>
        )}
        {n >= 9 && (
          <Appear key="reveal">
            <Frame id={ID.frame} className="frame" x={4} y={2} w={872} h={374} />
            <Label id={ID.frameLabel} className="frame-label" x={600} y={346}>
              made with this skill
            </Label>
          </Appear>
        )}
      </AnimatePresence>
    </SceneLayer>
  )
}
