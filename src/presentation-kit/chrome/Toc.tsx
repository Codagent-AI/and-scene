export function Toc({ eras, index, onSelect }: { eras: { era: string; index: number }[]; index: number; onSelect: (index: number) => void }) {
  return <nav aria-label="Table of contents" data-presentation-toc style={{ position: 'absolute', zIndex: 2, left: 24, top: '50%', display: 'flex', flexDirection: 'column' }}>{eras.map((item) => <button key={item.era} type="button" aria-current={item.index === index ? 'step' : undefined} data-presentation-toc-item data-presentation-active={item.index === index ? 'true' : 'false'} onClick={() => onSelect(item.index)}>{item.era}</button>)}</nav>
}
