import { registerPlugin, Capacitor } from '@capacitor/core';

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

export interface PhotoSummary {
  id: string;
  creationDate: string;
  pixelWidth: number;
  pixelHeight: number;
  fileSize?: number;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  } | null;
}

export interface RecocolPhotosPlugin {
  fetchPhotos(options: { limit: number; offset: number }): Promise<{ photos: PhotoAsset[]; totalCount: number }>;
  requestPhotoLibraryPermission(): Promise<{ status: string; authorized: boolean }>;
  getPhotoLibraryPermissionStatus(): Promise<{ status: string; authorized: boolean }>;
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
  getLocalThumbs(options: {
    assetIds: string[];
    thumbSize?: number;
    transport?: 'base64' | 'file';
    limit?: number;
  }): Promise<{
    thumbs: Array<{ assetId: string; thumb: string }>;
    failedAssetIds: string[];
  }>;
  recordCurationAction(options: {
    assetId: string;
    action: 'deleted' | 'recorded' | 'skipped';
    dayKey: string;
  }): Promise<{ ok: boolean }>;
  getPhotoSummary(options: { assetId: string; includeFileSize?: boolean }): Promise<PhotoSummary>;
  getPhotoMetadata(options: { assetId: string; allowNetworkAccess?: boolean }): Promise<any>;
  loadImageData(options: {
    assetId: string;
    quality: 'thumbnail' | 'analysis' | 'original';
    thumbSize?: number;
    allowNetworkAccess?: boolean;
  }): Promise<{ base64: string }>;
  deletePhoto(options: { assetId: string }): Promise<{ success: boolean }>;
}

const NativePlugin = registerPlugin<RecocolPhotosPlugin>('RecocolPhotos');

const mockBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const MockPlugin: RecocolPhotosPlugin = {
  fetchPhotos: async () => ({ photos: [], totalCount: 0 }),
  requestPhotoLibraryPermission: async () => ({ status: 'authorized', authorized: true }),
  getPhotoLibraryPermissionStatus: async () => ({ status: 'authorized', authorized: true }),
  getDailyCuration: async (options) => {
    console.log('[MOCK] getDailyCuration called on web');
    const limit = options.limit || 3;
    return {
      dayKey: new Date().toISOString().split('T')[0],
      fromCache: false,
      needsRefresh: false,
      items: Array(limit).fill(null).map((_, i) => ({
        assetId: `mock-web-${i}`,
        score: 60 + i,
        flags: ['mocked_for_web', 'screenshot'],
        thumb: `https://picsum.photos/seed/recoco${i}/400/600`
      }))
    };
  },
  getLocalThumbs: async (options) => ({
    thumbs: options.assetIds.map((assetId, i) => ({
      assetId,
      thumb: `https://picsum.photos/seed/${encodeURIComponent(assetId || `recoco${i}`)}/400/600`
    })),
    failedAssetIds: []
  }),
  recordCurationAction: async () => ({ ok: true }),
  getPhotoSummary: async (options) => ({
    id: options.assetId,
    creationDate: new Date().toISOString(),
    pixelWidth: 800,
    pixelHeight: 600,
    location: null
  }),
  getPhotoMetadata: async () => ({}),
  loadImageData: async () => ({ base64: mockBase64 }),
  deletePhoto: async () => ({ success: true })
};

const RecocolPhotos = Capacitor.isNativePlatform() ? NativePlugin : MockPlugin;

export default RecocolPhotos;
