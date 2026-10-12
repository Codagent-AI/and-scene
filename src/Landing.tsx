import { ArrowUpRight, Orbit } from "lucide-react";
import { presentations } from "./presentations";

export function Landing() {
  return (
    <main className="landing">
      <header className="landing-brand"><Orbit size={22} /> <span>AND SCENE</span></header>
      <section className="landing-intro">
        <p className="eyebrow">A small studio for ideas in motion</p>
        <h1>One scene.<br /><em>A story that moves.</em></h1>
        <p className="landing-copy">Presentations here unfold as a single diagram. Follow the parts as they arrive, connect, and change meaning.</p>
      </section>
      <section className="presentation-list" aria-label="Presentations">
        <p className="eyebrow">The library <span>({presentations.length})</span></p>
        {presentations.map(({ slug, title }) => (
          <a className="presentation-link" href={`/${slug}`} key={slug}>
            <span>{title}</span><ArrowUpRight aria-hidden="true" size={20} />
          </a>
        ))}
      </section>
      <footer className="landing-footer">A collection of ideas, held in one evolving frame.</footer>
    </main>
  );
}
