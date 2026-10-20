import { User } from 'lucide-react'
import { Appear, Box, Label } from '../../../presentation-kit/index.ts'
import { E } from '../entities.ts'
import { R } from '../layout.ts'

export const meta = {
  id: 'topic',
  era: 'the ask',
  title: 'You have a topic',
  caption: 'It starts with you, a topic, and mild overconfidence.',
}

export const entities = () => [
  <Appear key={E.you}>
    <Box id={E.you} rect={R.you} Icon={User} data-kind="you">
      <Label id={`${E.you}-label`}>you</Label>
    </Box>
  </Appear>,
  <Appear key={E.prompt}>
    <Box id={E.prompt} rect={R.prompt} data-kind="prompt">
      prompt
    </Box>
  </Appear>,
]
