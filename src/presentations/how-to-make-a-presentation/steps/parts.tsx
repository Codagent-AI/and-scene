import { ArrowLeftRight } from 'lucide-react'
import { Box, SymbolChip } from '../../../presentation-kit'
import { CARD_H, CARD_W, CARD_Y, MID_Y } from './geometry'

export function StepCard({ id, x, index }: { id: string; x: number; index: number }) {
  return (
    <Box id={id} x={x} y={CARD_Y} w={CARD_W} h={CARD_H} className="htmp-card">
      <span className="htmp-card-title">Title {index}</span>
      <span className="htmp-card-caption">Caption</span>
      <span className="htmp-card-visual">Visual</span>
    </Box>
  )
}

export function Morph({ id, x }: { id: string; x: number }) {
  return (
    <SymbolChip id={id} x={x} y={MID_Y - 34} w={24} h={24} icon={ArrowLeftRight} className="htmp-morph" />
  )
}
