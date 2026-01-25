/**
 * Image Worker - background processing
 * 메인 스레드와 별개로 이미지 리사이징 및 EXIF 추출 수행
 */

import ExifReader from 'exifreader';

// 메타데이터 날짜 포맷팅 헬퍼
function formatDate(rawDate) {
    if (!rawDate) return null;
    return rawDate
        .substring(0, 16)
        .replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
}

// DMS 좌표를 십진수로 변환
function convertDMSToDecimal(values, ref) {
    if (!values || values.length < 3) return null;
    const d = values[0].numerator / values[0].denominator;
    const m = values[1].numerator / values[1].denominator;
    const s = values[2].numerator / values[2].denominator;
    
    let decimal = d + (m / 60) + (s / 3600);
    if (ref === 'S' || ref === 'W') decimal = -decimal;
    return decimal;
}

self.onmessage = async (e) => {
    const { file, config } = e.data;

    try {
        // 1. 메타데이터 추출
        const metadata = { date: null, gps: null };
        try {
            const tags = await ExifReader.load(file);
            if (tags['DateTimeOriginal']) {
                metadata.date = formatDate(tags['DateTimeOriginal'].description);
            }
            if (tags['GPSLatitude'] && tags['GPSLongitude']) {
                const lat = convertDMSToDecimal(tags['GPSLatitude'].value, tags['GPSLatitudeRef']?.value?.[0] || 'N');
                const lon = convertDMSToDecimal(tags['GPSLongitude'].value, tags['GPSLongitudeRef']?.value?.[0] || 'E');
                metadata.gps = {
                    lat,
                    lon,
                    formatted: `${lat.toFixed(4)}, ${lon.toFixed(4)}`
                };
            }
        } catch (err) {
            console.warn('Worker metadata error:', err);
        }

        // 2. 이미지 리사이징 (OffscreenCanvas 사용)
        const bitmap = await createImageBitmap(file);
        let { width: w, height: h } = bitmap;

        const scaleSide = Math.max(w, h) > config.MAX_SIDE ? config.MAX_SIDE / Math.max(w, h) : 1;
        const scaleArea = (w * h) > config.MAX_AREA ? Math.sqrt(config.MAX_AREA / (w * h)) : 1;
        const scale = Math.min(scaleSide, scaleArea);

        w = Math.round(w * scale);
        h = Math.round(h * scale);

        const canvas = new OffscreenCanvas(w, h);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, w, h);

        // Blob으로 변환 후 Base64 생성
        const blob = await canvas.convertToBlob({
            type: config.FORMAT,
            quality: config.QUALITY
        });
        
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result;
            self.postMessage({
                success: true,
                result: {
                    base64: dataUrl.split(',')[1],
                    dataUrl,
                    width: w,
                    height: h,
                    metadata
                }
            });
        };
        reader.readAsDataURL(blob);

    } catch (error) {
        self.postMessage({ success: false, error: error.message });
    }
};
