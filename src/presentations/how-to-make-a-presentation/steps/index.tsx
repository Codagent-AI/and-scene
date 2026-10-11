import { step as topic } from './01-topic';
import { step as interview } from './02-interview';
import { step as answers } from './03-answers';
import { step as deck } from './04-deck';
import { step as depth } from './05-depth';
import { step as assemble } from './06-assemble';
import { step as verify } from './07-verify';
import { step as modify } from './08-modify';
import { step as reveal } from './09-reveal';

export const STEPS = [topic, interview, answers, deck, depth, assemble, verify, modify, reveal] as const;
