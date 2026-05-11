/**
 * InputController — image processing + meaning/tags state.
 *
 * See:
 *   - docs/refactor/headless-core-agent-instructions.md §6 Input controller
 *   - docs/refactor/slice-3c2-controller-mapping.md §1
 *
 * Decisions (slice-3c-2 decision log):
 *   #1 (C) — Hybrid. `setTextFields({meaning, tags})` writes store.
 *            `getInputData()`/`getViewModel()` read from store. UI/DOM
 *            adapter (slice 5) decides keystroke vs blur/submit timing.
 *
 * Cross-controller couplings:
 *   - Image inflow from Home view: a DOM adapter may call
 *     `home.getCurrentPhotoBase64()` / `home.getCurrentPhotoMeta()` and pass
 *     the result to `input.setPreviewImage({dataUrl, metadata})` and/or
 *     `input.processFile(file)`. InputController never calls Home directly.
 *   - ResultController (slice 3c-2) reads `store.input.base64` for share
 *     image source (Decision 5A). InputController has no awareness of that.
 *
 * @param {{
 *   imageProcessorPort: { process: (file: File) => Promise<{ base64: string, dataUrl: string, width: number, height: number, metadata: Object }> },
 *   store: Object,
 *   normalizeError: (error: any, context?: string) => Object
 * }} deps
 */

const INPUT_CONTEXT = 'input';

const extractBase64FromDataUrl = (dataUrl) => {
    if (typeof dataUrl !== 'string' || dataUrl.length === 0) return null;
    const commaIdx = dataUrl.indexOf(',');
    return commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
};

export function createInputController({
    imageProcessorPort,
    store,
    normalizeError
} = {}) {
    if (!imageProcessorPort || !store) {
        throw new Error('createInputController: imageProcessorPort, store are required');
    }

    const writeInput = (patch) => {
        store.patch({ input: patch });
    };

    const writeError = (error) => {
        const normalized = normalizeError
            ? normalizeError(error, INPUT_CONTEXT)
            : { message: 'input_error', context: INPUT_CONTEXT, code: null, cause: error };
        writeInput({ status: 'error', error: normalized });
    };

    return {
        async processFile(file) {
            writeInput({ status: 'processing', error: null });

            try {
                const result = await imageProcessorPort.process(file);
                writeInput({
                    base64: result.base64 || null,
                    dataUrl: result.dataUrl || null,
                    metadata: result.metadata || {},
                    status: 'ready',
                    error: null
                });
                return result;
            } catch (error) {
                writeError(error);
                return null;
            }
        },

        setTextFields({ meaning, tags } = {}) {
            const patch = {};
            if (typeof meaning === 'string') patch.meaning = meaning;
            if (typeof tags === 'string') patch.tags = tags;
            if (Object.keys(patch).length > 0) writeInput(patch);
        },

        setPreviewImage({ dataUrl, metadata } = {}) {
            const patch = {};
            if (typeof dataUrl === 'string' && dataUrl.length > 0) {
                patch.dataUrl = dataUrl;
                patch.base64 = extractBase64FromDataUrl(dataUrl);
            }
            if (metadata && typeof metadata === 'object') {
                patch.metadata = metadata;
            }
            if (Object.keys(patch).length === 0) return;
            patch.status = 'ready';
            patch.error = null;
            writeInput(patch);
        },

        reset() {
            writeInput({
                base64: null,
                dataUrl: null,
                metadata: {},
                meaning: '',
                tags: '',
                status: 'idle',
                error: null
            });
        },

        getInputData() {
            const slice = store.get('input') || {};
            return {
                base64: slice.base64 || null,
                dataUrl: slice.dataUrl || null,
                metadata: slice.metadata || {},
                meaning: typeof slice.meaning === 'string' ? slice.meaning : '',
                tags: typeof slice.tags === 'string' ? slice.tags : ''
            };
        },

        getViewModel() {
            const slice = store.get('input') || {};
            const base64 = slice.base64 || null;
            const dataUrl = slice.dataUrl || null;
            const status = typeof slice.status === 'string' ? slice.status : 'idle';

            return {
                hasImage: Boolean(base64 || dataUrl),
                dataUrl,
                metadata: slice.metadata || {},
                meaning: typeof slice.meaning === 'string' ? slice.meaning : '',
                tags: typeof slice.tags === 'string' ? slice.tags : '',
                isProcessing: status === 'processing',
                error: slice.error || null
            };
        }
    };
}
