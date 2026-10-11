// Executed in the browser: only stable presentation hooks, text and computed styles.
export function inspectVisuals() {
  const root = document.querySelector('[data-presentation-root]');
  const warnings = [];
  const warn = (kind, detail) => warnings.push({ kind, detail });
  const visible = element => {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height || rect.bottom <= 0 || rect.right <= 0 || rect.top >= innerHeight || rect.left >= innerWidth) return false;
    for (let current = element; current; current = current.parentElement) {
      const style = getComputedStyle(current);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < .05) return false;
    }
    return true;
  };
  const identify = element => {
    const hooked = element.closest('[data-presentation-entity], [data-presentation-node], [data-presentation-title], [data-presentation-caption], [data-presentation-marker], [data-presentation-progress-item], [data-presentation-toc-item], [data-presentation-prev], [data-presentation-next], [data-presentation-mode-toggle], [data-presentation-attribution]') ?? element;
    const hooks = [...hooked.attributes].filter(a => a.name.startsWith('data-presentation-')).map(a => `[${a.name}${a.value ? `="${a.value}"` : ''}]`).join('');
    return `${hooks || element.tagName.toLowerCase()} ${JSON.stringify(element.textContent.trim().replace(/\s+/g, ' ').slice(0, 55))}`;
  };
  const chrome = '[data-presentation-title], [data-presentation-caption], [data-presentation-marker], [data-presentation-progress-item], [data-presentation-toc-item], [data-presentation-prev], [data-presentation-next], [data-presentation-mode-toggle], [data-presentation-attribution]';
  const candidates = [];
  for (const element of root.querySelectorAll('*')) {
    if (!visible(element) || element.closest('[data-presentation-allow-overlap]') || element.closest('svg, script, style')) continue;
    // Text ranges avoid treating the empty area of a labeled frame as text.
    const rects = [];
    if (element.matches(chrome)) rects.push(element.getBoundingClientRect());
    else for (const node of element.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      rects.push(...range.getClientRects());
    }
    if (rects.length) candidates.push({ element, rects });
  }
  for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
    const a = candidates[i], b = candidates[j];
    if (a.element.contains(b.element) || b.element.contains(a.element)) continue;
    if (a.rects.some(x => b.rects.some(y => Math.min(x.right, y.right) - Math.max(x.left, y.left) > 2 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 2))) {
      warn('overlap', `${identify(a.element)} intersects ${identify(b.element)}`);
    }
  }
  // Intrinsic control width varies with label length, even without active styling.
  const properties = ['color', 'backgroundColor', 'backgroundImage', 'borderTopColor', 'borderTopWidth', 'borderTopStyle', 'borderRadius', 'outline', 'boxShadow', 'opacity', 'fontWeight', 'fontSize', 'transform', 'textDecoration'];
  for (const hook of ['data-presentation-progress-item', 'data-presentation-toc-item']) {
    const items = [...root.querySelectorAll(`[${hook}]`)].filter(visible);
    const active = items.find(e => e.getAttribute('data-presentation-active') === 'true');
    const inactive = items.find(e => e.getAttribute('data-presentation-active') !== 'true' && e.parentElement === active?.parentElement);
    if (active && inactive) {
      const a = getComputedStyle(active), b = getComputedStyle(inactive);
      if (properties.every(property => a[property] === b[property])) warn('active-chrome', `[${hook}] active and inactive controls have indistinguishable computed visual styles`);
    }
  }
  const attribution = root.querySelector('[data-presentation-attribution]');
  if (!attribution || !visible(attribution)) warn('attribution', '[data-presentation-attribution] is missing or invisible; style this hook for legible attribution');
  else {
    const style = getComputedStyle(attribution);
    if (parseFloat(style.fontSize) < 11) warn('attribution', '[data-presentation-attribution] font size is under 11px; style this hook for legibility');
    if (['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color) && style.textDecorationLine.includes('underline')) warn('attribution', '[data-presentation-attribution] has browser-default link color and underline; style this hook locally');
  }
  const entities = [...root.querySelectorAll('[data-presentation-entity]')].map(element => ({ id: element.getAttribute('data-presentation-entity'), opacity: Number(getComputedStyle(element).opacity) }));
  return { warnings, entities };
}
