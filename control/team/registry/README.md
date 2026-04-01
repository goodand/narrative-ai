# Team Registry

`registry/` under `team/` is for team-wide synchronization state.
It should answer "what is the current aligned state?" rather than store the artifacts themselves.

Primary path map:
- `control/team/registry/control-plane-path-map.json`

## Good Fits
- ownership maps
- current team path maps
- coordination metadata
- active compatibility or migration registries

## Not For
- team rules
- migration reports
- reusable templates

Those belong in `resources/`.
