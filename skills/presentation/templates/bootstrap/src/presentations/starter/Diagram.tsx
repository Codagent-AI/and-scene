import { Appear, Arrow, Box, SceneLayer, type SceneProps } from '../../presentation-kit'
import { E } from './entities'

export interface DiagramPayload {
  /** One-based step; the scene shows every entity up to and including this one. */
  step: 1 | 2 | 3
}

const place = (left: number, top: number) => ({ position: 'absolute' as const, left, top, width: 200, height: 70 })

/** One persistent scene shared by all steps; only `payload` changes, so entities morph in place. */
export function Diagram({ payload }: SceneProps<DiagramPayload>) {
  const { step } = payload
  return (
    <SceneLayer name="starter">
      <Box id={E.idea} style={place(40, step === 1 ? 150 : 40)}>
        Idea
      </Box>
      {step >= 2 && (
        <Appear>
          <Box id={E.build} style={place(340, 40)}>
            Build
          </Box>
          <Arrow id={E.ideaToBuild} from={{ x: 240, y: 75 }} to={{ x: 340, y: 75 }} />
        </Appear>
      )}
      {step >= 3 && (
        <Appear>
          <Box id={E.share} style={place(640, 40)}>
            Share
          </Box>
          <Arrow id={E.buildToShare} from={{ x: 540, y: 75 }} to={{ x: 640, y: 75 }} />
        </Appear>
      )}
    </SceneLayer>
  )
}
