import type { Step } from '../../../presentation-kit'
import { OUTLINE } from '../outline'
import { TalkScene } from '../TalkScene'
import type { TalkPayload } from '../TalkScene'

export const step8: Step<TalkPayload> = {
  ...OUTLINE[7],
  Scene: TalkScene,
  groupKey: 'talk',
  payload: { step: 8 },
}
