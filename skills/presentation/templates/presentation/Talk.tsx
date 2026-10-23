import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'

export default function Talk() {
  return <Presentation steps={STEPS} title={__TITLE__} initialMode="browse" />
}
