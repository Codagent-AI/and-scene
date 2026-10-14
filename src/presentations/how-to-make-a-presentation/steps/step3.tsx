import type { Step } from '../../../presentation-kit'
import { OUTLINE } from '../outline'
import { TalkScene } from '../TalkScene'
import type { TalkPayload } from '../TalkScene'

export const step3: Step<TalkPayload> = {
  ...OUTLINE[2],
  Scene: TalkScene,
  groupKey: 'talk',
  payload: { step: 3 },
}
