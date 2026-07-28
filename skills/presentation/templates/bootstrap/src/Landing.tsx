import type { PresentationRegistryEntry } from './router'

interface LandingProps {
  registry: PresentationRegistryEntry[]
}

function Landing({ registry }: LandingProps) {
  return (
    <main data-landing="">
      <h1>and-scene</h1>
      <ul data-testid="presentation-registry">
        {registry.map((entry) => (
          <li key={entry.slug}>
            <a href={`/${entry.slug}`}>{entry.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default Landing
