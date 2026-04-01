# Gemini Control Surface Root Revert

## Goal
Restore `.gemini/` as a real root-level runtime-plane directory.

## Revert
- source-of-truth reverted from `src/devtools/gemini/` back to `.gemini/`
- the root `.gemini` symlink shim was removed

## Reason
The structure philosophy was clarified as:
- `root = runtime plane`
- runtime control surfaces should remain rooted at the repository top level

Under that rule, `.gemini` should not have `src/` as its source-of-truth location.

## Current Rule
- `.gemini/` is a root runtime-plane directory
- do not relocate `.gemini/` under `src/`
- if documentation references the prior relocation, treat it as superseded by this revert note
