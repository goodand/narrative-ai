/**
 * ImageProcessorPort adapter — wraps the existing ImageProcessor.
 *
 * See: packages/core/src/contracts/ports.js — ImageProcessorPort
 * Wraps `src/processors/ImageProcessor.js` instance injected via deps.
 *
 * @param {{ imageProcessor: { process: (file: File) => Promise<Object> } }} deps
 * @returns {{ process: (file: File) => Promise<{ base64: string, dataUrl: string, width: number, height: number, metadata: Object }> }}
 */
export function createImageProcessorPort({ imageProcessor } = {}) {
    return {
        process(file) {
            return imageProcessor.process(file);
        }
    };
}
