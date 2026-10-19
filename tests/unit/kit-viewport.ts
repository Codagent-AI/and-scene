/** Test helper: sets the jsdom viewport and notifies resize listeners. Synthetic only. */
const original = { width: window.innerWidth, height: window.innerHeight }

export function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height })
  window.dispatchEvent(new Event('resize'))
}

export function restoreViewport(): void {
  setViewport(original.width, original.height)
}
