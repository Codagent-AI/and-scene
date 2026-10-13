export function Header({ title, mode, index, total }: { title: string; mode: 'browse' | 'present'; index: number; total: number }) {
  return <header className="presentation-header" data-presentation-header><span className="presentation-marker">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>{mode === 'browse' && <strong>{title}</strong>}</header>
}
