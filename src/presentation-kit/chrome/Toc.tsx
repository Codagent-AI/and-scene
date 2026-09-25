import type { Ref } from 'react'
export function Toc({ eras, activeEra, onSelect, ref, visible }: { eras: { era: string; index: number }[]; activeEra: string; onSelect: (index: number) => void; ref?: Ref<HTMLElement>; visible: boolean }) {
  return <nav ref={ref} aria-label="Table of contents" data-presentation-toc style={{ position: 'absolute', zIndex: 2, left: 24, top: '50%', display: 'flex', flexDirection: 'column', visibility: visible ? undefined : 'hidden' }}>{eras.map((item) => <button key={item.era} type="button" aria-current={item.era === activeEra ? 'step' : undefined} data-presentation-toc-item data-presentation-active={item.era === activeEra ? 'true' : 'false'} onClick={() => onSelect(item.index)}>{item.era}</button>)}</nav>
}
