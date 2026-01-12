import { useEffect, useState } from "react";
import { getKardex, createMovement, KardexItem } from "../service/movements.service";
import { MovementsTable } from "../components/MovementsTable";
import { MovementForm } from "../components/MovementForm";
import { ITButton, ITDialog, ITLoader } from "axzy_ui_system";

const MovementsPage = () => {
  const [movements, setMovements] = useState<KardexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  



  const fetchMovements = async () => {
    setLoading(true);
    const res = await getKardex();
    if (res.success && res.data) {
        setMovements(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const handleCreate = async (data: { entryId: number; toLocationId: number }) => {
    await createMovement({
        entryId: data.entryId,
        toLocationId: data.toLocationId,
        assignedUserId: 2 // Hardcoded
    });
    setIsModalOpen(false);
    fetchMovements();
  };

  if (loading) return <div className="flex justify-center p-10"><ITLoader /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Movimientos de Vehículos</h1>
      </div>

      <MovementsTable data={movements} />

      <ITDialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Movimiento">
         <MovementForm onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
      </ITDialog>
    </div>
  );
};

export default MovementsPage;
