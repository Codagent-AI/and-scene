import { Lightbulb, Target } from 'lucide-react'
import { Appear, Arrow, Box, SceneLayer, type SceneProps } from '../../presentation-kit/index.ts'
import { ID } from './entities.ts'
import type { Payload } from './steps.ts'

/** Canvas is 880 × 380 design units; positions below are in those units. */
export function MainScene({ payload }: SceneProps<Payload>) {
  const { beat } = payload
  return (
    <SceneLayer>
      <Box id={ID.topic} icon={Lightbulb} className="node" style={{ left: 80, top: 150, width: 200, height: 80 }}>
        topic
      </Box>
      <Appear when={beat >= 2} id={ID.idea}>
        <Box id={ID.idea} className="node" style={{ left: 600, top: 150, width: 200, height: 80 }}>
          related idea
        </Box>
      </Appear>
      <Arrow id={ID.link} when={beat >= 2} className="link" from={{ x: 290, y: 190 }} to={{ x: 590, y: 190 }} />
      <Appear when={beat >= 3} id={ID.result}>
        <Box id={ID.result} icon={Target} className="node node-result" style={{ left: 340, top: 270, width: 200, height: 70 }}>
          the point
        </Box>
      </Appear>
    </SceneLayer>
  )
}
