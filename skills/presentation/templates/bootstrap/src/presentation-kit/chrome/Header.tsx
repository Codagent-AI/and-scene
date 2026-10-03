export function Header({ title, mode, branding }: { title: string; mode: 'browse' | 'present'; branding?: React.ReactNode }) {
  return <header className="presentation-header" data-presentation-header=""><div className="presentation-brand-slot">{branding}</div>{mode === 'browse' && <h1 className="presentation-title">{title}</h1>}</header>
}
