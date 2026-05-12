/**
 * SharePort adapter — wraps existing ShareService named exports.
 *
 * See: packages/core/src/contracts/ports.js — SharePort
 * Source: src/services/ShareService.js (`shareWithImage`, `shareCaption`).
 * The private `downloadImage` DOM helper is intentionally NOT exposed
 * through this port (it touches `document.body`); UI layer handles it.
 *
 * @param {{
 *   shareWithImage: (payload: { imageBase64: string, caption: string }) => Promise<void>,
 *   shareCaption: (caption: string) => Promise<void>
 * }} deps
 * @returns {{
 *   shareWithImage: (payload: { imageBase64: string, caption: string }) => Promise<void>,
 *   shareCaption: (caption: string) => Promise<void>
 * }}
 */
export function createSharePort({ shareWithImage, shareCaption } = {}) {
    return {
        shareWithImage(payload) {
            return shareWithImage(payload);
        },
        shareCaption(caption) {
            return shareCaption(caption);
        }
    };
}
