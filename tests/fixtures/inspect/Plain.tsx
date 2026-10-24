import { Presentation } from '../../../src/presentation-kit'
import { STEPS } from './steps'

/** No presentation CSS: active chrome is indistinct and the attribution is browser-default. */
export default function Plain() {
  return <Presentation steps={STEPS} title="Plain fixture" />
}
