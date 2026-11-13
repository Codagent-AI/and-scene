export function diagnostics({ texts, active, attribution }, step) {
  const warnings = [];
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i],
        b = texts[j];
      if (a.allowed || b.allowed) continue;
      // Ordinary chrome containment is not a collision (e.g. a label in a button).
      if (
        (a.kind === "chrome" || b.kind === "chrome") &&
        (a.lineage?.includes(b.owner) || b.lineage?.includes(a.owner))
      )
        continue;
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
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        Number(style.opacity) === 0
      )
        return false;
    }
    return true;
  };
  const texts = [];
  const owners = new WeakMap();
  let sequence = 0;
  const owner = (el) => {
    if (!owners.has(el)) owners.set(el, ++sequence);
    return owners.get(el);
  };
  const lineage = (el) => {
    const ids = [];
    for (let node = el; node; node = node.parentElement) ids.push(owner(node));
    return ids;
  };
  const identity = (el) => ({
    owner: owner(el),
    lineage: lineage(el),
    allowed: !!el.closest("[data-presentation-allow-overlap]"),
  });
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
          ...identity(el),
          kind: "text",
          rect: { x: r.x, y: r.y, w: r.width, h: r.height },
        });
  }
  const chromeSelectors = [
    "[data-presentation-header]",
    "[data-presentation-footer]",
    "[data-presentation-toc]",
    "[data-presentation-controls]",
    "[data-presentation-progress]",
    "[data-presentation-mode-toggle]",
    "[data-presentation-attribution]",
    "[data-presentation-controls] button",
    "[data-presentation-toc] button",
    "[data-presentation-progress] button",
  ];
  for (const el of document.querySelectorAll(chromeSelectors.join(","))) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    texts.push({
      name: `chrome: ${el.getAttribute("aria-label") || el.getAttributeNames().find((name) => name.startsWith("data-presentation-")) || el.tagName.toLowerCase()}`,
      kind: "chrome",
      ...identity(el),
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
    // A fresh document supplies UA defaults without inheriting host anchor rules.
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText =
      "position:absolute;width:0;height:0;border:0;visibility:hidden";
    document.body.append(frame);
    try {
      const probe = frame.contentDocument.createElement("a");
      probe.href = "#";
      probe.textContent = "probe";
      frame.contentDocument.body.append(probe);
      const s = getComputedStyle(a),
        d = frame.contentWindow.getComputedStyle(probe);
      attribution = {
        size: parseFloat(s.fontSize),
        styled: [
          "color",
          "fontFamily",
          "fontSize",
          "fontWeight",
          "textDecorationLine",
          "letterSpacing",
        ].some((key) => s[key] !== d[key]),
      };
    } finally {
      frame.remove();
    }
  }
  return { texts, active, attribution };
}
