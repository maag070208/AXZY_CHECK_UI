import { ITButton, ITDialog, ITFlex, ITImage, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaCompress, FaExpand, FaTrash } from "react-icons/fa";

interface MediaItem {
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
        <ITFlex direction="column" gap={3} className={inFullscreen ? "h-full min-h-0 p-6" : "flex-1 min-h-0"}>
            <ITFlex align="center" justify="between" gap={2} className={inFullscreen ? "pr-14" : undefined}>
                <ITFlex align="center" gap={2}>
                    {title && <ITText as="span" className="font-medium text-slate-800">{title}</ITText>}
                    <ITText as="span" muted>{`${count} ${count === 1 ? "archivo" : "archivos"}`}</ITText>
                </ITFlex>
                <ITButton variant="outlined" color="secondary" size="md" onClick={() => setFullscreen(!inFullscreen)}>
                    <ITFlex align="center" gap={2}>
                        {inFullscreen ? <FaCompress /> : <FaExpand />}
                        <span>{inFullscreen ? "Salir" : "Pantalla completa"}</span>
                    </ITFlex>
                </ITButton>
            </ITFlex>

            <ITFlex align="center" justify="center" className={`relative w-full overflow-hidden rounded-xl bg-slate-900 ${inFullscreen ? "h-[calc(100vh-180px)]" : "h-[min(480px,48vh)]"}`}>
                {current.type === "VIDEO" ? (
                    <video src={current.url} controls className="h-full w-full" />
                ) : (
                    <ITImage src={current.url} alt={current.title ?? title ?? "Evidencia"} fit="contain" className="h-full w-full" fallback="No se pudo cargar la imagen" />
                )}

                <ITText as="span" className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
                    {`${safeIndex + 1} / ${count}`}
                </ITText>

                {count > 1 && (
                    <>
                        <ITFlex className="absolute left-3 top-1/2 -translate-y-1/2">
                            <ITButton variant="rounded" color="secondary" size="md" onClick={prev}>
                                <FaChevronLeft />
                            </ITButton>
                        </ITFlex>
                        <ITFlex className="absolute right-3 top-1/2 -translate-y-1/2">
                            <ITButton variant="rounded" color="secondary" size="md" onClick={next}>
                                <FaChevronRight />
                            </ITButton>
                        </ITFlex>
                    </>
                )}

                {current.title && (
                    <ITText as="span" className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
                        {current.title}
                    </ITText>
                )}
            </ITFlex>

            <ITFlex align="center" justify="between" gap={3}>
                <ITFlex align="center" gap={2}>
                    {count > 1 && media.map((item, i) => (
                        <ITButton key={`${item.url}-${i}`} variant="text" color={i === safeIndex ? "primary" : "gray"} size="sm" onClick={() => setIndex(i)}>
                            {item.type === "VIDEO" ? (
                                <ITText as="span" muted>Video {i + 1}</ITText>
                            ) : (
                                <ITImage src={item.url} alt={`Miniatura ${i + 1}`} fit="cover" className="h-14 w-20 rounded-lg" />
                            )}
                        </ITButton>
                    ))}
                </ITFlex>
                {showDelete && onDelete && (
                    <ITButton variant="text" color="danger" size="sm" onClick={() => onDelete(current, safeIndex)}>
                        <ITFlex align="center" gap={2}>
                            <FaTrash />
                            <span>Eliminar foto</span>
                        </ITFlex>
                    </ITButton>
                )}
            </ITFlex>
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
