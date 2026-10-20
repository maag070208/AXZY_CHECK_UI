import { ITButton, ITDialog, ITFlex, ITImage, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaCompress, FaExpand, FaPlay, FaTrash } from "react-icons/fa";

export interface MediaItem {
    type: "IMAGE" | "VIDEO";
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

/** Visor de evidencias: foto completa (sin recorte), navegación, miniaturas y pantalla completa. */
export const MediaCarousel = ({ media, initialIndex = 0, title, onDelete, showDelete = false }: MediaCarouselProps) => {
    const [index, setIndex] = useState(initialIndex);
    const [fullscreen, setFullscreen] = useState(false);
    const count = media.length;
    const safeIndex = Math.min(index, Math.max(count - 1, 0));

    useEffect(() => {
        if (count < 2) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
            if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [count]);

    // Esc cierra solo la pantalla completa: se captura antes que el diálogo del detalle.
    useEffect(() => {
        if (!fullscreen) return;
        const onEscape = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            e.stopImmediatePropagation();
            setFullscreen(false);
        };
        window.addEventListener("keydown", onEscape, true);
        return () => window.removeEventListener("keydown", onEscape, true);
    }, [fullscreen]);

    if (count === 0) return null;
    const current = media[safeIndex];
    const prev = () => setIndex((i) => (i - 1 + count) % count);
    const next = () => setIndex((i) => (i + 1) % count);

    const renderViewer = (inFullscreen: boolean) => (
        <ITFlex
            direction="column"
            gap={3}
            className={inFullscreen ? "h-full min-h-0 p-4 sm:p-6" : "flex-1 min-h-0"}
        >
            {/* ── Header ─────────────────────────────────────────── */}
            <ITFlex
                align="center"
                justify="between"
                gap={3}
                className={inFullscreen ? "pr-14" : undefined}
            >
                <ITFlex align="center" gap={2} className="min-w-0">
                    {title && (
                        <ITText as="span" className="truncate font-semibold text-slate-800">
                            {title}
                        </ITText>
                    )}
                    <ITText
                        as="span"
                        className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                    >
                        {`${count} ${count === 1 ? "archivo" : "archivos"}`}
                    </ITText>
                </ITFlex>

                <ITFlex align="center" gap={2} className="shrink-0">
                    {showDelete && onDelete && (
                        <ITButton
                            variant="outlined"
                            color="danger"
                            size="md"
                            onClick={() => onDelete(current, safeIndex)}
                            aria-label="Eliminar archivo"
                        >
                            <ITFlex align="center" gap={2}>
                                <FaTrash />
                                <span className="hidden sm:inline">Eliminar</span>
                            </ITFlex>
                        </ITButton>
                    )}
                    <ITButton
                        variant="outlined"
                        color="secondary"
                        size="md"
                        onClick={() => setFullscreen(!inFullscreen)}
                        aria-label={inFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                    >
                        <ITFlex align="center" gap={2}>
                            {inFullscreen ? <FaCompress /> : <FaExpand />}
                            <span className="hidden sm:inline">
                                {inFullscreen ? "Salir" : "Pantalla completa"}
                            </span>
                        </ITFlex>
                    </ITButton>
                </ITFlex>
            </ITFlex>

            {/* ── Visor principal ────────────────────────────────── */}
            <div
                className={`group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 shadow-lg shadow-slate-900/10 ${
                    inFullscreen ? "h-[calc(100vh-210px)] min-h-0" : "h-[min(440px,46vh)]"
                }`}
            >
                {current.type === "VIDEO" ? (
                    <video key={current.url} src={current.url} controls className="h-full w-full object-contain" />
                ) : (
                    <img
                        key={current.url}
                        src={current.url}
                        alt={current.title ?? title ?? "Evidencia"}
                        className="h-full w-full object-contain"
                        draggable={false}
                    />
                )}

                {/* Contador */}
                <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                    {`${safeIndex + 1} / ${count}`}
                </span>

                {/* Flechas: aparecen al hacer hover en desktop, siempre visibles en mobile */}
                {count > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={prev}
                            aria-label="Anterior"
                            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-black/70 active:scale-95 md:opacity-0 md:group-hover:opacity-100"
                        >
                            <FaChevronLeft />
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            aria-label="Siguiente"
                            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-black/70 active:scale-95 md:opacity-0 md:group-hover:opacity-100"
                        >
                            <FaChevronRight />
                        </button>
                    </>
                )}

                {/* Título con gradiente inferior */}
                {current.title && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-3 pt-14">
                        <ITText as="span" className="text-sm font-medium text-white">
                            {current.title}
                        </ITText>
                    </div>
                )}
            </div>

            {/* ── Miniaturas ─────────────────────────────────────── */}
            {count > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                    {media.map((item, i) => {
                        const active = i === safeIndex;
                        return (
                            <button
                                key={`${item.url}-${i}`}
                                type="button"
                                onClick={() => setIndex(i)}
                                aria-label={`Ver archivo ${i + 1}`}
                                aria-current={active ? "true" : undefined}
                                className={`relative shrink-0 overflow-hidden rounded-lg transition-all duration-200 ${
                                    active
                                        ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white"
                                        : "opacity-60 hover:opacity-100"
                                }`}
                            >
                                {item.type === "VIDEO" ? (
                                    <div className="flex h-14 w-20 items-center justify-center bg-slate-900 text-white/80">
                                        <FaPlay />
                                    </div>
                                ) : (
                                    <ITImage
                                        src={item.url}
                                        alt={`Miniatura ${i + 1}`}
                                        fit="cover"
                                        className="h-14 w-20"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </ITFlex>
    );

    return (
        <>
            {!fullscreen && renderViewer(false)}
            <ITDialog isOpen={fullscreen} onClose={() => setFullscreen(false)} fullScreen>
                {fullscreen && renderViewer(true)}
            </ITDialog>
        </>
    );
};