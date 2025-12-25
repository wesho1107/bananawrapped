import { useState, useCallback } from 'react';

export interface ImageValidationError {
  message: string;
  code: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'READ_ERROR' | 'INVALID_FORMAT';
}

export interface ImageProcessorResult {
  dataUrl: string;
  file: File;
  previewUrl: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Custom hook for handling image upload, validation, and preview generation
 */
export function useUploadImageProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<ImageValidationError | null>(null);

  /**
   * Validates an image file
   */
  const validateImage = useCallback((file: File): ImageValidationError | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        message: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
        code: 'INVALID_TYPE',
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        code: 'FILE_TOO_LARGE',
      };
    }

    return null;
  }, []);

  /**
   * Converts a File to base64 data URI
   */
  const fileToDataUrl = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Validate that result is a data URI
        if (!result.startsWith('data:image/')) {
          reject({
            message: 'Failed to convert file to valid image data URI',
            code: 'INVALID_FORMAT',
          } as ImageValidationError);
          return;
        }
        resolve(result);
      };
      reader.onerror = () => {
        reject({
          message: 'Failed to read file',
          code: 'READ_ERROR',
        } as ImageValidationError);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * Creates a preview URL from a File using URL.createObjectURL
   */
  const createPreviewUrl = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  /**
   * Processes an image file: validates, converts to base64, and creates preview
   */
  const processImage = useCallback(
    async (file: File): Promise<ImageProcessorResult> => {
      setIsProcessing(true);
      setError(null);

      try {
        // Validate the file
        const validationError = validateImage(file);
        if (validationError) {
          setError(validationError);
          throw validationError;
        }

        // Convert to base64 data URI
        const dataUrl = await fileToDataUrl(file);

        // Create preview URL
        const previewUrl = createPreviewUrl(file);

        setIsProcessing(false);
        return {
          dataUrl,
          file,
          previewUrl,
        };
      } catch (err) {
        setIsProcessing(false);
        if (err && typeof err === 'object' && 'code' in err) {
          setError(err as ImageValidationError);
          throw err;
        }
        const unknownError: ImageValidationError = {
          message: 'An unexpected error occurred while processing the image',
          code: 'READ_ERROR',
        };
        setError(unknownError);
        throw unknownError;
      }
    },
    [validateImage, fileToDataUrl, createPreviewUrl]
  );

  /**
   * Revokes a preview URL to free memory
   */
  const revokePreviewUrl = useCallback((previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
  }, []);

  return {
    processImage,
    validateImage,
    revokePreviewUrl,
    isProcessing,
    error,
    clearError: () => setError(null),
  };
}

