import { Presentation, Arrow, Box, SceneLayer, type Step } from '../../presentation-kit/index.ts'
import '../_shared/active.css'
import '../_shared/attribution.css'

/** Two different Scene components (no shared group) with a shared layoutId and an unrelated peer layer. */
function First() {
  return (
    <SceneLayer>
      <Box id="shared-box" style={{ left: 60, top: 60, width: 120, height: 60 }}>
        shared
      </Box>
      <Box id="peer-box" style={{ left: 700, top: 300, width: 100, height: 40 }}>
        peer
      </Box>
      <Arrow id="shared-arrow" from={{ x: 100, y: 330 }} to={{ x: 300, y: 330 }} />
    </SceneLayer>
  )
}

function Second() {
  return (
    <SceneLayer>
      <Box id="shared-box" style={{ left: 500, top: 200, width: 240, height: 100 }}>
        shared
      </Box>
      <Box id="peer-box" style={{ left: 700, top: 300, width: 100, height: 40 }}>
        peer
      </Box>
      <Arrow id="shared-arrow" from={{ x: 100, y: 330 }} to={{ x: 600, y: 200 }} />
    </SceneLayer>
  )
}

const steps: Step[] = [
  { id: 'u1', era: 'u', title: 'Ungrouped 1', caption: 'c1', Scene: First },
  { id: 'u2', era: 'u', title: 'Ungrouped 2', caption: 'c2', Scene: Second },
]

export default function Talk() {
  return <Presentation steps={steps} title="ungrouped" />
}
