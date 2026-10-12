---
name: presentation
description: Creates and modifies evolving-scene React presentations. Use when asked to "create a presentation", "build a talk", "add steps", "modify a presentation", "scaffold", or "resync the presentation scene-kit scaffold".
---

# Presentation skill

Use this skill to create and modify step-based presentations hosted by the
React/Vite scene kit. Follow the detailed procedures and safety rules in
[the workflow reference](references/workflow.md), the examples in
[the authoring guide](references/authoring.md), and the templates beside this
file. Resolve template paths from this file's directory, not the caller's
working directory.

## Workflow

1. **Gather:** Collect the topic, visual direction, and step content that the
   user has not already provided. Follow the partial-detail and clarification
   rules in the workflow reference.
2. **Resolve and scaffold:** Inspect the target, identify the build, scene-kit,
   and registry anchors, then reuse or add only what is needed. Follow the
   target selection and write-safety procedure in the workflow reference.
3. **Create or modify:** Read the existing registry, one talk, its entities,
   and one step module before editing an existing app. Match its import paths,
   ID prefixes, CSS naming, and registry style. Follow the authoring guide and
   use the bundled templates for new files.
4. **Verify:** Run the build, browser verification, and inspection commands in
   the workflow reference. Fix failures and rerun until clean; inspect the
   required screenshots and warnings before reporting.
5. **Report:** Use the completion report format below. Report only results you
   observed.

## Generated talk layout

Create each talk under `<presentations-dir>/<slug>/`:

```text
<slug>/
├── entities.ts
├── Talk.tsx
├── styles.css
└── steps/
    ├── 01-introduction.tsx
    └── ...
```

Add one loader entry for the talk in the presentation registry. Keep its
visual styling local to the talk.

## Completion report format

```text
Talk: <slug>
Route: <route>
Commands:
- `<command>` — <result>
Screenshots: <directory or paths>
Warnings:
- <warning, or "None">
Visual review: <first, last, dense/key, and narrow viewport as applicable>
```

## Out of scope

- Static slide decks and PowerPoint/PDF export: use a slide-authoring tool or
  export workflow designed for those formats.
- Non-React or non-Vite hosts: use the host's presentation tooling.
- Changing the scene kit's core behavior or visuals: use the kit maintenance
  workflow/repository. This skill changes presentation-owned content and
  styling while consuming the kit contract.
