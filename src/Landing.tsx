import { presentations } from './presentations'
export default function Landing() {
  return <main className="landing"><p className="eyebrow">AND SCENE / A FIELD GUIDE</p><h1>Ideas, in motion.</h1><p>One scene. A story that unfolds.</p><div className="presentation-list">{presentations.map(entry => <a key={entry.slug} href={`/${entry.slug}`}><span>{entry.title}</span><span aria-hidden="true">↗</span></a>)}</div><footer>Built to explain what comes next.</footer></main>
}
