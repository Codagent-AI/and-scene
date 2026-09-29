import { presentations } from './presentations'

export default function Landing() {
  return <main className="landing" data-presentation-landing="">
    <header className="landing-header"><p className="landing-eyebrow">And Scene</p><h1>Presentations as evolving scenes.</h1><p>Each presentation follows one diagram as it changes through a sequence of ideas.</p></header>
    <section className="landing-list" aria-labelledby="presentations-heading"><h2 id="presentations-heading">Presentations</h2>
      {presentations.length ? presentations.map(item => <a key={item.slug} href={`/${item.slug}`} data-presentation-link=""><span>{item.title}</span><span aria-hidden="true">→</span></a>) : <p>No presentations have been added yet.</p>}
    </section>
  </main>
}
