import { Appear, Arrow, Box, Label } from '../../presentation-kit/index.ts'
import { E } from './entities.ts'
import { card, CARD_W, CARD_Y, part } from './layout.ts'

/** A step card carrying the parts every step has: title, caption, visual. */
export function stepCard(n: number) {
  return [
    <Appear key={E.card(n)}>
      <Box id={E.card(n)} rect={card(n)} data-kind="card" />
    </Appear>,
    ...(['title', 'caption', 'visual'] as const).map((p, row) => (
      <Appear key={E.part(n, p)}>
        <Label id={E.part(n, p)} rect={part(n, row)} data-kind="card-part">
          {p}
        </Label>
      </Appear>
    )),
  ]
}

/** Link between consecutive cards; what morphs is drawn on the link, not inside the cards. */
export function cardLink(n: number, morphs: string) {
  const left = card(n)
  const right = card(n + 1)
  const y = CARD_Y + 55
  const mid = (left.x + CARD_W + right.x) / 2
  return [
    <Appear key={E.link(n)}>
      <Arrow id={E.link(n)} from={{ x: left.x + CARD_W, y }} to={{ x: right.x, y }} data-kind="link" />
    </Appear>,
    <Appear key={E.morph(n)}>
      <Label id={E.morph(n)} rect={{ x: mid - 52, y: CARD_Y - 24, w: 104, h: 20 }} data-kind="morph">
        {morphs}
      </Label>
    </Appear>,
  ]
}
