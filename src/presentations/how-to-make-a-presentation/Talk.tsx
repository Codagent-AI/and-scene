import { Presentation } from '../../presentation-kit/Presentation'
import { SAMPLE_TITLE } from './steps/outline'
import { STEPS } from './steps'
import './styles.css'
export default function Talk() { return <Presentation steps={STEPS} title={SAMPLE_TITLE} initialMode="browse" /> }
