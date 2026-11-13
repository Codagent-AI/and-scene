import { presentations } from './presentations'
export function Landing() {
 return <main className="landing"><p className="eyebrow">and-scene / a living diagram</p><h1>Ideas move.<br/>The scene stays.</h1><p>Follow one idea as it takes shape, one beat at a time.</p><ol>{presentations.map((entry,i)=><li key={entry.slug}><span>0{i+1}</span><a href={`/${entry.slug}`}>{entry.title}<span aria-hidden="true"> ↗</span></a></li>)}</ol><p className="landing-note">Use arrow keys to explore · P to present</p></main>
}
