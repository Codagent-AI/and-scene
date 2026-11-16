import { presentations } from './presentations'
export function Landing() {
  return <main className="landing"><span className="eyebrow">AND SCENE / A COLLECTION</span><h1>Ideas, in motion.</h1><p>One scene. A story that unfolds.</p><ol>{presentations.map(p => <li key={p.slug}><a href={`/${p.slug}`}>{p.title}<span aria-hidden="true"> ↗</span></a></li>)}</ol><small>Built for curious people. Made to be explored.</small></main>
}
