import { get, post } from "@app/core/axios/axios";

export interface PersonLite {
  id: number;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface PersonContact {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  relationship?: string | null;
}

export interface PersonDocument {
  id: number;
  expiresAt: string | null;
  notes?: string | null;
  createdAt: string;
  kind: { code: string; name: string };
}

/** El cliente HTTP lanza el cuerpo de respuestas no 2xx. Las escrituras devuelven ese cuerpo
 *  (éxito o error) para que la pantalla lea `success` y `code` sin excepciones. */
const settle = <T>(request: Promise<T>): Promise<T> => request.catch((error) => error as T);

export const searchPersons = (q: string) => get<PersonLite[]>(`/persons?q=${encodeURIComponent(q)}`);
export const createPerson = (body: { firstName: string; lastName?: string | null; phone?: string | null; email?: string | null; confirmNewPerson?: boolean }) =>
  settle(post<PersonLite>("/persons", body));

export const listContacts = (personId: number) => get<PersonContact[]>(`/persons/${personId}/contacts`);
export const addContact = (personId: number, body: { name: string; phone?: string | null; email?: string | null; relationship?: string | null }) =>
  settle(post<PersonContact>(`/persons/${personId}/contacts`, body));

export const listDocuments = (personId: number) => get<PersonDocument[]>(`/persons/${personId}/documents`);
export const documentUrl = (personId: number, documentId: number) =>
  get<{ url: string; expiresInSeconds: number }>(`/persons/${personId}/documents/${documentId}/url`);
export const addDocument = (personId: number, body: { kindCode: string; mediaFileId: number; expiresAt?: string | null; notes?: string | null }) =>
  settle(post<PersonDocument>(`/persons/${personId}/documents`, body));

/** Sube un archivo privado: presign → PUT directo a S3 → confirmación. Devuelve el id del MediaFile. */
export const uploadPrivateFile = async (file: File): Promise<number> => {
  const presign: any = await post<any>("/media/presign", { contentType: file.type, sizeBytes: file.size, isPrivate: true });
  if (!presign.success) throw presign;
  const put = await fetch(presign.data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!put.ok) throw new Error("No se pudo subir el archivo");
  const confirm: any = await post<any>(`/media/${presign.data.mediaId}/confirm`, {});
  if (!confirm.success) throw confirm;
  return presign.data.mediaId as number;
};
