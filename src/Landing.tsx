import { presentations } from './presentations'
export default function Landing() { return <main className="landing"><p>AND SCENE / A NEW WAY TO EXPLAIN</p><h1>One idea.<br />An evolving scene.</h1><p>Follow the story as the diagram grows.</p><ul>{presentations.map(p => <li key={p.slug}><a href={`/${p.slug}`}>{p.title} <span>↗</span></a></li>)}</ul></main> }
