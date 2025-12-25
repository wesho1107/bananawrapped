'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Camera, Upload, Wand2, Trash2, Layout, ImagePlus, CheckCircle2, AlertCircle, Download, X } from 'lucide-react';
import { MONTHS } from '@/lib/constants';
import BaseStyleSelector from './BaseStyleSelector';
import { BaseStyleImage } from '@/lib/models/BaseStyleImage';
import { useUploadImageProcessor } from '@/hooks/useImageProcessor';

interface MonthData {
  name: string;
  editPrompt: string;
  baseImage: string | null;
  resultImage: string | null;
  status: 'idle' | 'processing' | 'completed' | 'error';
}

const WrappedPoster = () => {
  const [monthsData, setMonthsData] = useState<MonthData[]>(
      MONTHS.map(name => ({ 
        name, 
        editPrompt: "", 
        baseImage: null, 
        resultImage: null, 
        status: 'idle' as const
      }))
    );
    
  const [selectedBaseStyleId, setSelectedBaseStyleId] = useState<string | null>(null);
  const [selectedBaseStyle, setSelectedBaseStyle] = useState<BaseStyleImage | null>(null);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const posterRef = useRef(null); // Used for html2canvas
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { processImage, isProcessing, error, clearError, revokePreviewUrl } = useUploadImageProcessor();

  const handleBaseStyleSelect = (id: string | null, baseStyle: BaseStyleImage | null) => {
    setSelectedBaseStyleId(id);
    setSelectedBaseStyle(baseStyle);
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => {
        if (url && url.startsWith('blob:')) {
          revokePreviewUrl(url);
        }
      });
    };
  }, []);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedMonth === null) {
      return;
    }

    // Clear previous error
    clearError();
    setUploadError(null);

    try {
      // Process the image (validates, converts to base64, creates preview)
      const result = await processImage(file);

      // Update monthsData with the base64 data URI
      const newData = [...monthsData];
      newData[selectedMonth].baseImage = result.dataUrl;

      // Clean up old preview URL if it exists
      if (previewUrls[selectedMonth] && previewUrls[selectedMonth].startsWith('blob:')) {
        revokePreviewUrl(previewUrls[selectedMonth]);
      }

      // Store preview URL for cleanup
      setPreviewUrls((prev) => ({
        ...prev,
        [selectedMonth]: result.previewUrl,
      }));

      setMonthsData(newData);

      // Clear the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      // Error is already set by the hook, but we'll also set a user-friendly message
      const errorMessage = error?.message || 'Failed to upload image. Please try again.';
      setUploadError(errorMessage);
    }
  };

  // Handle image removal
  const handleImageRemove = () => {
    if (selectedMonth === null) return;

    // Clean up preview URL
    if (previewUrls[selectedMonth] && previewUrls[selectedMonth].startsWith('blob:')) {
      revokePreviewUrl(previewUrls[selectedMonth]);
    }

    // Update state
    const newData = [...monthsData];
    newData[selectedMonth].baseImage = null;
    setMonthsData(newData);

    setPreviewUrls((prev) => {
      const newUrls = { ...prev };
      delete newUrls[selectedMonth];
      return newUrls;
    });

    setUploadError(null);
    clearError();

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 md:gap-10">
        
        {/* Control Column */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          <header className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter text-white">
              <span className="text-yellow-500">BANANA</span>WRAPPED
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              Create your 2025 Wrapped calendar.
            </p>
          </header>

          <section className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="space-y-3">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Select An Avatar</h2>
              <BaseStyleSelector
                selectedId={selectedBaseStyleId}
                onSelect={handleBaseStyleSelect}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={()=>{}}
                disabled={isProcessingAll}
                className="flex-1 w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                {isProcessingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Generate All
              </button>
              
              <button
                onClick={()=>{}}
                disabled={isExporting}
                className="flex-none p-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 rounded-xl flex items-center justify-center transition-all shadow-lg h-auto"
                style={{minWidth: 0}}
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </button>
            </div>
          </section>
        </div>

        {/* Poster Grid Area */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div 
            ref={posterRef}
            className="bg-white aspect-[9/16] w-full max-w-[420px] shadow-2xl rounded-[1.5rem] overflow-hidden flex flex-col border-[10px] border-slate-900"
            style={{ backgroundImage: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
          >
            {/* Poster Header */}
            <div className="pt-8 pb-4 text-center">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">2025</h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="h-[1.5px] w-6 bg-indigo-500/20"></span>
                <span className="text-[9px] font-black text-indigo-500/60 tracking-[0.4em] uppercase">My year in a calendar</span>
                <span className="h-[1.5px] w-6 bg-indigo-500/20"></span>
              </div>
            </div>

            {/* 3x4 Grid */}
            <div className="flex-1 px-4 grid grid-cols-3 grid-rows-4 gap-2 pb-6">
              {monthsData.map((month, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedMonth(idx)}
                  className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all border 
                    ${month.resultImage ? 'border-transparent shadow-sm' : 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                >
                  {month.resultImage ? (
                    <img src={month.resultImage} className="w-full h-full object-cover" alt={month.name} crossOrigin="anonymous" />
                  ) : month.baseImage ? (
                    <div className="relative w-full h-full">
                      <img src={month.baseImage} className="w-full h-full object-cover opacity-30 grayscale" alt="Base" crossOrigin="anonymous" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Wand2 className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                      <ImagePlus className="w-4 h-4 mb-0.5 opacity-20" />
                      <span className="text-[7px] font-bold uppercase tracking-widest">{month.name}</span>
                    </div>
                  )}

                  {month.status === 'processing' && (
                    <div className="absolute inset-0 bg-indigo-900/40 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                  
                  <div className="absolute bottom-1 left-1 flex justify-between items-center pointer-events-none w-full pr-2">
                    <span className="text-[7px] font-black text-slate-900/40 uppercase truncate bg-white/60 px-1 rounded-sm">{month.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="h-12 flex items-center justify-center px-8 gap-3 border-t border-slate-100">
               <div className="flex-1 text-[8px] font-black text-slate-400 tracking-tight uppercase leading-tight">
                 My 2025 Wrapped Calendar<br/>
                 <span className="text-[7px] font-medium opacity-60 italic">Generated with BananaWrapped</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {selectedMonth !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Monthly Scene</span>
                  <h3 className="text-xl font-bold">{monthsData[selectedMonth].name} 2025</h3>
                </div>
                <button onClick={() => setSelectedMonth(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">✕</button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    1. Upload Image of the Month
                  </label>
                  <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 relative group overflow-hidden">
                    {monthsData[selectedMonth].baseImage ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={monthsData[selectedMonth].baseImage!} 
                          className="w-full h-full object-cover" 
                          alt="Preview" 
                        />
                        {isProcessing && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                        <button
                          onClick={handleImageRemove}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors text-white cursor-pointer z-10"
                          aria-label="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 cursor-pointer group">
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-6 h-6 mb-1 animate-spin" />
                            <span className="text-[10px]">Processing...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-6 h-6 mb-1" />
                            <span className="text-[10px]">Tap to upload</span>
                          </>
                        )}
                        {/* Upload overlay - only shows when no image exists */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/60 flex items-center justify-center transition-opacity pointer-events-none">
                          <Upload className="w-5 h-5 text-white" />
                        </div>
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          className="hidden" 
                          onChange={handleImageUpload} 
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          disabled={isProcessing}
                        />
                      </label>
                    )}
                  </div>
                  {(error || uploadError) && (
                    <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-red-300">{error?.message || uploadError}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    2. Describe Highlight of the Month
                  </label>
                  <textarea
                    value={monthsData[selectedMonth].editPrompt}
                    onChange={(e) => {
                      const newData = [...monthsData];
                      newData[selectedMonth].editPrompt = e.target.value;
                      setMonthsData(newData);
                    }}
                    className="w-full min-h-[80px] bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Describe highlights of the month (e.g. a trip to the beach, a new job, a birthday...)"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={()=>{}}
                  disabled={!monthsData[selectedMonth].baseImage}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-900/40"
                >
                  Apply & Render
                </button>
                <button
                  onClick={() => setSelectedMonth(null)}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WrappedPoster;