# Composition and styling checklist

Use during the verify stage, on the first step, the last step, every dense step, and (if responsive-sensitive) narrow.

- Everything important sits inside the 880 x 380 canvas; nothing is clipped or tiny.
- No entity text collides with another entity, the caption, progress dots, ToC or navigation.
- Overlaps that are intentional (a label over a frame, a chip on a box) are readable and carry
  `data-presentation-allow-overlap` on that element only.
- Persisting entities keep id and position; newcomers are added where there is room.
- The active step in progress, ToC and nav is visibly different from inactive items.
- Attribution is >= 12px, deliberately colored, not default link styling.
- Colors, fonts, spacing and borders live in the presentation's CSS, not in the kit.
- Each step has a caption that explains what changed.
