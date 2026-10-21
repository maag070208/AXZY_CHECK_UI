import { ITCard, ITPage } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import { FaUserShield } from "react-icons/fa";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ResidentForm } from "../components/ResidentForm";
import {
  createResident,
  getResidentById,
  ResidentUser,
  updateResident,
} from "../services/residents.service";

export const ResidentFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const isEdit = Boolean(id);
  const initialStep = searchParams.get("step") === "identificacion" ? 3 : 0;
  const [resident, setResident] = useState<ResidentUser | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getResidentById(Number(id));
      if (res.success && res.data) setResident(res.data);
      else setError("No se encontró el residente.");
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el residente.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (data: any) => {
    try {
      const res = isEdit && id ? await updateResident(Number(id), data) : await createResident(data);
      if (res.success) {
        dispatch(
          showToast({
            message: isEdit ? "Expediente actualizado" : "Residente creado",
            type: "success",
          }),
        );
        const created = (res as any).data;
        navigate(isEdit ? `/residents/${id}` : created?.id ? `/residents/${created.id}` : "/residents");
      } else {
        dispatch(showToast({ message: res.messages?.[0] || "No se pudo guardar", type: "error" }));
      }
    } catch (err: any) {
      dispatch(showToast({ message: err?.messages?.[0] || "Error al guardar", type: "error" }));
    }
  };

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1200px]! px-6! bg-slate-50"
      noPadding
      backAction={() => navigate(isEdit ? `/residents/${id}` : "/residents")}
      loading={loading}
      error={error}
      onRetry={load}
      title={isEdit ? "Editar expediente" : "Nuevo residente"}
      breadcrumbs={[
        { label: "Inicio", href: "#/home" },
        { label: "Directorio de Residentes", href: "#/residents" },
        { label: isEdit ? "Editar expediente" : "Nuevo residente" },
      ]}
      description={isEdit ? "Actualiza datos, acceso, contactos e identificación." : "Alta de residente, acceso y expediente."}
      icon={<FaUserShield size={20} />}
      iconColor="#065911"
    >
      <ITCard className="mt-5 rounded-3xl border-0! bg-white! shadow-none!" contentClassName="p-4!">
        <ResidentForm
          initialData={resident}
          initialStep={initialStep}
          onSubmit={handleSubmit}
          onCancel={() => navigate(isEdit ? `/residents/${id}` : "/residents")}
        />
      </ITCard>
    </ITPage>
  );
};

export default ResidentFormPage;
