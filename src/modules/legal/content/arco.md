# Procedimiento para atender derechos ARCO

> **BORRADOR PARA REVISIÓN LEGAL.** Procedimiento interno y formato de solicitud. Los plazos están pendientes de validar con la ley vigente.

## 1. Responsable de atender

`[[NOMBRE / ÁREA]]` · `[[CORREO DE PRIVACIDAD]]` · `[[TELÉFONO]]` · `[[LUGAR FÍSICO]]`. Lleva un **registro de solicitudes** (fecha, titular, derecho, respuesta, cierre).

## 2. Flujo

| Paso | Qué se hace | Plazo |
|---|---|---|
| 1. Recepción | Se recibe por correo o en persona. Se entrega acuse con fecha y folio | Mismo día |
| 2. Identidad | Se verifica la identidad con identificación oficial; si actúa un representante, carta poder `[[VALIDAR requisitos]]` | Antes de actuar |
| 3. Completitud | Si falta información, se pide una sola vez al titular | `[[PLAZO LEGAL — VALIDAR]]` |
| 4. Búsqueda | Se localizan los datos en los sistemas (tabla de la sección 3) | — |
| 5. Respuesta | Se responde por escrito si procede o se niega con motivo fundado | `[[PLAZO LEGAL — VALIDAR]]` |
| 6. Ejecución | Si procede, se aplica el cambio o la eliminación y se confirma | `[[PLAZO LEGAL — VALIDAR]]` |
| 7. Cierre | Se archiva el expediente | — |

## 3. Dónde están los datos de una persona

| Derecho | Qué hay que consultar o hacer | Datos |
|---|---|---|
| **Acceso** | Entregar copia de lo que se tiene | `User`, `Person`, `ResidentProfile`, `ResidentContact`, `Resident` (ocupación), `Vehicle`, `Invitation` (de su autoría), `Complaint` y `ComplaintMessage`, cargos y pagos, `PersonDocument` y archivos de `MediaFile` en S3 |
| **Rectificación** | Corregir el dato inexacto | Contacto y foto: el residente lo hace en la APP. Nombre, propiedad y documentos: lo hace la Administración |
| **Cancelación** | Eliminar o bloquear | Ver sección 4 |
| **Oposición** | Dejar de usar para finalidades no necesarias | Registrar la oposición; no enviar comunicados no operativos |
| **Revocación del consentimiento** | Igual que cancelación para lo que dependa del consentimiento | — |

## 4. Cancelación: qué se elimina y qué se bloquea

| Dato | Acción | Motivo si se conserva |
|---|---|---|
| Foto de perfil, foto de contactos, contactos de agenda | **Eliminar** (fila y archivo en S3) | — |
| INE y documentos | **Eliminar** el archivo en S3 y el registro | — |
| Cuenta de acceso | **Desactivar** y anonimizar nombre y usuario cuando no haya obligación de conservarlo | Integridad de la bitácora |
| Accesos, rondas y bitácora de seguridad | **Bloquear** (sin uso salvo obligación legal) hasta el plazo de retención y luego eliminar | Seguridad y obligaciones legales |
| Pagos y recibos | **Bloquear** hasta el plazo fiscal y contable | Obligación fiscal `[[VALIDAR]]` |
| Quejas | Anonimizar el autor al cierre del plazo | Historial operativo |

> **Brecha técnica.** Hoy el sistema **no tiene** funciones para exportar los datos de una persona ni para eliminarlos de forma completa (incluidos los archivos en S3 y las copias de respaldo). Se hace a mano con consultas. **Crear estas dos funciones** antes de publicar el aviso. Ver la [política de retención](06-politica-de-retencion.md).

## 5. Causas por las que se puede negar

`[[LISTAR las causas que prevé la ley vigente: p. ej., cuando el titular no acredite su identidad, cuando los datos no obren en poder del responsable, cuando exista obligación legal de conservarlos, etc. — VALIDAR]]`. Siempre se responde **por escrito y con motivo**.

## 6. Formato de solicitud

**Solicitud de ejercicio de derechos sobre datos personales**

| Campo | Datos |
|---|---|
| Nombre completo del titular | |
| Propiedad / domicilio en el residencial | |
| Correo y teléfono para respuesta | |
| Derecho que ejerce (marca uno o varios) | ☐ Acceso ☐ Rectificación ☐ Cancelación ☐ Oposición ☐ Revocar consentimiento |
| Descripción clara de los datos y de lo que solicita | |
| Documentos que anexa (identificación oficial; para rectificar, el documento que acredite el dato correcto) | |
| Representante (si aplica) y carta poder | |
| Fecha y firma | |

Acuse de recibo: folio `____` · fecha `____` · recibió `____`.
