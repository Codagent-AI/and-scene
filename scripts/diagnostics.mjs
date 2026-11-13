export function overlapWarnings(items, step) {
  const warnings = [];
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i],
        b = items[j];
      if (
        a.visible &&
        b.visible &&
        !a.allow &&
        !b.allow &&
        Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
        Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1
      )
        warnings.push(`step ${step}: overlap ${a.name} / ${b.name}`);
    }
  return warnings;
}
export function chromeWarnings(items, step) {
  return ["progress", "toc"].flatMap((kind) => {
    const active = items.find((i) => i.kind === kind && i.active),
      inactive = items.filter((i) => i.kind === kind && !i.active);
    return active && inactive.some((i) => i.signature === active.signature)
      ? [`step ${step}: indistinct active ${kind} chrome`]
      : [];
  });
}
export function attributionWarnings(item, step) {
  const browserDefault =
    item &&
    /rgb\(0, 0, 238\)|rgb\(85, 26, 139\)/.test(item.color) &&
    item.decoration.includes("underline");
  return !item || item.fontSize < 11 || browserDefault
    ? [
        `step ${step}: unpolished attribution; style [data-presentation-attribution] (missing, too small or browser-default)`,
      ]
    : [];
}
export async function inspectPage(page, step) {
  const data = await page.evaluate(() => {
    const visible = (el) => {
      if (!el.getClientRects().length) return false;
      for (let parent = el; parent; parent = parent.parentElement) {
        const s = getComputedStyle(parent);
        if (
          s.visibility === "hidden" ||
          s.display === "none" ||
          Number(s.opacity) === 0
        )
          return false;
      }
      return true;
    };
    const texts = [];
    const walker = document.createTreeWalker(
      document.querySelector("[data-presentation-root]"),
      NodeFilter.SHOW_TEXT,
    );
    let text;
    while ((text = walker.nextNode())) {
      const el = text.parentElement;
      if (
        !text.textContent.trim() ||
        !visible(el) ||
        el.closest("script,style")
      )
        continue;
      const range = document.createRange();
      range.selectNodeContents(text);
      const rect = range.getBoundingClientRect();
      texts.push({
        name: `${el.getAttribute("data-presentation-entity") || el.tagName}: ${text.textContent.trim().slice(0, 50)}`,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        visible: true,
        allow: !!el.closest("[data-presentation-allow-overlap]"),
      });
    }
    const chrome = [
      ...document.querySelectorAll(
        "[data-presentation-progress-entry],[data-presentation-toc-entry]",
      ),
    ]
      .filter(visible)
      .map((el) => {
        const s = getComputedStyle(el);
        return {
          kind: el.hasAttribute("data-presentation-progress-entry")
            ? "progress"
            : "toc",
          active: el.getAttribute("data-presentation-active") === "true",
          signature: JSON.stringify([
            s.color,
            s.backgroundColor,
            s.borderColor,
            s.borderWidth,
            s.fontWeight,
            s.opacity,
            s.boxShadow,
            s.textDecoration,
            s.transform,
          ]),
        };
      });
    const a = document.querySelector("[data-presentation-attribution]");
    const s = a && visible(a) ? getComputedStyle(a) : null;
    return {
      texts,
      chrome,
      attribution: s
        ? {
            fontSize: parseFloat(s.fontSize),
            color: s.color,
            fontFamily: s.fontFamily,
            decoration: s.textDecoration,
          }
        : null,
    };
  });
  return [
    ...overlapWarnings(data.texts, step),
    ...chromeWarnings(data.chrome, step),
    ...attributionWarnings(data.attribution, step),
  ];
}
