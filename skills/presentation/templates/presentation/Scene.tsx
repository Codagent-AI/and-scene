import { Appear, Arrow, Box, Presence, SceneLayer, type SceneProps } from '../../presentation-kit'
import { E } from './entities'

export interface Payload {
  /** 1-based beat number; entities accumulate with it. */
  n: number
}

export function Scene({ payload: { n } }: SceneProps<Payload>) {
  return (
    <SceneLayer>
      <Box entity={E.topic} at={{ x: 120, y: 150, w: 200, h: 80 }} className="topic">
        <span>__TITLE__</span>
      </Box>
      <Presence>
        {n >= 2 && (
          <Appear key="detail">
            <Arrow entity={E.link} from={[320, 190]} to={[560, 190]} className="link" />
            <Box entity={E.detail} at={{ x: 560, y: 150, w: 200, h: 80 }} className="detail">
              <span>the next idea</span>
            </Box>
          </Appear>
        )}
      </Presence>
    </SceneLayer>
  )
}
