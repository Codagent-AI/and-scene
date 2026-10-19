import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './styles.css'

export default function Talk() {
  return <Presentation steps={STEPS} title="__TITLE__" initialMode="browse" />
}
