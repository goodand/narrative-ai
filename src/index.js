/**
 * Module Index — Central export point for legacy compatibility.
 *
 * Slice 6 cleanup:
 *   - `StateManager` / `store` public export removed (legacy daily reset is
 *     imported directly by `main.js`; no other consumer depends on it).
 *   - `SettingsModal` export removed (class deleted in slice 6 M4).
 *
 * Headless core export lives separately at `@recoco/core`
 * (`packages/core/src/index.js`).
 */

// Constants
export * from './constants/config.js';

// Utils
export { fetchWithRetry, delay } from './utils/fetch.js';
export { convertDMSToDecimal, formatGPSCoordinates, decimalToDMS } from './utils/geo.js';
export { handleError, showToast, ErrorLevel } from './utils/errorHandler.js';

// Services
export { GeminiService } from './services/GeminiService.js';

// Processors
export { ImageProcessor, imageProcessor } from './processors/ImageProcessor.js';

// Components
export { Modal, SuggestionModal, ConfirmModal } from './components/Modal.js';
export { OnboardingModal } from './components/OnboardingModal.js';
export { AuthModal } from './components/AuthModal.js';
export { PermissionModal } from './components/PermissionModal.js';
export { HomeManager } from './components/HomeManager.js';
export { MyPageManager } from './components/MyPageManager.js';
export { SelectionGroup, DropdownGroup } from './components/SelectionGroup.js';
export { DropZone } from './components/DropZone.js';
export { ResultViewer } from './components/ResultViewer.js';
