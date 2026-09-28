import { Appear, Arrow, Box, Label, SceneLayer } from '../../../presentation-kit'
import { E } from '../entities'

/** Continuing entities render again unwrapped so they stay put; only newcomers use <Appear>. */
export function Scene02() {
  return (
    <SceneLayer>
      <div key={E.subject} className="__SLUG__-slot __SLUG__-slot-subject">
        <Box id={E.subject}>
          <Label id={`${E.subject}:label`}>Subject</Label>
        </Box>
      </div>
      <Appear key={E.link} className="__SLUG__-slot __SLUG__-slot-link">
        <Arrow id={E.link} direction="right" />
      </Appear>
      <Appear key={E.detail} className="__SLUG__-slot __SLUG__-slot-detail">
        <Box id={E.detail}>
          <Label id={`${E.detail}:label`}>Detail</Label>
        </Box>
      </Appear>
    </SceneLayer>
  )
}
