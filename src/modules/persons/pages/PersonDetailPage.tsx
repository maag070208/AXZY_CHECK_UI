import { ITButton, ITInput, ITLoader } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { addContact, addDocument, documentUrl, listContacts, listDocuments, PersonContact, PersonDocument, uploadPrivateFile } from "../persons.service";

/** Ficha de persona (A2): contactos y documentos privados. */
export const PersonDetailPage = () => {
  const { id } = useParams();
  const personId = Number(id);
  const [contacts, setContacts] = useState<PersonContact[]>([]);
  const [documents, setDocuments] = useState<PersonDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", relationship: "" });
  const [docKind, setDocKind] = useState("INE");
  const [docExpiry, setDocExpiry] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [c, d]: any[] = await Promise.all([listContacts(personId), listDocuments(personId)]);
    setContacts(c.data ?? []);
    setDocuments(d.data ?? []);
    setLoading(false);
  }, [personId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveContact = async () => {
    setError(null);
    const res: any = await addContact(personId, { name: contactForm.name, phone: contactForm.phone || null, relationship: contactForm.relationship || null });
    if (res.success === false) return setError(res.messages?.[0] ?? "No se pudo guardar el contacto");
    setContactForm({ name: "", phone: "", relationship: "" });
    void load();
  };

  const saveDocument = async () => {
    if (!docFile) return;
    setError(null);
    try {
      const mediaFileId = await uploadPrivateFile(docFile);
      const res: any = await addDocument(personId, { kindCode: docKind, mediaFileId, expiresAt: docExpiry || null });
      if (res.success === false) return setError(res.messages?.[0] ?? "No se pudo guardar el documento");
      setDocFile(null);
      setDocExpiry("");
      void load();
    } catch (e: any) {
      setError(e?.messages?.[0] ?? e?.message ?? "No se pudo subir el documento");
    }
  };

  const openDocument = async (docId: number) => {
    const res: any = await documentUrl(personId, docId);
    if (res.data?.url) window.open(res.data.url, "_blank", "noopener");
  };

  if (loading) return <div className="flex justify-center p-10"><ITLoader size="sm" /></div>;

  return (
    <div className="p-8 space-y-8">
      <section className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Contactos</h2>
        <ul className="divide-y divide-slate-100 text-sm">
          {contacts.map((c) => (
            <li key={c.id} className="py-2">{c.name} {c.relationship ? `· ${c.relationship}` : ""} {c.phone ? `· ${c.phone}` : ""}</li>
          ))}
          {contacts.length === 0 && <li className="py-2 text-slate-400">Sin contactos</li>}
        </ul>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <ITInput name="contactName" label="Nombre" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
          <ITInput name="contactPhone" label="Teléfono" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
          <ITInput name="contactRelationship" label="Parentesco" value={contactForm.relationship} onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })} />
          <ITButton onClick={() => void saveContact()} disabled={!contactForm.name.trim()}>Agregar contacto</ITButton>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Documentos privados</h2>
        <ul className="divide-y divide-slate-100 text-sm">
          {documents.map((d) => (
            <li key={d.id} className="py-2 flex items-center justify-between gap-4">
              <span>{d.kind.name} {d.expiresAt ? `· vence ${new Date(d.expiresAt).toLocaleDateString("es-MX")}` : ""}</span>
              <ITButton variant="ghost" size="sm" onClick={() => void openDocument(d.id)}>Ver</ITButton>
            </li>
          ))}
          {documents.length === 0 && <li className="py-2 text-slate-400">Sin documentos</li>}
        </ul>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <label className="text-sm text-slate-600">Tipo
            <select className="block w-full border rounded-lg p-2" value={docKind} onChange={(e) => setDocKind(e.target.value)}>
              <option value="INE">Identificación (INE)</option>
              <option value="CONTRACT">Contrato</option>
              <option value="OTHER">Otro</option>
            </select>
          </label>
          <ITInput name="docExpiry" label="Vence (AAAA-MM-DD)" value={docExpiry} onChange={(e) => setDocExpiry(e.target.value)} />
          <input type="file" aria-label="Archivo del documento" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
          <ITButton onClick={() => void saveDocument()} disabled={!docFile}>Subir documento</ITButton>
        </div>
        <p className="text-xs text-slate-400">Los documentos son privados: se abren con un enlace temporal.</p>
      </section>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
};
