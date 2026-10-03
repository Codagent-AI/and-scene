import { presentations } from './presentations'
import './Landing.css'

export default function Landing() {
  return <main className="landing" data-presentation-landing="">
    <header><p className="landing-kicker">AND SCENE · PRESENTATION KIT</p><h1>Presentations as<br /><span>evolving scenes.</span></h1><p className="landing-summary">Explore ideas as one diagram that changes over time.</p></header>
    <section aria-label="Presentations">
      {presentations.length ? presentations.map(({ slug, title }) => <a key={slug} href={`/${slug}`} data-presentation-link=""><span>{title}</span><span aria-hidden="true"> ↗</span></a>) : <p className="landing-empty">Presentations added to this project will appear here.</p>}
    </section>
  </main>
}
