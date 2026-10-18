import { Presentation } from '../../presentation-kit'
import { PRESENTATION_TITLE } from './outline'
import { STEPS } from './steps'
import './styles.css'

export default function Talk() {
  return <Presentation steps={STEPS} title={PRESENTATION_TITLE} initialMode="browse" />
}
