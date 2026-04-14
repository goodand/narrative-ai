/**
 * PhotoService - Public facade for photo runtime operations.
 * Internal responsibilities are split into focused runtimes to keep launch,
 * hydration, mutation, and legacy paths separate without breaking callers.
 */

import RecocolPhotos from '../plugins/RecocolPhotos.ts';
import { fetchDailyCuration, refreshDailyCurationAfterMutation } from './photo/dailyCurationRuntime.js';
import { ensurePhotoSummary, loadPhotoDetails } from './photo/detailHydrator.js';
import { recordCurationAction, deletePhoto } from './photo/mutationRuntime.js';
import { fetchAndRankPhotos } from './photo/legacyRankingRuntime.js';

export class PhotoService {
    constructor() {
        this.photos = [];
        this.currentDayKey = null;
    }

    async fetchAndRankPhotos(limit = 30) {
        return fetchAndRankPhotos(this, limit);
    }

    async fetchDailyCuration({ limit = 6, thumbSize = 420, transport = 'base64', forceRefresh = false } = {}) {
        return fetchDailyCuration(this, { limit, thumbSize, transport, forceRefresh });
    }

    async fetchCurationBatch(options = {}) {
        const { fetchCurationBatch } = await import('./photo/dailyCurationRuntime.js');
        return fetchCurationBatch(options);
    }

    async refreshDailyCurationAfterMutation(options = {}) {
        return refreshDailyCurationAfterMutation(this, options);
    }

    async ensurePhotoSummary(index, { includeFileSize = false } = {}) {
        return ensurePhotoSummary(this, index, { includeFileSize });
    }

    async loadPhotoDetails(index) {
        return loadPhotoDetails(this, index);
    }

    /**
     * Returns raw base64 string directly from native plugin (no binary conversion)
     * Path B 최적화: base64 → File → FileReader → base64 왕복 제거
     */
    async getPhotoAsBase64(index) {
        if (index < 0 || index >= this.photos.length) return null;
        const photo = this.photos[index];

        try {
            const { base64 } = await RecocolPhotos.loadImageData({
                assetId: photo.id,
                quality: 'original'
            });
            return base64;
        } catch (error) {
            console.error('PhotoService: Base64 load failed', error);
            return null;
        }
    }

    async recordCurationAction({ assetId, action, dayKey }) {
        return recordCurationAction(this, { assetId, action, dayKey });
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

    async deletePhoto(index) {
        return deletePhoto(this, index, (targetIndex, options) => this.ensurePhotoSummary(targetIndex, options));
    }

    getPhotos() {
        return this.photos;
    }

    getPhoto(index) {
        return this.photos[index];
    }
}

export const photoService = new PhotoService();
