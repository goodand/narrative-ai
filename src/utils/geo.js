/**
 * Geo Utility Functions
 * GPS 좌표 변환 및 위치 관련 유틸리티
 */

/**
 * Convert DMS (Degree, Minute, Second) to Decimal coordinates
 * @param {Array} dms - DMS array from EXIF [degrees, minutes, seconds]
 * @param {string} ref - Reference direction (N, S, E, W)
 * @returns {number} Decimal coordinate
 */
export function convertDMSToDecimal(dms, ref) {
    if (!dms || dms.length < 3) return 0;

    // Handle both array and number formats from different EXIF readers
    const d = Array.isArray(dms[0]) ? dms[0][0] / dms[0][1] : dms[0];
    const m = Array.isArray(dms[1]) ? dms[1][0] / dms[1][1] : dms[1];
    const s = Array.isArray(dms[2]) ? dms[2][0] / dms[2][1] : dms[2];

    let decimal = d + (m / 60) + (s / 3600);

    // Apply negative for South and West references
    if (ref === 'S' || ref === 'W') {
        decimal = decimal * -1;
    }

    return decimal;
}

/**
 * Format GPS coordinates for display
 * @param {number} lat - Latitude in decimal
 * @param {number} lon - Longitude in decimal
 * @param {number} precision - Decimal places (default: 4)
 * @returns {string} Formatted coordinates string
 */
export function formatGPSCoordinates(lat, lon, precision = 4) {
    return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`;
}

/**
 * Convert decimal coordinates to DMS string format
 * @param {number} decimal - Decimal coordinate
 * @param {boolean} isLatitude - True for latitude, false for longitude
 * @returns {string} DMS formatted string
 */
export function decimalToDMS(decimal, isLatitude) {
    const direction = isLatitude
        ? (decimal >= 0 ? 'N' : 'S')
        : (decimal >= 0 ? 'E' : 'W');

    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesDecimal = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = ((minutesDecimal - minutes) * 60).toFixed(1);

    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}
