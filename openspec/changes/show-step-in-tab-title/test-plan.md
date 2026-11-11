## Coverage Strategy

Specifications remain the source of unit-test requirements. This plan records only additional
integration and end-to-end obligations, the acceptance testing envelope, and exceptional human-only
obligations.

The unit tests in the design (hook tests in `useTabTitle.test.ts` and component tests in
`Presentation.test.tsx`) cover the format, explicit-title, empty-deck, opt-out, custom-function, and
marker-independence scenarios. One integration test covers the wiring that can fail across
components. No E2E test is warranted: the behavior does not depend on layout, scaling, or rendering,
and jsdom's `document.title` has the same observable semantics as a browser's.

## Integration Tests

### INT-001: Tab title through real navigation under Strict Mode
- Covers: "Tab title reflects the current step", mainly the follows-navigation and restore-on-unmount scenarios.
- Boundary: the real `Presentation` with its real `usePresentationNav` keyboard handlers, rendered inside `React.StrictMode`, against jsdom's `document.title`.
- Setup: a short multi-step deck; `document.title` set to a sentinel value O before rendering. Each lifecycle below is a separate test with its own render.
- Action and assertions, per lifecycle:
  - Ordinary: press the real keys (Right, Left, and `P` to toggle mode); the title tracks the step in both modes; after unmount the title is O and Strict Mode's double-invoked effects have not corrupted it.
  - Host write immediately before release: the host sets H, then the presentation unmounts without navigating; the title stays H.
  - Host write then navigation: the host sets H, the user navigates (the kit writes a new step title), then unmount; the title is H, the baseline captured at the kit's next write.
  - Whitespace: an explicit title or `tabTitle` function output with leading, trailing, or repeated spaces; after unmount the title is O.
- Execution: Vitest alongside `src/presentation-kit/Presentation.test.tsx`, run by `npm test`.

## End-to-End Tests

None. See Coverage Strategy.

## Acceptance Testing Envelope

- Environments and sandboxes: the local Vite dev server on `127.0.0.1`, driven with `chrome-devtools-axi`; the reference deck is `how-to-make-a-presentation`.
- Credentials and secrets: none needed.
- Authorized effects: local only. Starting and stopping the dev server and writing screenshots to the scratchpad are allowed; nothing generated may be committed.
- Off limits: the network beyond localhost; committing generated screenshots or build output.
- Permitted substitutes: None.
- Known risk areas: decks that omit `title` now show only numbers (accepted tradeoff); tab numbering can differ from the on-screen marker (accepted limitation); a host setting `document.title` on its own (including between kit writes); Strict Mode double effects; several decks or tabs open at once, where the last writer wins (out of scope); the existing navigation-index problem when a mounted deck becomes empty and is repopulated (not addressed by this change).

## Human-Only Testing

None.

## Coverage Map

| Requirement or journey | INT | E2E | HT |
| --- | --- | --- | --- |
| Tab title reflects the current step | INT-001 | — | — |
