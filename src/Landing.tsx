import { presentations } from './presentations'
import './Landing.css'

export default function Landing() {
  return <main className="landing" data-presentation-landing>
    <p className="landing__eyebrow">And Scene</p>
    <h1>Presentations as evolving scenes.</h1>
    <p className="landing__intro">Follow an idea as its diagram changes through a sequence of connected states.</p>
    <section className="landing__list" aria-label="Presentations">
      {presentations.length ? presentations.map(({ slug, title }) => <a className="landing__link" key={slug} href={`/${slug}`} data-presentation-link><span>{title}</span><span aria-hidden="true">→</span></a>) : <p data-presentation-empty>No presentations yet.</p>}
    </section>
  </main>
}
