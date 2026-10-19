import { Presentation } from '__KIT__'
import { STEPS } from './steps'
import './styles.css'

export default function Talk() {
  return <Presentation steps={STEPS} title="__TITLE__" initialMode="browse" />
}
