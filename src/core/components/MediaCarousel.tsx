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

/** Visor de evidencias: una pieza a la vez, navegación, miniaturas y pantalla completa. */
export const MediaCarousel = ({ media, initialIndex = 0, title, onDelete, showDelete = false }: MediaCarouselProps) => {
    const [index, setIndex] = useState(initialIndex);
    const [fullscreen, setFullscreen] = useState(false);
    const [ratio, setRatio] = useState<number | null>(null);
    const count = media.length;
    const current = media[Math.min(index, Math.max(count - 1, 0))];

    // Proporción real de la pieza: el escenario la toma para que la foto quepa completa, sin recorte.
    useEffect(() => {
        setRatio(null);
        if (!current || current.type !== "IMAGE") return;
        const img = new window.Image();
        img.onload = () => { if (img.naturalWidth && img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight); };
        img.src = current.url;
    }, [current?.url, current?.type]);

    useEffect(() => {
        if (count < 2) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
            if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [count]);

    if (count === 0) return null;
    const prev = () => setIndex((i) => (i - 1 + count) % count);
    const next = () => setIndex((i) => (i + 1) % count);

    const stageStyle = (inFullscreen: boolean): React.CSSProperties => {
        const maxH = inFullscreen ? Math.max(200, window.innerHeight - 220) : 320;
        if (!ratio) return { width: "100%", height: inFullscreen ? maxH : 280 };
        return { width: `min(100%, ${maxH * ratio}px)`, aspectRatio: String(ratio) };
    };

    const renderViewer = (inFullscreen: boolean) => (
        <ITFlex direction="column" gap={3}>
            <ITFlex align="center" justify="between" gap={2}>
                <ITFlex direction="column">
                    {title && <ITText as="p" className="font-semibold text-slate-800">{title}</ITText>}
                    <ITText as="span" muted>{index + 1} / {count}</ITText>
                </ITFlex>
                <ITFlex align="center" gap={2}>
                    {showDelete && onDelete && (
                        <ITButton variant="outlined" color="danger" size="md" onClick={() => onDelete(current, index)}>
                            <ITFlex align="center" gap={2}>
                                <FaTrash />
                                <span>Eliminar</span>
                            </ITFlex>
                        </ITButton>
                    )}
                    <ITButton variant="outlined" color="gray" size="md" onClick={() => setFullscreen(!inFullscreen)}>
                        <ITFlex align="center" gap={2}>
                            {inFullscreen ? <FaCompress /> : <FaExpand />}
                            <span>{inFullscreen ? "Salir" : "Pantalla completa"}</span>
                        </ITFlex>
                    </ITButton>
                </ITFlex>
            </ITFlex>

            <ITFlex align="center" justify="center" className="relative overflow-hidden rounded-xl bg-slate-900" style={stageStyle(inFullscreen)}>
                {current.type === "VIDEO" ? (
                    <video src={current.url} controls className="h-full w-full" />
                ) : (
                    <ITImage src={current.url} alt={title ?? "Evidencia"} className="h-full w-full" fallback="No se pudo cargar la imagen" />
                )}
                {count > 1 && (
                    <>
                        <ITFlex className="absolute left-3 top-1/2 -translate-y-1/2">
                            <ITButton variant="filled" color="gray" size="md" onClick={prev}>
                                <FaChevronLeft />
                            </ITButton>
                        </ITFlex>
                        <ITFlex className="absolute right-3 top-1/2 -translate-y-1/2">
                            <ITButton variant="filled" color="gray" size="md" onClick={next}>
                                <FaChevronRight />
                            </ITButton>
                        </ITFlex>
                    </>
                )}
            </ITFlex>

            {count > 1 && (
                <ITFlex align="center" justify="center" gap={2} className="flex-wrap">
                    {media.map((item, i) => (
                        <ITButton key={`${item.url}-${i}`} variant="text" color={i === index ? "primary" : "gray"} size="sm" onClick={() => setIndex(i)}>
                            {item.type === "VIDEO" ? <ITText as="span" muted>Video {i + 1}</ITText> : <ITImage src={item.url} alt={`Miniatura ${i + 1}`} className="h-14 w-20 object-cover rounded" />}
                        </ITButton>
                    ))}
                </ITFlex>
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
