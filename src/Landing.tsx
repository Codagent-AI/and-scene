import { presentations } from './presentations'
export function Landing() {
  return <main className="landing"><span className="eyebrow">AND SCENE / PRESENTATIONS</span><h1>Ideas, in motion.</h1><p>One scene. A story that builds with every step.</p><div className="presentation-list">{presentations.map(entry => <a key={entry.slug} href={`/${entry.slug}`}><span>{entry.title}</span><span aria-hidden="true">↗</span></a>)}</div></main>
}
