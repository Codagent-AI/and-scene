import type { Step } from '../../../presentation-kit'
import { OUTLINE } from '../outline'
import { TalkScene } from '../TalkScene'
import type { TalkPayload } from '../TalkScene'

export const step2: Step<TalkPayload> = {
  ...OUTLINE[1],
  Scene: TalkScene,
  groupKey: 'talk',
  payload: { step: 2 },
}
