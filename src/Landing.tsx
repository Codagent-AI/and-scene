import { presentations } from './presentations'
import type { PresentationEntry } from './presentations'

export function Landing({ entries = presentations }: { entries?: readonly PresentationEntry[] }) {
  return <main className="landing">
    <header className="landing-heading">
      <p className="landing-eyebrow">AND SCENE</p>
      <h1>One scene.<br />A story in motion.</h1>
      <p>Ideas unfold through evolving diagrams. Choose a presentation and follow the story, one step at a time.</p>
    </header>
    <section className="presentation-library" aria-labelledby="library-title">
      <h2 id="library-title">Presentations <span>{String(entries.length).padStart(2, '0')}</span></h2>
      {entries.length ? <ul>{entries.map(entry => <li key={entry.slug}>
        <a data-presentation-link href={`/${entry.slug}`}>{entry.title}</a>
      </li>)}</ul> : <div className="library-empty"><h3>No presentations yet.</h3><p>The stage is set. The first story starts here.</p></div>}
    </section>
    <footer className="landing-footer">Built for ideas that deserve more than a slide.</footer>
  </main>
}
