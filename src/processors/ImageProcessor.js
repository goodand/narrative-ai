/**
 * ImageProcessor - Image File Processing
 * 이미지 파일 메타데이터 추출 및 리사이징 처리
 */

import ExifReader from 'exifreader';
import { IMAGE_CONFIG } from '../constants/config.js';
import { convertDMSToDecimal, formatGPSCoordinates } from '../utils/geo.js';

export class ImageProcessor {
    constructor(config = IMAGE_CONFIG) {
        this.config = config;
    }

    /**
     * Extract metadata from image file
     * @param {File} file - Image file
     * @returns {Promise<Object>} Extracted metadata
     */
    async extractMetadata(file) {
        const metadata = {
            date: null,
            gps: null
        };

        try {
            const tags = await ExifReader.load(file);

            // Extract date information
            if (tags['DateTimeOriginal']) {
                const rawDate = tags['DateTimeOriginal'].description;
                metadata.date = this._formatDate(rawDate);
            }

            // Extract GPS information
            if (tags['GPSLatitude'] && tags['GPSLongitude']) {
                const latVal = tags['GPSLatitude'].value;
                const lonVal = tags['GPSLongitude'].value;
                const latRef = tags['GPSLatitudeRef']?.value?.[0] || 'N';
                const lonRef = tags['GPSLongitudeRef']?.value?.[0] || 'E';

                const lat = convertDMSToDecimal(latVal, latRef);
                const lon = convertDMSToDecimal(lonVal, lonRef);

                metadata.gps = {
                    lat,
                    lon,
                    formatted: formatGPSCoordinates(lat, lon)
                };
            }
        } catch (error) {
            console.error('Metadata extraction error:', error);
        }

        return metadata;
    }

    /**
     * Resize image for API usage
     * @param {File} file - Original image file
     * @param {number} maxSide - Maximum side length
     * @param {number} maxArea - Maximum area in pixels
     * @returns {Promise<Object>} Resized image data
     */
    async resize(file, maxSide = this.config.MAX_SIDE, maxArea = this.config.MAX_AREA) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                let { width: w, height: h } = img;

                // Calculate scale factors
                const scaleSide = Math.max(w, h) > maxSide
                    ? maxSide / Math.max(w, h)
                    : 1;

                const scaleArea = (w * h) > maxArea
                    ? Math.sqrt(maxArea / (w * h))
                    : 1;

                const scale = Math.min(scaleSide, scaleArea);

                w = Math.round(w * scale);
                h = Math.round(h * scale);

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);

                // Convert to base64
                const dataUrl = canvas.toDataURL(this.config.FORMAT, this.config.QUALITY);

                resolve({
                    base64: dataUrl.split(',')[1],
                    dataUrl,
                    width: w,
                    height: h
                });
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Process image file (extract metadata and resize)
     * @param {File} file - Image file
     * @returns {Promise<Object>} Processed image data with metadata
     */
    async process(file) {
        const [metadata, resizedImage] = await Promise.all([
            this.extractMetadata(file),
            this.resize(file)
        ]);

        return {
            ...resizedImage,
            metadata
        };
    }

    // Private helper methods

    _formatDate(rawDate) {
        // Convert EXIF date format (YYYY:MM:DD HH:MM:SS) to display format
        return rawDate
            .substring(0, 16)
            .replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    }
}

// Export singleton instance
export const imageProcessor = new ImageProcessor();
