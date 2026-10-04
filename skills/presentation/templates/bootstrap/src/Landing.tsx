import { presentations } from './presentations'
export default function Landing() {
  return <main className="landing"><h1>And Scene</h1><p>Choose a presentation.</p><ul>{presentations.map(item => <li key={item.slug}><a href={`/${item.slug}`}>{item.title}</a></li>)}</ul></main>
}
