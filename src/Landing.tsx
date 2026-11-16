import { presentations } from './presentations'
export function Landing() {
  return <main className="landing"><span className="eyebrow">AND SCENE / A LIVING DIAGRAM</span><h1>Ideas unfold.<br />The scene stays.</h1><p>Presentations that build a story, one change at a time.</p><div className="presentation-list">{presentations.map(entry => <a key={entry.slug} href={`/${entry.slug}`}><span>{entry.title}</span><span aria-hidden="true">↗</span></a>)}</div><small>Choose a presentation. Follow the idea.</small></main>
}
