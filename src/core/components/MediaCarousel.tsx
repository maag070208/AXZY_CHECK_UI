import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    FaChevronLeft,
    FaChevronRight,
    FaCompress,
    FaExpand,
    FaPlay,
    FaTimes
} from 'react-icons/fa';

interface MediaItem {
    type: 'IMAGE' | 'VIDEO';
    url: string;
    key?: string;
    title?: string;
}

interface MediaCarouselProps {
    media: MediaItem[];
    initialIndex?: number;
    title?: string;
    onDelete?: (item: MediaItem, index: number) => void;
    showDelete?: boolean;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({ 
    media, 
    initialIndex = 0, 
    title = "Galería de Medios",
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Navegación ---
    const nextSlide = useCallback(() => {
        if (media.length <= 1) return;
        setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
    }, [media.length]);

    const prevSlide = useCallback(() => {
        if (media.length <= 1) return;
        setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
    }, [media.length]);

    // const handleDelete = () => {
    //     if (onDelete && window.confirm("¿Estás seguro de que deseas eliminar este archivo?")) {
    //         onDelete(media[currentIndex], currentIndex);
    //         // If it was the last item, the parent should handle it, 
    //         // but we might need to adjust local index if the parent doesn't re-render immediately
    //         if (currentIndex >= media.length - 1 && currentIndex > 0) {
    //             setCurrentIndex(currentIndex - 1);
    //         }
    //     }
    // };

    // --- Fullscreen ---
    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            try {
                await containerRef.current?.requestFullscreen();
                setIsFullscreen(true);
            } catch (err) {
                console.error("Error al intentar entrar en pantalla completa", err);
            }
        } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // --- Teclado ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'Escape' && isFullscreen) toggleFullscreen();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide, isFullscreen]);

    if (!media || media.length === 0) return null;

    const currentItem = media[currentIndex];

    return (
        <div 
            ref={containerRef}
            className={`
                flex flex-col overflow-hidden transition-all duration-500 ease-in-out font-sans group
                ${isFullscreen ? 'fixed inset-0 z-[100] bg-black' : 'relative rounded-2xl shadow-2xl bg-slate-900 border border-white/10 w-full max-w-5xl mx-auto'}
            `}
        >
            {/* --- Header Superior --- */}
            <div className={`
                absolute top-0 left-0 w-full z-20 flex justify-between items-center p-4
                bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300
                ${isFullscreen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
            `}>
                <div className="flex flex-col">
                    <h3 className="text-white font-medium text-lg drop-shadow-md">{title}</h3>
                    <p className="text-white/60 text-xs uppercase tracking-widest">
                        {currentIndex + 1} / {media.length}
                    </p>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={toggleFullscreen}
                        className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all border border-white/10"
                    >
                        {isFullscreen ? <FaCompress /> : <FaExpand />}
                    </button>
                    {isFullscreen && (
                        <button 
                            onClick={toggleFullscreen}
                            className="p-3 rounded-full bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md text-red-200 transition-all border border-red-500/20"
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>
            </div>

            {/* --- Escenario Principal --- */}
            <div className={`relative flex-1 flex items-center justify-center select-none ${isFullscreen ? 'h-full' : 'aspect-video'}`}>
                
                {/* Botones de Navegación */}
                {media.length > 1 && (
                    <>
                        <button 
                            onClick={prevSlide}
                            className="absolute left-4 z-30 p-4 rounded-2xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/10 -translate-x-4 group-hover:translate-x-0"
                        >
                            <FaChevronLeft size={24} />
                        </button>
                        <button 
                            onClick={nextSlide}
                            className="absolute right-4 z-30 p-4 rounded-2xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/10 translate-x-4 group-hover:translate-x-0"
                        >
                            <FaChevronRight size={24} />
                        </button>
                    </>
                )}

                {/* Contenido Media */}
                <div className="w-full h-full flex items-center justify-center p-2 bg-black">
                    {currentItem.type?.toUpperCase() === 'VIDEO' || currentItem.url.toLowerCase().match(/\.(mp4|webm|mov|ogg|m4v)$/i) ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <video 
                                key={currentItem.url}
                                src={currentItem.url}
                                controls 
                                playsInline
                                preload="metadata"
                                className="max-w-full max-h-full rounded-lg shadow-2xl"
                                autoPlay={isFullscreen}
                                onLoadedMetadata={(e) => {
                                    // Sometimes we need to seek to show the first frame
                                    const video = e.target as HTMLVideoElement;
                                    if (video.currentTime === 0) video.currentTime = 0.1;
                                }}
                            >
                                Tu navegador no soporta el elemento de video.
                            </video>
                        </div>
                    ) : (
                        <img 
                            src={currentItem.url} 
                            alt={currentItem.title || "Gallery item"} 
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-fade-in"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Error+al+cargar+imagen';
                            }}
                        />
                    )}
                </div>
            </div>

            {/* --- Tira de Miniaturas (Footer) --- */}
            <div className={`
                w-full p-4 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl z-20
                ${isFullscreen ? 'absolute bottom-0 opacity-0 hover:opacity-100 transition-opacity duration-300' : ''}
            `}>
                <div className="flex gap-4 overflow-x-auto pb-2 justify-center no-scrollbar">
                    {media.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`
                                relative flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden transition-all duration-300 transform
                                ${idx === currentIndex 
                                    ? 'ring-2 ring-blue-500 scale-110 shadow-lg opacity-100' 
                                    : 'opacity-40 hover:opacity-100 scale-100 grayscale hover:grayscale-0'
                                }
                            `}
                        >
                            {item.type?.toUpperCase() === 'VIDEO' || item.url.toLowerCase().match(/\.(mp4|webm|mov|ogg|m4v)$/i) ? (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                                    <video 
                                        src={`${item.url}#t=0.5`} 
                                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                                        onLoadedData={(e) => {
                                            const video = e.target as HTMLVideoElement;
                                            video.pause();
                                        }}
                                        muted
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/0 transition-all duration-300">
                                        <FaPlay className="text-white text-xs drop-shadow-lg scale-125 group-hover:scale-150 transition-transform" />
                                    </div>
                                </div>
                            ) : (
                                <img 
                                    src={item.url} 
                                    className="w-full h-full object-cover animate-fade-in" 
                                    alt="thumbnail"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x70?text=Err';
                                    }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};