# Gemini Control Surface Relocation

## Goal
Relocate the `.gemini` control surface into `src/` while preserving the root `.gemini` path required by Gemini CLI and related tooling.

## Source-of-truth Move
- `.gemini/`
  -> `src/devtools/gemini/`

## Legacy Strategy
The root `.gemini` path is preserved as a symlink shim:
- `.gemini` -> `src/devtools/gemini`

This keeps tools that expect `.gemini/settings.json` at the repository root working without changing their lookup behavior.

## Reasoning
- The user requested the Gemini control surface to live under `src/`
- Existing evidence shows Gemini CLI and related logs expect the root `.gemini/settings.json` path
- A direct move without a shim would break that expectation

## Rule
- Edit the source-of-truth files under `src/devtools/gemini/`
- Treat root `.gemini` as a compatibility surface only
