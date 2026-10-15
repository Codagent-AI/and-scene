import { Plug } from 'lucide-react'
import { Box } from '../../../presentation-kit'
import { E } from '../entities'

/** The scene-kit socket plugs into the tray's bottom edge (the tray itself stays unframed). */
export function Beat6() {
  return (
    <Box id={E.kitSocket} Icon={Plug} className="htp-socket" style={{ left: 290, top: 264, width: 300, height: 36 }}>
      <span>scene kit · boxes, arrows, motion</span>
    </Box>
  )
}

