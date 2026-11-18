// Pure geometry/style comparisons are shared by the browser helper and unit tests.
export function diagnose(elements, step) {
  const warnings = [];
  const warn = (kind, detail) => warnings.push({ step, kind, detail });
  const visible = elements.filter(
    (e) => e.width > 0 && e.height > 0 && !e.hidden,
  );
  const texts = visible.filter((e) => e.text && !e.allow);
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i],
        b = texts[j];
      if (a.ancestors?.includes(b.key) || b.ancestors?.includes(a.key))
        continue;
      if (
        Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
        Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1
      )
        warn("overlap", `${a.key} overlaps ${b.key}`);
    }
  for (const a of visible.filter((e) => e.active)) {
    const peers = visible.filter((e) => e.group === a.group && !e.active);
    if (
      peers.length &&
      peers.every(
        (b) => JSON.stringify(b.appearance) === JSON.stringify(a.appearance),
      )
    )
      warn("active", `indistinct active chrome ${a.key}`);
  }
  const attribution = visible.find((e) => e.attribution);
  if (!attribution)
    warn("attribution", "missing [data-presentation-attribution]");
  else if (attribution.fontSize < 11 || attribution.browserDefault)
    warn(
      "attribution",
      "style [data-presentation-attribution]: too small or browser-default",
    );
  return warnings;
}
export async function collectElements(page) {
  return page.evaluate(() => {
    const all = [...document.querySelectorAll("body *")];
    return all.flatMap((el, i) => {
      if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) return [];
      const s = getComputedStyle(el),
        r = el.getBoundingClientRect();
      const direct = [...el.childNodes].some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
      );
      if (
        !direct &&
        !el.hasAttribute("data-presentation-active") &&
        !el.hasAttribute("data-presentation-attribution")
      )
        return [];
      const key =
        el.getAttribute("data-presentation-entity") ||
        el.id ||
        `${el.tagName.toLowerCase()}-${i}`;
      const rects = [];
      // Text ranges avoid treating whitespace in large layout boxes as collisions.
      for (const n of el.childNodes)
        if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) {
          const range = document.createRange();
          range.selectNodeContents(n);
          rects.push(...range.getClientRects());
        }
      const box = rects.length
        ? {
            x: Math.min(...rects.map((r) => r.x)),
            y: Math.min(...rects.map((r) => r.y)),
            width:
              Math.max(...rects.map((r) => r.right)) -
              Math.min(...rects.map((r) => r.x)),
            height:
              Math.max(...rects.map((r) => r.bottom)) -
              Math.min(...rects.map((r) => r.y)),
          }
        : r;
      let hidden = false;
      for (let p = el; p; p = p.parentElement) {
        const c = getComputedStyle(p);
        if (
          c.display === "none" ||
          c.visibility === "hidden" ||
          Number(c.opacity) === 0
        )
          hidden = true;
      }
      const attr = el.hasAttribute("data-presentation-attribution");
      let browserDefault = false;
      if (attr) {
        const baseline = document.createElement("a");
        baseline.style.all = "revert";
        baseline.textContent = "reference";
        baseline.href = "#";
        document.body.append(baseline);
        const bs = getComputedStyle(baseline);
        browserDefault = s.color === bs.color && s.textDecorationLine === bs.textDecorationLine;
        baseline.remove();
      }
      return [
        {
          key,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          text: direct,
          hidden,
          allow: !!el.closest("[data-presentation-allow-overlap]"),
          active: el.getAttribute("data-presentation-active") === "true",
          group: el.closest("[data-presentation-progress]")
            ? "progress"
            : el.closest("[data-presentation-toc]")
              ? "toc"
              : null,
          appearance: {
            color: s.color,
            background: s.backgroundColor,
            border: s.border,
            fontWeight: s.fontWeight,
            opacity: s.opacity,
            outline: s.outline,
            shadow: s.boxShadow,
            transform: s.transform,
          },
          attribution: attr,
          fontSize: parseFloat(s.fontSize),
          browserDefault,
        },
      ];
    });
  });
}
