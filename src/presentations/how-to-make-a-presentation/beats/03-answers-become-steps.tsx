import { MessageSquareText } from 'lucide-react'
import { Box } from '../../../presentation-kit'
import { E } from '../entities'
import { StepCard } from '../StepCard'

export function Beat3() {
  return (
    <>
      <Box id={E.tray} className="htp-tray" style={{ left: 20, top: 112, width: 840, height: 152 }} />
      <StepCard index={0} Icon={MessageSquareText} />
    </>
  )
}

