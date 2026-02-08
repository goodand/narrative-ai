/**
 * ImageProcessor - Image File Processing
 * 이미지 파일 메타데이터 추출 및 리사이징 처리
 *
 * Worker가 ArrayBuffer(Transferable)를 반환하면
 * 메인 스레드에서 Blob/dataUrl/base64로 변환한다.
 * (base64는 Phase 3 multipart 전환 시 제거 예정)
 */

import { IMAGE_CONFIG } from '../constants/config.js';
import ImageWorker from './image.worker?worker';

/** ArrayBuffer → base64 문자열 변환 (chunked, 스택 오버플로 방지) */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const CHUNK = 8192;
    let binary = '';
    for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
}

export class ImageProcessor {
    constructor(config = IMAGE_CONFIG) {
        this.config = config;
    }

    /**
     * Process image file using Web Worker
     * @param {File} file - Image file
     * @returns {Promise<{base64: string, dataUrl: string, width: number, height: number, metadata: Object}>}
     */
    async process(file) {
        const workerResult = await new Promise((resolve, reject) => {
            const worker = new ImageWorker();

            worker.onmessage = (e) => {
                const { success, result, error } = e.data;
                if (success) {
                    resolve(result);
                } else {
                    reject(new Error(error));
                }
                worker.terminate();
            };

            worker.onerror = (err) => {
                reject(err);
                worker.terminate();
            };

            worker.postMessage({ file, config: this.config });
        });

        // Worker → ArrayBuffer(Transferable) → 메인 스레드에서 변환
        const { imageBuffer, mimeType, width, height, metadata } = workerResult;
        const blob = new Blob([imageBuffer], { type: mimeType });
        const dataUrl = URL.createObjectURL(blob);
        const base64 = arrayBufferToBase64(imageBuffer);

        return { base64, dataUrl, width, height, metadata };
    }
}

export const imageProcessor = new ImageProcessor();
