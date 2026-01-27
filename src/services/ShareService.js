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
        // 캡션을 클립보드에 복사
        await Clipboard.write({ string: caption });

        // 이미지를 임시 파일로 저장
        const fileUri = await saveImageToTemp(imageBase64);

        // Share Sheet 호출
        await Share.share({
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
 * @param {string} caption
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
 * 웹 환경 폴백: navigator.share 또는 다운로드
 */
async function shareWeb({ imageBase64, caption }) {
    // navigator.share + file 지원 여부 확인
    if (navigator.share && navigator.canShare) {
        try {
            const blob = await (await fetch(imageBase64)).blob();
            const file = new File([blob], 'narrative.jpg', { type: 'image/jpeg' });

            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    text: caption,
                    files: [file],
                });
                return;
            }
        } catch {
            // canShare 실패 시 다운로드로 폴백
        }
    }

    // 최종 폴백: 이미지 다운로드 + 클립보드 복사
    downloadImage(imageBase64);
    await navigator.clipboard.writeText(caption);
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
