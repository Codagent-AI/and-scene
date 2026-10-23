import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './presentation.css'

export const TITLE = 'Starter presentation'

export default function Talk() {
  return <Presentation steps={STEPS} title={TITLE} initialMode="browse" />
}
