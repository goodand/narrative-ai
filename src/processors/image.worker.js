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

// DMS 좌표를 십진수로 변환 (유연한 포맷 대응)
function convertDMSToDecimal(values, ref) {
    if (!values || values.length < 3) return null;
    
    // 유연한 값 추출 로직 (numerator/denominator 또는 단순 숫자 대응)
    const getValue = (v) => {
        if (typeof v === 'object' && v !== null && 'numerator' in v) {
            return v.numerator / v.denominator;
        }
        if (Array.isArray(v)) {
            return v[0] / v[1];
        }
        return Number(v);
    };

    try {
        const d = getValue(values[0]);
        const m = getValue(values[1]);
        const s = getValue(values[2]);
        
        let decimal = d + (m / 60) + (s / 3600);
        if (ref === 'S' || ref === 'W') decimal = -decimal;
        return decimal;
    } catch (err) {
        console.warn('DMS conversion error:', err);
        return null;
    }
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
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.drawImage(bitmap, 0, 0, w, h);

        // Blob → ArrayBuffer (Transferable zero-copy 전송)
        const blob = await canvas.convertToBlob({
            type: config.FORMAT,
            quality: config.QUALITY
        });
        const arrayBuffer = await blob.arrayBuffer();

        self.postMessage({
            success: true,
            result: {
                imageBuffer: arrayBuffer,
                mimeType: config.FORMAT,
                width: w,
                height: h,
                metadata
            }
        }, [arrayBuffer]); // Transferable: zero-copy 전송

    } catch (error) {
        self.postMessage({ success: false, error: error.message });
    }
};
