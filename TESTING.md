# Pruebas de la WEB y la API — estado y pendientes

Última actualización: 2026-10-22. Suite combinada de la WEB: **1.054 pruebas en 38 archivos**, todo en verde. Cobertura global del combinado: **99,07 % statements · 95,16 % branches · 93,38 % functions** (`pnpm test:coverage`, ~2,5 min en una máquina descargada).

## 1. Cómo correr

```bash
source ~/.nvm/nvm.sh && nvm use      # Node 22 (.nvmrc)
pnpm test                            # unit + flujos, sin cobertura
pnpm test:unit                       # solo unit, con cobertura
pnpm test:e2e                        # solo flujos, con cobertura
pnpm test:coverage                   # todo, con cobertura (reporte en coverage/index.html)
pnpm test:watch
```

Si `pnpm` no está en el PATH de la sesión, los binarios locales hacen lo mismo:
`./node_modules/.bin/vitest run`, `./node_modules/.bin/vitest run tests/flows/<archivo>`.

Playwright (`e2e/`, `pnpm e2e`) sigue intacto: levanta build + API + BD, por eso es lento. Se puede retirar cuando los flujos de Vitest lo reemplacen.

## 2. Qué hay

| Capa | Dónde | Qué prueba |
|---|---|---|
| **unit** | `tests/unit/**` | slices de Redux, axios, utilidades, hook de catálogos, servicios HTTP (método, ruta, cuerpo, ramas de error/PDF/subidas), componentes compartidos (`MediaCarousel`, `ReportCreateForm`, `ReportDetailDialog`, mapas, rutas protegidas, navbar, toast), helpers visuales de catálogos (`catalogVisuals`) y el generador de PDF de QRs (`locationQRsPdf`) |
| **flujos ("e2e" rápidos)** | `tests/flows/**` | pantallas completas montando `<App/>` (router, Redux, UI System) contra una API simulada con MSW: listar, filtrar, crear, editar, borrar, validaciones y errores |
| **helpers** | `tests/helpers/**` | `renderApp({route, role, claims})`, `renderWithProviders`, `stub/table/fail` (MSW), `mockTransport` (FormData/Blob), dobles de **Ably** y **Google Maps**, `dropfile`, `pickOption`, fixtures |

Archivos de flujo por pantalla (pruebas que aporta cada uno):

| Archivo | Pruebas | Pantalla(s) |
|---|---:|---|
| `app-routes.test.tsx` | 129 | matriz rol × ruta de `App.tsx` (ADMIN, SHIFT, GUARD, MAINT, CLIENT, RESDN), sesión y rutas desconocidas |
| `catalogs.test.tsx` | 52 | catálogos de reporte y base, categorías, tipos, activar/desactivar y borrado |
| `properties.test.tsx` | 83 | listado, alta/edición/baja, ocupación, hogar, autorizaciones, importación y expediente |
| `residents.test.tsx` | 46 | listado, alta multietapa, detalle, contactos, pases e INE |
| `invitations.test.tsx` | 36 | listado, alta, gafete QR/WhatsApp, revocación y validación de acceso |
| `reports.test.tsx` | 84 | incidencias, mantenimientos y casa club (parametrizado): listado, filtros, detalle, resolver, eliminar y PDF |
| `landing.test.tsx` | 14 | landing pública: navegación, menú móvil, tabs, FAQ, offline/planes y cotización por WhatsApp |
| `routes.test.tsx` | 21 | listado, alta/edición, QR de ubicaciones y descarga del PDF de QRs por ruta |
| `guard-tracking.test.tsx` | 16 | seguimiento de guardias y ramas defensivas del selector/resumen |
| `dashboard*.test.tsx`, `chat`, `kardex`, `login`, `locations`, `rounds`, `round-detail`, `schedules`, `shift-handover`, `uniform`, `users`, `guards` | — | flujos previos (sin cambios) + unit existentes |

Dobles globales (en `tests/setup.ts`): Ably, `@vis.gl/react-google-maps`, `google.maps`, `ResizeObserver`, `matchMedia`, `URL.createObjectURL`, `navigator.geolocation`, dayjs (utc/timezone/es). MSW está en modo estricto: **cualquier request sin handler falla la prueba**.

Limitación: jsdom no es un navegador real; no valida layout, CSS ni mapas reales.

## 3. Estado por módulo (WEB)

| Módulo | Estado |
|---|---|
| core (store, axios, hooks, componentes, rutas, navbar, utils) | ✅ salvo ramas defensivas inalcanzables (ver §4) |
| auth / login | ✅ 100% |
| locations, users, schedules, uniform, kardex, chat | ✅ 100% |
| dashboard en vivo + home (Ritmo, Analytics, mapa, Ably) | ✅ 100% |
| guards (listado, asignaciones, historial) | ✅ 100% |
| routes (listado, alta/edición, QR y PDF de QRs por ruta) | ✅ 21 flujos + 2 unit del generador |
| rounds (listado + detalle + `RoundRouteMap`) | ✅ 100% |
| shift-handover (historial + nueva) | ✅ 100% |
| servicios HTTP | ✅ unit |
| guard-tracking | ✅ 16 flujos (incluye `?? null`, desglose sin datos, limpiar selector y rol traducido) |
| catalogs | ✅ 52 flujos + 29 unit de `catalogVisuals` |
| invitations | ✅ 36 flujos (alta, estados, QR/impresión/WhatsApp, revocación y escaneo) |
| incidents / maintenances / club | ✅ 84 flujos parametrizados (listado, filtros, detalle, resolver, eliminar, alta y PDF) |
| residents | ✅ 46 flujos (lista, alta/edición, detalle, contactos, pases, INE) |
| properties | ✅ 83 flujos (lista, detalle, ocupación, hogar, autorizaciones, importación) |
| landing | ✅ 14 flujos (render, navegación, menú, tabs, offline/planes, cotización) |
| `src/App.tsx` (rutas por rol) | ✅ 129 pruebas de matriz rol → ruta |

## 4. Pendientes concretos

Solo queda lo inalcanzable por UI o el código muerto; no hay pantallas sin pruebas.

### Código muerto a borrar (recomendado; explica casi todo el hueco restante)
- `MaintenancesPage.handleDeleteMedia` y `ClubPage.handleDeleteMedia`: `ReportDetailDialog` **ignora** `onDeleteMedia` y fija `showDelete={false}`, así que la eliminación de evidencia no existe en la UI (~30 líneas inalcanzables).
- `CatalogsPage.confirmDelete`: la rama `kind: "type"` nunca se usa (la página solo abre targets de categoría).
- `GuardTrackingPage`: fallback `ROLE_TRANSLATIONS[...] ?? role?.name`; el filtro previo solo admite GUARD/SHIFT/MAINT, todos traducidos.
- `catalog.hook`: el `catch` de `handleGetCatalog` es inalcanzable porque `getCatalogOptions` convierte cualquier error en `{ success: false }`.
- `navbar.constants.isRouteActive`: el parámetro `subroutes` no lo pasa nadie.
- `IncidentService`/`ClubService`: `e.message ?? serverMessage` dentro del `catch` del PDF (axios siempre trae `message`).

### Ramas no ejercitadas por diseño
- Modales de PDF (`*ReportModal`, 96,8 %): ramas `cancelled` de los dos efectos (solo se dan si el modal se cierra antes de que responda el API) y `generar con 0 seleccionados` (el botón está deshabilitado; la guarda es defensiva).
- `InvitationQRPrint` (77 % branches): la pre-generación de la imagen a los 700 ms no se ejercita; los tests generan la imagen al pulsar WhatsApp.
- `ImportPropertiesModal` (75 % branches): errores de lectura del archivo (FileReader) y tipos de archivo no válidos.
- `ResidentFormPage` / `ResidentDetailPage`: ramas de error de red y estados intermedios poco probables (96,97–97,43 % statements).
- Ramas de `onChange` del `ITDatePicker` para un `Date` suelto o `null`: el picker en modo rango solo emite arreglos.

### Cierre global
- **Umbrales al 100 % en CI**: todavía no. El combinado está en 99,3 % statements / 95,53 % branches / 93,5 % functions; activar `--coverage.thresholds.*=100` después de borrar el código muerto de arriba.
- Si se quiere separar métricas: `test:unit` y `test:e2e` ya reportan por capa; la meta 100 % está pensada para el **combinado**.

## 5. Decisiones y política de cobertura

- **Código muerto**: lista explícita en `vitest.config.ts` (16 archivos que nadie importa: `StatusBadge`, `QuoteMapper`, `usePaginatedTable`, `RegisterPage/Form`, `persons/**`, `watermark`, etc.). **Recomendado borrarlos.**
- **Guardas inalcanzables**: se eliminaron cuando eran redundantes; si no, `/* v8 ignore next -- razón */` (pocas, todas comentadas).
- Archivos solo de tipos (`src/core/types/**`) excluidos.
- Los flujos de `properties` cubren los fixes de robustez del detalle/paneles (ver §6); si se revierten esos archivos, las pruebas de reintento/error fallarán.
- `tests/flows/guard-tracking.test.tsx` deja 100 ms antes del `afterEach` global para que la petición de detalle en vuelo termine antes de que MSW resetee sus handlers.

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
| Detalle de propiedad | Error HTTP solo hacía `console.error`; el usuario no veía nada | toast con el mensaje del API |
| Paneles de propiedad (ocupación, hogar, autorizaciones) | `getOccupancy`/`listHousehold`/`listAuthorizations` sin `catch`: *unhandled rejection* y loader infinito | `catch` + aviso (`role="alert"`) + **Reintentar** |
| Detalle de propiedad | Comparaba el rol `SHIFT_GUARD` (inexistente): los supervisores no veían "Editar" | `isAdmin = ADMIN \|\| SHIFT` |
| Detalle de propiedad | `console.log(row)` de depuración y botón atrás sin nombre accesible | eliminado / `ariaLabel="Volver"` |

Los cuatro últimos salieron de `tests/flows/properties.test.tsx` (que también verifica los reintentos y los avisos).

## 7. Hallazgos abiertos (no corregidos)

- **Catálogos**: `CatalogsPage.confirmDelete` siempre llama a `deleteCategory`; en una categoría **activa** el diálogo dice "Desactivar…" y promete reactivarla, pero se envía `DELETE` (borrado permanente).
- **Catálogos**: `saveBase`/`removeBase` solo contemplan HTTP 200 con `{ success: false }`; un 4xx/5xx deja una promesa rechazada sin aviso.
- **Catálogos**: `CategoryTypesDialog.confirmPending` ignora `res.success`: un fallo con HTTP 200 cierra el diálogo y recarga como si hubiera funcionado.
- **Catálogos**: los toggles de categoría/base no capturan errores del PUT.
- **Catálogos**: textos menores: "1 tipos" (vista previa de `CategoryFormModal`) y "Nuevo Tipos de propiedad" / "Editar Tipos de propiedad".
- **Invitaciones**: las ramas `catch` de `InvitationsPage` son inalcanzables porque `invitations.service.ts` convierte todo error en `{ success: false, messages: ["Error …"] }`; el usuario ve el mensaje genérico del servicio.
- **Invitaciones**: el aviso "Escribe el motivo de la revocación" es inalcanzable (el botón "Revocar pase" está deshabilitado sin motivo).
- **Invitaciones**: la entrada manual de fechas en modo rango está rota: `ITDatePicker` emite un `Date` suelto y `InvitationForm` lo guarda como `dateRange`, dejando `dateRange[0]/[1]` en `undefined` (Yup lo bloquea).
- **Invitaciones**: etiquetas incoherentes tabla vs gafete ("Expirada/Revocada" vs "Expirado/Revocado") y el éxito de salida dice "Pase marcado como Módulo de Salida".
- **Residentes**: `ResidentContactsManager` ignora `{ success: false }` al crear/editar/eliminar: sin toast ni refresco.
- **Residentes**: `ResidentForm.validateCurrentStep` solo valida los pasos 0 y 1; un `emergencyPhone` inválido no bloquea "Siguiente" y el submit final queda bloqueado por Formik sin explicación.
- **Residentes**: `ResidentDetailPage` no captura errores HTTP al eliminar un contacto; `ResidentPassesPanel.revoke` no informa fallos y `QRCode.toDataURL` no tiene manejo de error en `showPass`.
- **Landing**: `ITSearchSelect` no renderiza `required` y `QuoteForm` no valida los selects al enviar: con nombre/empresa/contacto llenos y Guardias/Ubicaciones vacíos se abre WhatsApp con campos vacíos.
- **Reportes**: `handleDeleteMedia` de mantenimientos/casa club es código muerto (ver §4).
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

- La suite completa tarda ~2–3 min. Si la máquina está cargada, las pruebas con debounce (500 ms) pueden acercarse a los 15 s del proyecto `flows`; las matrices pesadas se dividieron por ruta (la de roles pasó de 4 pruebas de ~15 s a 129 de <1 s).
- Los flujos esperan la segunda carga de las tablas con debounce antes de interactuar (helper `open()` de cada archivo) para evitar lecturas durante el remonte.
- Los tests de propiedades dependen de los fixes de §6 (reintento del detalle + errores de los paneles); revertir `src/modules/properties` los rompería.
- La landing importa `landing.css`; Vitest corre con `css: false`, por eso no necesita stubs de CSS.
- Nada de esto está commiteado; el repo tiene además cambios previos sin relación (assets eliminados).
