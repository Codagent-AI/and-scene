import { presentations } from './presentations/index.js'

export function Landing() {
  return <main className="landing" data-presentation-landing="">
    <header className="landing-header"><p>and-scene</p><h1>Presentations as evolving scenes</h1><p>Explore presentations built as one diagram that changes over time.</p></header>
    <section className="landing-presentations" aria-label="Presentations">{presentations.length ? presentations.map(item => <a key={item.slug} href={`/${item.slug}`} className="landing-presentation" data-presentation-link=""><h2>{item.title}</h2><span>Open presentation</span></a>) : <p data-presentation-empty="">No presentations yet.</p>}</section>
  </main>
}
