# Shared design system

`design-system/` contains domain-independent React primitives: buttons, form fields, feedback, layout, and SVG icons. It must never import feature modules or DSH integration. Modules supply translated strings and handlers; shared components only render and dispatch them. Icons use `currentColor` so they follow surrounding text across themes.

Settings layouts include accessible cards, tab navigation, and native disclosure sections. Keep `<details>/<summary>` keyboard behavior and ARIA semantics when changing a subsection; headings and icons should not become separate unlabeled controls. Shared primitives should not own persisted settings, product policy, or translation catalogs.
