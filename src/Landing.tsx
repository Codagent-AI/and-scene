import { presentations } from "./presentations";
export function Landing() {
  return (
    <main className="landing">
      <p>AND SCENE</p>
      <h1>Ideas, in motion.</h1>
      <p>One scene. A story that grows with every step.</p>
      <nav aria-label="Presentations">
        {presentations.map((p) => (
          <a key={p.slug} href={`/${p.slug}`}>
            {p.title} <span>↗</span>
          </a>
        ))}
      </nav>
      <small>Use arrow keys to explore. Press P to present.</small>
    </main>
  );
}
