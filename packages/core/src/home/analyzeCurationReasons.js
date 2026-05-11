/**
 * analyzeCurationReasons — pure helper that derives the Home header message
 * from a list of photos (or a list of reason strings).
 *
 * See:
 *   - docs/refactor/slice-3c1-controller-mapping.md §3
 *   - Source extraction:
 *       homeImageRuntime.calculateCommonFilter (lines 137-147)
 *       homeImageRuntime.updateCurationHeader  (lines 152-194)
 *
 * Decision 2C (Hybrid): pure mapping/intersection logic only. The original
 * homeImageRuntime DOM updates remain in slice 5; HomeController calls this
 * helper to derive `home.headerMessage` and writes it via `store.patch`.
 *
 * Constraints:
 *   - No DOM, no platform globals, no console, no normalizeError, no ports.
 *   - No mutation of input photos.
 *
 * @param {Array<Object>|Array<string>} input
 *        Either an array of photo objects (each may have
 *        `rawAsset.curationReasons: string[]`) or an array of pre-extracted
 *        reason strings.
 * @param {{ locale?: 'ko' }} [_options] Reserved; current mapping is Korean only.
 * @returns {{ commonReasons: Array<string>, headerMessage: string, matchedReason: string|null }}
 */

const DEFAULT_HEADER = '기기에서 찾아낸 비우기 좋은 기록들입니다.';
const FALLBACK_HEADER = '정리하기 좋은 기록들을 모아봤어요.';
const COMBO_OLD_UNORGANIZED_HEADER = '1년 넘게 앨범에 정리되지 않은 사진들이에요.';

const REASON_TO_HEADER = {
    // English flags (from native plugin / dailyCurationRuntime)
    unorganized: '앨범에 정리되지 않은 사진들이에요.',
    screenshot: '스크린샷 기록들이에요.',
    large: '공간을 많이 차지하는 대용량 파일들이에요.',
    old: '1년 이상 된 오래된 사진들이에요.',
    burst_day: '비슷한 사진이 많은 날의 기록들이에요.',
    icloud_only: 'iCloud에만 저장된 사진들이에요.',
    // Korean reasons (from CurationEngine)
    '앨범 미분류': '앨범에 정리되지 않은 사진들이에요.',
    '스크린샷': '스크린샷 기록들이에요.',
    '대용량 파일': '공간을 많이 차지하는 대용량 파일들이에요.',
    '오래된 사진': '1년 이상 된 오래된 사진들이에요.',
    '즐겨찾기 됨': '특별히 아꼈던 기록들이에요.'
};

const isPlainArray = (value) => Array.isArray(value);

const isReasonString = (value) => typeof value === 'string' && value.length > 0;

const extractReasonSets = (photos) => {
    if (!isPlainArray(photos) || photos.length === 0) return [];
    return photos.map((photo) => {
        const list = photo && photo.rawAsset && Array.isArray(photo.rawAsset.curationReasons)
            ? photo.rawAsset.curationReasons
            : [];
        return new Set(list);
    });
};

const intersectSets = (sets) => {
    if (sets.length === 0) return [];
    const [first, ...rest] = sets;
    const result = [];
    for (const value of first) {
        if (rest.every((set) => set.has(value))) {
            result.push(value);
        }
    }
    return result;
};

const has = (reasons, key) => reasons.indexOf(key) !== -1;

export function analyzeCurationReasons(input, _options = {}) {
    let commonReasons;

    if (!isPlainArray(input) || input.length === 0) {
        commonReasons = [];
    } else if (isReasonString(input[0])) {
        // input is already a reasons array.
        commonReasons = input.filter(isReasonString);
    } else {
        commonReasons = intersectSets(extractReasonSets(input));
    }

    if (commonReasons.length === 0) {
        return {
            commonReasons,
            headerMessage: DEFAULT_HEADER,
            matchedReason: null
        };
    }

    // Combo override: aged + unorganized (English or Korean).
    const oldOrAgedKorean = has(commonReasons, 'old') || has(commonReasons, '오래된 사진');
    const unorganizedAny = has(commonReasons, 'unorganized') || has(commonReasons, '앨범 미분류');
    if (oldOrAgedKorean && unorganizedAny) {
        return {
            commonReasons,
            headerMessage: COMBO_OLD_UNORGANIZED_HEADER,
            matchedReason: 'combo:old+unorganized'
        };
    }

    const primary = commonReasons[0];
    const mapped = REASON_TO_HEADER[primary];
    if (mapped) {
        return {
            commonReasons,
            headerMessage: mapped,
            matchedReason: primary
        };
    }

    return {
        commonReasons,
        headerMessage: FALLBACK_HEADER,
        matchedReason: null
    };
}
