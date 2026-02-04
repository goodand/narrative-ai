/**
 * CurationEngine - Rule-base Photo Selection
 * 사진 메타데이터를 기반으로 '비움 지수'를 계산하여 최적의 큐레이션을 제공합니다.
 */

const FILTER_WEIGHTS = {
    UNCLASSIFIED_ALBUM: 30,    // 앨범 미분류 (높은 추천 순위)
    LARGE_FILE: 20,            // 10MB 이상
    OLD_PHOTO: 10,             // 1년 이상 경과
    SCREENSHOT: 25,            // 스크린샷
    FAVORITE_PENALTY: -50,     // 즐겨찾기는 강력하게 제외
    ALREADY_IN_ALBUM: -100     // 이미 앨범에 있는 사진은 사실상 제외
};

export class CurationEngine {
    /**
     * 사진 리스트에 점수를 매기고 정렬합니다.
     * @param {Array} assets - PhotoAsset 목록
     * @returns {Array} 점수가 계산된 정렬된 목록
     */
    static rankAssets(assets) {
        return assets
            .map(asset => {
                const score = this.calculateScore(asset);
                const reasons = this.getReasonList(asset);
                return { 
                    ...asset, 
                    curationScore: score, 
                    curationReasons: reasons 
                };
            })
            // 비움 지수가 높은 순서대로 정렬 (내림차순)
            .sort((a, b) => b.curationScore - a.curationScore);
    }

    /**
     * 개별 사진의 비움 지수를 계산합니다.
     */
    static calculateScore(asset) {
        let score = 0;

        // 1. 앨범 분류 여부 (최우선)
        if (!asset.isInAlbum) {
            score += FILTER_WEIGHTS.UNCLASSIFIED_ALBUM;
        } else {
            score += FILTER_WEIGHTS.ALREADY_IN_ALBUM;
        }

        // 2. 스크린샷 여부
        if (asset.isScreenshot) {
            score += FILTER_WEIGHTS.SCREENSHOT;
        }

        // 3. 파일 크기 (10MB 이상)
        const TEN_MB = 10 * 1024 * 1024;
        if (asset.fileSize && asset.fileSize > TEN_MB) {
            score += FILTER_WEIGHTS.LARGE_FILE;
        }

        // 4. 오래된 사진 (1년 이상)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (new Date(asset.creationDate) < oneYearAgo) {
            score += FILTER_WEIGHTS.OLD_PHOTO;
        }

        // 5. 즐겨찾기 (비움 방지)
        if (asset.isFavorite) {
            score += FILTER_WEIGHTS.FAVORITE_PENALTY;
        }

        return score;
    }

    /**
     * 점수 부여 사유를 사람이 읽기 쉬운 텍스트로 반환합니다.
     */
    static getReasonList(asset) {
        const reasons = [];
        
        if (!asset.isInAlbum) reasons.push('앨범 미분류');
        if (asset.isScreenshot) reasons.push('스크린샷');
        
        const TEN_MB = 10 * 1024 * 1024;
        if (asset.fileSize && asset.fileSize > TEN_MB) reasons.push('대용량 파일');
        
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (new Date(asset.creationDate) < oneYearAgo) reasons.push('오래된 사진');
        
        if (asset.isFavorite) reasons.push('즐겨찾기 됨');
        
        return reasons;
    }
}