import RecocolPhotos from '../../plugins/RecocolPhotos.ts';
import { geocodingService } from '../GeocodingService.js';
import { formatGPSCoordinates } from '../../utils/geo.js';

export async function ensurePhotoSummary(service, index, { includeFileSize = false } = {}) {
    if (index < 0 || index >= service.photos.length) return null;
    const photo = service.photos[index];
    if (!photo) return null;

    const rawAsset = photo.rawAsset || {};
    const summaryHydrated = rawAsset._summaryHydrated === true;
    const needsBaseSummary =
        !summaryHydrated ||
        !rawAsset.creationDate ||
        !rawAsset.pixelWidth ||
        !rawAsset.pixelHeight;
    const needsFileSize = includeFileSize && !(typeof rawAsset.fileSize === 'number' && rawAsset.fileSize > 0);

    if (!needsBaseSummary && !needsFileSize) {
        return photo;
    }

    try {
        const summary = await RecocolPhotos.getPhotoSummary({
            assetId: photo.id,
            includeFileSize
        });

        if (!summary) return photo;

        const mergedRawAsset = {
            ...rawAsset,
            ...summary,
            location: summary.location ?? rawAsset.location ?? null,
            _summaryHydrated: true
        };

        photo.rawAsset = mergedRawAsset;

        if (summary.creationDate && (!photo.date || photo.date === service.currentDayKey)) {
            photo.date = summary.creationDate.split('T')[0];
        }

        if (mergedRawAsset.location && (!photo.location || photo.location === '위치 정보 없음')) {
            photo.location = formatGPSCoordinates(
                mergedRawAsset.location.latitude,
                mergedRawAsset.location.longitude
            );
        }

        return photo;
    } catch (error) {
        console.error('PhotoService: Summary hydration failed', error);
        return photo;
    }
}

export async function loadPhotoDetails(service, index) {
    if (index < 0 || index >= service.photos.length) return null;
    const photo = service.photos[index];

    if (photo.imageUrl && photo.location) return photo;

    try {
        const tasks = [];

        if (!photo.imageUrl) {
            tasks.push(
                RecocolPhotos.loadImageData({
                    assetId: photo.id,
                    quality: 'thumbnail',
                    thumbSize: 300,
                    allowNetworkAccess: false
                })
                    .then(({ base64 }) => { photo.imageUrl = `data:image/jpeg;base64,${base64}`; })
                    .catch((err) => {
                        console.error(`PhotoService: Failed to load image ${photo.id}:`, err);
                        photo.imageUrl = null;
                    })
            );
        }

        if (!photo.location) {
            if (photo.rawAsset.location) {
                tasks.push(
                    geocodingService.getAddress(
                        photo.rawAsset.location.latitude,
                        photo.rawAsset.location.longitude
                    )
                        .then((addr) => { photo.location = addr; })
                        .catch(() => { photo.location = '위치 정보 없음'; })
                );
            } else {
                photo.location = '위치 정보 없음';
            }
        }

        await Promise.all(tasks);
        return photo;
    } catch (error) {
        console.error(`PhotoService: Failed to load details for ${photo.id}`, error);
        return null;
    }
}
