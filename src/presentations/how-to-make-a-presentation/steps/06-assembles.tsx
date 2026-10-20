import { Appear, Box, Label } from '../../../presentation-kit/index.ts'
import { E } from '../entities.ts'
import { R } from '../layout.ts'

export const meta = {
  id: 'assembles',
  era: 'the build',
  title: 'It assembles the scene',
  caption:
    'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
}

// The socket plugs into the bottom edge of the tray of cards, so it intentionally overlaps them.
export const entities = () => [
  <Appear key={E.socket}>
    <Box id={E.socket} rect={R.socket} data-kind="socket" data-presentation-allow-overlap="" />
  </Appear>,
  <Appear key={E.socketLabel}>
    <Label id={E.socketLabel} rect={{ x: R.socket.x + 20, y: R.socket.y + 22, w: R.socket.w - 40, h: 22 }} data-kind="socket-label">
      shared scene kit
    </Label>
  </Appear>,
]
