/**
 * normalizeError(error, context?) — pure error normalizer for the headless core.
 *
 * Contract (instruction doc §6):
 *   - never calls console / showToast.
 *   - never throws.
 *   - returns:
 *       {
 *         message: string,           // user-facing; falls back to error.message or String(error)
 *         context: string,           // controller domain or ''
 *         code: string|null,         // platform/service-specific code if present
 *         cause: Error|string|null   // original error preserved for logging only
 *       }
 *
 * Used by every controller before assigning errors to `store.set('<domain>.error', ...)`
 * so view models render a consistent shape across UIs.
 *
 * @param {*} error
 * @param {string} [context]
 * @returns {{ message: string, context: string, code: string|null, cause: Error|string|null }}
 */
export function normalizeError(error, context = '') {
    const safeContext = typeof context === 'string' ? context : '';

    if (error == null) {
        return {
            message: 'Unknown error',
            context: safeContext,
            code: null,
            cause: null
        };
    }

    if (typeof error === 'string') {
        return {
            message: error,
            context: safeContext,
            code: null,
            cause: error
        };
    }

    const message = (typeof error.message === 'string' && error.message.length > 0)
        ? error.message
        : (() => {
            try {
                return String(error);
            } catch (_) {
                return 'Unknown error';
            }
        })();

    let code = null;
    if (typeof error.code === 'string' && error.code.length > 0) {
        code = error.code;
    } else if (typeof error.code === 'number') {
        code = String(error.code);
    } else if (typeof error.name === 'string' && error.name.length > 0 && error.name !== 'Error') {
        code = error.name;
    }

    return {
        message,
        context: safeContext,
        code,
        cause: error
    };
}
