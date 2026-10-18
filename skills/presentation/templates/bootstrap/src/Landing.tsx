import type { PresentationEntry } from './presentations'

export function Landing({ registry }: { registry: readonly PresentationEntry[] }) {
  return (
    <main data-landing="">
      <h1>And Scene</h1>
      <ul>
        {registry.map((e) => (
          <li key={e.slug}>
            <a href={`/${e.slug}`}>{e.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
