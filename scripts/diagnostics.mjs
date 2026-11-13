export function diagnostics({ texts, active, attribution }, step) {
  const warnings = [];
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i],
        b = texts[j];
      if (a.allowed || b.allowed) continue;
      const overlap =
        Math.min(a.rect.x + a.rect.w, b.rect.x + b.rect.w) -
          Math.max(a.rect.x, b.rect.x) >
          1 &&
        Math.min(a.rect.y + a.rect.h, b.rect.y + b.rect.h) -
          Math.max(a.rect.y, b.rect.y) >
          1;
      if (overlap) warnings.push(`step ${step} overlap: ${a.name} / ${b.name}`);
    }
  for (const item of active)
    if (!item.distinct)
      warnings.push(`step ${step} indistinct active ${item.kind}`);
  if (!attribution || attribution.size < 11 || !attribution.styled)
    warnings.push(
      `step ${step} attribution: style [data-presentation-attribution] for legibility`,
    );
  return warnings;
}
export function collectDiagnostics() {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    for (let ancestor = el; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    }
    return true;
  };
  const texts = [];
  const walker = document.createTreeWalker(
    document.querySelector("[data-presentation]") ?? document.body,
    NodeFilter.SHOW_TEXT,
  );
  while (walker.nextNode()) {
    const node = walker.currentNode,
      el = node.parentElement;
    if (!el || !node.textContent.trim() || !visible(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of range.getClientRects())
      if (r.width && r.height)
        texts.push({
          name: node.textContent.trim().slice(0, 70),
          allowed: !!el.closest("[data-presentation-allow-overlap]"),
          rect: { x: r.x, y: r.y, w: r.width, h: r.height },
        });
  }
  const signature = (el) => {
    const s = getComputedStyle(el);
    return [
      s.color,
      s.backgroundColor,
      s.borderBottomColor,
      s.borderBottomWidth,
      s.fontWeight,
      s.opacity,
      s.boxShadow,
      s.transform,
    ].join("|");
  };
  const active = [];
  for (const [kind, selector] of [
    ["progress", "[data-presentation-progress]"],
    ["toc", "[data-presentation-toc]"],
  ]) {
    const root = document.querySelector(selector),
      current = root?.querySelector('[data-presentation-active="true"]'),
      others = [
        ...(root?.querySelectorAll('[data-presentation-active="false"]') ?? []),
      ];
    if (current && visible(current) && others.length)
      active.push({
        kind,
        distinct: others.every((el) => signature(el) !== signature(current)),
      });
  }
  const a = document.querySelector("[data-presentation-attribution]");
  let attribution = null;
  if (a && visible(a)) {
    const s = getComputedStyle(a),
      probe = document.createElement("a");
    probe.href = "#";
    probe.textContent = "probe";
    document.body.append(probe);
    const d = getComputedStyle(probe);
    attribution = {
      size: parseFloat(s.fontSize),
      styled:
        s.color !== d.color ||
        s.fontFamily !== d.fontFamily ||
        s.textDecorationLine !== d.textDecorationLine,
    };
    probe.remove();
  }
  return { texts, active, attribution };
}
