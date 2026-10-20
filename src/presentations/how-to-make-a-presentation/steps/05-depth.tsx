import { Appear, Box, Label } from '../../../presentation-kit/index.ts'
import { E } from '../entities.ts'
import { R } from '../layout.ts'

export const meta = {
  id: 'depth',
  era: 'the gathering',
  title: 'You set the depth',
  caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
}

export const entities = () => [
  <Appear key={E.ghost}>
    <Box id={E.ghost} rect={R.ghost} data-kind="ghost" data-presentation-ghost="" />
  </Appear>,
  <Appear key={E.ghostLabel}>
    <Label id={E.ghostLabel} rect={{ x: R.ghost.x + 10, y: R.ghost.y + 44, w: R.ghost.w - 20, h: 22 }} data-kind="ghost-label">
      unspecified
    </Label>
  </Appear>,
  <Appear key={E.depth}>
    <Box id={E.depth} rect={R.depth} data-kind="depth" data-docked-to="you">
      partial ↔ full
    </Box>
  </Appear>,
]
