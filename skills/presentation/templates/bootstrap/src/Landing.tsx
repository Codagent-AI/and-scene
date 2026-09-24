import { presentations } from './presentations'
export default function Landing() {
  return <main className="landing"><h1>Presentations</h1><ul>{presentations.map((item) => <li key={item.slug}><a href={`/${item.slug}`}>{item.title}</a></li>)}</ul></main>
}
