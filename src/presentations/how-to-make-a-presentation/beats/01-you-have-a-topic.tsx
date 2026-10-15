import { User } from 'lucide-react'
import { Box } from '../../../presentation-kit'
import { E } from '../entities'

export function Beat1() {
  return (
    <>
      <Box id={E.you} Icon={User} className="htp-node htp-you" style={{ left: 30, top: 14, width: 130, height: 56 }}>
        <span>you</span>
      </Box>
      <Box id={E.prompt} className="htp-bubble" style={{ left: 175, top: 8, width: 190, height: 32 }}>
        <span>“Make me a talk on…”</span>
      </Box>
    </>
  )
}

