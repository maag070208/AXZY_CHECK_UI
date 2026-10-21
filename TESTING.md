# Pruebas de la WEB y la API — estado y pendientes

Última actualización: 2026-10-21. Cobertura medida por módulo con `pnpm exec vitest run --coverage --coverage.include='src/modules/<modulo>/**'`; la suite completa con cobertura global **no se ha vuelto a correr** tras los últimos cambios.

## 1. Cómo correr

```bash
source ~/.nvm/nvm.sh && nvm use      # Node 22 (.nvmrc)
pnpm test                            # unit + flujos, sin cobertura
pnpm test:unit                       # solo unit, con cobertura
pnpm test:e2e                        # solo flujos, con cobertura
pnpm test:coverage                   # todo, con cobertura (reporte en coverage/index.html)
pnpm test:watch
```

Playwright (`e2e/`, `pnpm e2e`) sigue intacto: levanta build + API + BD, por eso es lento. Se puede retirar cuando los flujos de Vitest lo reemplacen.

## 2. Qué hay

| Capa | Dónde | Qué prueba |
|---|---|---|
| **unit** | `tests/unit/**` | slices de Redux, axios, utilidades, hook de catálogos, servicios HTTP (método, ruta, cuerpo, ramas de error/PDF/subidas), componentes compartidos (`MediaCarousel`, `ReportCreateForm`, `ReportDetailDialog`, mapas, rutas protegidas, navbar, toast) |
| **flujos ("e2e" rápidos)** | `tests/flows/**` | pantallas completas montando `<App/>` (router, Redux, UI System) contra una API simulada con MSW: listar, filtrar, crear, editar, borrar, validaciones y errores |
| **helpers** | `tests/helpers/**` | `renderApp({route, role, claims})`, `renderWithProviders`, `stub/table/fail` (MSW), `mockTransport` (FormData/Blob), dobles de **Ably** y **Google Maps**, `dropfile`, `pickOption`, fixtures |

Dobles globales (en `tests/setup.ts`): Ably, `@vis.gl/react-google-maps`, `google.maps`, `ResizeObserver`, `matchMedia`, `URL.createObjectURL`, `navigator.geolocation`, dayjs (utc/timezone/es). MSW está en modo estricto: **cualquier request sin handler falla la prueba**.

Limitación: jsdom no es un navegador real; no valida layout, CSS ni mapas reales.

## 3. Estado por módulo (WEB)

| Módulo | Estado |
|---|---|
| core (store, axios, hooks, componentes, rutas, navbar, utils) | ✅ 100% |
| auth / login | ✅ 100% |
| locations, users, schedules, uniform, kardex, chat | ✅ 100% |
| dashboard en vivo + home (Ritmo, Analytics, mapa, Ably) | ✅ 100% |
| guards (listado, asignaciones, historial) | ✅ 100% |
| routes (listado, alta/edición, QR) | ✅ 100% |
| rounds (listado + detalle + `RoundRouteMap`) | ✅ 100% |
| shift-handover (historial + nueva) | ✅ 100% |
| servicios HTTP | ✅ unit |
| **guard-tracking** | 🟡 13 flujos pasan; faltan ramas (ver §4) |
| **catalogs** | ❌ sin pruebas (CatalogsPage 404 l., CategoryTypesDialog, etc.) |
| **invitations** | ❌ sin pruebas (InvitationsPage 505 l., InvitationQRPrint 305 l.) |
| **incidents** | ❌ sin pruebas (IncidentsPage 476 l., IncidentReportModal, detalle) |
| **maintenances** | ❌ sin pruebas |
| **club** | ❌ sin pruebas |
| **residents** | ❌ sin pruebas (lista, detalle, formulario, contactos, pases) |
| **properties** | ❌ sin pruebas (lista, detalle, ocupación, autorizaciones, hogar) |
| **landing** | ❌ sin pruebas (LandingPage 1018 l., LandingVisuals) |
| `src/App.tsx` (rutas por rol) | 🟡 cubierto parcialmente vía flujos; falta matriz rol → ruta |

## 4. Pendientes concretos

### guard-tracking (casi listo)
- `RoundRouteMap`: ramas de clave ausente, cero puntos visibles, colores por estado, `fitBounds` y foco ya están en `tests/unit/components/RoundRouteMap.test.tsx`; correr la suite completa para que se sumen.
- `GuardTrackingPage`: falta `detailRes.data` sin el guardia (`?? null`), `breakdownRes.data` indefinido, rol fuera del mapa de traducciones y limpiar el selector (`val` vacío).

### Módulos sin pruebas (orden sugerido)
1. **incidents → maintenances → club**: comparten forma (`ReportCreateForm`, `ReportDetailDialog`, PDF, filtros, resolver/eliminar evidencia). Un conjunto de flujos parametrizado cubre los tres.
2. **catalogs**: categorías/tipos, reordenar, activar/desactivar, errores.
3. **invitations**: alta, estados, QR/impresión, motivo de rechazo.
4. **residents** y **properties**: formularios con validación Yup, contactos, pases, ocupación, autorizaciones, importación.
5. **landing**: pantalla estática grande; bastan pruebas de render + interacciones (menú, formulario, scroll).
6. **App.tsx**: tabla rol × ruta (ADMIN, SHIFT, GUARD, MAINT, RESDN) verificando redirecciones.

### Cierre global
- Correr `pnpm test:coverage` completo y ajustar huecos.
- Activar umbrales al 100% (`--coverage.thresholds.*=100`) en CI cuando lo anterior esté listo.
- Si se quiere separar métricas: `test:unit` y `test:e2e` ya reportan por capa; la meta 100% está pensada para el **combinado**.

## 5. Decisiones y política de cobertura

- **Código muerto**: lista explícita en `vitest.config.ts` (16 archivos que nadie importa: `StatusBadge`, `QuoteMapper`, `usePaginatedTable`, `RegisterPage/Form`, `persons/**`, `watermark`, etc.). **Recomendado borrarlos.**
- **Guardas inalcanzables**: se eliminaron cuando eran redundantes; si no, `/* v8 ignore next -- razón */` (pocas, todas comentadas).
- Archivos solo de tipos (`src/core/types/**`) excluidos.

## 6. Bugs reales encontrados y corregidos

| Dónde | Problema | Arreglo |
|---|---|---|
| Usuarios | Filtros Rol/Estatus no se enviaban al API | `roleId` y `active` en `externalFilters` |
| Horarios | Nunca se mostraba el mensaje de error del servidor | lee `error.messages[0]` |
| Detalle de ronda | Cancelar "¿eliminar?" cerraba el detalle | solo cierra si realmente se eliminó |
| Mapas (3 archivos) | Clave de Google Maps hardcodeada (y truncada) | se quitó; el aviso "no configurada" ahora es alcanzable |
| Kardex | Borrado de evidencia inalcanzable (sin `showDelete`) | código removido (el servicio se conserva) |
| Home | 7 de 8 tarjetas inalcanzables por rol | removidas |
| Ubicaciones | Diálogo "Autos en…" (legado de otro producto) nunca se abría | removido |
| Login | Candado de contraseña que la librería nunca renderiza | removido |

## 7. Hallazgos abiertos (no corregidos)

- **UI System (`AXZY_UI_SYSTEM`)**: `ITSearchSelect` no limpia su texto cuando `value` vuelve a `""` (en Rutas, tras "Añadir", el selector queda con la etiqueta anterior y filtra mal). Corregir en el repo del UI System.
- **UI System**: `ITDropfile` espera 1.5 s fijos ("simulación") al confirmar un archivo.
- `GuardsPage`: `row.role` nulo rompería la columna Categoría (el filtro del API evita que ocurra hoy).
- Nombre de guardia sin datos genera etiqueta `"undefined "` en selectores de Uniforme/Entrega de turno (datos incompletos de usuario).
- `ReportCreateForm`: Escape llama dos veces a `onClose` (el diálogo y un listener propio); inocuo hoy.

## 8. API (`../API`)

Trabajo hecho por la sesión "API: e2e, seeds por flujo y errores" (**sin commitear**):

- Suite jest verde: **61 suites, 955 pruebas**.
- Cobertura: statements 50.7% → **95.3%**, branches 27.6% → **81.5%**.
- Pruebas e2e HTTP por flujo (`supertest` sobre la app Express, BD `checkapp_test` en Docker `:55433`, con la salvaguarda de que nunca toca bases que no sean locales `*_test`) y seeds por flujo.
- **Pendiente**: ramas sin cubrir en `pdf-report.renderer`, `emailSender`, `round.service` y `dashboard.service`; el informe completo de la sesión (bugs hallados, seeds creadas, scripts) no se ha revisado — pedírselo a la sesión `api-e2e` o leer `git status` en `API/`.

## 9. Riesgos / notas operativas

- La suite completa es pesada: si la máquina está cargada, las pruebas con debounce (500 ms) pueden exceder tiempos; correr por módulo (`pnpm exec vitest run --project flows tests/flows/<archivo>`).
- Los flujos esperan la segunda carga de las tablas con debounce antes de interactuar (helper `open()` de cada archivo) para evitar lecturas durante el remonte.
- Nada de esto está commiteado; el repo tiene además cambios previos sin relación (assets eliminados).
