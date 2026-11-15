# Scene primitives

Give every continuing primitive a stable `entityId`. Its outer motion element
retains that identity while layout changes animate. Text supplied as string or
number children cross-fades inside this element; `label="..."` also provides an
animated label alongside arbitrary children or an icon. Outgoing label text is
hidden from accessibility APIs during its exit.

Supply `emphasis={{ scale: 1.05, borderColor: '#...' }}` to animate changes in
presentation-owned visual values. The kit provides transition timing, not a
palette or emphasis appearance. Use `animate`/`transition` for custom Motion
behavior; explicit author props override the defaults. Complex label markup can
compose a nested Label primitive or author-owned motion elements.

For viewports shorter than 500px, the stage and chrome use document flow instead
of subtracting fixed header/footer reserves. Browse chrome remains available;
the page can scroll vertically when it cannot all fit at once. The stage uses
40% of viewport height in browse and 60% in present, and keeps uniform scaling.
No positive scale floor forces the canvas to overflow its available pixels.
