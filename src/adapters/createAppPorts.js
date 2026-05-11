/**
 * createAppPorts — single composition root for all 13 platform/service ports.
 *
 * Per docs/refactor/headless-core-agent-instructions.md §4 line 298,
 * this is the ONLY app module allowed to import platform services or
 * Capacitor plugins directly. Adapter factories under `src/adapters/<group>/`
 * receive their dependencies through this assembler.
 *
 * Slice 2b: ports are constructed but no UI consumer is wired yet. Existing
 * components/services keep their direct imports until later slices migrate
 * them. This file therefore introduces NO behavior change at runtime — it
 * only adds a callable assembler that future controllers will consume.
 *
 * Layout note: instruction §2 layout omits `clipboard/` and `stats/`
 * directories, but ports.js §4 and instruction §8 both define those ports.
 * Slice 2b adds the missing files (decision #5 + StatsService split) under
 * `src/adapters/clipboard/clipboardPort.js` and
 * `src/adapters/stats/statsPort.js`.
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Clipboard } from '@capacitor/clipboard';

import { supabase } from '../services/supabase.js';
import { photoService } from '../services/PhotoService.js';
import { GeminiService } from '../services/GeminiService.js';
import { StatsService } from '../services/StatsService.js';
import {
    requestPermission as requestNotificationPermission,
    scheduleDailyNotification,
    cancelAll as cancelAllNotifications,
    setupActionListener as setupNotificationActionListener
} from '../services/NotificationService.js';
import { shareWithImage, shareCaption } from '../services/ShareService.js';
import { imageProcessor } from '../processors/ImageProcessor.js';
import RecocolPhotos from '../plugins/RecocolPhotos.ts';
import { API_CONFIG } from '../constants/config.js';

import { createSupabaseAuthPort } from './auth/supabaseAuthPort.js';
import { createCapacitorAppPort } from './auth/capacitorAppPort.js';
import { createCapacitorBrowserPort } from './auth/capacitorBrowserPort.js';
import { createPhotoPort } from './photos/photoPort.js';
import { createGeminiAiPort } from './ai/geminiAiPort.js';
import { createCapacitorNotificationPort } from './notifications/capacitorNotificationPort.js';
import { createAccountApiPort } from './account/accountApiPort.js';
import { createStatsPort } from './stats/statsPort.js';
import { createBrowserStoragePort } from './storage/browserStoragePort.js';
import { createClipboardPort } from './clipboard/clipboardPort.js';
import { createSharePort } from './share/sharePort.js';
import { createImageProcessorPort } from './image/imageProcessorPort.js';
import { createSystemClockPort } from './time/systemClockPort.js';

/**
 * Build the bundle of ports the headless core consumes.
 *
 * @returns {{
 *   authPort: Object,
 *   browserPort: Object,
 *   appPort: Object,
 *   photoPort: Object,
 *   aiPort: Object,
 *   notificationPort: Object,
 *   accountPort: Object,
 *   statsPort: Object,
 *   storagePort: Object,
 *   clipboardPort: Object,
 *   sharePort: Object,
 *   imageProcessorPort: Object,
 *   clock: Object
 * }}
 */
export function createAppPorts() {
    const geminiService = new GeminiService();

    const authPort = createSupabaseAuthPort({ supabase });
    const appPort = createCapacitorAppPort({ Capacitor, App });
    const browserPort = createCapacitorBrowserPort({ Browser });
    const photoPort = createPhotoPort({
        photoService,
        recocolPhotos: RecocolPhotos
    });
    const aiPort = createGeminiAiPort({ geminiService });
    const notificationPort = createCapacitorNotificationPort({
        requestPermission: requestNotificationPermission,
        scheduleDailyNotification,
        cancelAll: cancelAllNotifications,
        setupActionListener: setupNotificationActionListener
    });
    const accountPort = createAccountApiPort({
        baseUrl: API_CONFIG.BASE_URL,
        fetchImpl: (input, init) => fetch(input, init)
    });
    const statsPort = createStatsPort({ supabase, statsService: StatsService });
    const storagePort = createBrowserStoragePort({
        localStorage: window.localStorage,
        sessionStorage: window.sessionStorage
    });
    const clipboardPort = createClipboardPort({
        isNative: () => Capacitor.isNativePlatform(),
        nativeClipboard: Clipboard,
        webClipboard: navigator.clipboard
    });
    const sharePort = createSharePort({ shareWithImage, shareCaption });
    const imageProcessorPort = createImageProcessorPort({ imageProcessor });
    const clock = createSystemClockPort();

    return {
        authPort,
        browserPort,
        appPort,
        photoPort,
        aiPort,
        notificationPort,
        accountPort,
        statsPort,
        storagePort,
        clipboardPort,
        sharePort,
        imageProcessorPort,
        clock
    };
}
