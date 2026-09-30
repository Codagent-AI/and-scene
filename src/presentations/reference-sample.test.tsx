import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { presentations } from './index'
import Talk from './how-to-make-a-presentation/Talk'

describe('the committed reference sample', () => {
  it('registers How to Use This Skill to Make a Presentation at its canonical route', () => {
    expect(presentations).toContainEqual(expect.objectContaining({
      slug: 'how-to-make-a-presentation',
      title: 'How to Use This Skill to Make a Presentation',
    }))
  })

  it('starts the canonical nine-step outline with the prescribed first narration', () => {
    render(<Talk />)

    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-count', '9')
    expect(screen.getByText('It starts with you, a topic, and mild overconfidence.')).toBeInTheDocument()
  })
})
