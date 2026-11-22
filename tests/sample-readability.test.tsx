import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StoryScene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { fitScale } from '../src/presentation-kit/useFitScale'
const css = readFileSync('src/presentations/how-to-make-a-presentation/presentation.css', 'utf8')
it.each([1, 5, 9])('F-1 beat %i declared scene type remains at least 12px after narrow fixed-canvas scaling', beat => {
  render(<div className="story"><style>{css}</style><StoryScene payload={beat} /></div>)
  const scale = fitScale(390, 400, 'browse')
  // jsdom has no glyph layout. Check the actual entity/detail font declarations;
  // the production-browser regression also checks inherited text and rectangles.
  const nodes = [...document.querySelectorAll('[data-presentation-entity], [data-presentation-entity] small')]
  for (const node of nodes) {
    const size = parseFloat(getComputedStyle(node).fontSize)
    expect(size * scale, `${node.textContent}: declared ${size}px × fit ${scale}`).toBeGreaterThanOrEqual(12)
  }
  expect(screen.getByText('you')).toBeTruthy(); expect(screen.getByText('a topic')).toBeTruthy()
  if (beat === 9) expect(screen.getByRole('img', { name: 'Unspecified steps' }).textContent).toBe('…')
})
