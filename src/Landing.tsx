import { presentations } from './presentations'
import './Landing.css'

export default function Landing() {
  return <main className="landing" data-presentation-landing>
    <header className="landing-header"><p className="landing-brand"><span aria-hidden="true">◉</span> and-scene <span className="landing-edition">SCENE STUDIO</span></p><h1>Ideas take shape<br /><em>as they unfold.</em></h1><p className="landing-summary">A presentation is one scene, changing state by state. Browse the stories below, or start with the model behind them.</p></header>
    <section aria-label="Presentations" className="landing-presentations">
      {presentations.length ? presentations.map(({ slug, title }) => <a key={slug} href={`/${slug}`} data-presentation-link><span>{title}</span><span aria-hidden="true">↗</span></a>) : <div className="landing-empty" data-presentation-empty><span className="landing-empty-index">01 — 00</span><h2>The canvas is clear.</h2><p>When a presentation is added, it will appear here as a path through one evolving scene.</p><div className="landing-scene-mark" aria-hidden="true"><i /><i /><i /><b /></div></div>}
    </section>
  </main>
}
