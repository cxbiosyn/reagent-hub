# Reagent Hub

Reagent Hub manages laboratory reagent inventory and connects digital storage records to recognizable physical locations.

## Laboratory space

**Laboratory map**:
An interactive, spatially recognizable representation of a laboratory, primarily used for orientation and locating reagents. It may reveal inventory details and exceptions, but those are secondary layers.
_Avoid_: Layout view, equipment diagram, inventory dashboard

**Storage device**:
A physically recognizable place that can contain reagents, such as a refrigerator, workbench, shelf, or cabinet.
_Avoid_: Card, rectangle, layout item

**Workbench**:
A storage-bearing laboratory bench identified in laboratory 903 by the canonical names Workbench A through Workbench E.
_Avoid_: Experimental table, numbered workbench

**Storage position**:
The smallest labeled physical location to which reagent inventory can be assigned and from which it can be retrieved.
_Avoid_: Cell, slot

**Spatial landmark**:
A recognizable fixed feature used to understand orientation and routes inside a laboratory, whether or not it stores reagents. Examples include doors, sinks, shakers, biosafety cabinets, fume hoods, ovens, and autoclaves.
_Avoid_: Decoration, storage device

**Primary entrance**:
The door most people use to enter a laboratory and the reference point from which its map is oriented. For laboratory 903, this is Door 2.
_Avoid_: Default door, map origin

## Navigation

**Laboratory overview**:
The top-level map that helps a person navigate from the primary entrance to a storage device or approximate workbench area. It deliberately does not expose individual storage positions.
_Avoid_: Canvas, overview mode

**Device detail**:
The internal view of a selected storage device or workbench area, used to locate inventory down to its storage position.
_Avoid_: Subpage, device mode

**Location trail**:
The continuous path from a laboratory, through a storage device, to a storage position. A reagent search remains active along this path so its target stays highlighted when moving from the laboratory overview into device detail.
_Avoid_: Breadcrumb

**Search destination**:
A storage device or workbench area containing inventory that matches the active reagent search. All destinations are highlighted simultaneously and each shows its local quantity, although multiple destinations for one reagent are expected to be uncommon.
_Avoid_: Search dot, primary result

## Inventory roles

**Point-of-use stock**:
Inventory kept in laboratory 903 for immediate experimental use. Its desired quantity depends on the reagent class rather than one universal low-stock threshold.
_Avoid_: Local stock, 903 stock

**Reserve stock**:
Inventory kept in laboratory 908 to replenish point-of-use stock in laboratory 903.
_Avoid_: Backup stock, 908 stock

**Replenishment reminder**:
An indication that point-of-use stock should be refilled from reserve stock. It is distinct from a purchase warning.
_Avoid_: Low-stock warning

**Purchase warning**:
An indication that available stock across its relevant locations is insufficient and external purchasing may be required.
_Avoid_: Replenishment reminder
