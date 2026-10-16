import { Presentation } from '../../presentation-kit'
import './__SLUG__.css'
import { STEPS } from './steps'

export default function Talk() {
  return <Presentation steps={STEPS} title="__TITLE__" initialMode="browse" />
}
