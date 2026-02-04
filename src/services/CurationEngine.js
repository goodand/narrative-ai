/**
 * CurationEngine - Rule-base Photo Selection
 * 사진 메타데이터를 기반으로 '비움 지수'를 계산하여 최적의 큐레이션을 제공합니다.
 */

const FILTER_WEIGHTS = {
    UNCLASSIFIED_ALBUM: 30,    // 앨범 미분류 (높은 추천 순위)
    LARGE_FILE: 20,            // 10MB 이상
    OLD_PHOTO: 10,             // 1년 이상 경과
    SCREENSHOT: 25,            // 스크린샷
    FAVORITE_PENALTY: -50,     // 즐겨찾기는 강력하게 제외 (감점 확대)
    ALREADY_IN_ALBUM: -100     // 이미 앨범에 있는 사진은 추천 제외 (강력한 감점)
};

export class CurationEngine {
// ...
    /**
     * 개별 사진의 비움 지수를 계산합니다.
     */
    static calculateScore(asset) {
        let score = 0;

        // 1. 앨범 분류 여부 (최우선 순위)
        if (!asset.isInAlbum) {
            score += FILTER_WEIGHTS.UNCLASSIFIED_ALBUM;
        } else {
            score += FILTER_WEIGHTS.ALREADY_IN_ALBUM;
        }

        // 2. 스크린샷 여부
// ...
    /**
     * 점수 부여 사유를 사람이 읽기 쉬운 텍스트로 반환합니다.
     */
    static getReasonList(asset) {
        const reasons = [];
        if (!asset.isInAlbum) reasons.push('앨범 미분류');
        if (asset.isScreenshot) reasons.push('스크린샷');
// ...

