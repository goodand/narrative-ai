/**
 * Port contracts for the RECOCO core.
 *
 * These typedefs define the boundary between the headless core and the host
 * application adapters. The core never imports platform code directly; it
 * only relies on the shapes declared here.
 *
 * Keep these contracts in lockstep with
 * docs/refactor/headless-core-agent-instructions.md §4.
 */

/**
 * @typedef {Object} AuthPort
 * @property {(provider: 'google', options: { redirectTo: string, skipBrowserRedirect: boolean }) => Promise<{ url?: string }>} signInWithOAuth
 * @property {(tokens: { access_token: string, refresh_token: string }) => Promise<void>} setSession
 * @property {(code: string) => Promise<void>} exchangeCodeForSession
 * @property {() => Promise<{ user: Object|null, session: Object|null }>} getSession
 * @property {() => Promise<{ user: Object|null }>} getUser
 * @property {(callback: Function) => { unsubscribe?: Function }} onAuthStateChange
 * @property {(options?: Object) => Promise<void>} signOut
 */

/**
 * @typedef {Object} BrowserPort
 * @property {(options: { url: string, presentationStyle?: string }) => Promise<void>} open
 * @property {() => Promise<void>} close
 */

/**
 * @typedef {Object} AppPort
 * @property {() => boolean} isNative
 * @property {() => Promise<{ url?: string }|null>} getLaunchUrl
 * @property {(eventName: 'appUrlOpen'|'appStateChange', callback: Function) => Promise<{ remove?: Function }>|{ remove?: Function }} addListener
 */

/**
 * @typedef {Object} PhotoCurationResult
 * @property {Array<Object>} photos
 * @property {string|null} dayKey
 * @property {number} totalCount
 * @property {boolean} fromCache
 * @property {boolean} needsRefresh
 * @property {boolean} stale
 * @property {boolean} nativeTimeout
 */

/**
 * @typedef {Object} PhotoPort
 * @property {() => Array<Object>} getPhotos
 * @property {(options?: Object) => Promise<PhotoCurationResult>} fetchDailyCuration
 * @property {(options?: Object) => Promise<PhotoCurationResult>} fetchCurationBatch
 * @property {(photos: Array<Object>, options?: Object) => Promise<Array<Object>>} hydrateThumbsForPhotos
 * @property {(index: number) => Promise<Object|null>} loadPhotoDetails
 * @property {(index: number, options?: Object) => Promise<string|null>} getPhotoAsBase64
 * @property {(index: number, options?: Object) => Promise<File|null>} getPhotoAsFile
 * @property {(assetId: string) => Promise<string|null>} getPhotoAsAnalysisBase64
 * @property {(assetId: string) => Promise<any>|undefined} getAnalysis
 * @property {(assetId: string, promise: Promise<any>) => void} registerAnalysis
 * @property {(index: number) => Promise<boolean>} deletePhoto
 * @property {(payload: { assetId: string, action: string, dayKey?: string }) => Promise<void>} recordCurationAction
 * @property {() => Promise<{ status: string, authorized: boolean }>} getPhotoLibraryPermissionStatus
 * @property {() => Promise<{ status: string, authorized: boolean }>} requestPhotoLibraryPermission
 */

/**
 * @typedef {Object} AiPort
 * @property {(payload: Object) => Promise<Object>} generateDeleteRecommendation
 * @property {(payload: Object) => Promise<{ recommendations: Array<Object> }>} generateBatchDeleteRecommendations
 * @property {(payload: Object) => Promise<Object>} generateStory
 * @property {(payload: Object) => Promise<Array<Object>>} generateSynonyms
 */

/**
 * @typedef {Object} NotificationPort
 * @property {() => Promise<boolean>} requestPermission
 * @property {() => Promise<boolean>} scheduleDailyNotification
 * @property {() => Promise<boolean|void>} cancelAll
 * @property {(navigation: Object) => Promise<void>|void} setupActionListener
 */

/**
 * @typedef {Object} AccountPort
 * @property {(payload: { user_id: string, reason: string }) => Promise<void>} deleteAccount
 */

/**
 * @typedef {Object} StatsPort
 * @property {(userId: string) => Promise<Object|null>} getUserStats
 * @property {(userId: string, sinceIso: string) => Promise<Array<{ cleared_at: string }>>} getDetoxLogs
 * @property {(payload: Object) => Promise<void>} logCurationAction
 */

/**
 * @typedef {Object} StoragePort
 * @property {(key: string) => string|null} getItem
 * @property {(key: string, value: string) => void} setItem
 * @property {() => void} clearLocal
 * @property {() => void} clearSession
 */

/**
 * @typedef {Object} ClipboardPort
 * @property {(text: string) => Promise<void>} writeText
 */

/**
 * @typedef {Object} SharePort
 * @property {(payload: { imageBase64: string, caption: string }) => Promise<void>} shareWithImage
 * @property {(caption: string) => Promise<void>} shareCaption
 */

/**
 * @typedef {Object} ImageProcessorPort
 * @property {(file: File) => Promise<{ base64: string, dataUrl: string, width: number, height: number, metadata: Object }>} process
 */

/**
 * @typedef {Object} ClockPort
 * @property {() => Date} now
 */

export {};
