import { useEffect, useState } from 'react'

/** True while the viewport is at least `px` wide. */
export function useMinWidth(px: number): boolean {
  const [wide, setWide] = useState(() => window.innerWidth >= px)
  useEffect(() => {
    const update = () => setWide(window.innerWidth >= px)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [px])
  return wide
}
