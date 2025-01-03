import { MediaViewProps } from '@/types/Media';
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause, RotateCw, Heart, Share2, ZoomIn, ZoomOut } from 'lucide-react';

interface MediaViewProps {
  initialIndex: number;
  onClose: () => void;
  allMedia: string[];
  currentPage: number;
  itemsPerPage: number;
  type: 'image' | 'video';
}

const MediaView: React.FC<MediaViewProps> = ({
  initialIndex,
  onClose,
  allMedia,
  currentPage,
  itemsPerPage,
  type,
}) => {
  // State management
  const [globalIndex, setGlobalIndex] = useState<number>(
    (currentPage - 1) * itemsPerPage + initialIndex
  );
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('pictopy-favorites');
    return saved ? JSON.parse(saved) : [];
  });

  
  useEffect(() => {
    setGlobalIndex((currentPage - 1) * itemsPerPage + initialIndex);
  }, [initialIndex, currentPage, itemsPerPage]);

  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNextItem();
      if (e.key === 'ArrowLeft') handlePrevItem();
      if (e.key === '+') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === 'r') handleRotate();
      if (e.key === 'f') toggleFavorite();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalIndex, onClose, favorites]);

  
  useEffect(() => {
    let slideshowInterval: NodeJS.Timeout | null = null;

    if (isSlideshowActive) {
      slideshowInterval = setInterval(() => {
        handleNextItem();
      }, 3000);
    }

    return () => {
      if (slideshowInterval) clearInterval(slideshowInterval);
    };
  }, [isSlideshowActive, globalIndex]);

  
  const handleZoomIn = () => setScale((s) => Math.min(4, s + 0.1));
  const handleZoomOut = () => setScale((s) => Math.max(0.5, s - 0.1));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const toggleFavorite = () => {
    const currentMedia = allMedia[globalIndex];
    setFavorites(prev => {
      const newFavorites = prev.includes(currentMedia)
        ? prev.filter(f => f !== currentMedia)
        : [...prev, currentMedia];
      
      localStorage.setItem('pictopy-favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Shared Image ${globalIndex + 1}`,
          url: allMedia[globalIndex]
        });
      } else {
        await navigator.clipboard.writeText(allMedia[globalIndex]);
        console.log('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const handlePrevItem = () => {
    setGlobalIndex(globalIndex > 0 ? globalIndex - 1 : allMedia.length - 1);
    resetZoom();
  };

  const handleNextItem = () => {
    setGlobalIndex(globalIndex < allMedia.length - 1 ? globalIndex + 1 : 0);
    resetZoom();
  };

  const handleThumbnailClick = (index: number) => {
    setGlobalIndex(index);
    resetZoom();
  };

  const toggleSlideshow = () => {
    setIsSlideshowActive(prev => !prev);
  };

  const isFavorite = (mediaUrl: string) => favorites.includes(mediaUrl);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={handleShare}
          className="rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors duration-200"
          aria-label="Share"
        >
          <Share2 className="h-6 w-6" />
        </button>
        <button
          onClick={toggleFavorite}
          className={`rounded-full p-2 text-white transition-colors duration-300 ${
            isFavorite(allMedia[globalIndex])
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-white/20 hover:bg-white/40'
          }`}
          aria-label={isFavorite(allMedia[globalIndex]) ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`h-6 w-6 ${
              isFavorite(allMedia[globalIndex]) ? 'fill-current' : ''
            }`}
          />
        </button>
        <button
          onClick={toggleSlideshow}
          className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-white hover:bg-white/40 transition-colors duration-200"
          aria-label="Toggle Slideshow"
        >
          {isSlideshowActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {isSlideshowActive ? 'Pause' : 'Slideshow'}
        </button>
        <button
          onClick={onClose}
          className="rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors duration-200"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      
      <div
        className="relative flex h-full w-full items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {type === 'image' ? (
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative h-full w-full flex items-center justify-center overflow-hidden"
          >
            <img
              src={allMedia[globalIndex]}
              alt={`media-${globalIndex}`}
              draggable={false}
              className="h-full w-full object-contain"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                cursor: isDragging ? 'grabbing' : 'grab',
                transition: isDragging ? 'none' : 'transform 0.2s ease-in-out',
              }}
            />

            
            <div className="absolute bottom-20 right-4 flex gap-2">
              <button
                onClick={handleZoomOut}
                className="rounded-md bg-white/20 p-2 text-white hover:bg-white/40 transition-colors duration-200"
                aria-label="Zoom Out"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <button
                onClick={resetZoom}
                className="rounded-md bg-white/20 px-4 py-2 text-white hover:bg-white/40 transition-colors duration-200"
              >
                Reset
              </button>
              <button
                onClick={handleZoomIn}
                className="rounded-md bg-white/20 p-2 text-white hover:bg-white/40 transition-colors duration-200"
                aria-label="Zoom In"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                onClick={handleRotate}
                className="rounded-md bg-white/20 p-2 text-white hover:bg-white/40 transition-colors duration-200"
                aria-label="Rotate"
              >
                <RotateCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <video
            src={allMedia[globalIndex]}
            className="h-full w-full object-contain"
            controls
            autoPlay
          />
        )}

        
        <button
          onClick={handlePrevItem}
          className="absolute left-4 top-1/2 z-50 flex items-center rounded-full bg-white/20 p-3 text-white hover:bg-white/40 transition-colors duration-200"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={handleNextItem}
          className="absolute right-4 top-1/2 z-50 flex items-center rounded-full bg-white/20 p-3 text-white hover:bg-white/40 transition-colors duration-200"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="absolute bottom-0 flex w-full items-center justify-center gap-2 overflow-x-auto bg-black/50 px-4 py-2 opacity-0 transition-opacity duration-300 hover:opacity-100">
        {allMedia.map((media, index) => (
          <div
            key={index}
            onClick={() => handleThumbnailClick(index)}
            className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
              index === globalIndex
                ? 'border-blue-500 shadow-lg'
                : 'border-transparent'
            } cursor-pointer transition-transform hover:scale-105`}
          >
            {isFavorite(media) && (
              <div className="absolute top-1 right-1 z-10">
                <Heart className="h-4 w-4 text-red-500 fill-current" />
              </div>
            )}
            {type === 'image' ? (
              <img
                src={media}
                alt={`thumbnail-${index}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                src={media}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaView;