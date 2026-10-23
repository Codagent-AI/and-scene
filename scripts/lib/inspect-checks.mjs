// Pure diagnostics over page snapshots; every finding is advisory.
const MIN_OVERLAP_PX = 2
const MIN_OVERLAP_RATIO = 0.1
const MIN_ATTRIBUTION_PX = 11
const DEFAULT_LINK_COLORS = ['rgb(0, 0, 238)', 'rgb(85, 26, 139)', 'rgb(158, 158, 255)']

export function intersection(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? { w, h } : null
}

/** Pairs of visible text/chrome items that collide, unless either sits in an allow-overlap subtree. */
export function findOverlaps(items) {
  const found = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.allowed || b.allowed) continue
      if (a.ancestors.includes(j) || b.ancestors.includes(i)) continue
      const overlap = intersection(a.rect, b.rect)
      if (!overlap || overlap.w < MIN_OVERLAP_PX || overlap.h < MIN_OVERLAP_PX) continue
      const smaller = Math.min(a.rect.w * a.rect.h, b.rect.w * b.rect.h)
      if ((overlap.w * overlap.h) / smaller < MIN_OVERLAP_RATIO) continue
      found.push([a.label, b.label])
    }
  }
  return found
}

/** True when the active and inactive entries differ in at least one visible computed style. */
export function isDistinct(active, inactive) {
  return Object.keys(active).some((k) => active[k] !== inactive[k])
}

export function attributionIssues(attribution) {
  if (!attribution) return ['is missing']
  const issues = []
  if (attribution.fontSize < MIN_ATTRIBUTION_PX) issues.push(`is too small (${attribution.fontSize}px)`)
  if (DEFAULT_LINK_COLORS.includes(attribution.color)) issues.push('uses the browser-default link color')
  return issues
}

/** Advisory warnings for one captured step (`stepNumber` is one-based). */
export function diagnose(snapshot, stepNumber) {
  const warnings = []
  const warn = (msg) => warnings.push(`WARN step ${stepNumber}: ${msg}`)
  for (const [a, b] of findOverlaps(snapshot.overlapItems)) {
    warn(`${a} overlaps ${b}; fix the collision or mark an intentional readable overlap with data-presentation-allow-overlap`)
  }
  for (const [name, pair] of [['progress indicator', snapshot.progress], ['table-of-contents entry', snapshot.toc]]) {
    if (pair && !isDistinct(pair.active, pair.inactive)) {
      warn(`active ${name} is visually indistinct from inactive ones; style [data-presentation-active="true"] in presentation CSS`)
    }
  }
  const issues = attributionIssues(snapshot.attribution)
  if (issues.length) warn(`attribution ${issues.join(' and ')}; style [data-presentation-attribution] in presentation CSS`)
  return warnings
}

export function parseInspectArgs(argv, defaults = { viewport: '1440x900', settleMs: 1200 }) {
  const opts = { slug: null, viewport: defaults.viewport, settleMs: defaults.settleMs }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--viewport') opts.viewport = argv[++i]
    else if (arg === '--settle-ms') opts.settleMs = Number(argv[++i])
    else if (arg.startsWith('--')) throw new Error(`unknown option ${arg}`)
    else if (opts.slug === null) opts.slug = arg
    else throw new Error(`unexpected argument ${arg}`)
  }
  if (!opts.slug) throw new Error('usage: inspect-presentation <slug> [--viewport WxH] [--settle-ms N]')
  const m = /^(\d+)x(\d+)$/.exec(opts.viewport ?? '')
  if (!m) throw new Error(`invalid --viewport "${opts.viewport}"; expected WxH`)
  if (!Number.isFinite(opts.settleMs) || opts.settleMs < 0) throw new Error('invalid --settle-ms')
  return { ...opts, width: Number(m[1]), height: Number(m[2]) }
}

export const stepFileName = (stepNumber) => `step-${String(stepNumber).padStart(2, '0')}.png`

/** Steps through the presentation, capturing a settled screenshot and diagnostics per step. */
export async function captureSteps(page, { count, settleMs, shotPath, snapshot, waitForStep, log = () => {} }) {
  const warnings = []
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      await page.keyboard.press('ArrowRight')
      await waitForStep(i)
    }
    await page.waitForTimeout(settleMs)
    await page.screenshot({ path: shotPath(i + 1) })
    for (const w of diagnose(await page.evaluate(snapshot), i + 1)) {
      warnings.push(w)
      log(w)
    }
  }
  return warnings
}
