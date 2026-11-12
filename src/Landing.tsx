import { presentations, type PresentationEntry } from './presentations'

export default function Landing({ entries = presentations }: { entries?: PresentationEntry[] }) {
  return <main className="landing">
    <a className="wordmark" href="/">and scene<span>✳</span></a>
    <p className="eyebrow">IDEAS, IN MOTION</p>
    <h1>One scene.<br />A story unfolding.</h1>
    <p className="landing-intro">Browser presentations built as evolving diagrams. Follow an idea as its pieces appear, connect, and come together.</p>
    <section aria-label="Presentations" className="presentation-list">
      {entries.map((entry, index) => <a key={entry.slug} href={`/${entry.slug}`}><span className="listing-number">{String(index + 1).padStart(2, '0')}</span><span>{entry.title}</span><span aria-hidden="true">↗</span></a>)}
    </section>
    <p className="landing-note">Use the arrow keys to follow the story. Press P to present.</p>
  </main>
}
