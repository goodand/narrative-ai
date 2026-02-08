/**
 * PhotoService - Manages photo data fetching, caching, and processing
 * Encapsulates logic for native plugin interaction and curation engine
 */

import RecocolPhotos from '../plugins/RecocolPhotos.ts';
import { CurationEngine } from './CurationEngine.js';
import { geocodingService } from './GeocodingService.js';
import { StatsService } from './StatsService.js';

export class PhotoService {
    constructor() {
        this.photos = [];
        this.cache = new Map(); // assetId -> { imageUrl, location }
    }

    /**
     * Fetches photos from native gallery and ranks them using CurationEngine
     */
    async fetchAndRankPhotos(limit = 30) {
        console.log('PhotoService: Fetching photos...');
        try {
            const result = await RecocolPhotos.fetchPhotos({ limit, offset: 0 });
            
            if (!result || !result.photos) {
                console.warn('PhotoService: No photos returned');
                return { photos: [], totalCount: 0 };
            }

            console.log(`PhotoService: Found ${result.photos.length} photos. Ranking...`);
            const rankedAssets = CurationEngine.rankAssets(result.photos);
            const targetAssets = rankedAssets.slice(0, 10); // Top 10 curation targets (백그라운드 프리페치 포함)

            this.photos = targetAssets.map(asset => ({
                id: asset.id,
                imageUrl: null, // Loaded lazily
                date: asset.creationDate.split('T')[0],
                location: null, // Loaded lazily
                contextMessage: this._generateContextMessage(asset),
                rawAsset: asset,
                score: asset.curationScore
            }));

            return { 
                photos: this.photos, 
                totalCount: result.totalCount 
            };
        } catch (error) {
            console.error('PhotoService: Fetch failed', error);
            throw error;
        }
    }

    /**
     * Loads image data and location for a specific photo index
     */
    async loadPhotoDetails(index) {
        if (index < 0 || index >= this.photos.length) return null;
        const photo = this.photos[index];

        if (photo.imageUrl && photo.location) return photo; // Already loaded

        try {
            const tasks = [];

            // 1. Image Data (네이티브 플러그인)
            if (!photo.imageUrl) {
                tasks.push(
                    RecocolPhotos.loadImageData({ assetId: photo.id, quality: 'thumbnail' })
                        .then(({ base64 }) => { photo.imageUrl = `data:image/jpeg;base64,${base64}`; })
                );
            }

            // 2. Location Data (API 호출) — 이미지와 병렬 실행
            if (!photo.location) {
                if (photo.rawAsset.location) {
                    tasks.push(
                        geocodingService.getAddress(
                            photo.rawAsset.location.latitude,
                            photo.rawAsset.location.longitude
                        )
                        .then(addr => { photo.location = addr; })
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

    /**
     * Converts current photo to a File object for upload
     */
    async getPhotoAsFile(index) {
        if (index < 0 || index >= this.photos.length) return null;
        const photo = this.photos[index];

        try {
            const { base64 } = await RecocolPhotos.loadImageData({ 
                assetId: photo.id, 
                quality: 'original' 
            });
            
            const byteCharacters = atob(base64);
            const byteArray = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteArray[i] = byteCharacters.charCodeAt(i);
            }
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            
            return new File([blob], `photo_${photo.id}.jpg`, { type: 'image/jpeg' });
        } catch (error) {
            console.error('PhotoService: File conversion failed', error);
            return null;
        }
    }

    /**
     * Deletes a photo and logs stats
     */
    async deletePhoto(index) {
        if (index < 0 || index >= this.photos.length) return false;
        const photo = this.photos[index];

        try {
            const { success } = await RecocolPhotos.deletePhoto({ assetId: photo.id });
            if (success) {
                await StatsService.logDetox({
                    fileSize: photo.rawAsset.fileSize,
                    reason: photo.rawAsset.curationReasons?.join(', ') || '사용자 선택',
                    photoDate: photo.rawAsset.creationDate,
                    location: photo.location
                });
                
                // Remove from local list
                this.photos.splice(index, 1);
                return true;
            }
            return false;
        } catch (error) {
            console.error('PhotoService: Delete failed', error);
            throw error;
        }
    }

    getPhotos() {
        return this.photos;
    }

    getPhoto(index) {
        return this.photos[index];
    }

    _generateContextMessage(asset) {
        return asset.curationReasons.length > 0 
            ? `${asset.curationReasons.join(', ')}이라 비워내기 좋아요.`
            : '오늘의 소중한 기록 한 장입니다.';
    }
}

export const photoService = new PhotoService();
