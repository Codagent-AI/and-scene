import { presentations } from './presentations'
export default function Landing() {
  return <main className="landing"><p className="eyebrow">AND SCENE / FIELD NOTES</p><h1>Ideas take shape.</h1><p>One scene. A story that grows as you go.</p><nav aria-label="Presentations">{presentations.map(p => <a key={p.slug} href={`/${p.slug}`}><span>{p.title}</span><span aria-hidden="true">↗</span></a>)}</nav></main>
}
