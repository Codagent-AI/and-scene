import { presentations } from './presentations'

export default function Landing() {
  return <main data-presentation-landing><h1>Presentations</h1><nav>{presentations.map((item) => <a key={item.slug} href={`/${item.slug}`}>{item.title}</a>)}</nav></main>
}
