import type { Step } from '../../../presentation-kit'
import { OUTLINE } from '../outline'
import { TalkScene } from '../TalkScene'
import type { TalkPayload } from '../TalkScene'

export const step9: Step<TalkPayload> = {
  ...OUTLINE[8],
  Scene: TalkScene,
  groupKey: 'talk',
  payload: { step: 9 },
}
