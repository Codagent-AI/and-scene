import { Sparkles } from 'lucide-react'
import { Arrow, Box, SymbolChip } from '../../../presentation-kit'
import { E } from '../entities'

export function Beat2() {
  return (
    <>
      <Box id={E.skill} Icon={Sparkles} className="htp-node htp-skill" style={{ left: 700, top: 14, width: 150, height: 56 }}>
        <span>skill</span>
      </Box>
      <Arrow id={E.askArrow} from={{ x: 166, y: 52 }} to={{ x: 694, y: 52 }} className="htp-arrow htp-arrow-talk" />
      <Arrow id={E.replyArrow} from={{ x: 694, y: 66 }} to={{ x: 166, y: 66 }} className="htp-arrow htp-arrow-talk" />
      <SymbolChip id={E.questionChip} symbol="?" className="htp-chip htp-chip-question" style={{ left: 470, top: 22, width: 120 }}>
        <span>one question</span>
      </SymbolChip>
    </>
  )
}

