import { Presentation } from '__KIT__'
import { STEPS } from './steps'
import './presentation.css'

export default function Talk() {
  return <Presentation steps={STEPS} title={__TITLE_LIT__} className="deck-__SLUG__" />
}
