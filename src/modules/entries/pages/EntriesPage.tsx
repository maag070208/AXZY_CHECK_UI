import { useEffect, useState } from "react";
import { AssignKeyDialog } from "../components/AssignKeyDialog";
import { createEntry, getEntries, VehicleEntry, assignKey, finishKeyAssignment } from "../service/entries.service";
import { useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { ITLoader, ITButton, ITDialog } from "axzy_ui_system";
import { EntriesTable } from "../components/EntriesTable";
import { EntryForm } from "../components/EntryForm";

const EntriesPage = () => {
  const [entries, setEntries] = useState<VehicleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for Assign Key Dialog
  const [assignKeyEntry, setAssignKeyEntry] = useState<VehicleEntry | null>(null);

  const user = useSelector((state: AppState) => state.auth);

  const fetchEntries = async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await getEntries();
    if (res.success && res.data) {
        setEntries(res.data);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

// ...

  const handleCreate = async (formData: FormData) => {
    await createEntry(formData);
    setIsModalOpen(false);
    fetchEntries(true); // Silent refresh
  };

  const handleAssignKey = async (operatorId: number, actionType: string, targetLocationId?: number) => {
      if (!assignKeyEntry) return;
      try {
          // UX: Don't show full screen loader
          await assignKey(assignKeyEntry.id, operatorId, actionType, targetLocationId);
          fetchEntries(true); // Silent refresh
      } catch (error) {
          console.error(error);
          alert("Error al asignar llave");
      } finally {
          setAssignKeyEntry(null);
      }
  };

  const handleFinishAssignment = async (assignmentId: number) => {
      try {
          if (!confirm("¿Confirmar que el operador ha devuelto las llaves?")) return;
          // UX: Don't show full screen loader
          await finishKeyAssignment(assignmentId);
          fetchEntries(true); // Silent refresh
      } catch (error) {
          console.error(error);
          alert("Error al finalizar asignación");
      }
  };

  if (loading) return <div className="flex justify-center p-10"><ITLoader /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Entradas de Vehículos</h1>
        {user?.role !== "OPERATOR" && (
            <ITButton onClick={() => setIsModalOpen(true)}>Registrar Entrada</ITButton>
        )}
      </div>

      <EntriesTable 
        data={entries} 
        onAssignKey={(entry) => setAssignKeyEntry(entry)}
        onFinishAssignment={handleFinishAssignment}
        readOnly={user?.role === "OPERATOR"}
      />

      <ITDialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Entrada" className="max-w-4xl w-full">
        <EntryForm 
            onSubmit={handleCreate} 
            onCancel={() => setIsModalOpen(false)} 
            userId={3} // TODO: Logic to select user
            operatorUserId={user.id || 0}
        />
      </ITDialog>

      <AssignKeyDialog 
        isOpen={!!assignKeyEntry}
        onClose={() => setAssignKeyEntry(null)}
        entry={assignKeyEntry}
        onConfirm={handleAssignKey}
      />
    </div>
  );
};

export default EntriesPage;
