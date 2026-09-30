export function textOverlapWarnings(index) {
  const root = document.querySelector('[data-presentation]')
  if (!root) return []

  const describe = (element, text) => (
    element.getAttribute('data-presentation-node')
    || element.getAttribute('data-presentation-header')
    || element.getAttribute('data-presentation-footer')
    || element.getAttribute('data-presentation-toc')
    || element.getAttribute('data-presentation-attribution')
    || text.slice(0, 36)
    || element.tagName.toLowerCase()
  )
  const rectangles = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let textNode
  let textNodeIndex = 0
  while ((textNode = walker.nextNode())) {
    const text = textNode.textContent?.trim()
    const element = textNode.parentElement
    if (!text || !element) continue

    const style = getComputedStyle(element)
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) <= 0) continue

    const range = document.createRange()
    range.selectNodeContents(textNode)
    for (const rect of range.getClientRects()) {
      if (rect.width <= 0 || rect.height <= 0) continue
      rectangles.push({
        allowOverlap: Boolean(element.closest('[data-presentation-allow-overlap]')),
        bottom: rect.bottom,
        description: describe(element, text),
        left: rect.left,
        right: rect.right,
        textNodeIndex,
        top: rect.top,
      })
    }
    textNodeIndex += 1
  }

  const cellSize = 64
  const buckets = new Map()
  const warnings = new Set()
  const bucketKeys = (rect) => {
    const keys = []
    const minColumn = Math.floor(rect.left / cellSize)
    const maxColumn = Math.floor(rect.right / cellSize)
    const minRow = Math.floor(rect.top / cellSize)
    const maxRow = Math.floor(rect.bottom / cellSize)
    for (let column = minColumn; column <= maxColumn; column += 1) {
      for (let row = minRow; row <= maxRow; row += 1) keys.push(`${column}:${row}`)
    }
    return keys
  }
  const intersects = (first, second) => (
    first.left < second.right
    && first.right > second.left
    && first.top < second.bottom
    && first.bottom > second.top
  )

  rectangles.forEach((rect, rectIndex) => {
    const keys = bucketKeys(rect)
    const candidates = new Set()
    for (const key of keys) {
      for (const candidate of buckets.get(key) ?? []) candidates.add(candidate)
    }
    for (const candidateIndex of candidates) {
      const candidate = rectangles[candidateIndex]
      if (
        candidate.textNodeIndex !== rect.textNodeIndex
        && !candidate.allowOverlap
        && !rect.allowOverlap
        && intersects(candidate, rect)
      ) {
        warnings.add(`step ${index + 1}: visible overlap between ${candidate.description} and ${rect.description}`)
      }
    }
    for (const key of keys) {
      const bucket = buckets.get(key) ?? []
      bucket.push(rectIndex)
      buckets.set(key, bucket)
    }
  })

  return [...warnings]
}
