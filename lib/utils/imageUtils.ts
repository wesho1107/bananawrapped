/**
 * Utility functions for handling image data URIs
 */

/**
 * Extract base64 data from a data URI
 * @param dataUri - Data URI string (e.g., "data:image/jpeg;base64,...")
 * @returns Base64 string without the data URI prefix
 * @throws Error if the data URI format is invalid
 */
export function extractBase64FromDataUri(dataUri: string): string {
  const matches = dataUri.match(/^data:image\/[^;]+;base64,(.+)$/);
  if (!matches || matches.length < 2) {
    throw new Error('Invalid data URI format');
  }
  return matches[1];
}

/**
 * Extract media type from a data URI
 * @param dataUri - Data URI string (e.g., "data:image/jpeg;base64,...")
 * @returns Media type string (e.g., "image/jpeg")
 * @throws Error if the data URI format is invalid
 */
export function extractMediaTypeFromDataUri(dataUri: string): string {
  const matches = dataUri.match(/^data:(image\/[^;]+);base64,/);
  if (!matches || matches.length < 2) {
    throw new Error('Invalid data URI format');
  }
  return matches[1];
}

/**
 * Convert Uint8Array to base64 data URI
 * @param uint8Array - Image data as Uint8Array
 * @param mediaType - Media type (e.g., "image/jpeg")
 * @returns Base64 data URI string
 */
export function uint8ArrayToDataUri(uint8Array: Uint8Array, mediaType: string): string {
  const base64String = Buffer.from(uint8Array).toString('base64');
  return `data:${mediaType};base64,${base64String}`;
}

