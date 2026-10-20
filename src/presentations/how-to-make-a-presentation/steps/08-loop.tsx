import { Appear, Arrow, Emphasis, Label } from '../../../presentation-kit/index.ts'
import { E } from '../entities.ts'
import { card, R } from '../layout.ts'

export const meta = {
  id: 'loop',
  era: 'the loop',
  title: 'Changed your mind? Loop it.',
  caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
}

export const entities = () => [
  <Appear key={E.modify}>
    <Arrow id={E.modify} from={{ x: R.skill.x + 60, y: R.skill.y + R.skill.h }} to={{ x: card(2).x + 80, y: card(2).y - 2 }} data-kind="modify" />
  </Appear>,
  <Appear key={E.modifyLabel}>
    <Label id={E.modifyLabel} rect={R.modifyLabel} data-kind="modify-label">
      edit in place
    </Label>
  </Appear>,
  <Appear key={E.flag}>
    <Emphasis id={E.flag} rect={{ ...card(2), x: card(2).x - 4, y: card(2).y - 4, w: card(2).w + 8, h: card(2).h + 8 }} data-kind="flag" />
  </Appear>,
  <Appear key={E.flagLabel}>
    <Label id={E.flagLabel} rect={R.flag} data-kind="flag-label">
      edited
    </Label>
  </Appear>,
]
