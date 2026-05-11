/**
 * ResultController — caption display, edit mode, keyword replacement,
 * copy/share orchestration, synonym loading.
 *
 * See:
 *   - docs/refactor/headless-core-agent-instructions.md §6 Result controller
 *     (loadSynonyms added in slice 3c-2 patch)
 *   - docs/refactor/slice-3c2-controller-mapping.md §2
 *
 * Decisions (slice-3c-2 decision log):
 *   #2 (B) — `result.loadSynonyms(word)` is exposed by this controller.
 *            UI/SuggestionModal does not import `aiPort` directly.
 *   #3 (B) — `getViewModel().captionSegments` re-tokenizes saved text via
 *            `formatCaption(text, keywords)` after edit mode exits.
 *   #4 (B) — Status writes are terminal: 'idle' → 'copying'|'sharing' →
 *            'copied'|'shared'|'error'. Visual auto-revert is owned by UI.
 *   #5 (A) — `shareCaption()` reads `store.input.base64`. If present, calls
 *            `sharePort.shareWithImage(...)`; otherwise `sharePort.shareCaption(...)`.
 *
 * Cross-controller couplings:
 *   - cross-domain read from `store.input.base64` (slice-3a decision #1
 *     allows store-level cross-domain).
 *   - never calls InputController/AuthController/HomeController directly.
 *
 * @param {{
 *   clipboardPort: { writeText: (text: string) => Promise<void> },
 *   sharePort: {
 *     shareWithImage: (payload: { imageBase64: string, caption: string }) => Promise<void>,
 *     shareCaption: (caption: string) => Promise<void>
 *   },
 *   aiPort: { generateSynonyms: (payload: { keywords: Array<string>, language?: string }) => Promise<Array<Object>> },
 *   store: Object,
 *   normalizeError: (error: any, context?: string) => Object
 * }} deps
 */

import { formatCaption } from './formatCaption.js';

const RESULT_CONTEXT = 'result';

export function createResultController({
    clipboardPort,
    sharePort,
    aiPort,
    store,
    normalizeError
} = {}) {
    if (!clipboardPort || !sharePort || !aiPort || !store) {
        throw new Error('createResultController: clipboardPort, sharePort, aiPort, store are required');
    }

    const writeResult = (patch) => {
        store.patch({ result: patch });
    };

    const writeError = (error) => {
        const normalized = normalizeError
            ? normalizeError(error, RESULT_CONTEXT)
            : { message: 'result_error', context: RESULT_CONTEXT, code: null, cause: error };
        writeResult({ error: normalized });
    };

    const getCurrent = () => store.get('result.currentResult');

    const cloneResult = (current) => {
        if (!current || typeof current !== 'object') return null;
        return {
            ...current,
            keywords: Array.isArray(current.keywords) ? current.keywords.map((k) => ({ ...k })) : []
        };
    };

    return {
        setResult(result) {
            writeResult({
                currentResult: result || null,
                editMode: false,
                copyStatus: 'idle',
                shareStatus: 'idle',
                error: null
            });
        },

        replaceKeyword({ originalWord, suggestion } = {}) {
            if (typeof originalWord !== 'string' || typeof suggestion !== 'string') return;
            const current = getCurrent();
            if (!current || typeof current.original_caption !== 'string') return;

            const next = cloneResult(current);
            next.original_caption = next.original_caption.replace(originalWord, suggestion);
            const idx = next.keywords.findIndex((k) => k && k.word === originalWord);
            if (idx >= 0) {
                next.keywords[idx] = { ...next.keywords[idx], word: suggestion };
            }

            writeResult({ currentResult: next });
        },

        saveCaption(text) {
            if (typeof text !== 'string') return;
            const current = getCurrent();
            if (!current) return;
            const next = cloneResult(current);
            next.original_caption = text;
            writeResult({ currentResult: next });
        },

        enterEditMode() {
            writeResult({ editMode: true });
        },

        exitEditMode(text) {
            const patch = { editMode: false };
            if (typeof text === 'string') {
                const current = getCurrent();
                if (current) {
                    const next = cloneResult(current);
                    next.original_caption = text;
                    patch.currentResult = next;
                }
            }
            writeResult(patch);
        },

        async copyCaption() {
            const current = getCurrent();
            const text = current && typeof current.original_caption === 'string'
                ? current.original_caption
                : '';
            if (text.length === 0) return;

            writeResult({ copyStatus: 'copying', error: null });
            try {
                await clipboardPort.writeText(text);
                writeResult({ copyStatus: 'copied' });
            } catch (error) {
                writeResult({ copyStatus: 'error' });
                writeError(error);
            }
        },

        async shareCaption() {
            const current = getCurrent();
            const text = current && typeof current.original_caption === 'string'
                ? current.original_caption
                : '';
            if (text.length === 0) return;

            writeResult({ shareStatus: 'sharing', error: null });

            const imageBase64 = store.get('input.base64');

            try {
                if (imageBase64) {
                    await sharePort.shareWithImage({ imageBase64, caption: text });
                } else {
                    await sharePort.shareCaption(text);
                }
                writeResult({ shareStatus: 'shared' });
            } catch (error) {
                writeResult({ shareStatus: 'error' });
                writeError(error);
            }
        },

        async loadSynonyms(word) {
            if (typeof word !== 'string' || word.length === 0) return [];
            try {
                const suggestions = await aiPort.generateSynonyms({
                    keywords: [word],
                    language: 'Korean'
                });
                return Array.isArray(suggestions) ? suggestions : [];
            } catch (error) {
                writeError(error);
                return [];
            }
        },

        getFormattedCaption() {
            const current = getCurrent();
            const text = current && typeof current.original_caption === 'string'
                ? current.original_caption
                : '';
            const keywords = current && Array.isArray(current.keywords) ? current.keywords : [];
            return formatCaption(text, keywords);
        },

        getViewModel() {
            const slice = store.get('result') || {};
            const current = slice.currentResult || null;
            const originalCaption = current && typeof current.original_caption === 'string'
                ? current.original_caption
                : '';
            const keywords = current && Array.isArray(current.keywords) ? current.keywords : [];
            const isEditMode = Boolean(slice.editMode);
            const copyStatus = typeof slice.copyStatus === 'string' ? slice.copyStatus : 'idle';
            const shareStatus = typeof slice.shareStatus === 'string' ? slice.shareStatus : 'idle';

            const captionSegments = isEditMode
                ? [{ type: 'text', text: originalCaption }]
                : formatCaption(originalCaption, keywords);

            const hasResult = Boolean(current);
            const inputBase64 = store.get('input.base64');
            const isBusy = copyStatus === 'copying' || shareStatus === 'sharing';

            return {
                hasResult,
                captionSegments,
                originalCaption,
                keywords: keywords.slice(),
                isEditMode,
                copyStatus,
                shareStatus,
                error: slice.error || null,
                controls: {
                    canEdit: hasResult && !isEditMode && !isBusy,
                    canCopy: hasResult && !isBusy && originalCaption.length > 0,
                    canShare: hasResult && !isBusy && originalCaption.length > 0,
                    canReplaceKeyword: hasResult && !isEditMode && keywords.length > 0,
                    hasShareImage: Boolean(inputBase64)
                }
            };
        }
    };
}
