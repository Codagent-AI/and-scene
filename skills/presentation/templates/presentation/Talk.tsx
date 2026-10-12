import { Presentation } from '../../presentation-kit/Presentation'
import { step } from './steps/step'
import './styles.css'
export default function Talk() { return <Presentation steps={[step]} title="Presentation title" initialMode="browse" /> }
