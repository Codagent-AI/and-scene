import type { Mode, StepMeta } from '../types'
export function Footer({steps,index,mode,go,next,prev}:{steps:StepMeta[];index:number;mode:Mode;go:(n:number)=>void;next:()=>void;prev:()=>void}) {
 const step=steps[index]
 return <footer data-presentation-footer=""><div data-presentation-marker="">{String(index+1).padStart(2,'0')} / {String(steps.length).padStart(2,'0')} · {step.era}</div><h1 data-presentation-step-title="">{step.title}</h1>{mode==='browse' && <><p data-presentation-caption="">{step.caption}</p><div data-presentation-controls=""><button aria-label="Previous step" onClick={prev} disabled={index===0}>←</button><nav aria-label="Steps" data-presentation-progress="">{steps.map((s,i)=><button key={s.id} aria-label={`Go to step ${i+1}`} aria-current={i===index?'step':undefined} data-presentation-active={i===index} onClick={()=>go(i)}>{i+1}</button>)}</nav><button aria-label="Next step" onClick={next} disabled={index===steps.length-1}>→</button></div></>}</footer>
}
