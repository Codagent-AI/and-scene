import { AnimatePresence } from 'motion/react'
import { Appear, Box, Label } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'

export interface StarterPayload {
  stage: number
}

/** One persistent scene: later steps change `payload.stage`, entities keep their ids. */
export function StarterScene({ payload }: SceneProps<StarterPayload>) {
  return (
    <AnimatePresence initial={false}>
      <Appear key="idea">
        <Box id="starter-idea" at={{ x: 40, y: 40, w: 200, h: 80 }}>
          An idea
        </Box>
      </Appear>
      {payload.stage >= 1 ? (
        <Appear key="result">
          <Box id="starter-result" at={{ x: 400, y: 40, w: 200, h: 80 }}>
            A presentation
          </Box>
          <Label id="starter-label" at={{ x: 240, y: 70, w: 160, h: 20 }}>
            becomes
          </Label>
        </Appear>
      ) : null}
    </AnimatePresence>
  )
}
