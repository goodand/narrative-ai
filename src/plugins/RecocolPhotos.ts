import { registerPlugin } from '@capacitor/core';

export interface PhotoAsset {
  id: string;
  creationDate: string;
  modificationDate: string;
  mediaType: 'image' | 'video';
  pixelWidth: number;
  pixelHeight: number;
  fileSize?: number;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  isFavorite: boolean;
  isScreenshot: boolean;
  isInAlbum: boolean; // 추가됨
  burstIdentifier?: string;
}

export interface RecocolPhotosPlugin {
  fetchPhotos(options: { limit: number; offset: number }): Promise<{ photos: PhotoAsset[]; totalCount: number }>;
  getDailyCuration(options: {
    limit?: number;
    thumbSize?: number;
    transport?: 'base64' | 'file';
    forceRefresh?: boolean;
  }): Promise<{
    dayKey: string;
    fromCache: boolean;
    needsRefresh: boolean;
    items: Array<{
      assetId: string;
      score: number;
      flags: string[];
      thumb: string;
    }>;
  }>;
  recordCurationAction(options: {
    assetId: string;
    action: 'deleted' | 'recorded' | 'skipped';
    dayKey: string;
  }): Promise<{ ok: boolean }>;
  getPhotoMetadata(options: { assetId: string }): Promise<any>;
  loadImageData(options: { assetId: string; quality: 'thumbnail' | 'original'; thumbSize?: number }): Promise<{ base64: string }>;
  deletePhoto(options: { assetId: string }): Promise<{ success: boolean }>;
}

const RecocolPhotos = registerPlugin<RecocolPhotosPlugin>('RecocolPhotos');

export default RecocolPhotos;
