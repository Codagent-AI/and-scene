import { presentationRegistry } from './presentations'

export function Landing() {
  return <main data-presentation-landing="true"><h1>Presentations</h1><ul>{presentationRegistry.map((item) => <li key={item.slug}><a href={`/${item.slug}`}>{item.title}</a></li>)}</ul></main>
}
