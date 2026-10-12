# Scene authoring guide

Model a talk as one scene that changes through named steps. Give persistent
entities stable IDs in `entities.ts`; use the same IDs in adjacent scenes so
layout transitions can morph in place. Keep adjacent states in a shared scene
group when they represent one evolving composition. New elements should enter
after continuing elements settle; removed elements should exit. Captions explain
the current step, and previous/next navigation must work.

Keep colors, typography, spacing, borders, shadows, and component treatment in
the talk's `styles.css`. The kit supplies behavior, geometry, and data hooks, not
a visual theme. Use the sample's named step modules, `Talk.tsx`, and registry
entry as structural examples. The sample's accumulate-only sequence is an
example of that talk's story, not a general composition constraint.
