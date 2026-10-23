import type { ReactNode } from 'react'
import type { Mode } from '../constants'

interface HeaderProps {
  mode: Mode
  index: number
  count: number
  title: string
  brand?: ReactNode
  onToggleMode: () => void
}

const pad = (n: number, width: number) => String(n).padStart(width, '0')

export function Header({ mode, index, count, title, brand, onToggleMode }: HeaderProps) {
  const width = String(count).length
  return (
    <header data-presentation-header="">
      {brand ? <div data-presentation-brand="">{brand}</div> : null}
      <span data-presentation-marker="">
        {pad(index + 1, width)} / {pad(count, width)}
      </span>
      {mode === 'browse' ? <h1 data-presentation-title="">{title}</h1> : null}
      <button type="button" data-presentation-mode-toggle="" onClick={onToggleMode}>
        {mode === 'browse' ? 'Present' : 'Browse'}
      </button>
    </header>
  )
}
