import RecocolPhotos from '../../plugins/RecocolPhotos.ts';
import { CurationEngine } from '../CurationEngine.js';

function generateContextMessage(asset) {
    return asset.curationReasons.length > 0
        ? `${asset.curationReasons.join(', ')}이라 비워내기 좋아요.`
        : '오늘의 소중한 기록 한 장입니다.';
}

export async function fetchAndRankPhotos(service, limit = 30) {
    console.log('PhotoService: Fetching photos...');
    try {
        const result = await RecocolPhotos.fetchPhotos({ limit, offset: 0 });

        if (!result || !result.photos) {
            console.warn('PhotoService: No photos returned');
            return { photos: [], totalCount: 0 };
        }

        console.log(`PhotoService: Found ${result.photos.length} photos. Ranking...`);
        const rankedAssets = CurationEngine.rankAssets(result.photos);
        const targetAssets = rankedAssets.slice(0, 10);

        service.photos = targetAssets.map((asset) => ({
            id: asset.id,
            imageUrl: null,
            date: asset.creationDate.split('T')[0],
            location: null,
            contextMessage: generateContextMessage(asset),
            rawAsset: asset,
            score: asset.curationScore
        }));

        return {
            photos: service.photos,
            totalCount: result.totalCount
        };
    } catch (error) {
        console.error('PhotoService: Fetch failed', error);
        throw error;
    }
}
