import { presentations } from './presentations'
export function Landing() {
  return <main className="landing"><p className="eyebrow">AND SCENE / FIELD NOTES</p><h1>One idea.<br />An evolving scene.</h1><p>Follow the shape of a story, one beat at a time.</p><ul>{presentations.map(item => <li key={item.slug}><a href={`/${item.slug}`}>{item.title} <span>↗</span></a></li>)}</ul></main>
}
