import { presentations, type PresentationEntry } from './presentations'
export default function Landing({ registry = presentations }: { registry?: readonly PresentationEntry[] }) {
  return <main className="landing">
    <a className="wordmark" href="/">and scene<span>↗</span></a>
    <p className="eyebrow">IDEAS, IN MOTION</p>
    <h1>A story.<br />One evolving scene.</h1>
    <p className="intro">Follow the thought as it takes shape. Browser presentations built from conversations, with a shared scene kit.</p>
    <section aria-label="Presentations">{registry.map((entry, index) => <a className="presentation-link" key={entry.slug} href={`/${entry.slug}`}>
      <span className="entry-number">{String(index + 1).padStart(2, '0')}</span><span>{entry.title}</span><span aria-hidden="true">↗</span>
    </a>)}</section>
    <footer>Made to explain things, one beat at a time.</footer>
  </main>
}
