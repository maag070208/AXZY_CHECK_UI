import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaExpand, FaTimes, FaPlay, FaDownload } from 'react-icons/fa';

interface MediaItem {
    type: string; // 'IMAGE' | 'VIDEO'
    url: string;
    key?: string;
}

interface MediaCarouselProps {
    media: MediaItem[];
    initialIndex?: number;
    onClose?: () => void;
    title?: string;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({ media, initialIndex = 0, onClose, title }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isFullscreen, setIsFullscreen] = useState(false);

    if (!media || media.length === 0) return null;

    const currentItem = media[currentIndex];

    const nextSlide = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
    };

    const toggleFullscreen = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsFullscreen(!isFullscreen);
    };

    // Controlador de clic para miniaturas - previene la propagación
    const handleThumbnailClick = (e: React.MouseEvent, idx: number) => {
        e.stopPropagation(); // ¡Esto es crucial!
        setCurrentIndex(idx);
    };

    // Helper para renderizar contenido de media con control de eventos
    const renderContent = (item: MediaItem, className: string, isThumbnail: boolean = false) => {
        const handleClick = (e: React.MouseEvent) => {
            if (isThumbnail) {
                e.stopPropagation();
            }
        };

        if (item.type === 'VIDEO' || item.url.match(/\.(mp4|webm|mov)$/i)) {
            if (isThumbnail) {
                // Para miniaturas, mostramos solo la primera imagen del video
                // O puedes usar un poster si tienes uno
                return (
                    <div className="relative w-full h-full">
                        <img 
                            src={`https://img.youtube.com/vi/${item.url.split('/').pop()}/0.jpg`} 
                            alt="Video thumbnail" 
                            className={className}
                            onClick={handleClick}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <FaPlay className="text-white text-sm" />
                        </div>
                    </div>
                );
            }
            return (
                <video 
                    src={item.url} 
                    controls 
                    className={className} 
                    autoPlay={false}
                    onClick={handleClick}
                />
            );
        }
        return (
            <img 
                src={item.url} 
                alt="Evidence" 
                className={className}
                onClick={handleClick}
            />
        );
    };

    return (
        <div className={`flex flex-col h-full w-full select-none ${isFullscreen ? 'fixed inset-0 z-[60] bg-black text-white p-4' : 'relative bg-black/5 rounded-xl overflow-hidden'}`}>
            
             {/* Header / Controls */}
            {isFullscreen && (
                <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
                     <span className="text-sm font-medium">{title || 'Evidencia'} ({currentIndex + 1} / {media.length})</span>
                     <button onClick={toggleFullscreen} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <FaTimes className="text-xl" />
                     </button>
                </div>
            )}

            {/* Main Stage */}
            <div className={`relative flex-1 flex items-center justify-center overflow-hidden bg-slate-950 group ${isFullscreen ? 'h-screen' : 'aspect-video max-h-[60vh] w-full'}`}>
                 {renderContent(currentItem, `w-full h-full ${isFullscreen ? 'object-contain' : 'object-contain'}`)}

                 {/* Navigation Arrows */}
                 {media.length > 1 && (
                     <>
                        <button 
                            onClick={prevSlide}
                            className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 border border-white/5"
                        >
                            <FaChevronLeft />
                        </button>
                        <button 
                            onClick={nextSlide}
                            className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 border border-white/5"
                        >
                            <FaChevronRight />
                        </button>
                     </>
                 )}

                 {/* Expand Button (if not fullscreen) */}
                 {!isFullscreen && (
                     <button 
                        onClick={toggleFullscreen}
                        className="absolute top-3 right-3 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 border border-white/10"
                        title="Ver en pantalla completa"
                     >
                        <FaExpand />
                     </button>
                 )}
            </div>

            {/* Thumbnails / Footer */}
            <div className={`p-4 border-t border-white/10 ${isFullscreen ? 'bg-black/90' : 'bg-slate-900'}`}>
                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1 justify-center">
                    {media.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => handleThumbnailClick(e, idx)}
                            className={`relative flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all ${
                                idx === currentIndex 
                                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 opacity-100' 
                                    : 'border-transparent opacity-50 hover:opacity-80 grayscale hover:grayscale-0'
                            }`}
                        >
                            {renderContent(item, "w-full h-full object-cover", true)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};