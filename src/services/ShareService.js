/**
 * ShareService - 이미지+캡션 공유 (Capacitor Share Sheet / Web fallback)
 */
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Clipboard } from '@capacitor/clipboard';

const isNative = () => Capacitor.isNativePlatform();

/**
 * base64 이미지를 임시 파일로 저장하고 URI를 반환
 * @param {string} base64Data - data:image/... 형식 또는 순수 base64
 * @returns {Promise<string>} file URI
 */
async function saveImageToTemp(base64Data) {
    // data URL에서 순수 base64 추출
    const pure = base64Data.includes(',')
        ? base64Data.split(',')[1]
        : base64Data;

    const fileName = `narrative_share_${Date.now()}.jpg`;

    const result = await Filesystem.writeFile({
        path: fileName,
        data: pure,
        directory: Directory.Cache,
    });

    return result.uri;
}

/**
 * 네이티브 Share Sheet를 통해 이미지+캡션 공유
 * 캡션은 클립보드에 복사되고, 이미지는 Share Sheet로 전달
 * @param {Object} options
 * @param {string} options.imageBase64 - base64 이미지 데이터
 * @param {string} options.caption - 캡션 텍스트
 */
export async function shareWithImage({ imageBase64, caption }) {
    if (isNative()) {
        // 캡션을 클립보드에 복사 (인스타그램 등 텍스트 자동 입력이 안 되는 앱을 위함)
        await Clipboard.write({ string: caption });

        // 이미지는 임시 파일로 저장하여 전달
        const fileUri = await saveImageToTemp(imageBase64);

        await Share.share({
            title: 'RECOCO Narrative',
            text: caption, // 이미지와 텍스트 함께 전달 시도
            files: [fileUri],
            dialogTitle: '공유하기',
        });
    } else {
        // 웹 환경 폴백
        await shareWeb({ imageBase64, caption });
    }
}

/**
 * 캡션만 공유 (이미지 없이)
 */
export async function shareCaption(caption) {
    if (isNative()) {
        await Share.share({
            text: caption,
            dialogTitle: '캡션 공유하기',
        });
    } else {
        if (navigator.share) {
            await navigator.share({ text: caption });
        } else {
            await navigator.clipboard.writeText(caption);
        }
    }
}

/**
 * 웹 환경 폴백: 캡션 공유 최우선 전략
 * 인스타그램 등에서 이미지+텍스트 동시 공유가 안 될 경우 캡션을 우선함
 */
async function shareWeb({ imageBase64, caption }) {
    // 1. 기본적으로 클립보드에 복사 (백업)
    try {
        await navigator.clipboard.writeText(caption);
    } catch (err) {
        console.warn('Clipboard write failed:', err);
    }

    if (!navigator.share) return;

    try {
        // 2. 이미지 + 텍스트 동시 공유 시도
        const blob = await (await fetch(imageBase64)).blob();
        const file = new File([blob], 'narrative.jpg', { type: 'image/jpeg' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'RECOCO Narrative',
                text: caption,
                files: [file],
            });
        } else {
            // 3. 동시 공유 미지원 시 텍스트만 공유 (캡션 우선)
            await navigator.share({
                title: 'RECOCO Narrative',
                text: caption,
            });
        }
    } catch (err) {
        // 사용자가 취소했거나 에러 발생 시 텍스트만이라도 다시 시도
        console.log('Dual share failed, attempting text-only share:', err);
        try {
            await navigator.share({
                title: 'RECOCO Narrative',
                text: caption,
            });
        } catch (finalErr) {
            console.error('Final share attempt failed:', finalErr);
        }
    }
}

/**
 * 이미지 다운로드 헬퍼
 */
function downloadImage(base64Data) {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = `narrative_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
