import { readFile } from "node:fs/promises";
export const REFERENCE_SLUG = "how-to-make-a-presentation";
export const reference = JSON.parse(
  await readFile(new URL("./reference-outline.json", import.meta.url), "utf8"),
);
export const SETTLE_MS = 880;
export function validateOutline(actual) {
  if (
    !Array.isArray(actual) ||
    actual.length !== reference.length ||
    reference.some((row, i) =>
      ["id", "era", "title", "caption"].some(
        (key) => actual[i]?.[key] !== row[key],
      ),
    )
  )
    throw new Error("sample: missing or malformed nine-step reference outline");
}
export const failureMessage = (phase, index, message) =>
  `${phase} at step ${index}: ${message}`;
export function validateCount(count) {
  if (!Number.isInteger(count) || count < 1)
    throw new Error("render: invalid step count");
  return count;
}
export function parseOptions(args) {
  const value = (name) => {
    const i = args.indexOf(name);
    return i < 0 ? undefined : args[i + 1];
  };
  return {
    slug:
      value("--presentation") ||
      (!args[0]?.startsWith("-") && args[0]) ||
      REFERENCE_SLUG,
    width: Number(value("--width") || 1440),
    height: Number(value("--height") || 900),
    settle: Number(value("--settle") || SETTLE_MS),
  };
}
