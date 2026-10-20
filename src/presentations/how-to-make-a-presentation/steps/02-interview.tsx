import { Bot } from 'lucide-react'
import { Appear, Arrow, Box, Label, SymbolChip } from '../../../presentation-kit/index.ts'
import { E } from '../entities.ts'
import { R } from '../layout.ts'

export const meta = {
  id: 'interview',
  era: 'the ask',
  title: 'The skill interviews you',
  caption: 'One question at a time: the topic, the look, then each beat of the story.',
}

export const entities = () => [
  <Appear key={E.skill}>
    <Box id={E.skill} rect={R.skill} Icon={Bot} data-kind="skill">
      <Label id={`${E.skill}-label`}>skill</Label>
    </Box>
  </Appear>,
  <Appear key={E.converse}>
    <Arrow id={E.converse} from={{ x: 150, y: 44 }} to={{ x: 730, y: 44 }} bidirectional data-kind="converse" />
  </Appear>,
  <Appear key={E.question}>
    <SymbolChip id={E.question} rect={R.question} data-kind="question">
      one question?
    </SymbolChip>
  </Appear>,
]
