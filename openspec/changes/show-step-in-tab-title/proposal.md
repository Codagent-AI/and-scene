## Why

A presenter who switches to another tab (notes, a demo, a video call) has no way to tell where they are in the deck while that other tab is active: the browser tab always shows the static `index.html` title. The on-page header marker already shows position once they are back on the deck, so the benefit here is orientation *while another tab is active*, visible from the tab strip or window switcher. Presenter orientation is a core use of the product, and the change is small and low-risk.

## What Changes

- While a presentation is mounted, enabled, and non-empty, the kit sets `document.title` to the current step position: `"N / total"` (for example `3 / 12`), or `"N / total · <title>"` when the host passed an explicit `title` prop to `Presentation`.
- N is the 1-based raw step index and total is `steps.length`. It counts every navigable step, matching the footer progress controls' accessible step numbers. The value updates on every step change, in both browse and present modes.
- Title ownership: the kit owns `document.title` only while it is enabled and the deck is non-empty. It captures the prior title when it takes ownership and releases on disable, empty deck, or unmount. On release it restores the prior title only if the current title still matches what the kit last wrote (compared against the browser's read-back value, since `document.title` normalizes whitespace), so a host title set just before release is not overwritten. If a host writes the title and the kit then updates it for navigation, the kit's write replaces the host's, and the host's value becomes the baseline restored on later release; protection applies at release, not during later navigation. Hosts that manage `document.title` themselves should opt out.
- Hosts can opt out or customize through a new optional `Presentation` prop. A customization callback's return value replaces the entire tab title.
- Accepted tradeoff: a host that omits `title` loses its descriptive static tab title and gets only numbers. Default-on is kept because the talk template already supplies a title. Hosts resyncing the vendored kit can use the opt-out to keep existing behavior.
- The change lands in `src/presentation-kit/` and is mirrored byte-for-byte into the bootstrap template kit copy.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `evolving-scene-presentations`: adds a requirement that the browser tab title reflects the current step position, with ownership/restore rules, alongside the existing step navigation requirements.

## Technical Approach

`Presentation.tsx` already owns the step index via `usePresentationNav` and the `title` prop, so a small effect there (or a tiny kit hook such as `useTabTitle`) is the natural home. It writes `document.title` when step, total, or title changes and applies the ownership rules above on cleanup. No new dependency, no CSS, and no change to the style-neutral kit contract or the `data-presentation-*` hooks. A general multi-owner title manager is unnecessary.

Details for design:

- `title` currently defaults to `'Presentation'` and is used for `data-presentation`. The tab-title suffix must key off the raw prop, kept separate from that fallback, so an explicit `title="Presentation"` still receives a suffix. Behavior for `undefined` and empty-string titles is defined in design.
- The opt-out/customize prop shape (for example `tabTitle?: false | ((index, steps) => string)`) is left to design.
- Numbering deliberately ignores the `marker` override: the marker may return arbitrary strings and skip chrome cards, so it cannot supply a numerator compatible with `steps.length`. The tab number can therefore differ from the on-screen marker (for example "01" on screen, "2 / 12" in the tab). The customization callback is the supported way to align alternate numbering; the kit will not parse marker strings or combine a filtered numerator with an unfiltered denominator.

## Out of Scope

- Favicon changes or badges.
- A new per-step metadata field or authoring workflow for tab titles (the customization callback is the only escape hatch).
- URL hash or history sync.
- Following the `marker` override for tab numbering.
- A multi-owner `document.title` manager.
- Changing existing `data-presentation-*` hooks or step navigation behavior, including the existing navigation-index problem when a mounted deck becomes empty and is repopulated (navigation keeps its index and can reach `-1`); that is a separate follow-up.

## Impact

- Code: `src/presentation-kit/Presentation.tsx` (plus a possible new hook file and tests), and the identical files under `skills/presentation/templates/bootstrap/src/presentation-kit/`, enforced by the snapshot parity tests.
- Docs: `skills/presentation/SKILL.md` and any scaffold docs that list `Presentation` props get a mention of the tab-title behavior and opt-out. No `presentation-skill` spec requirement changes.
- Verification: if `scripts/verify.mjs` gains a tab-title assertion, it must target a known default-format fixture, not every registered presentation, since customized and opted-out decks are legitimate; keep it aligned with its bootstrap template copy.
- Users: every presentation gains the new tab title by default. Hosts that rely on their own `document.title` need the opt-out prop.
