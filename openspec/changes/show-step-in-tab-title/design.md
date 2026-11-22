## Context

`Presentation` (`src/presentation-kit/Presentation.tsx`) owns step state through `usePresentationNav` and takes an optional `title` prop (default `'Presentation'`, used only for the `data-presentation` attribute) and a `marker` callback `(index, steps) => string`. Nothing in the kit touches `document.title`; `index.html` hardcodes `<title>and-scene</title>`. `Presentation` renders an early return for an empty deck, after all hooks have run.

`src/presentation-kit/` must stay byte-aligned (non-test files) with `skills/presentation/templates/bootstrap/src/presentation-kit/`; parity tests enforce it. The kit is style-neutral and adds no dependencies.

## Goals / Non-Goals

**Goals:**
- Reflect the current step in the browser tab title per the `evolving-scene-presentations` delta spec "Tab title reflects the current step".
- Never clobber a title the host set; restore the original on release.
- Keep the change small, dependency-free, and mirrored into the bootstrap template.

**Non-Goals:**
- Favicon or badge changes, URL/hash sync, a per-step metadata field, a multi-owner title manager, following the `marker` override, or any `verify.mjs` change.

## Approach

New hook `src/presentation-kit/useTabTitle.ts`, exported from `index.ts`:

```ts
useTabTitle(text: string | null): void
```

A single `useEffect` keyed on `text`. When `text` is `null` or `document` is undefined it does nothing. Otherwise it captures `prior = document.title`, sets `document.title = text`, then captures `written = document.title` (the read-back value, because the browser strips and collapses whitespace). Its cleanup restores `prior` only if `document.title === written`, meaning nothing else has changed it since the kit wrote it. If the host changed the title in between, the cleanup skips the restore, and the next write captures the host's value as its new `prior`.

Baseline rule: protection applies when the kit releases ownership, not during later navigation. Sequence original O → kit A → host H → navigation writes kit B → unmount restores H (the baseline captured at B's write), not O. A host write immediately before release is left in place.

Wiring in `Presentation.tsx`, with the hook called before the empty-deck early return so hook order is stable:

```ts
const tabText =
  tabTitle === false || steps.length === 0 ? null
  : typeof tabTitle === 'function' ? tabTitle(step, steps)
  : `${step + 1} / ${steps.length}${title ? ` · ${title}` : ''}`
useTabTitle(tabText)
```

- New prop `tabTitle?: false | ((index: number, steps: Step<P>[]) => string)`. `false` opts out; a function's return value replaces the whole title. It mirrors the `marker` callback signature.
- `title` loses its destructuring default so the raw value is available for the suffix. `data-presentation` uses `title ?? 'Presentation'`, leaving that attribute unchanged. An explicit `title="Presentation"` is therefore suffixed; `undefined` and `""` mean no suffix.
- Release paths (opt-out, empty deck, unmount) all pass through the same effect cleanup.

## Decisions

- **One prop, not two.** `tabTitle` combines opt-out and customization (`false | fn`) rather than a boolean plus a formatter. It is one prop and follows the existing `marker` pattern.
- **Restore only if unchanged.** Comparing against the kit's last read-back write avoids overwriting a host title set just before release without a stored ownership registry. Comparing against the raw `text` would fail for titles with leading, trailing, or repeated whitespace.
- **Raw numbering.** The tab uses `step + 1` over `steps.length`, ignoring `marker`, because `marker` may return arbitrary strings and skip chrome cards. `tabTitle` is the escape hatch for alternate numbering.
- **Empty-string `title` means no explicit title.** A dangling `·` would look broken.
- **No `verify.mjs` change.** Unit tests cover the behavior; avoiding it also avoids a matching template-script edit.

## Risks / Trade-offs

- Each step change restores then rewrites the title synchronously inside effects, so nothing paints between; the cost is trivial.
- React Strict Mode double-invokes effects; restore-then-rewrite is idempotent.
- If two presentations were mounted at once, the last writer wins. Out of scope.
- Existing limitation, not addressed here: `usePresentationNav` keeps its index when the step count changes, and advancing on an empty deck sets it to `-1`, so a deck that becomes empty and is later repopulated can fail to render. This change only guarantees the title is released cleanly when the deck goes empty; fixing navigation is a separate follow-up.
- A host that omits `title` loses its descriptive static tab title (accepted in the proposal); hosts can opt out with `tabTitle={false}`.

## Migration Plan

Default-on and additive. Hosts that manage `document.title` themselves, or that resync the vendored kit and want the old behavior, pass `tabTitle={false}`. Rollback is removing the hook call and prop. Document the prop in `skills/presentation/SKILL.md` and in the scaffold's list of `Presentation` props (one line each).

## Testing

Written first, per the repo's TDD rule.
- `useTabTitle.test.ts`: writes the text, restores on unmount, does not clobber a host title set just before release, does nothing for `null`, and handles whitespace (text with leading, trailing, or repeated spaces still restores correctly across title changes and Strict Mode cleanup).
- `Presentation.test.tsx`: default `N / total` format; explicit-title suffix; explicit `title="Presentation"` suffixed; empty-string title unsuffixed; updates on navigation in both browse and present modes; `marker` override does not affect the tab number; empty deck leaves the title untouched; `tabTitle={false}` never modifies it; function `tabTitle` replaces the whole title (including output with surrounding whitespace).
- Mirror non-test kit files into the bootstrap template; existing snapshot parity tests cover alignment.
- Final gate: `npm test`, `npm run lint`, `npm run build`, `npm run verify`.
