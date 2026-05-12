# Slice 3c-2 Controller Mapping (Input + Result)

Audit date: 2026-05-09

Reference docs:
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:463-483` — Input controller contract.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:485-519` — Result controller and `formatCaption` contract.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:670-672` — Component conversion table for DropZone/InputManager/ResultViewer.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:65-71` — `AiPort`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:101-115` — `ClipboardPort`, `SharePort`, `ImageProcessorPort`.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:16-27` — Adapter decision log, especially AiPort and ClipboardPort.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:272-282` — Slice 3a decision resolutions.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3b-controller-mapping.md:224-232` — Slice 3b decision resolutions.
- `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3c1-controller-mapping.md:21-32` — Slice 3c-1 surfaced AI split decisions.

## 0. Decisions To Surface

| # | Question | Options | Source alignment | Existing-doc alignment |
|---|---|---|---|---|
| 1 | When does `input.setTextFields({ meaning, tags })` run, and what is the source of truth? | A) Store is single truth; UI calls `setTextFields` on keystroke/blur. B) UI remains truth; `getInputData()` reads DOM snapshot. C) Hybrid; UI local during typing, sync on blur/submit. | Current source aligns with B: `InputManager.getInputData()` reads DOM fields at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:81-88`. There is no source event that writes meaning/tags into store. Text inputs are rendered at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:48-54`. | Instruction aligns with A or C because it requires meaning/tags state writes and `input.setTextFields` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:467-480`. Core store already has `input.meaning` and `input.tags` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:52`. |
| 2 | How are synonyms loaded for keyword replacement? | A) `replaceKeyword` only; UI/SuggestionModal directly calls `aiPort.generateSynonyms`. B) Add `result.loadSynonyms(word)` controller method. C) Story response already carries alternatives; no separate fetch. | Current UI aligns with C if backend returns alternatives: `SuggestionModal` renders `wordData.alternatives || wordData.suggestions || []` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/Modal.js:90-117`, and `ResultViewer` passes the clicked keyword data at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:284-299`. Current source has no click-time fetch in `main.js:199-211`. However, `GeminiService.generateStory` validates only `original_caption` and `keywords` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/GeminiService.js:85-93`, so alternatives are not guaranteed. Separate synonym API exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/GeminiService.js:223-248`. | Instruction result methods do not include `loadSynonyms` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:497-506`. Slice 2 maps `AiPort.generateSynonyms(payload)` to `GeminiService.getSynonyms` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:16-21`; B needs an instruction patch, A would make UI depend on an AI port. |
| 3 | After edit mode save, should keyword highlighting be restored? | A) Preserve current behavior: edited caption becomes plain text and keyword interaction disappears. B) Re-tokenize saved text with existing keywords through `formatCaption`. C) Clear keywords when text is edited. | Current source aligns with A. `exitEditMode()` writes `interactiveCaption.textContent = newText` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:195-198`, while original highlighting is only built in `renderCaption()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:113-148`. | Instruction says result owns formatting/highlight segmentation and edit state at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:489-506`, but does not specify post-edit keyword behavior. A has source parity; B has cleaner use of the new helper; C is a behavior change. |
| 4 | Who owns copy/share status auto-revert? | A) Controller uses timer and restores `copyStatus` to `idle`. B) Controller writes terminal status only; UI owns transient visual revert. C) `copyCaption({ autoRevertMs })` option controls timer. | Current source aligns with UI-owned visual revert: `_showCopySuccess()` uses `setTimeout(2000)` to restore button text/classes at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:301-314`. `copyToClipboard()` directly uses browser clipboard at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:240-249`. | Core store has `copyStatus` and `shareStatus` but no timer field at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:53-58`. Slice 2 decision #5 keeps the DOM `execCommand` fallback outside the port at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:24-27`. C changes instruction method signature at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:503`. |
| 5 | Where does `result.shareCaption()` get the image source? | A) ResultController reads `store.input.base64`. B) Change signature to `result.shareCaption(payload)`. C) Add `result.setShareImage(base64)`. | Current source aligns with A: `main.js` reads `store.getState('base64')` and chooses image vs caption share at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:219-226`. The legacy key maps to the new core `input.base64` field at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:52`. | Instruction fixes `result.shareCaption()` with no args at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:504`. `SharePort` already supports both `shareWithImage({ imageBase64, caption })` and `shareCaption(caption)` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:106-110`. B/C require instruction patch. |

Gemini response fact for Decision 2:
- `GeminiService.generateStory(imageData, context)` returns whatever backend JSON is validated as a story result at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/GeminiService.js:25-100`.
- The validation requires `data.original_caption` and `Array.isArray(data.keywords)` only at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/GeminiService.js:85-93`.
- Therefore `keywords[].alternatives` may pass through if the backend sends it, but current source does not guarantee it.
- The dedicated synonym method is separate: `getSynonyms(keywords, language)` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/services/GeminiService.js:223-248`.

## 1. InputController (createInputController.js)

**Required methods (instruction §6 그대로)**
- `input.processFile(file)`: accepts a user-selected `File`; returns a promise for processed image state or void after store write; intent is to orchestrate image processing without DOM work.
- `input.setTextFields({ meaning, tags })`: accepts text fields; writes meaning/tags state; intent is to decouple textarea/input reads from controller logic.
- `input.setPreviewImage({ dataUrl, metadata })`: accepts an already prepared preview image payload; writes preview state for external handoff.
- `input.reset()`: clears image payload and text fields; restores input view model to empty state.
- `input.getInputData()`: returns the current input payload for story generation or orchestration.
- `input.getViewModel()`: returns derived UI-safe input state.

**Port dependencies**
- `imageProcessorPort.process(file)` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:112-115`.
- `store`, specifically `input.base64`, `input.dataUrl`, `input.metadata`, `input.meaning`, and `input.tags` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:52`.
- `normalizeError(error, context)` per the controller error rule in instruction doc; controller must write normalized error to state and avoid toast emission.
- No `photoPort`, `aiPort`, `clipboardPort`, `sharePort`, DOM API, or platform API dependency is needed for InputController.

**Store writes**
- `processFile(file)` writes `input.base64`, `input.dataUrl`, and `input.metadata` from `imageProcessorPort.process(file)`.
- `processFile(file)` should write an in-flight state if the view model exposes `isProcessing`; current store has no `input.status` or `input.error`, so this needs either a store schema patch or controller-local transient state.
- `processFile(file)` should write normalized failure to `input.error` if that field is added; current store lacks that key at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:52`.
- `setTextFields({ meaning, tags })` writes `input.meaning` and `input.tags`.
- `setPreviewImage({ dataUrl, metadata })` writes `input.dataUrl`, derived `input.base64` when a comma-delimited data URL is provided, and `input.metadata`.
- `reset()` writes `input.base64 = null`, `input.dataUrl = null`, `input.metadata = {}`, `input.meaning = ''`, and `input.tags = ''`.
- `getInputData()` writes nothing; it returns a snapshot.
- `getViewModel()` writes nothing; it derives `hasImage`, `isProcessing`, and error display fields.

**View model shape**
- `{ hasImage, dataUrl, metadata, meaning, tags, isProcessing, error }`.
- `hasImage`: boolean derived from `Boolean(input.base64 || input.dataUrl)`.
- `dataUrl`: `string | null`, from `store.input.dataUrl`.
- `metadata`: object, from `store.input.metadata`.
- `meaning`: string, from `store.input.meaning`.
- `tags`: string, from `store.input.tags`.
- `isProcessing`: boolean; requires a new state key or controller-local state because current store has no input status.
- `error`: normalized error object or null; requires a new state key or controller-local state because current store has no input error.

**Init sequence**
- n/a — instruction §6 does not define an `input.init()` method at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:474-480`.
- DOM setup remains in DropZone/InputManager adapters after conversion.
- File selection should call `input.processFile(file)` from a DOM adapter, matching instruction conversion rule at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:483`.

**Source mapping**
- `InputManager.constructor` and `render()` are DOM shell work at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:10-60`.
- `_initDropZone()` currently bridges DropZone output into store writes at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:62-76`; the core portion maps to `setPreviewImage` or `processFile` completion state.
- `getInputData()` currently reads DOM at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:81-88`; this maps to store snapshot reads after Decision 1 is resolved.
- `reset()` clears DOM and store image fields at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:93-112`; core owns state reset, DOM adapter owns element reset.
- `setPreviewImage()` mixes DOM preview and store writes at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:119-134`; core owns state writes, DOM adapter owns preview image display.
- `DropZone._handleFile()` calls `ImageProcessor.process(file)` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:140-172`; this maps to `input.processFile(file)`.
- The current processing source returns `{ base64, dataUrl, width, height, metadata }` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/processors/ImageProcessor.js:34-63`.
- `createRecocoCore` currently leaves `input: null` with a slice 3c-2 TODO at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:97-100`.

**Cross-controller couplings**
- Home-to-input image inflow exists in source through HomeManager helper methods, especially the current photo handoff area at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/HomeManager.js:48-70`.
- Slice 3a decision #1 forbids direct cross-controller calls; cross-domain communication should happen through store and adapter orchestration at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:272-282`.
- Practical mapping: a DOM adapter can read `home.getCurrentPhotoBase64()` / `home.getCurrentPhotoMeta()` and call `input.setPreviewImage(...)`, or it can dispatch selected files to `input.processFile(file)`.
- InputController should not call HomeController directly.
- ResultController may read `input.base64` through store if Decision 5A is chosen.

**Smoke validation path**
- Select an image file through DropZone; expect `input.processFile(file)` to write `base64`, `dataUrl`, and `metadata`, and `input.getViewModel().hasImage` to become true without DOM access from core.

## 2. ResultController (createResultController.js)

**Required methods (instruction §6 그대로)**
- `result.setResult(result)`: accepts generated result payload; writes current result and resets edit/share/copy transient state.
- `result.replaceKeyword({ originalWord, suggestion })`: replaces a keyword in the caption and updates keyword metadata.
- `result.saveCaption(text)`: persists edited caption text.
- `result.enterEditMode()`: writes edit mode true.
- `result.exitEditMode(text)`: writes edit mode false and saves text according to Decision 3.
- `result.copyCaption()`: copies current caption through `clipboardPort`.
- `result.shareCaption()`: shares current caption, and possibly image data, through `sharePort`.
- `result.getFormattedCaption()`: returns structured caption segments from `formatCaption`.
- `result.getViewModel()`: returns UI-safe result state and controls.

**Port dependencies**
- `clipboardPort.writeText(text)` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:101-104`.
- `sharePort.shareWithImage({ imageBase64, caption })` and `sharePort.shareCaption(caption)` from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:106-110`.
- `aiPort.generateStory(payload)` is the existing source for story payload shape, but instruction §6 does not define a result method that invokes story generation directly.
- `aiPort.generateSynonyms(payload)` is needed only if Decision 2B adds a controller method; slice 2 maps that adapter at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:16-21`.
- `store`, specifically `result.currentResult`, `result.editMode`, `result.copyStatus`, `result.shareStatus`, and Decision 5A `input.base64`.
- `normalizeError(error, context)` for error writes; no toast emission from controller.
- `formatCaption(text, keywords)` helper from the new result module.

**Store writes**
- `setResult(result)` writes `result.currentResult = result`, `result.editMode = false`, `result.copyStatus = 'idle'`, and `result.shareStatus = 'idle'`.
- `replaceKeyword({ originalWord, suggestion })` writes a copied `result.currentResult` with `original_caption` updated by one replacement, matching current `String.replace` behavior at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:199-211`.
- `replaceKeyword` also updates the matched keyword object's `word` to `suggestion`, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:204-207`.
- `saveCaption(text)` writes `result.currentResult.original_caption = text`.
- `enterEditMode()` writes `result.editMode = true`.
- `exitEditMode(text)` writes `result.editMode = false` and delegates to the selected Decision 3 behavior.
- `copyCaption()` writes `result.copyStatus = 'copying'`, then `'copied'` or an error state after `clipboardPort.writeText`.
- `shareCaption()` writes `result.shareStatus = 'sharing'`, then `'shared'` or an error state after `sharePort`.
- Current store has no `result.error` key at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/state/createStore.js:53-58`; error view model support requires schema patch or controller-local state.
- `getFormattedCaption()` writes nothing.
- `getViewModel()` writes nothing.

**View model shape**
- `{ hasResult, captionSegments, originalCaption, keywords, isEditMode, copyStatus, shareStatus, error, controls }`.
- `hasResult`: boolean from `Boolean(result.currentResult)`.
- `captionSegments`: output of `formatCaption(originalCaption, keywords)` unless Decision 3A preserves plain text after edit.
- `originalCaption`: `result.currentResult?.original_caption || ''`.
- `keywords`: `result.currentResult?.keywords || []`.
- `isEditMode`: boolean from `result.editMode`.
- `copyStatus`: `'idle' | 'copying' | 'copied' | 'error'` style state; exact enum is not yet fixed in ports or instruction.
- `shareStatus`: `'idle' | 'sharing' | 'shared' | 'error'` style state; exact enum is not yet fixed in ports or instruction.
- `error`: normalized error or null; requires new store state if persistent.
- `controls`: expected derived booleans such as `canEdit`, `canCopy`, `canShare`, and `canReplaceKeyword`.

**Init sequence**
- n/a — instruction §6 does not define `result.init()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:497-506`.
- The input-to-AI-to-result orchestration is not fully represented by the current result method catalog.
- Current code instantiates `GeminiService` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:42`, but no current source path was found that directly calls `generateStory`.
- The narrow contract path is: external orchestration obtains result payload, then calls `result.setResult(result)`.

**Source mapping**
- `ResultViewer.constructor` holds DOM refs and callbacks at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:18-48`; core owns state, DOM adapter owns refs.
- `renderCaption()` mixes payload validation, image DOM, HTML formatting, and event binding at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:75-156`.
- Keyword formatting source range is `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:113-148`.
- `enterEditMode()` DOM toggles map to adapter; `result.enterEditMode()` owns state at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:161-181`.
- `exitEditMode()` mutates caption and calls `onSave(newText)` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:186-216`.
- `copyToClipboard()` maps to `clipboardPort.writeText` plus UI fallback at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:240-249`.
- Main ResultViewer factory binds keyword replacement, save, and share callbacks at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:189-228`.
- `getSuggestionModal()` lazy-loads the DOM modal at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:232-255`.
- Duplicate keyword replacement helper exists at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:278-290`; map it to the same `result.replaceKeyword` behavior if still reachable.
- `createRecocoCore` currently leaves `result: null` with a slice 3c-2 TODO at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:97-100`.

**Cross-controller couplings**
- ResultController should not call InputController directly, following slice 3a no direct controller-call pattern at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3-controller-mapping.md:272-282`.
- If Decision 5A is selected, `result.shareCaption()` reads `store.input.base64`, which is cross-domain via store and does not violate the no direct controller-call rule.
- If Decision 2B is selected, ResultController gains a direct dependency on `aiPort.generateSynonyms`; this is same-domain result behavior through a port, not cross-controller coupling.
- Story generation remains a contract gap: the current instruction result method list has `setResult(result)` but not `generateStoryFromInput`.
- DOM modal rendering remains outside core; controller should only return or write data needed by the view model.

**Smoke validation path**
- Given a stored result with `original_caption` and `keywords`, call `replaceKeyword`, `saveCaption`, `copyCaption`, and `shareCaption`; expect store updates and port calls with no DOM access from core.

## 3. formatCaption.js (helper)

**Source extraction range**
- Extract from `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:113-148`.
- Existing code filters keywords at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:116`.
- Existing code sorts by longest word first at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:119-121`.
- Existing code escapes regex metacharacters at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:123-129`.
- Existing code uses case-insensitive matching and lower-case lookup at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:132-134`.

**Function signature + segment shape**
- `formatCaption(text: string, keywords: Array<{ word: string }>) => Array<{ type: 'text'|'keyword', text: string, word?: string }>`
- Segment shape is fixed by instruction at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:509-518`.
- Text segments contain literal caption text.
- Keyword segments contain the matched display text and normalized `word`.
- Helper must not return HTML.
- Helper must not attach event handlers.

**Edge cases**
- Empty keywords: return one segment `{ type: 'text', text }`.
- Null or undefined caption: normalize to `''` and return one empty text segment.
- Overlap: longest keyword wins, preserving the current length-descending sort.
- Case mismatch: matching is case-insensitive; segment text preserves original caption casing.
- Regex special characters in keyword words must be escaped.
- Duplicate keyword words should collapse by lower-case key or behave consistently with the current lookup map, which stores `keywordMap.set(keyword.word.toLowerCase(), keyword)`.
- Unknown keyword payload fields should be ignored by this helper.

**Pure-ness rule**
- No DOM calls.
- No store reads or writes.
- No port calls.
- No console logging.
- No mutation of the incoming `keywords` array.
- No HTML string construction.

## 4. Component split boundary mapping

### 4.1 InputManager.js — core/DOM line 분리

- DOM shell stays in slice 5: constructor container lookup and render call at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:10-14`.
- DOM markup stays in slice 5: `render()` template at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:16-60`.
- DOM adapter owns textarea/input event wiring for Decision 1 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:48-54`.
- Core boundary: `_initDropZone` callback store writes at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:70-74` become `input.setPreviewImage` or post-`processFile` state.
- Core boundary: `getInputData()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:81-88` becomes `input.getInputData()`.
- Split reset: state clear moves to core; DOM clear stays in adapter at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:93-112`.
- Split preview: state write moves to core; image element mutation stays in adapter at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/InputManager.js:119-134`.
- Legacy `store` import is removed from converted UI, per conversion table at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:671`.
- `InputManager` after conversion should render from `input.getViewModel()`.
- `InputManager` after conversion should call injected action methods only.

### 4.2 DropZone.js — core/DOM line 분리

- DOM constructor and element lookup stay in slice 5 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:21-47`.
- `ImageProcessor` import and direct instantiation move out of UI because DropZone conversion says to remove ImageProcessor at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:670`.
- DOM reset stays in adapter at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:52-57`.
- DOM preview stays in adapter at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:63-73`.
- DOM metadata display stays in adapter at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:79-89`.
- Drag/drop/click listeners stay in adapter at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:98-130`.
- `handleExternalFile(file)` remains a UI-facing entry point but delegates to injected `onFileSelected(file)` or `input.processFile(file)` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:136-138`.
- Core boundary: `_handleFile(file)` processing call moves to `InputController.processFile(file)` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:140-172`.
- DOM metadata hide stays in adapter at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/DropZone.js:174-178`.
- Error display callbacks stay adapter-level; normalized error state belongs to controller if store schema supports it.

### 4.3 ResultViewer.js — core/DOM line 분리

- `constructor`: DOM refs/callback setup stay in slice 5; controller receives no element IDs. Source `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:18-48`.
- `show()`: DOM class mutation only; slice 5. Source `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:53-55`.
- `hide()`: DOM class mutation only; slice 5. Source `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:60-62`.
- `scrollIntoView()`: DOM behavior only; slice 5. Source `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:67-69`.
- `renderCaption(data)`: split. Core owns result payload storage and `formatCaption`; adapter owns image element mutation, segment rendering, and event binding. Source `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:75-156`.
- `enterEditMode()`: split. Core writes `editMode = true`; adapter toggles classes and focus. Source `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:161-181`.
- `exitEditMode()`: split. Core writes edited caption and `editMode = false`; adapter reads textarea and toggles DOM. Source `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:186-216`.
- `updateCaption(newCaption)`: core can map this to `saveCaption(newCaption)` or `setResult`; adapter rerenders from view model. Source `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:222-227`.
- `getCurrentText()`: core maps to `result.currentResult.original_caption`; adapter should not keep independent `_currentData` after conversion. Source `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:233-235`.
- `copyToClipboard()`: core maps to `copyCaption()` and `clipboardPort.writeText`; DOM fallback remains slice 5. Source `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:240-249`.
- `_getElement()`: DOM helper only; slice 5. Source `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:253-256`.
- `_init()`: DOM event binding only; adapter calls injected actions. Source `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:258-282`.
- `_bindKeywordEvents()`: DOM event binding stays adapter; core action is `replaceKeyword` after modal selection. Source `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:284-299`.
- `_showCopySuccess()`: toast, classes, text, and timeout are DOM/UI concern unless Decision 4A is chosen. Source `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:301-314`.
- `_copyFallback()`: DOM textarea and `document.execCommand('copy')` fallback are slice 5 only. Source `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:316-324`.
- `showToast` import at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:1` stays UI-level per toast compatibility rule.

### 4.4 main.js:189-228 ResultViewer factory callbacks 분리

- Factory element wiring is DOM composition at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:189-198`.
- `onKeywordClick` currently opens `SuggestionModal`; modal rendering stays slice 5 at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:199-211`.
- Inside `onKeywordClick`, current result mutation maps to `result.replaceKeyword({ originalWord, suggestion })` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:202-208`.
- `onSave` maps to `result.saveCaption(newText)` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:212-218`.
- `onShare` maps to `result.shareCaption()` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:219-226`.
- Dynamic `ShareService` import in `onShare` is replaced by injected `sharePort`, per `SharePort` at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/contracts/ports.js:106-110`.
- `imageBase64 = store.getState('base64')` maps to Decision 5A's `store.input.base64` read if no signature change is chosen.
- `handleError` in `onShare` maps to `normalizeError` plus result error state; UI toast remains adapter/error-presenter concern.
- Lazy `SuggestionModal` factory remains DOM composition at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:232-255`.
- Duplicate `handleSuggestionSelect` helper at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/main.js:278-290` should collapse into the same `result.replaceKeyword` action.

## 5. Cross-slice impact summary

- Decision 1A/C: no port change, but DOM adapters must call `input.setTextFields`; current source has no such event wiring.
- Decision 1B: keeps source behavior but conflicts with instruction's meaning/tags state-write responsibility.
- Decision 2A: no instruction patch, but converted UI would depend on `aiPort`, weakening the controller boundary.
- Decision 2B: requires instruction §6 patch to add `result.loadSynonyms(...)` because current required methods omit it at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:497-506`.
- Decision 2C: no patch if backend story payload keeps alternatives, but current `GeminiService.generateStory` validation does not guarantee alternatives.
- Decision 3A: no instruction patch; preserves current plain-text-after-edit behavior.
- Decision 3B: no method patch; uses `formatCaption` more consistently and changes current post-edit behavior.
- Decision 3C: no method patch; changes data semantics by clearing keywords after edit.
- Decision 4A: may introduce timer ownership in core; no current TimerPort exists.
- Decision 4B: no instruction patch; matches current UI visual timer ownership.
- Decision 4C: requires method signature patch because `copyCaption()` currently has no args at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/headless-core-agent-instructions.md:503`.
- Decision 5A: no instruction patch; result reads `store.input.base64` cross-domain via store.
- Decision 5B: requires instruction §6 patch to change `result.shareCaption()` signature.
- Decision 5C: requires instruction §6 patch to add `result.setShareImage(base64)`.
- Store schema likely needs `input.status`, `input.error`, and `result.error` if the requested view model shapes are implemented as persistent state.
- `createRecocoCore` must inject `imageProcessorPort` into InputController and `clipboardPort`, `sharePort`, and possibly `aiPort` into ResultController; current TODO placeholders are at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/packages/core/src/createRecocoCore.js:97-100`.
- `formatCaption.js` needs no ports, no store schema, and no `createRecocoCore` wiring.
- Slice 3b reinforces same-domain direct port orchestration rather than cross-controller calls, especially account logout using `authPort` directly at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3b-controller-mapping.md:224-232`; ResultController should follow that pattern with `clipboardPort` and `sharePort`.
- Slice 3c-1 already surfaced the AI/core/helper split pressure at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-3c1-controller-mapping.md:21-32`; this slice should keep `formatCaption` pure and keep DOM rendering outside ResultController.
- `ClipboardPort` already hides native/web dispatch inside the adapter per `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:423-458`.
- `ShareService.downloadImage` remains outside controller/port, matching slice 2 SharePort mapping at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:460-485`.
- DOM `execCommand` clipboard fallback remains slice 5 UI behavior, not controller behavior, matching `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/src/components/ResultViewer.js:316-324`.
- The input-to-AI-to-result orchestration remains only partially specified: `AiPort.generateStory` exists, but ResultController has no required `generate` method. If Slice 3c-2 implementation intends ResultController to own generation, instruction §6 needs a method addition before coding.
- No source indicates current direct consumers for `GeminiService.generateStory` or `GeminiService.getSynonyms`; slice 2 observed no direct consumers at `/Users/jaehyuntak/Desktop/Project_____현재_진행중인/narrative-ai/docs/refactor/slice-2-adapter-mapping.md:243-249`.

## Decision Resolutions (Slice 3c-2)

| # | Resolved option | Rationale |
| --- | --- | --- |
| 1 | **C** — Hybrid. `setTextFields({meaning, tags})` writes store, `getInputData()`/view model read store. UI/DOM adapter (slice 5) decides keystroke vs blur/submit timing. | Controller code is identical for A or C. UI flexibility preserved. |
| 2 | **B** — Add `result.loadSynonyms(word)` controller method. Instruction §6 result methods receive a 1-line patch in lockstep. | Backend `generateStory` validation does not guarantee `keywords[].alternatives` (mapping doc line 26-30). A weakens controller boundary. Precedent: slice-2a patched instruction for PhotoCurationResult. |
| 3 | **B** — Re-tokenize edited text via `formatCaption(text, keywords)`. Keyword spans survive only if the corresponding word remains in the saved text. | Reuses helper consistently. No extra store key. Subtle UX improvement (clickable keyword if word preserved); strict plain-text behavior is achievable in slice 5 DOM adapter without core changes. |
| 4 | **B** — Controller writes terminal `copyStatus`/`shareStatus` only ('idle' → 'copying' → 'copied' or 'error'). UI/DOM adapter handles visual transient revert with its own setTimeout. | Matches current `ResultViewer._showCopySuccess` ownership. Core has no TimerPort and need not own DOM-bound visual timing. |
| 5 | **A** — `result.shareCaption()` reads `store.input.base64` directly. `sharePort.shareWithImage({imageBase64, caption})` if base64 present, otherwise `sharePort.shareCaption(caption)`. | Source alignment 100%. instruction §6 signature unchanged. Cross-domain via store does not violate slice-3a decision #1. |

### Additional store-schema additions (Slice 3c-2 coding)

- **`input.status: 'idle'`** initial — allows view model `isProcessing` flag without controller-local state.
- **`input.error: null`** initial — allows `normalizeError` writes via `store.patch({input: {error: ...}})`.
- **`result.error: null`** initial — same rationale as `account.error` added in slice 3b.

### Instruction §6 patch (Slice 3c-2 coding)

Add one line to result Required methods at instruction §6 after `result.shareCaption()`:

```
result.loadSynonyms(word)
```

This locks the boundary that `aiPort.generateSynonyms` is consumed only through the result controller, not from UI/SuggestionModal directly.

Slice 3c-2 controllers are constructed by `createRecocoCore(ports)` and not yet consumed by `main.js`. `ResultViewer.js`, `InputManager.js`, `DropZone.js` remain untouched (slice 5).
