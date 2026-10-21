import { MediaCarousel } from "@app/core/components/MediaCarousel";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITCard,
  ITDialog,
  ITDivider,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITImage,
  ITPage,
  ITProgress,
  ITText,
} from "@axzydev/axzy_ui_system";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { FaCheck, FaCheckCircle, FaPause, FaClipboardList, FaClock, FaExclamationTriangle, FaFileAlt, FaImage, FaLocationArrow, FaMapMarkedAlt, FaMapMarkerAlt, FaPlay, FaQrcode, FaRoute, FaStopwatch, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { RoundRouteMap, RoutePoint } from "../../guard-tracking/components/RoundRouteMap";
import { getRoutesList } from "../../routes/services/RoutesService";
import { getRoundDetail, IRoundDetail } from "../services/RoundsService";
import { deleteKardexEntry, deleteKardexMedia } from "../../kardex/services/KardexService";
import { deleteIncident, deleteIncidentMedia } from "../../incidents/services/IncidentService";
import { AppState } from "@app/core/store/store";

const RoundDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const role = useSelector((state: AppState) => state.auth.role);
    const isAdmin = role === 'ADMIN';

    const [data, setData] = useState<IRoundDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
    const [selectedPinLocationId, setSelectedPinLocationId] = useState<number | null>(null);
    const [playing, setPlaying] = useState(false);
    const [playIndex, setPlayIndex] = useState(-1);
    const [focusedPoint, setFocusedPoint] = useState<RoutePoint | null>(null);
    const routeRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const timelineRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const handleDeleteMedia = async (eventId: number, type: 'SCAN' | 'INCIDENT', item: any) => {
        const key = item.key || item.url.split('/').pop();
        if (!key) return;

        let res;
        if (type === 'SCAN') {
            res = await deleteKardexMedia(eventId, key);
        } else {
            res = await deleteIncidentMedia(eventId, key);
        }

        if (res.success) {
            dispatch(showToast({ message: "Archivo eliminado correctamente", type: "success" }));
            // Actualización local para evitar recarga completa
            setData(prev => {
                return {
                    ...prev!,
                    timeline: prev!.timeline.map(e => {
                        const currentId = e.data?.id;
                        if (currentId === eventId && e.type === type) {
                            return {
                                ...e,
                                data: {
                                    ...e.data,
                                    media: e.data.media.filter((m: any) => (m.key || m.url.split('/').pop()) !== key)
                                }
                            };
                        }
                        return e;
                    })
                };
            });
        }
    };

    /** Devuelve true solo si el registro se eliminó (confirmado por la persona y por el API). */
    const handleDeleteEvent = async (eventId: number, type: 'SCAN' | 'INCIDENT') => {
        if (!window.confirm("¿Deseas eliminar este registro permanentemente?")) return false;

        let res;
        if (type === 'SCAN') {
            res = await deleteKardexEntry(eventId);
        } else {
            res = await deleteIncident(eventId);
        }

        if (res.success) {
            dispatch(showToast({ message: "Registro eliminado", type: "success" }));
            setData(prev => {
                return {
                    ...prev!,
                    timeline: prev!.timeline.filter(e => !(e.data?.id === eventId && e.type === type))
                };
            });
        }
        return res.success;
    };

    const handleDeleteEventFromModal = async (eventId: number, type: "SCAN" | "INCIDENT") => {
        if (await handleDeleteEvent(eventId, type)) setSelectedEventIndex(null);
    };

    const [routeTitle, setRouteTitle] = useState("");

    const metrics = useMemo(() => {
        if (!data) return null;
        
        const start = new Date(data.round.startTime);
        const end = data.round.endTime ? new Date(data.round.endTime) : (data.round.status === 'COMPLETED' ? new Date() : null);
        const effectiveEnd = end || new Date();

        const durationMs = effectiveEnd.getTime() - start.getTime();
        const totalMinutes = Math.floor(durationMs / 60000);
        const durationDays = Math.floor(totalMinutes / 1440);
        const durationHours = Math.floor((totalMinutes % 1440) / 60);
        const durationMins = totalMinutes % 60;
        const durationLabel = [
            durationDays > 0 ? `${durationDays}d` : null,
            durationDays > 0 || durationHours > 0 ? `${durationHours}h` : null,
            `${durationMins}m`,
        ].filter(Boolean).join(" ");
        
        // Filter scans
        const scans = data.timeline.filter(e => e.type === 'SCAN').sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        const visitedLocations = new Set<string>();
        let validScansCount = 0;

        // Treasure Map Nodes
        const mapNodes: any[] = [];
        let previousTime = start;

        // Start Node
        mapNodes.push({
            type: 'START',
            label: 'Inicio',
            status: 'START',
            timeDiff: null
        });

        scans.forEach(scan => {
            const current = new Date(scan.timestamp);
            const diff = current.getTime() - previousTime.getTime();
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);

            const locId = String(scan.data?.location?.id);
            const isDuplicate = visitedLocations.has(locId);
            visitedLocations.add(locId);

            // Check evidence (naive check on media array)
            const hasEvidence = scan.data?.media && Array.isArray(scan.data.media) && scan.data.media.length > 0;
            
            let status = 'SUCCESS';
            if (isDuplicate) status = 'DUPLICATE';
            else if (!hasEvidence) status = 'INCOMPLETE';
            else validScansCount++; // Only count if unique and complete? Or just valid? User said "no contar 2 veces".

            mapNodes.push({
                type: 'POINT',
                label: scan.data?.location?.name || "Punto",
                status,
                timeDiff: `${mins}m ${secs}s`,
                diffMs: diff,
                locationId: scan.data?.location?.id,
            });

            previousTime = current;
        });

        // Computed expected points
        const expectedLocs = data.round.recurringConfiguration?.recurringLocations || [];
        const missingLocs = expectedLocs.filter((l: any) => !visitedLocations.has(String(l.location.id)));
        
        missingLocs.forEach((loc: any) => {
            mapNodes.push({
                type: 'POINT',
                label: loc.location.name,
                status: data.round.status === 'COMPLETED' ? 'MISSING' : 'PENDING',
                timeDiff: '--',
                diffMs: 0,
                locationId: loc.location.id,
            });
        });

        // End Node
        if (data.round.endTime) {
            const current = new Date(data.round.endTime);
            const diff = current.getTime() - previousTime.getTime();
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
             mapNodes.push({
                type: 'END',
                label: 'Fin',
                status: 'END',
                timeDiff: `${mins}m ${secs}s`
            });
        }
        
        const avgTime = scans.length > 0 ? (durationMs / (scans.length + (data.round.endTime ? 1 : 0))) : 0;
        const avgMins = Math.floor(avgTime / 60000);
        const avgSecs = Math.floor((avgTime % 60000) / 1000);
        
        return {
            duration: durationLabel,
            totalScans: validScansCount,
            totalRawScans: scans.length,
            expectedScans: expectedLocs.length,
            mapNodes,
            avgTime: `${avgMins}m ${avgSecs}s`
        };
    }, [data]);

    const routePoints = useMemo<RoutePoint[]>(() => {
        if (!data) return [];

        const orderedScans = data.timeline
            .map((event, eventIndex) => ({ event, eventIndex }))
            .filter(({ event }) => event.type === "SCAN" && event.data?.latitude != null && event.data?.longitude != null)
            .sort((a, b) => new Date(a.event.timestamp).getTime() - new Date(b.event.timestamp).getTime());

        const scannedLocationIds = new Set(
            data.timeline
                .filter((event) => event.type === "SCAN")
                .map((event) => event.data?.location?.id)
                .filter((id) => id != null),
        );

        const scanPoints: RoutePoint[] = orderedScans.map(({ event, eventIndex }, index) => ({
            seq: index + 1,
            label: event.data?.location?.name ?? "Punto",
            timestamp: event.timestamp,
            lat: Number(event.data.latitude),
            lng: Number(event.data.longitude),
            status: Array.isArray(event.data?.media) && event.data.media.length > 0 ? "COMPLETE" : "NO_EVIDENCE",
            locationId: event.data?.location?.id ?? null,
            eventIndex,
        }));

        const missingPoints: RoutePoint[] = (data.round.recurringConfiguration?.recurringLocations ?? [])
            .filter((rl) => !scannedLocationIds.has(rl.locationId) && rl.lastLatitude != null && rl.lastLongitude != null)
            .map((rl, index) => ({
                seq: scanPoints.length + index + 1,
                label: rl.location.name,
                timestamp: "",
                lat: Number(rl.lastLatitude),
                lng: Number(rl.lastLongitude),
                status: "MISSING",
                locationId: rl.locationId,
                eventIndex: null,
            }));

        return [...scanPoints, ...missingPoints];
    }, [data]);

    const playablePoints = useMemo(() => routePoints.filter((point) => point.status !== "MISSING"), [routePoints]);
    const currentPlayPoint = playIndex >= 0 ? playablePoints[playIndex] : null;
    const previousPlayPoint = playIndex > 0 ? playablePoints[playIndex - 1] : null;
    const currentGapMs =
        currentPlayPoint && previousPlayPoint
            ? new Date(currentPlayPoint.timestamp).getTime() - new Date(previousPlayPoint.timestamp).getTime()
            : null;
    const revealedPointCount =
        playing || (playIndex >= 0 && playIndex < playablePoints.length - 1)
            ? Math.min(playIndex + 1, playablePoints.length)
            : null;

    const handlePlayAnimation = () => {
        if (playing) {
            setPlaying(false);
            return;
        }
        // El botón está deshabilitado sin puntos reproducibles.
        const nextIndex = playIndex < 0 || playIndex >= playablePoints.length - 1 ? 0 : playIndex;
        setPlayIndex(nextIndex);
        setPlaying(true);
        const point = playablePoints[nextIndex];
        if (point) {
            setFocusedPoint(point);
            handleMapPointSelect(point);
        }
    };

    useEffect(() => {
        if (!playing) return;
        if (playIndex >= playablePoints.length - 1) {
            setPlaying(false);
            setFocusedPoint(null);
            return;
        }

        const current = playablePoints[playIndex];
        const next = playablePoints[playIndex + 1];
        const deltaMs = Math.max(
            0,
            new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime(),
        );
        // Tiempo comprimido: respeta la proporción real, pero no dura los 10 min del guardia.
        const delay = Math.min(1600, Math.max(350, deltaMs / 8));

        const timer = window.setTimeout(() => {
            const nextIndex = playIndex + 1;
            const point = playablePoints[nextIndex];
            setPlayIndex(nextIndex);
            if (point) {
                setFocusedPoint(point);
                handleMapPointSelect(point);
            }
        }, delay);

        return () => window.clearTimeout(timer);
    }, [playing, playIndex, playablePoints]);

    const selectedEvent = data && selectedEventIndex !== null ? data.timeline[selectedEventIndex] : null;

    const handleMapPointSelect = (point: RoutePoint) => {
        if (point.locationId == null) return;
        setSelectedPinLocationId(point.locationId);
        routeRefs.current[String(point.locationId)]?.scrollIntoView({ behavior: "smooth", block: "center" });
        timelineRefs.current[String(point.locationId)]?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    useEffect(() => {
        if (id) {
            getData(Number(id));
        }
    }, [id]);

    const getData = async (roundId: number) => {
        setLoading(true);
        const res = await getRoundDetail(roundId);
        if (res.success && res.data) {
            setData(res.data);
            
            // Handle missing recurringConfiguration relation
            if (res.data.round.recurringConfiguration) {
                setRouteTitle(res.data.round.recurringConfiguration.title);
            } else if (res.data.round.recurringConfigurationId) {
                // Fetch routes to find title
                getRoutesList().then(routesRes => {
                    if (routesRes.success && routesRes.data) {
                        const match = routesRes.data.find((r: any) => r.id === res.data.round.recurringConfigurationId);
                        if (match) setRouteTitle(match.title);
                    }
                });
            }
        }
        setLoading(false);
    };

    const handleOpenRouteMap = () => {
        const scansWithCoords = data!.timeline
            .filter(e => e.type === 'SCAN' && e.data?.latitude && e.data?.longitude)
            .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        if (scansWithCoords.length === 0) {
            dispatch(showToast({ message: "No hay puntos con coordenadas GPS para trazar una ruta.", type: "warning" }));
            return;
        }

        if (scansWithCoords.length === 1) {
             // Just open the single point
             const url = `https://www.google.com/maps/search/?api=1&query=${scansWithCoords[0].data.latitude},${scansWithCoords[0].data.longitude}`;
             window.open(url, '_blank');
             return;
        }

        const origin = `${scansWithCoords[0].data.latitude},${scansWithCoords[0].data.longitude}`;
        const destination = `${scansWithCoords[scansWithCoords.length - 1].data.latitude},${scansWithCoords[scansWithCoords.length - 1].data.longitude}`;
        
        const waypoints = scansWithCoords.slice(1, -1).map(s => `${s.data.latitude},${s.data.longitude}`).join('|');
        
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=walking`;
        
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <ITPage
                className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
                noPadding
                loading
                title="Detalle de ronda"
                description="Cargando información de la ronda..."
                icon={<FaRoute size={20} />}
                iconColor="#065911"
            >
                <ITFlex />
            </ITPage>
        );
    }

    if (!data) {
        return (
            <ITPage
                className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
                noPadding
                title="Detalle de ronda"
                description="No se encontró la ronda."
                icon={<FaRoute size={20} />}
                iconColor="#065911"
                error="La ronda que buscas no existe o fue eliminada."
                onRetry={() => getData(Number(id))}
            >
                <ITFlex />
            </ITPage>
        );
    }

    return (
        <ITPage
            className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
            noPadding
            backAction={() => navigate(-1)}
            title={routeTitle || `Ronda #${data.round.id}`}
            breadcrumbs={[
                { label: "Inicio", href: "#/home" },
                { label: "Operación" },
                { label: "Historial de recorridos", href: "#/rounds" },
                { label: "Detalle de ronda" },
            ]}
            description={`${data.round.guard.name} ${data.round.guard.lastName ?? ""} · ${new Date(data.round.startTime).toLocaleDateString()}`}
            icon={<FaRoute size={20} />}
            iconColor="#065911"
            actions={
                <ITBadget
                    color={data.round.status === "COMPLETED" ? "success" : "warning"}
                    variant="filled"
                    size="sm"
                >
                    {data.round.status === "COMPLETED" ? "FINALIZADA" : "EN CURSO"}
                </ITBadget>
            }
        >
            <ITGrid container columns={12} spacing={5} className="w-full pb-10 pt-5">
                {metrics && (
                    <ITGrid container columns={12} spacing={3} className="col-span-12">
                        <ITGrid item xs={12} md={4}>
                            <MetricCard title="Duración total" value={metrics.duration} icon={<FaClock />} tone="blue" />
                        </ITGrid>
                        <ITGrid item xs={12} md={4}>
                            <MetricCard
                                title={metrics.expectedScans > 0 ? "Puntos cubiertos" : "Puntos válidos"}
                                value={`${metrics.totalScans} / ${metrics.expectedScans > 0 ? metrics.expectedScans : metrics.totalRawScans}`}
                                icon={<FaQrcode />}
                                tone="violet"
                            />
                        </ITGrid>
                        <ITGrid item xs={12} md={4}>
                            <MetricCard title="Promedio por tramo" value={metrics.avgTime} icon={<FaStopwatch />} tone="orange" />
                        </ITGrid>
                    </ITGrid>
                )}

                {metrics && (
                    <>
                        <ITCard title="Ruta recorrida" className="col-span-12 h-full rounded-3xl xl:col-span-3" contentClassName="space-y-2">
                            <ITFlex direction="column" className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                                {metrics.mapNodes.map((node: any, idx: number) => (
                                    <ITFlex
                                        key={idx}
                                        ref={(el) => {
                                            if (node.locationId != null) routeRefs.current[String(node.locationId)] = el;
                                        }}
                                        align="center"
                                        gap={2}
                                        className={`shrink-0 rounded-xl bg-slate-50/60 px-2.5 py-2 dark:bg-slate-900/40 ${
                                            node.locationId != null && selectedPinLocationId === node.locationId
                                                ? "ring-2 ring-inset ring-emerald-300"
                                                : ""
                                        }`}
                                    >
                                        <ITFlex
                                            align="center"
                                            justify="center"
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs ${NODE_TONE[node.status]}`}
                                        >
                                            {node.status === "START" && <FaPlay size={11} />}
                                            {node.status === "END" && <FaCheckCircle size={12} />}
                                            {node.status === "SUCCESS" && <FaCheckCircle size={12} />}
                                            {node.status === "DUPLICATE" && <ITText as="span" className="text-sm font-black">!</ITText>}
                                            {node.status === "INCOMPLETE" && <FaExclamationTriangle size={11} />}
                                            {node.status === "MISSING" && <ITText as="span" className="text-sm font-black">?</ITText>}
                                            {node.status === "PENDING" && <FaClock size={11} />}
                                        </ITFlex>

                                        <ITFlex direction="column" className="min-w-0 flex-1">
                                            <ITText as="p" className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                                {node.label}
                                            </ITText>
                                            <ITText as="p" className="text-[10px] text-slate-400">
                                                {node.timeDiff && node.timeDiff !== "--" ? `+${node.timeDiff}` : "—"}
                                            </ITText>
                                        </ITFlex>

                                        {node.status !== "START" && node.status !== "END" && (
                                            <ITBadget
                                                color={NODE_BADGE[node.status]}
                                                variant="outlined"
                                                size="sm"
                                                className="shrink-0 whitespace-nowrap"
                                            >
                                                {NODE_LABEL[node.status]}
                                            </ITBadget>
                                        )}
                                    </ITFlex>
                                ))}
                            </ITFlex>
                        </ITCard>

                        <ITCard
                            className="col-span-12 h-full rounded-3xl xl:col-span-6"
                            contentClassName="space-y-3"
                        >
                            <ITFlex align="center" justify="between" gap={2} className="mb-1">
                                <ITText as="h3" className="text-xl font-semibold text-slate-900 dark:text-white">
                                    Mapa de la ronda
                                </ITText>
                                <ITButton
                                    variant="icon-only"
                                    color="primary"
                                    size="sm"
                                    icon={playing ? <FaPause size={12} /> : <FaPlay size={12} />}
                                    ariaLabel={playing ? "Pausar recorrido" : "Reproducir recorrido"}
                                    title={playing ? "Pausar recorrido" : "Reproducir recorrido"}
                                    onClick={handlePlayAnimation}
                                    disabled={playablePoints.length === 0}
                                />
                            </ITFlex>
                            {routePoints.length > 0 ? (
                                <RoundRouteMap points={routePoints} height="420px" className="rounded-2xl" onPointSelect={handleMapPointSelect} fitPadding={110} focusedPoint={focusedPoint} visiblePointCount={revealedPointCount} />
                            ) : (
                                <ITEmptyState title="Sin coordenadas GPS para trazar la ruta." className="py-12" />
                            )}
                            <ITFlex align="center" gap={4} wrap="wrap">
                                <ITFlex align="center" gap={1}>
                                    <ITFlex className="h-2 w-2 rounded-full bg-[#12a36f]" />
                                    <ITText as="span" className="text-[10px] font-medium text-slate-500">Con foto</ITText>
                                </ITFlex>
                                <ITFlex align="center" gap={1}>
                                    <ITFlex className="h-2 w-2 rounded-full bg-[#ef4444]" />
                                    <ITText as="span" className="text-[10px] font-medium text-slate-500">Sin foto</ITText>
                                </ITFlex>
                                <ITFlex align="center" gap={1}>
                                    <ITFlex className="h-2 w-2 rounded-full bg-[#94a3b8]" />
                                    <ITText as="span" className="text-[10px] font-medium text-slate-500">No escaneado</ITText>
                                </ITFlex>
                            </ITFlex>

                            {playablePoints.length > 0 && (
                                <ITFlex direction="column" gap={1}>
                                    <ITFlex align="center" justify="between" gap={2}>
                                        <ITText as="span" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            {playing
                                                ? "Reproduciendo recorrido"
                                                : playIndex >= playablePoints.length - 1
                                                    ? "Recorrido completado"
                                                    : playIndex >= 0
                                                        ? "Recorrido en pausa"
                                                        : "Recorrido"}
                                        </ITText>
                                        <ITText as="span" className="text-[10px] font-bold text-slate-500">
                                            {Math.min(Math.max(playIndex + 1, 0), playablePoints.length)} / {playablePoints.length}
                                        </ITText>
                                    </ITFlex>
                                    <ITProgress
                                        value={Math.min(Math.max(playIndex + 1, 0), playablePoints.length)}
                                        max={playablePoints.length}
                                        color="success"
                                        size="sm"
                                    />
                                    {currentPlayPoint && (
                                        <ITFlex align="center" gap={2} wrap="wrap">
                                            <ITText as="span" className="truncate text-[10px] text-slate-400">
                                                {new Date(currentPlayPoint.timestamp).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} · {currentPlayPoint.label}
                                            </ITText>
                                            {currentGapMs != null && (
                                                <ITBadget color="success" variant="outlined" size="sm" className="shrink-0">
                                                    +{formatGap(currentGapMs)}
                                                </ITBadget>
                                            )}
                                        </ITFlex>
                                    )}
                                </ITFlex>
                            )}

                            <ITFlex align="center" justify="between" gap={2} wrap="wrap">
                                <ITText as="p" className="text-[10px] font-medium text-slate-400">
                                    Ctrl/Cmd + scroll para zoom
                                </ITText>
                                <ITButton
                                    variant="text"
                                    color="secondary"
                                    size="sm"
                                    icon={<FaMapMarkedAlt />}
                                    onClick={handleOpenRouteMap}
                                >
                                    Abrir en Google Maps
                                </ITButton>
                            </ITFlex>
                        </ITCard>

                        <ITCard title="Línea de tiempo" className="col-span-12 h-full rounded-3xl xl:col-span-3" contentClassName="space-y-2">
                            {data.timeline.length === 0 ? (
                                <ITEmptyState title="No hay eventos registrados." className="py-12" />
                            ) : (
                                <ITFlex direction="column" className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                                    {data.timeline.map((event, index) => {
                                        const media = Array.isArray(event.data?.media) ? event.data.media : [];
                                        const firstImage = media.find((m: any) => m?.url);
                                        const previousPointEvent = [...data.timeline.slice(0, index)]
                                            .reverse()
                                            .find((e) => e.type === "SCAN" || e.type === "START");
                                        const gapMs =
                                            (event.type === "SCAN" || event.type === "END") && previousPointEvent
                                                ? new Date(event.timestamp).getTime() - new Date(previousPointEvent.timestamp).getTime()
                                                : null;
                                        return (
                                            <ITFlex
                                                key={index}
                                                ref={(el) => {
                                                    const locationId = event.data?.location?.id;
                                                    if (locationId != null) timelineRefs.current[String(locationId)] = el;
                                                }}
                                                direction="column"
                                                className={`shrink-0 rounded-xl ${
                                                    event.data?.location?.id != null && selectedPinLocationId === event.data.location.id
                                                        ? "ring-2 ring-inset ring-emerald-300"
                                                        : ""
                                                }`}
                                            >
                                            <ITCard
                                                onClick={() => setSelectedEventIndex(index)}
                                                className="rounded-xl border-slate-100! bg-slate-50/60! dark:border-slate-800! dark:bg-slate-900/40!"
                                                contentClassName="space-y-1 p-2.5!"
                                            >
                                                <ITFlex align="start" gap={2}>
                                                    <TimelineEventIcon type={event.type} />
                                                    <ITFlex direction="column" className="min-w-0 flex-1">
                                                        <ITText as="p" className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                                            {event.description}
                                                        </ITText>
                                                        <ITFlex align="center" gap={2} wrap="wrap">
                                                            <ITText as="span" className="text-[10px] text-slate-400">
                                                                {new Date(event.timestamp).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} · {event.type}
                                                            </ITText>
                                                            {gapMs != null && (
                                                                <ITText as="span" className="text-[10px] font-bold text-emerald-600">
                                                                    +{formatGap(gapMs)}
                                                                </ITText>
                                                            )}
                                                        </ITFlex>
                                                    </ITFlex>
                                                </ITFlex>

                                                {media.length > 0 && (
                                                    <ITFlex align="center" gap={2} className="pl-9">
                                                        {firstImage && (
                                                            <ITImage
                                                                src={firstImage.url}
                                                                alt={event.description}
                                                                fit="cover"
                                                                className="h-10 w-10 shrink-0 rounded-lg object-cover"
                                                            />
                                                        )}
                                                        <ITText as="span" className="text-[10px] font-medium text-slate-400">
                                                            {media.length} archivo{media.length === 1 ? "" : "s"}
                                                        </ITText>
                                                    </ITFlex>
                                                )}
                                            </ITCard>
                                            </ITFlex>
                                        );
                                    })}
                                </ITFlex>
                            )}
                        </ITCard>
                    </>
                )}

            </ITGrid>

            <ITDialog
                isOpen={selectedEventIndex !== null}
                onClose={() => setSelectedEventIndex(null)}
                padded={false}
                className="max-w-4xl w-full max-h-[90vh] border-0!"
            >
                {selectedEvent && (
                    <>
                        <EventModalHeader
                            event={selectedEvent}
                            isAdmin={isAdmin}
                            onDeleteEvent={handleDeleteEventFromModal}
                        />
                        <ITFlex direction="column" className="overflow-y-auto px-6 pb-6">
                            <EventDetailCard
                                event={selectedEvent}
                                isAdmin={isAdmin}
                                onDeleteMedia={handleDeleteMedia}
                            />
                        </ITFlex>
                    </>
                )}
            </ITDialog>
        </ITPage>
    );
};

const formatGap = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

const TIMELINE_TONE: Record<string, string> = {
    START: "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400",
    SCAN: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
    INCIDENT: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    END: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
};

const TimelineEventIcon = ({ type }: { type: string }) => (
    <ITFlex
        align="center"
        justify="center"
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${TIMELINE_TONE[type]}`}
    >
        {type === "START" && <FaPlay size={10} />}
        {type === "SCAN" && <FaQrcode size={11} />}
        {type === "INCIDENT" && <FaExclamationTriangle size={10} />}
        {type === "END" && <FaCheckCircle size={11} />}
    </ITFlex>
);

const NODE_TONE: Record<string, string> = {
    START: "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400",
    END: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    SUCCESS: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    DUPLICATE: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
    INCOMPLETE: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    MISSING: "bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400",
    PENDING: "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
};

const NODE_BADGE: Record<string, "success" | "danger" | "warning" | "secondary"> = {
    SUCCESS: "success",
    DUPLICATE: "danger",
    INCOMPLETE: "warning",
    MISSING: "danger",
    PENDING: "secondary",
};

const NODE_LABEL: Record<string, string> = {
    SUCCESS: "Completado",
    DUPLICATE: "Repetido",
    INCOMPLETE: "Sin evidencia",
    MISSING: "Faltante",
    PENDING: "Pendiente",
};

const METRIC_TONE: Record<string, string> = {
    blue: "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
};

const MetricCard = ({
    title,
    value,
    icon,
    tone,
}: {
    title: string;
    value: string;
    icon: ReactNode;
    tone: "blue" | "violet" | "orange";
}) => (
    <ITCard className="h-full" contentClassName="p-4!">
        <ITFlex align="center" justify="between" gap={2}>
            <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                {title}
            </ITText>
            <ITFlex
                align="center"
                justify="center"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs ${METRIC_TONE[tone]}`}
            >
                {icon}
            </ITFlex>
        </ITFlex>
        <ITText as="p" className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {value}
        </ITText>
    </ITCard>
);

const EVENT_BADGE: Record<string, "primary" | "secondary" | "success" | "warning" | "danger"> = {
    START: "primary",
    SCAN: "secondary",
    INCIDENT: "warning",
    END: "success",
};

const EvidenceAndLocation = ({
    event,
    isAdmin,
    onDeleteMedia,
    gpsTitle,
}: {
    event: any;
    isAdmin: boolean;
    onDeleteMedia: (eventId: number, type: "SCAN" | "INCIDENT", item: any) => void;
    gpsTitle: string;
}) => {
    const media = Array.isArray(event.data?.media) ? event.data.media : [];
    const hasCoords = event.data?.latitude != null && event.data?.longitude != null;

    return (
        <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} lg={8}>
                <ITCard className="h-full rounded-2xl border-0! bg-slate-50/40! shadow-none!" contentClassName="space-y-3 p-3!">
                    <ITFlex align="center" gap={2}>
                        <ITFlex align="center" justify="center" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400">
                            <FaImage size={12} />
                        </ITFlex>
                        <ITFlex direction="column">
                            <ITText as="p" className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                                Evidencia fotográfica
                            </ITText>
                            <ITText as="p" className="text-[10px] text-slate-400">
                                Fotos y videos
                            </ITText>
                        </ITFlex>
                    </ITFlex>

                    {media.length > 0 ? (
                        <ITFlex className="overflow-hidden rounded-xl">
                            <MediaCarousel
                                media={media}
                                showDelete={isAdmin}
                                onDelete={(item) => onDeleteMedia(event.data.id, event.type, item)}
                            />
                        </ITFlex>
                    ) : (
                        <ITFlex align="center" justify="center" gap={2} className="rounded-xl bg-slate-50 py-8 dark:bg-slate-900/40">
                            <FaImage className="text-slate-300" />
                            <ITText as="span" className="text-xs text-slate-400">
                                No hay evidencia fotográfica
                            </ITText>
                        </ITFlex>
                    )}
                </ITCard>
            </ITGrid>

            <ITGrid item xs={12} lg={4}>
                <ITCard className="h-full rounded-2xl border-0! bg-slate-50/40! shadow-none!" contentClassName="space-y-3 p-3!">
                    <ITFlex align="center" gap={2}>
                        <ITFlex align="center" justify="center" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                            <FaLocationArrow size={12} />
                        </ITFlex>
                        <ITFlex direction="column">
                            <ITText as="p" className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                                {gpsTitle}
                            </ITText>
                            <ITText as="p" className="text-[10px] text-slate-400">
                                Coordenadas del punto de control
                            </ITText>
                        </ITFlex>
                    </ITFlex>

                    {hasCoords ? (
                        <>


                            <ITGrid container columns={2} spacing={2}>
                                <ITGrid item xs={6}>
                                    <ITFlex direction="column" className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/40">
                                        <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Latitud</ITText>
                                        <ITText as="p" className="font-mono text-[11px] font-medium text-slate-700 dark:text-slate-200">
                                            {event.data.latitude}
                                        </ITText>
                                    </ITFlex>
                                </ITGrid>
                                <ITGrid item xs={6}>
                                    <ITFlex direction="column" className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/40">
                                        <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Longitud</ITText>
                                        <ITText as="p" className="font-mono text-[11px] font-medium text-slate-700 dark:text-slate-200">
                                            {event.data.longitude}
                                        </ITText>
                                    </ITFlex>
                                </ITGrid>
                            </ITGrid>

                            <ITButton
                                variant="text"
                                color="secondary"
                                size="sm"
                                icon={<FaMapMarkerAlt />}
                                onClick={() =>
                                    window.open(
                                        `https://www.google.com/maps/search/?api=1&query=${event.data.latitude},${event.data.longitude}`,
                                        "_blank",
                                    )
                                }
                            >
                                Abrir en Google Maps
                            </ITButton>
                        </>
                    ) : (
                        <ITFlex align="center" justify="center" gap={2} className="rounded-xl bg-rose-50 py-8 dark:bg-rose-950/20">
                            <FaExclamationTriangle className="text-rose-400" />
                            <ITText as="span" className="text-xs text-rose-600 dark:text-rose-400">
                                No se registraron coordenadas GPS para este punto
                            </ITText>
                        </ITFlex>
                    )}
                </ITCard>
            </ITGrid>
        </ITGrid>
    );
};

const EventModalHeader = ({
    event,
    isAdmin,
    onDeleteEvent,
}: {
    event: any;
    isAdmin: boolean;
    onDeleteEvent: (eventId: number, type: "SCAN" | "INCIDENT") => void;
}) => {
    const isScan = event.type === "SCAN";
    const isIncident = event.type === "INCIDENT";
    const canDelete =
        isAdmin &&
        (isIncident ||
            (isScan &&
                (event.data?.scanType === "FREE" || event.data?.user?.role === "MANTENIMIENTO")));

    return (
        <ITFlex direction="column" gap={3} className="px-6 pt-5 pb-3">
            <ITFlex align="start" justify="between" gap={3} wrap="wrap" className="pr-8">
                <ITFlex align="center" gap={3}>
                    <TimelineEventIcon type={event.type} />
                    <ITText as="h2" className="text-xl font-black text-slate-900 dark:text-white">
                        Detalle del evento
                    </ITText>
                </ITFlex>

                {canDelete && (
                    <ITButton
                        variant="icon-only"
                        color="danger"
                        size="sm"
                        icon={<FaTrash size={12} />}
                        ariaLabel="Eliminar registro"
                        title="Eliminar registro"
                        onClick={() => onDeleteEvent(event.data.id, event.type)}
                    />
                )}
            </ITFlex>

            <ITFlex align="center" gap={2} wrap="wrap">
                <ITText as="span" className="font-mono text-[11px] font-medium text-slate-400">
                    {new Date(event.timestamp).toLocaleString("es-MX")}
                </ITText>
                <ITBadget color={EVENT_BADGE[event.type]} variant="filled" size="sm">
                    {event.type}
                </ITBadget>
            </ITFlex>

            <ITText as="p" className="text-sm font-black text-slate-800 dark:text-slate-100">
                {event.description}
            </ITText>

            {isIncident && (
                <>
                    {event.data?.category && (
                        <ITFlex align="center" gap={2} wrap="wrap" className="rounded-xl bg-amber-50/60 px-3 py-2 dark:bg-amber-950/20">
                            <FaExclamationTriangle className="text-amber-600 dark:text-amber-400" size={12} />
                            <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                                Categoría
                            </ITText>
                            <ITText as="span" className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                {event.data.category}
                            </ITText>
                        </ITFlex>
                    )}
                    {event.data?.description && (
                        <ITText as="p" className="text-xs text-slate-600 dark:text-slate-300">
                            {event.data.description}
                        </ITText>
                    )}
                </>
            )}
        </ITFlex>
    );
};

const EventDetailCard = ({
    event,
    isAdmin,
    onDeleteMedia,
}: {
    event: any;
    isAdmin: boolean;
    onDeleteMedia: (eventId: number, type: "SCAN" | "INCIDENT", item: any) => void;
}) => {
    const isScan = event.type === "SCAN";
    const isIncident = event.type === "INCIDENT";

    return (
        <ITFlex direction="column" gap={4}>
            {isScan && (
                <>
                    <EvidenceAndLocation event={event} isAdmin={isAdmin} onDeleteMedia={onDeleteMedia} gpsTitle="Ubicación GPS" />

                    {event.data?.notes && (
                        <ITFlex direction="column" gap={2}>
                            <ITFlex align="center" gap={2}>
                                <ITFlex align="center" justify="center" className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                                    <FaFileAlt size={12} />
                                </ITFlex>
                                <ITFlex direction="column">
                                    <ITText as="p" className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                                        Notas adicionales
                                    </ITText>
                                    <ITText as="p" className="text-[10px] text-slate-400">
                                        Comentarios y observaciones
                                    </ITText>
                                </ITFlex>
                            </ITFlex>
                            <NotesViewer notes={event.data.notes} />
                        </ITFlex>
                    )}

                    {event.data?.assignment?.tasks && (
                        <ITFlex direction="column" gap={2}>
                            <ITFlex align="center" gap={2}>
                                <ITFlex align="center" justify="center" className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                                    <FaClipboardList size={12} />
                                </ITFlex>
                                <ITFlex direction="column">
                                    <ITText as="p" className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                                        Tareas realizadas
                                    </ITText>
                                    <ITText as="p" className="text-[10px] text-slate-400">
                                        Lista de tareas completadas en este punto
                                    </ITText>
                                </ITFlex>
                            </ITFlex>
                            <TaskList tasks={event.data.assignment.tasks} />
                        </ITFlex>
                    )}
                </>
            )}

            {isIncident && (
                <EvidenceAndLocation event={event} isAdmin={isAdmin} onDeleteMedia={onDeleteMedia} gpsTitle="Ubicación del incidente" />
            )}
        </ITFlex>
    );
};

// Subcomponent for Notes with Parsing
const NotesViewer = ({ notes }: { notes: string }) => {
    const lines = notes.split("\n");

    return (
        <ITFlex direction="column" gap={2}>
            {lines.map((line, i) => {
                const trimmed = line.trim();

                if (trimmed.startsWith("---")) {
                    const headerText = trimmed.replace(/---/g, "").trim();
                    return (
                        <ITFlex key={i} align="center" gap={2} className="my-2">
                            <ITDivider className="flex-1" />
                            <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                {headerText}
                            </ITText>
                            <ITDivider className="flex-1" />
                        </ITFlex>
                    );
                }

                if (trimmed.startsWith("[ ]") || trimmed.startsWith("[x]")) {
                    const isChecked = trimmed.startsWith("[x]");
                    const text = trimmed.replace(/\[.\]/, "").trim();
                    return (
                        <ITFlex key={i} align="start" gap={2} className="rounded-lg p-2">
                            <ITFlex
                                align="center"
                                justify="center"
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                                    isChecked
                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                        : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
                                }`}
                            >
                                {isChecked && <FaCheck size={8} />}
                            </ITFlex>
                            <ITText as="span" className={`text-xs leading-relaxed ${isChecked ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`}>
                                {text}
                            </ITText>
                        </ITFlex>
                    );
                }

                if (!trimmed) return null;

                return (
                    <ITFlex key={i} className="rounded-lg bg-amber-50/60 p-3 dark:bg-amber-950/20">
                        <ITText as="p" className="text-xs italic text-slate-700 dark:text-slate-200">
                            "{trimmed}"
                        </ITText>
                    </ITFlex>
                );
            })}
        </ITFlex>
    );
};

const TaskList = ({ tasks }: { tasks: any[] }) => {
    if (tasks.length === 0) return null;

    return (
        <ITFlex direction="column" gap={2}>
            {tasks.map((task, idx) => (
                <ITFlex key={idx} align="start" gap={2} className="rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/40">
                    <ITFlex
                        align="center"
                        justify="center"
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                            task.completed
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
                        }`}
                    >
                        {task.completed && <FaCheck size={8} />}
                    </ITFlex>
                    <ITText as="span" className={`text-xs leading-relaxed ${task.completed ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`}>
                        {task.description}
                    </ITText>
                </ITFlex>
            ))}
        </ITFlex>
    );
};

export default RoundDetailPage;