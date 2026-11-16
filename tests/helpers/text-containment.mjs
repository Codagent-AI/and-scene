// Shared by unit policy tests and production browser assertions. Entity type is
// deliberately not an input: every visible label gets the same bounds checks.
export function textContainment(text, owner, canvas, allowedOverlap = false) {
  const inside = box => text.left >= box.left - 1 && text.right <= box.right + 1 && text.top >= box.top - 1 && text.bottom <= box.bottom + 1
  return { fitsCanvas: inside(canvas), fitsOwner: !owner || allowedOverlap || inside(owner) }
}
