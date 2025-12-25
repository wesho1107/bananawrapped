'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Loader2, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { BaseStyleImage } from '@/lib/models/BaseStyleImage';

const BaseStyleUploader: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [names, setNames] = useState<Record<number, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<Array<{ success: boolean; message: string; data?: BaseStyleImage }>>([]);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const previewsRef = useRef(previews);

  // Keep ref in sync with state
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Generate previews and default names using the current images length
    const startIndex = images.length;
    const newPreviews: Record<number, string> = {};
    const newNames: Record<number, string> = {};

    files.forEach((file, index) => {
      const actualIndex = startIndex + index;
      // Use URL.createObjectURL for synchronous preview generation
      const previewUrl = URL.createObjectURL(file);
      newPreviews[actualIndex] = previewUrl;

      // Set default name from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      newNames[actualIndex] = nameWithoutExt;
    });

    // Update all state at once
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => ({ ...prev, ...newPreviews }));
    setNames((prev) => ({ ...prev, ...newNames }));

    // Clear the input so the same file can be selected again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to free memory
    setPreviews((prev) => {
      if (prev[index]) {
        URL.revokeObjectURL(prev[index]);
      }
      // Reindex previews to match new array indices after removal
      const newPreviews: Record<number, string> = {};
      Object.keys(prev).forEach((key) => {
        const keyNum = parseInt(key);
        if (keyNum < index) {
          newPreviews[keyNum] = prev[keyNum];
        } else if (keyNum > index) {
          newPreviews[keyNum - 1] = prev[keyNum];
        }
      });
      return newPreviews;
    });

    setNames((prev) => {
      // Reindex names to match new array indices after removal
      const newNames: Record<number, string> = {};
      Object.keys(prev).forEach((key) => {
        const keyNum = parseInt(key);
        if (keyNum < index) {
          newNames[keyNum] = prev[keyNum];
        } else if (keyNum > index) {
          newNames[keyNum - 1] = prev[keyNum];
        }
      });
      return newNames;
    });

    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const generateThumbnail = (dataUrl: string, maxSize: number = 200): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    });
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      alert('Please select at least one image');
      return;
    }

    setUploading(true);
    setUploadResults([]);

    const results: Array<{ success: boolean; message: string; data?: BaseStyleImage }> = [];

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const name = names[i] || file.name.replace(/\.[^/.]+$/, '');

      if (!name.trim()) {
        results.push({
          success: false,
          message: `Image ${i + 1}: Name is required`,
        });
        continue;
      }

      try {
        // Convert file to base64 data URI
        const imageDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Generate thumbnail
        const thumbnailUrl = await generateThumbnail(imageDataUrl);

        // Upload to API
        const response = await fetch('/api/base-styles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            imageUrl: imageDataUrl,
            thumbnailUrl,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        results.push({
          success: true,
          message: `✓ ${name} uploaded successfully`,
          data,
        });
      } catch (error) {
        results.push({
          success: false,
          message: `✗ ${name}: ${error instanceof Error ? error.message : 'Upload failed'}`,
        });
      }
    }

    setUploadResults(results);
    setUploading(false);

    // Clear form if all uploads succeeded
    if (results.every((r) => r.success)) {
      setTimeout(() => {
        // Revoke all object URLs before clearing
        Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
        setImages([]);
        setNames({});
        setPreviews({});
        setUploadResults([]);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-white mb-2">Upload Base Style Images</h1>
          <p className="text-slate-400 text-sm mb-6">
            Upload images to MongoDB. Images will be stored as base64 data URIs.
          </p>

          {/* File Input */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Select Images
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label
                htmlFor="image-upload"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5 text-indigo-400" />
                <span className="text-slate-300">Choose Images</span>
              </label>
            </div>
          </div>

          {/* Image Preview List */}
          {images.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Selected Images ({images.length})
              </h2>
              <div className="space-y-4">
                {images.map((file, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-4 bg-slate-800 border border-slate-700 rounded-lg"
                  >
                    {/* Preview */}
                    <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-slate-700">
                      {previews[index] ? (
                        <img
                          src={previews[index]}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                          <ImageIcon className="w-8 h-8 text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Name Input */}
                    <div className="flex-1">
                      <label className="block mb-2 text-sm font-medium text-slate-300">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={names[index] || ''}
                        onChange={(e) =>
                          setNames((prev) => ({ ...prev, [index]: e.target.value }))
                        }
                        placeholder="Enter image name"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={uploading}
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeImage(index)}
                      className="flex-shrink-0 self-start p-2 text-slate-400 hover:text-red-400 transition-colors"
                      disabled={uploading}
                      aria-label="Remove image"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          {images.length > 0 && (
            <button
              onClick={handleUpload}
              disabled={uploading || images.length === 0}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload {images.length} Image{images.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          )}

          {/* Upload Results */}
          {uploadResults.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-lg font-semibold text-white mb-2">Upload Results</h3>
              {uploadResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    result.success
                      ? 'bg-green-900/20 border border-green-800'
                      : 'bg-red-900/20 border border-red-800'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      result.success ? 'text-green-300' : 'text-red-300'
                    }`}
                  >
                    {result.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            ← Back to Main App
          </a>
        </div>
      </div>
    </div>
  );
};

export default BaseStyleUploader;

