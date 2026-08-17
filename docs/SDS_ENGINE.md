# SDS / chemicals engine (Phase 11)

Register on `chemicals` + `chemical_sds`. Locations use existing `locations`. Inventory is modest (`chemicals.inventory_qty` and `chemical_inventory` by location).

The **uploaded SDS file is authoritative**. The product does not invent GHS sections or extracted fields.

Files use `ehs-attachments` + `attachments` (`entity_type = chemical_sds`). Display is a **signed URL**, never a public object path.

Field QR encodes `/field/chemicals/[id]` — an authenticated deep link, not a public SDS.

## Surfaces

| Route | Role |
|---|---|
| `/app/chemicals` | Register + dashboard |
| `/app/chemicals/sds` | Current SDS list |
| `/app/chemicals/[id]` | SDS versions + inventory + QR |
| `/field/chemicals` | Search |
| `/field/chemicals/[id]` | Current SDS |

Feature: `chemical_sds` (alias `sds`). Permissions: `chemicals.view` / `chemicals.manage`.
