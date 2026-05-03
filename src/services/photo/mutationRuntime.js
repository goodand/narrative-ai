import RecocolPhotos from '../../plugins/RecocolPhotos.ts';
import { StatsService } from '../StatsService.js';

export async function recordCurationAction(service, { assetId, action, dayKey }) {
    if (!assetId || !action) return false;
    try {
        await RecocolPhotos.recordCurationAction({
            assetId,
            action,
            dayKey: dayKey || service.currentDayKey || ''
        });
        return true;
    } catch (error) {
        console.error('PhotoService: recordCurationAction failed', error);
        throw error;
    }
}

export async function deletePhoto(service, index, ensurePhotoSummary) {
    if (index < 0 || index >= service.photos.length) return false;
    await ensurePhotoSummary(index, { includeFileSize: true });
    const photo = service.photos[index];

    try {
        const { success } = await RecocolPhotos.deletePhoto({ assetId: photo.id });
        if (success) {
            await StatsService.logDetox({
                fileSize: photo.rawAsset.fileSize,
                reason: photo.rawAsset.curationReasons?.join(', ') || '사용자 선택',
                photoDate: photo.rawAsset.creationDate,
                location: photo.location
            });

            service.photos.splice(index, 1);
            return true;
        }
        return false;
    } catch (error) {
        console.error('PhotoService: Delete failed', error);
        throw error;
    }
}
