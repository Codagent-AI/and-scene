import { Bot, Check, CircleHelp, Layers, MessageSquareText, SlidersHorizontal, User } from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../../presentation-kit'
import { CARD_COUNT, CARD_H, CARD_W, CARD_Y, CONVO, ID, MODIFY_ARC, POS, SOCKET_LINK, VERIFY_LINK, cardX } from '../entities'

export interface ScenePayload {
  /** 1-based beat of the story; entities accumulate as it grows. */
  beat: number
}

/**
 * One persistent scene for every step: entities mount at the beat that introduces
 * them and then stay put, so continuing entities morph instead of remounting.
 */
export function Scene({ payload: { beat } }: SceneProps<ScenePayload>) {
  const cards = beat >= 4 ? CARD_COUNT : beat >= 3 ? 1 : 0
  return (
    <SceneLayer>
      <Box key="you" id={ID.you} Icon={User} label="you" {...POS.you} />
      <Appear key="prompt">
        <Label id={ID.prompt} {...POS.prompt}>
          your topic
        </Label>
      </Appear>

      {beat >= 2 && (
        <Appear key="interview">
          <Box id={ID.skill} Icon={Bot} label="skill" {...POS.skill} />
          <Arrow id={ID.convo} both {...CONVO} />
          <SymbolChip id={ID.question} Icon={CircleHelp} {...POS.question}>
            one question
          </SymbolChip>
        </Appear>
      )}

      {Array.from({ length: cards }, (_, i) => (
        <Appear key={`card-${i}`}>
          <Box id={ID.card(i)} className="step-card" x={cardX(i)} y={CARD_Y} w={CARD_W} h={CARD_H}>
            <span data-part="title">title</span>
            <span data-part="caption">caption</span>
            <span data-part="visual">visual</span>
          </Box>
          {i > 0 && (
            <>
              <Arrow
                id={ID.cardLink(i)}
                from={{ x: cardX(i - 1) + CARD_W, y: CARD_Y + 60 }}
                to={{ x: cardX(i), y: CARD_Y + 60 }}
              />
              <Label id={ID.cardLinkLabel(i)} className="link-label" x={cardX(i - 1) + CARD_W + 2} y={CARD_Y + 36} w={36}>
                morph
              </Label>
            </>
          )}
        </Appear>
      ))}

      {beat >= 5 && (
        <Appear key="ghost">
          <Box id={ID.ghost} className="ghost-card" {...POS.ghost}>
            <span data-part="title">?</span>
          </Box>
          <SymbolChip id={ID.depth} Icon={SlidersHorizontal} className="dock" {...POS.depth}>
            partial ↔ full
          </SymbolChip>
        </Appear>
      )}

      {beat >= 6 && (
        <Appear key="socket">
          <Arrow id={ID.socketLink} {...SOCKET_LINK} />
          <Box id={ID.socket} Icon={Layers} label="scene kit · boxes, arrows, motion" {...POS.socket} />
        </Appear>
      )}

      {beat >= 7 && (
        <Appear key="verify">
          <Arrow id={ID.verifyLink} {...VERIFY_LINK} />
          <SymbolChip id={ID.build} {...POS.build}>
            build
          </SymbolChip>
          <SymbolChip id={ID.render} {...POS.render}>
            render
          </SymbolChip>
          <Box id={ID.verify} Icon={Check} label="verify" className="pass" {...POS.verify} />
        </Appear>
      )}

      {beat >= 8 && (
        <Appear key="modify">
          <Arrow id={ID.modify} bend={26} {...MODIFY_ARC} />
          <Label id={ID.modifyLabel} className="link-label" {...POS.modifyLabel}>
            <MessageSquareText aria-hidden="true" data-presentation-glyph="" /> modify
          </Label>
          <Emphasis id={ID.flagRing} x={cardX(2) - 6} y={CARD_Y - 6} w={CARD_W + 12} h={CARD_H + 12} />
          <Label id={ID.flag} className="flag" {...POS.flag}>
            edited
          </Label>
        </Appear>
      )}

      {beat >= 9 && (
        <Appear key="reveal">
          <Frame id={ID.frame} label="you're looking at one" {...POS.frame} />
        </Appear>
      )}
    </SceneLayer>
  )
}
