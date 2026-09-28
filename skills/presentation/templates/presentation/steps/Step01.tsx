import { Appear, Box, Label, SceneLayer } from '../../../presentation-kit'
import { E } from '../entities'

export function Scene01() {
  return (
    <SceneLayer>
      <Appear key={E.subject} className="__SLUG__-slot __SLUG__-slot-subject">
        <Box id={E.subject}>
          <Label id={`${E.subject}:label`}>Subject</Label>
        </Box>
      </Appear>
    </SceneLayer>
  )
}
