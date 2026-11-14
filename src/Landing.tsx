import { presentations } from './presentations'
export function Landing() {
  return <main className="landing"><p className="eyebrow">AND SCENE / A FIELD GUIDE</p><h1>Ideas, in motion.</h1><p>One scene. A story that builds, one beat at a time.</p><div className="presentation-list">{presentations.map((entry, i) => <a key={entry.slug} href={`/${entry.slug}`}><span>0{i + 1} / PRESENTATION</span><h2>{entry.title}</h2><b>Explore the scene ↗</b></a>)}</div><footer>Built for the explanation that deserves a better diagram.</footer></main>
}
