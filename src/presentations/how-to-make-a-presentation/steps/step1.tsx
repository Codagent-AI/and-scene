import type { Step } from '../../../presentation-kit'
import { OUTLINE } from '../outline'
import { TalkScene } from '../TalkScene'
import type { TalkPayload } from '../TalkScene'

export const step1: Step<TalkPayload> = {
  ...OUTLINE[0],
  Scene: TalkScene,
  groupKey: 'talk',
  payload: { step: 1 },
}
