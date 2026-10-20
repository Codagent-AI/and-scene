import { Appear, Label } from '../../../presentation-kit/index.ts'
import { stepCard } from '../cards.tsx'
import { E } from '../entities.ts'
import { R } from '../layout.ts'

export const meta = {
  id: 'answers',
  era: 'the gathering',
  title: 'Answers become steps',
  caption:
    'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
}

export const entities = () => [
  <Appear key={E.tray}>
    <Label id={E.tray} rect={R.tray} data-kind="tray">
      tray
    </Label>
  </Appear>,
  ...stepCard(1),
]
