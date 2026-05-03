export const PHOTO_PERMISSION_ERRORS = new Set([
    'photo_permission_not_requested',
    'photo_permission_denied'
]);

export function isPhotoPermissionError(error) {
    const message = error?.message || error;
    return PHOTO_PERMISSION_ERRORS.has(message);
}
