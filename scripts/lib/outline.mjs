/**
 * Compare what a presentation actually rendered, step by step, with its
 * normative outline. Returns one problem per defect; empty when they match.
 */
export function validateRendered(rendered, outline) {
  const problems = []
  if (rendered.length !== outline.length) {
    problems.push(`expected ${outline.length} steps but rendered ${rendered.length}`)
  }
  outline.forEach((want, i) => {
    const got = rendered[i]
    if (!got) return
    for (const field of ['title', 'caption', 'era']) {
      if (field === 'era' && got.era === undefined) continue
      if (got[field] !== want[field]) {
        problems.push(`step ${i + 1} ${field}: expected ${JSON.stringify(want[field])} but rendered ${JSON.stringify(got[field])}`)
      }
    }
  })
  return problems
}
