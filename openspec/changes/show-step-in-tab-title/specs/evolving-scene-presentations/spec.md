## ADDED Requirements

### Requirement: Tab title reflects the current step
A presentation SHALL show the viewer's current position in the browser tab title while it is mounted, enabled, and has at least one step. The title SHALL be `N / total`, where N is the 1-based position of the current step and total is the number of steps, or `N / total · <title>` when the host passed an explicit `title`. The presentation SHALL own the tab title only while it is mounted, enabled, and non-empty, and SHALL NOT overwrite a title the host set after the presentation last wrote it when it releases ownership. The displayed title follows the browser's whitespace normalization of `document.title`. A host SHALL be able to opt out of the tab title and to replace the whole title with its own.

#### Scenario: Position without a title
- **WHEN** a presentation with 12 steps and no explicit `title` is on its third step
- **THEN** the tab title is `3 / 12`

#### Scenario: Position with an explicit title
- **WHEN** a presentation with 12 steps is given `title="Quarterly Review"` and is on its third step
- **THEN** the tab title is `3 / 12 · Quarterly Review`

#### Scenario: Explicit title equal to the default
- **WHEN** a host passes `title="Presentation"` explicitly
- **THEN** the tab title includes the suffix, as in `3 / 12 · Presentation`

#### Scenario: Follows navigation in both modes
- **WHEN** the viewer moves to another step by keyboard, swipe, on-screen controls, or a direct jump, in either present or browse mode
- **THEN** the tab title updates to the new position
- **AND** toggling the mode alone does not change the tab title

#### Scenario: Raw numbering ignores the marker override
- **WHEN** a host's `marker` override numbers steps differently from their raw position
- **THEN** the tab title still uses the raw 1-based step position over the total step count

#### Scenario: Restored on unmount
- **WHEN** the presentation unmounts and the tab title is still the value it last wrote
- **THEN** the tab title returns to what it was before the presentation took ownership

#### Scenario: Host title is not overwritten
- **WHEN** the host changes the tab title while the presentation is mounted, and the presentation then releases ownership without writing again
- **THEN** the host's title is left in place

#### Scenario: Host title becomes the restore baseline after navigation
- **WHEN** the host changes the tab title, the presentation then writes a new step title, and the presentation later releases ownership
- **THEN** the title is restored to the host's value, not the title from before the presentation first took ownership

#### Scenario: Titles with surrounding whitespace restore correctly
- **WHEN** an explicit title or a host-supplied title function produces text with leading, trailing, or repeated spaces, and the presentation later releases ownership
- **THEN** the tab title is restored as for any other text, and is not left showing the presentation's title

#### Scenario: Empty deck
- **WHEN** a presentation has no steps
- **THEN** the tab title is not modified

#### Scenario: Deck becomes empty while mounted
- **WHEN** a mounted presentation that had written a tab title ends up with no steps
- **THEN** it releases ownership under the same restore rules as unmount

#### Scenario: Opt-out
- **WHEN** the host sets the `tabTitle` prop to `false`
- **THEN** the presentation never modifies the tab title
- **AND** if it had written a title before being disabled, it releases ownership under the same restore rules as unmount

#### Scenario: Host-supplied title replaces the whole title
- **WHEN** the host sets the `tabTitle` prop to a function of the current step index and the steps
- **THEN** the function's result replaces the entire tab title at each step

#### Scenario: Absent or empty title is not explicit
- **WHEN** a host omits `title`, passes `undefined`, or passes an empty string
- **THEN** the presentation treats it as no explicit title and shows only `N / total`
