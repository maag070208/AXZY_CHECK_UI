import { useEffect, useState } from "react";
import { getExits, createExit, VehicleExit } from "../service/exits.service";
import { ExitsTable } from "../components/ExitsTable";
import { ExitForm } from "../components/ExitForm";
import { ITButton, ITDialog, ITLoader } from "axzy_ui_system";

const ExitsPage = () => {
  const [exits, setExits] = useState<VehicleExit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  


  const fetchExits = async () => {
    setLoading(true);
    const res = await getExits();
    if (res.success && res.data) {
        setExits(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExits();
  }, []);

  const handleCreate = async (data: { entryId: number; notes: string }) => {
    await createExit({
        entryId: data.entryId,
        operatorUserId: 2, // Hardcoded
        notes: data.notes
    });
    setIsModalOpen(false);
    fetchExits();
  };

  if (loading) return <div className="flex justify-center p-10"><ITLoader /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Salidas de Vehículos</h1>
      </div>

      <ExitsTable data={exits} />

      <ITDialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Salida">
         <ExitForm onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
      </ITDialog>
    </div>
  );
};

export default ExitsPage;
