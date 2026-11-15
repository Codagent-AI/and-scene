import { presentations } from './presentations'
export function Landing() {
  return <main className="landing"><p>AND SCENE / A FIELD GUIDE</p><h1>Ideas, in motion.</h1><p>One diagram. A story that unfolds.</p><div>{presentations.map(p => <a key={p.slug} href={`/${p.slug}`}><span>01 / PRESENTATION</span><h2>{p.title}</h2><span>Explore the scene →</span></a>)}</div></main>
}
