/**
 * ImageProcessor - Image File Processing
 * 이미지 파일 메타데이터 추출 및 리사이징 처리
 */

import { IMAGE_CONFIG } from '../constants/config.js';
import ImageWorker from './image.worker?worker';

export class ImageProcessor {
    constructor(config = IMAGE_CONFIG) {
        this.config = config;
    }

    /**
     * Process image file using Web Worker
     * @param {File} file - Image file
     * @returns {Promise<Object>} Processed image data with metadata
     */
    async process(file) {
        return new Promise((resolve, reject) => {
            const worker = new ImageWorker();

            worker.onmessage = (e) => {
                const { success, result, error } = e.data;
                if (success) {
                    resolve(result);
                } else {
                    reject(new Error(error));
                }
                worker.terminate(); // 작업 완료 후 워커 종료
            };

            worker.onerror = (err) => {
                reject(err);
                worker.terminate();
            };

            // 워커에게 파일과 설정을 전달하여 처리 요청
            worker.postMessage({
                file,
                config: this.config
            });
        });
    }

    // 기존의 무거운 로직들은 이제 워커 내부에서 실행되므로 클래스에서는 제거되거나 
    // 워커를 사용하지 않는 환경을 위한 대비용으로만 남겨둘 수 있습니다.
    // 여기서는 워커 기반으로 완전히 전환합니다.
}

export const imageProcessor = new ImageProcessor();
