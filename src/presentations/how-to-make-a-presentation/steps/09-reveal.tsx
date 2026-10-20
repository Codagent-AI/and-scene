import { Appear, Frame, Label } from '../../../presentation-kit/index.ts'
import { E } from '../entities.ts'
import { R } from '../layout.ts'

export const meta = {
  id: 'reveal',
  era: 'the reveal',
  title: "You're looking at one",
  caption: 'This presentation was built exactly this way. Thanks for watching.',
}

export const entities = () => [
  <Appear key={E.reveal}>
    <Frame id={E.reveal} rect={R.reveal} data-kind="reveal" />
  </Appear>,
  <Appear key={E.revealLabel}>
    <Label id={E.revealLabel} rect={R.revealLabel} data-kind="reveal-label">
      an example of this skill's own output
    </Label>
  </Appear>,
]
