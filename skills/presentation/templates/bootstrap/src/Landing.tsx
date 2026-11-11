import { presentations } from './presentations'
export function Landing() {
  return <main className="landing"><p className="eyebrow">AND SCENE / A SMALL STAGE FOR BIG IDEAS</p><h1>Ideas have<br /><em>moving parts.</em></h1><p>One diagram. A story that unfolds.<br />Take a seat and follow the connections.</p><div className="presentation-list">{presentations.map((entry, i) => <a key={entry.slug} href={`/${entry.slug}`}><span>0{i + 1} / FIELD NOTES</span><h2>{entry.title}</h2><b>Watch the story ↗</b></a>)}</div><footer>Built for explanations that deserve more than slides.</footer></main>
}
