import privacidad from "./content/privacidad.md?raw";
import simplificado from "./content/simplificado.md?raw";
import personal from "./content/personal.md?raw";
import terminos from "./content/terminos.md?raw";
import arco from "./content/arco.md?raw";

/**
 * Datos del responsable. Llena aquí una sola vez cada valor y se sustituye en todos los documentos;
 * lo que siga vacío se muestra marcado como "pendiente" (los textos son borradores para revisión legal).
 * La clave es el texto del campo `[[…]]` tal como aparece en el documento.
 */
export const LEGAL_VALUES: Record<string, string> = {
  "RAZÓN SOCIAL DEL RESPONSABLE": "",
  "RAZÓN SOCIAL": "",
  "DOMICILIO COMPLETO": "",
  "NOMBRE DEL RESIDENCIAL": "",
  "CORREO DE PRIVACIDAD": "",
  "TELÉFONO": "",
  FECHA: "",
};

export type LegalDocKey = "privacidad" | "simplificado" | "personal" | "terminos" | "arco";

export const LEGAL_DOCS: Record<LegalDocKey, { label: string; source: string }> = {
  privacidad: { label: "Aviso de privacidad", source: privacidad },
  simplificado: { label: "Aviso simplificado", source: simplificado },
  personal: { label: "Aviso para el personal", source: personal },
  terminos: { label: "Términos y condiciones", source: terminos },
  arco: { label: "Derechos ARCO", source: arco },
};

export const LEGAL_KEYS = Object.keys(LEGAL_DOCS) as LegalDocKey[];
