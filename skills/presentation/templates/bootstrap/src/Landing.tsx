import { presentations } from './presentations'
export default function Landing() {
  return <main className="landing"><p>AND SCENE</p><h1>Ideas, in motion.</h1><p>One diagram. A story that unfolds.</p><nav aria-label="Presentations">{presentations.map(p => <a key={p.slug} href={`/${p.slug}`}>{p.title} <span aria-hidden="true">↗</span></a>)}</nav></main>
}
