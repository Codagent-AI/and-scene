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
