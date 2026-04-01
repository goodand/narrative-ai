# Project Domain Registry

`registry/` is the synchronization surface for project-domain state.
Use it for indices, path maps, and status references that multiple actors must align against.

## Good Fits
- current domain path maps
- active experiment index records
- status pointers for domain truth that changes over time
- machine-readable references to current specs or canonical materials

## Not For
- the spec documents themselves
- reports
- checklists
- reusable materials

Those belong in `resources/`.
