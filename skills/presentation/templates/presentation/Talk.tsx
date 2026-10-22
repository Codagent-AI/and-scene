import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps/index.ts'
import './__SLUG__.css'

export default function Talk() {
  return <Presentation steps={STEPS} title="__TITLE__" initialMode="browse" />
}
