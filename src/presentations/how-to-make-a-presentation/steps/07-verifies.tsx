import { Check } from 'lucide-react'
import { Appear, Arrow, Box, Label, SymbolChip } from '../../../presentation-kit/index.ts'
import { E } from '../entities.ts'
import { R } from '../layout.ts'

export const meta = {
  id: 'verifies',
  era: 'the build',
  title: 'It checks its own work',
  caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
}

export const entities = () => [
  <Appear key={E.verifyLink}>
    <Arrow id={E.verifyLink} from={{ x: R.ghost.x + R.ghost.w, y: 215 }} to={{ x: R.verify.x, y: 215 }} data-kind="link" />
  </Appear>,
  <Appear key={E.verify}>
    <Box id={E.verify} rect={R.verify} data-kind="verify" />
  </Appear>,
  <Appear key={E.verifyLabel}>
    <Label id={E.verifyLabel} rect={{ x: R.verify.x + 10, y: R.verify.y + 14, w: R.verify.w - 20, h: 22 }} data-kind="verify-label">
      build + render
    </Label>
  </Appear>,
  <Appear key={E.pass}>
    <SymbolChip id={E.pass} rect={{ x: R.verify.x + 50, y: R.verify.y + 54, w: 56, h: 36 }} data-kind="pass" data-state="green">
      <Check data-presentation-icon="" aria-label="pass" />
    </SymbolChip>
  </Appear>,
]
