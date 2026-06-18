# Laboratory map design

## Purpose

The laboratory map is a searchable spatial map, not an inventory dashboard. Its priorities are:

1. Help a newcomer recognize and navigate the physical laboratory.
2. Locate the device or workbench area containing a reagent.
3. Open that area to locate the exact storage position.
4. Surface inventory exceptions without dominating the map.

## Confirmed behavior

- Laboratory 903 is oriented from Door 2, the primary entrance at the lower-right side of the map.
- The overview includes non-storage landmarks such as doors, sinks, shakers, the biosafety cabinet, fume hood, oven, autoclave, liquid-nitrogen tank, and waste area.
- In the resting state, a storage device shows only its name and device type.
- Hovering a storage device reveals an inventory summary.
- Searching highlights every storage device or workbench area containing the reagent and shows the quantity at each destination.
- Selecting a highlighted destination opens device detail and keeps the active search target highlighted down to the exact storage position.

## Visual model

Use a recognition-first schematic map:

- Preserve real adjacency, ordering, routes, and orientation from Door 2.
- Allow device sizes and spacing to depart from architectural scale when needed for readable labels and interaction targets.
- Give each equipment type a restrained, recognizable visual signature.
- Keep storage devices visually stronger than passive landmarks, because they are interactive destinations.
- Avoid both blueprint-level precision and decorative pseudo-3D illustration.

## Layout ownership

The laboratory 903 overview is a fixed, product-defined map. Ordinary users cannot move, resize, rotate, add, or remove its equipment and landmarks, and no layout-editing controls are shown for 903.

Laboratory 908 is outside the first-phase scope and retains its current behavior. Its map and editing model will be reconsidered in phase two.

## Laboratory 903 labels

The four 4°C refrigerators along the left side are named, from top to bottom:

1. 4°C Refrigerator 1
2. 4°C Refrigerator 2
3. 4°C Refrigerator 3
4. 4°C Refrigerator 4

The single −20°C and −80°C freezers do not require numeric suffixes.

## Interaction boundaries

Only the storage-bearing portion of a workbench is an interactive destination. Attached sinks remain visible as spatial landmarks but are not clickable, do not open device detail, and are never included in reagent-search highlighting.

Seated and floor-standing shakers follow the same rule: they are visible, non-interactive landmarks and are excluded from reagent-search highlighting.

The fume hood, biosafety cabinet, oven, and autoclave are also non-interactive landmarks. They do not contain reagent inventory, open detail views, or receive search highlighting.

The liquid-nitrogen tank and waste area are non-interactive landmarks under the same rule.

The complete set of interactive destinations in laboratory 903 is:

- 4°C Refrigerator 1–4
- −20°C Freezer
- −80°C Freezer
- The storage-bearing portions of Workbenches A–E

The canonical workbench names are Workbench A through Workbench E. Numeric labels from the supplied floor-plan sketch are not used in the product.

The sketch-to-product mapping is:

- Workbench 4 → Workbench A
- Workbench 3 → Workbench B
- Workbench 2 → Workbench C
- Workbench 1 → Workbench D
- Workbench 5 → Workbench E

## Resting-state disclosure

Interactive destinations show only their name and equipment type on the map. On hover, a compact summary shows:

- Device name
- Number of reagent types
- Total inventory units
- “Click to view exact storage positions”

The overview does not list individual reagent names in the hover summary.

## Search state

When a reagent search has matches:

- Non-matching interactive destinations and passive landmarks fade to approximately 35% visual prominence.
- Every matching destination receives a blue outline and restrained glow.
- Each matching destination displays the reagent name and its local quantity.
- Multiple destinations remain highlighted simultaneously.
- No walking route or path line is drawn.
- Door 2 remains visible as the orientation anchor.

When the search has no destination in laboratory 903, distinguish:

- The reagent exists and laboratory 908 has inventory: “No stock in 903; X units available in the 908 reserve.”
- The reagent exists but neither laboratory has inventory: “Currently out of stock.”
- No reagent matches the query: “Reagent not found.”

## Page structure

The laboratory 903 page contains, from top to bottom:

1. The 903 / 908 location switcher
2. The title “903 Laboratory Map” and the orientation note “Viewed from Door 2”
3. A prominent reagent search field
4. The map
5. A compact legend footer outside the map canvas for interactive storage areas, passive landmarks, and search matches

The page has no persistent equipment list. For laboratory 903, the layout-editing and restore-default-layout controls are removed.

## Phase-one acceptance criteria

- A newcomer can identify Door 2, the main aisles, all major landmarks, six freezers/refrigerators, and Workbenches A–E without opening another view.
- Only inventory-bearing areas respond to hover and click.
- Hovering an interactive destination shows its compact inventory summary.
- A reagent search highlights all matching destinations and displays the local quantity at each one.
- Opening a matching destination preserves the search and highlights the exact storage position.
- The three no-destination search outcomes are clearly distinguished.
- Laboratory 908 behavior is unchanged.
- No low-stock, replenishment, or purchase-warning indicators appear in phase one.
- All landmark artwork remains clipped and scaled within its equipment boundary at supported window sizes.
- The legend never overlaps the map canvas.

## Selected visual direction

Variant A, the calm schematic map, is the selected direction for production.

Two corrections are required in the production implementation:

- Icons and internal artwork, particularly for the biosafety cabinet, must remain contained within the equipment boundary.
- The legend must live in a dedicated footer outside the map canvas so it cannot obscure equipment, landmarks, entrances, or search results.

## Implementation status

Phase-one behavior is implemented in the production `LayoutView`:

- Laboratory 903 uses the fixed recognition-first map and has no layout controls.
- Device summaries, search destinations, quantities, and no-destination outcomes use live inventory data.
- Search state persists into device detail and highlights matching shelf or drawer positions.
- Legacy single-column position labels remain compatible.
- Laboratory 908 continues to use the existing configurable overview.

## Deferred: inventory signals

A single universal low-stock rule is not appropriate:

- Ambient reagents in laboratory 903 normally have a point-of-use quantity of one. Reaching zero means replenishment from reserve stock in laboratory 908, not necessarily purchasing.
- Enzymes stored in the laboratory 903 −20°C freezer may have many tubes and can use a meaningful low-stock threshold.
- Kits are intentionally purchased in small quantities, commonly two or three, and should not produce routine low-stock noise.

The map should distinguish a replenishment reminder from a purchase warning rather than presenting both as generic low stock.

For ambient reagents, inventory in laboratory 908 is reliable enough to determine the action:

- 903 quantity is zero and 908 has stock: show a replenishment reminder.
- Both 903 and 908 quantities are zero: show a purchase warning.

Inventory warnings are explicitly excluded from the first implementation phase. Phase one focuses on spatial recognition, reagent search, and progressive navigation into exact storage positions. Replenishment rules, purchase rules, reagent classification, and per-class inventory strategies will be designed in a second phase.
