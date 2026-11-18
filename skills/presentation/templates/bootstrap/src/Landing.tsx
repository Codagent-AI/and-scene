import { presentations } from "./presentations";
export default function Landing() {
  return (
    <main className="landing">
      <p>AND SCENE / A diagram with a story</p>
      <h1>Ideas that move.</h1>
      <p>One scene. A few good steps. Something worth explaining.</p>
      <ul>
        {presentations.map((p) => (
          <li key={p.slug}>
            <a href={`/${p.slug}`}>{p.title} ↗</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
