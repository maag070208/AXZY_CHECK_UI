import React, { useEffect, useState } from "react";
import { ITDialog, ITButton } from "@axzydev/axzy_ui_system";
import { getRoles, updateUser } from "../../users/services/UserService";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { FaUserTag } from "react-icons/fa";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

export const QuickRoleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen) {
      getRoles().then((res) => {
        if (res.success && res.data) setRoles(res.data);
      });
      setSelectedRoleId(user?.roleId?.toString() || "");
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    if (!selectedRoleId) {
      dispatch(showToast({ message: "Selecciona un rol", type: "warning" }));
      return;
    }

    setLoading(true);
    const res = await updateUser(user.id, { roleId: Number(selectedRoleId) });
    setLoading(false);

    if (res.success) {
      dispatch(showToast({ message: "Rol actualizado", type: "success" }));
      onSuccess();
    } else {
      dispatch(
        showToast({
          message: res.error || "Error al actualizar",
          type: "error",
        }),
      );
    }
  };

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Actualizar Categoría / Rol"
      className="max-w-md w-full"
    >
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
            {user?.name.charAt(0)}
            {user?.lastName?.charAt(0) || ""}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Guardia
            </p>
            <p className="font-bold text-slate-700">
              {user?.name} {user?.lastName}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <FaUserTag className="text-emerald-500" /> SELECCIONAR CATEGORÍA
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full h-[45px] px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
            >
              <option value="" disabled>
                Selecciona un rol...
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <ITButton
            variant="outlined"
            color="secondary"
            onClick={onClose}
            className="flex-1 !rounded-xl"
            disabled={loading}
          >
            CANCELAR
          </ITButton>
          <ITButton
            onClick={handleSave}
            className="flex-1 !rounded-xl !bg-emerald-600 hover:!bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-100"
          >
            ACTUALIZAR ROL
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};
