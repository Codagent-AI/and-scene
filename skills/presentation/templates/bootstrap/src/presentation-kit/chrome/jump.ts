/** Blur after a pointer activation so navigation keys keep driving the deck. */
export function jump(onJump: (index: number) => void, index: number) {
  return (e: { detail: number; currentTarget: HTMLElement }) => {
    onJump(index)
    if (e.detail > 0) e.currentTarget.blur()
  }
}
