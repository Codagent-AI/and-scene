import { Presentation } from '../../presentation-kit';
import { step } from './steps/01-start';
import './presentation.css';
const STEPS = [step];
export default function Talk() {
  return <Presentation steps={STEPS} title="Your presentation" initialMode="browse" className="authored-presentation" />;
}
