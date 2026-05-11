import { createStore } from './state/createStore.js';
import { normalizeError } from './errors/normalizeError.js';
import { createNavigationController } from './navigation/createNavigationController.js';
import { createAuthController } from './auth/createAuthController.js';
import { createPermissionController } from './permissions/createPermissionController.js';
import { createNotificationController } from './notifications/createNotificationController.js';
import { createAccountController } from './account/createAccountController.js';
import { createHomeController } from './home/createHomeController.js';
import { createInputController } from './input/createInputController.js';
import { createResultController } from './result/createResultController.js';
import { createReportController } from './report/createReportController.js';

/**
 * Create the headless RECOCO core.
 *
 * Slice 3c-3: ALL nine controllers (navigation, auth, permissions,
 * notifications, account, home, input, result, report) are wired. Slice 4+
 * adds the DOM app and reactor; slice 5 converts components to DOM-only.
 *
 * @param {{
 *   authPort?: Object,
 *   appPort?: Object,
 *   browserPort?: Object,
 *   photoPort?: Object,
 *   aiPort?: Object,
 *   notificationPort?: Object,
 *   accountPort?: Object,
 *   statsPort?: Object,
 *   storagePort?: Object,
 *   clipboardPort?: Object,
 *   sharePort?: Object,
 *   imageProcessorPort?: Object,
 *   clock?: Object
 * }} [deps]    Ports assembled by `src/adapters/createAppPorts.js`.
 * @param {{ webRedirectOrigin?: string }} [options]
 *   `webRedirectOrigin` supplies the web OAuth redirect URL because core
 *   cannot read host location info directly.
 */
export function createRecocoCore(deps = {}, options = {}) {
    const store = createStore();

    const navigation = createNavigationController({ store });

    const auth = (deps.authPort && deps.appPort && deps.browserPort)
        ? createAuthController({
            authPort: deps.authPort,
            appPort: deps.appPort,
            browserPort: deps.browserPort,
            store,
            normalizeError,
            webRedirectOrigin: options.webRedirectOrigin || ''
        })
        : null;

    const permissions = (deps.appPort && deps.photoPort)
        ? createPermissionController({
            appPort: deps.appPort,
            photoPort: deps.photoPort,
            store,
            normalizeError
        })
        : null;

    const notifications = (deps.notificationPort && deps.appPort && deps.storagePort)
        ? createNotificationController({
            notificationPort: deps.notificationPort,
            appPort: deps.appPort,
            storagePort: deps.storagePort,
            store,
            normalizeError
        })
        : null;

    const account = (deps.accountPort && deps.authPort && deps.storagePort)
        ? createAccountController({
            accountPort: deps.accountPort,
            authPort: deps.authPort,
            storagePort: deps.storagePort,
            store,
            normalizeError
        })
        : null;

    const home = (deps.photoPort && deps.aiPort)
        ? createHomeController({
            photoPort: deps.photoPort,
            aiPort: deps.aiPort,
            store,
            normalizeError
        })
        : null;

    const input = deps.imageProcessorPort
        ? createInputController({
            imageProcessorPort: deps.imageProcessorPort,
            store,
            normalizeError
        })
        : null;

    const result = (deps.clipboardPort && deps.sharePort && deps.aiPort)
        ? createResultController({
            clipboardPort: deps.clipboardPort,
            sharePort: deps.sharePort,
            aiPort: deps.aiPort,
            store,
            normalizeError
        })
        : null;

    const report = (deps.statsPort && deps.authPort && deps.clock)
        ? createReportController({
            statsPort: deps.statsPort,
            authPort: deps.authPort,
            clock: deps.clock,
            store,
            normalizeError
        })
        : null;

    return {
        store,
        navigation,
        auth,
        permissions,
        notifications,
        home,
        input,
        result,
        report,
        account
    };
}
