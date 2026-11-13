import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS } from './steps'
import './presentation.css'
export default function Talk() {return <Presentation title="Your presentation" steps={STEPS} initialMode="browse"/>}
