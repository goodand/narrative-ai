/**
 * ClipboardPort adapter.
 *
 * See: packages/core/src/contracts/ports.js — ClipboardPort
 *
 * Decision #5 (slice-2-adapter-decisions): native uses
 * `Clipboard.write({ string: text })`, web uses `navigator.clipboard.writeText(text)`.
 *
 * Decision #7C (slice-5-component-mapping): the DOM `execCommand('copy')`
 * fallback was previously in `ResultViewer._copyFallback`. To keep the
 * component DOM-only and let it call `core.result.copyCaption()` exclusively,
 * the fallback is moved into this adapter. The web branch tries
 * `navigator.clipboard.writeText` first; on failure (older browsers, missing
 * permission) it falls back to a hidden textarea + `document.execCommand('copy')`.
 *
 * @param {{
 *   isNative: () => boolean,
 *   nativeClipboard: { write: (options: { string: string }) => Promise<void> },
 *   webClipboard: { writeText: (text: string) => Promise<void> }
 * }} deps
 * @returns {{ writeText: (text: string) => Promise<void> }}
 */
const execCommandCopyFallback = (text) => {
    if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
        throw new Error('clipboard fallback unavailable');
    }
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.setAttribute('readonly', '');
    tempInput.style.position = 'absolute';
    tempInput.style.left = '-9999px';
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        const ok = document.execCommand('copy');
        if (!ok) throw new Error('execCommand copy returned false');
    } finally {
        document.body.removeChild(tempInput);
    }
};

export function createClipboardPort({ isNative, nativeClipboard, webClipboard } = {}) {
    return {
        async writeText(text) {
            if (isNative && isNative()) {
                await nativeClipboard.write({ string: text });
                return;
            }
            try {
                if (webClipboard && typeof webClipboard.writeText === 'function') {
                    await webClipboard.writeText(text);
                    return;
                }
                throw new Error('webClipboard.writeText unavailable');
            } catch (_) {
                execCommandCopyFallback(text);
            }
        }
    };
}
