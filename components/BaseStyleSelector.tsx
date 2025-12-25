'use client';
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { BaseStyleImage } from '@/lib/models/BaseStyleImage';

interface BaseStyleSelectorProps {
  selectedId: string | null;
  onSelect: (id: string | null, baseStyle: BaseStyleImage | null) => void;
}

const BaseStyleSelector: React.FC<BaseStyleSelectorProps> = ({ selectedId, onSelect }) => {
  const [baseStyles, setBaseStyles] = useState<BaseStyleImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const fetchBaseStyles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/base-styles');
        if (!response.ok) {
          throw new Error('Failed to fetch base styles');
        }
        const data = await response.json();
        setBaseStyles(data);
        
        // Auto-select first style if none selected
        if (data.length > 0 && !selectedId) {
          onSelect(data[0]._id?.toString() || null, data[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load base styles');
        console.error('Error fetching base styles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBaseStyles();
  }, []);

  // Update scroll button visibility when base styles load or scroll position changes
  useEffect(() => {
    const container = document.getElementById('base-style-carousel');
    if (container && baseStyles.length > 0) {
      const updateButtons = () => {
        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 10
        );
      };
      updateButtons();
      // Also update on resize
      window.addEventListener('resize', updateButtons);
      return () => window.removeEventListener('resize', updateButtons);
    } else {
      // Reset scroll buttons when container doesn't exist or no styles
      setCanScrollLeft(false);
      setCanScrollRight(false);
    }
  }, [baseStyles, scrollPosition]);

  const scrollLeft = () => {
    const container = document.getElementById('base-style-carousel');
    if (container) {
      const newPosition = Math.max(0, scrollPosition - 120);
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('base-style-carousel');
    if (container) {
      const maxScroll = container.scrollWidth - container.clientWidth;
      const newPosition = Math.min(maxScroll, scrollPosition + 120);
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newPosition = e.currentTarget.scrollLeft;
    setScrollPosition(newPosition);
    const container = e.currentTarget;
    setCanScrollLeft(newPosition > 0);
    setCanScrollRight(newPosition < container.scrollWidth - container.clientWidth - 10);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        <span className="ml-2 text-xs text-slate-400">Loading styles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-4 text-red-400">
        <AlertCircle className="w-4 h-4" />
        <span className="text-xs">{error}</span>
      </div>
    );
  }

  if (baseStyles.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-slate-500 text-xs">No base styles available</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div className="relative">
        {/* Scroll Buttons */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-full p-1.5 shadow-lg transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-slate-300" />
          </button>
        )}
        
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-full p-1.5 shadow-lg transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
        )}

        {/* Carousel */}
        <div
          id="base-style-carousel"
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {baseStyles.map((style) => {
            const styleId = style._id?.toString() || '';
            const isSelected = selectedId === styleId;
            const displayUrl = style.thumbnailUrl || style.imageUrl;

            return (
              <button
                key={styleId}
                onClick={() => onSelect(styleId, style)}
                className={`group relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-900/50'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
                aria-label={`Select ${style.name}`}
              >
                <img
                  src={displayUrl}
                  alt={style.name}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
                
                {/* Overlay */}
                <div
                  className={`absolute inset-0 transition-all ${
                    isSelected
                      ? 'bg-indigo-500/20'
                      : 'bg-black/0 group-hover:bg-black/20'
                  }`}
                />
                
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
                
                {/* Name Tooltip */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] font-bold text-white truncate block">
                    {style.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BaseStyleSelector;

