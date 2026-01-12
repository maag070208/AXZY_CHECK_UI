import { ITDialog, ITSelect, ITButton } from "axzy_ui_system";
import { useState, useEffect } from "react";
import { getUsers } from "../../users/services/UserService";
import { VehicleEntry } from "../service/entries.service";
import { getLocations } from "../../locations/service/locations.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entry: VehicleEntry | null;
  onConfirm: (operatorId: number, actionType: string, targetLocationId?: number) => void;
}

export const AssignKeyDialog = ({ isOpen, onClose, entry, onConfirm }: Props) => {
  const [operatorId, setOperatorId] = useState<string>("");
  const [actionType, setActionType] = useState<string>("");
  const [targetLocationId, setTargetLocationId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState<{value: string, label: string}[]>([]);
  const [locations, setLocations] = useState<{value: string, label: string}[]>([]);

  const actionOptions = [
      { value: "MOVEMENT", label: "Movimiento (Mover de Parking)" },
      { value: "DELIVERY", label: "Entrega (Ir por auto para entrega)" },
  ];

  useEffect(() => {
    if (isOpen) {
        getUsers().then(res => {
            if(res.success && res.data) {
                const ops = res.data
                    .filter(u => u.role === 'OPERATOR')
                    .map(u => ({ value: String(u.id), label: `${u.name} ${u.lastName}` }));
                setOperators(ops);
            }
        });

        // Fetch locations
        getLocations().then(res => {
            if(res.success && res.data) {
                const available = res.data
                    //.filter((l: any) => !l.isOccupied)
                    .map((l: any) => ({ 
                        value: String(l.id), 
                        label: l.name 
                    }));
                setLocations(available);
            }
        });

        setOperatorId("");
        setActionType("");
        setTargetLocationId("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (operatorId && actionType) {
        if (actionType === "MOVEMENT" && !targetLocationId) {
            alert("Seleccione la nueva ubicación");
            return;
        }

        setLoading(true);
        // Simulate API call delay
        setTimeout(() => {
            onConfirm(Number(operatorId), actionType, targetLocationId ? Number(targetLocationId) : undefined);
            setLoading(false);
            onClose();
        }, 1000);
    }
  };

  return (
    <ITDialog 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Asignar Llave - ${entry?.brand} ${entry?.model} (${entry?.plates})`}
        className="max-w-md w-full"
    >
        <div className="flex flex-col gap-6 p-4">
            <p className="text-gray-600 text-sm">
                Selecciona la acción y el operador responsable de las llaves.
            </p>

            <ITSelect
                label="Tipo de Acción"
                name="actionType"
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                options={actionOptions}
                placeholder="Seleccione la acción"
            />
            
            {actionType === "MOVEMENT" && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <ITSelect
                        label="Nueva Ubicación Destino"
                        name="targetLocation"
                        value={targetLocationId}
                        onChange={(e) => setTargetLocationId(e.target.value)}
                        options={locations}
                        placeholder="Seleccione nueva ubicación"
                    />
                </div>
            )}

            <ITSelect
                label="Operador"
                name="operator"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                options={operators}
                placeholder="Seleccione un operador"
            />

            <div className="flex justify-end gap-3 mt-4">
                <ITButton color="secondary" onClick={onClose} disabled={loading}>
                    Cancelar
                </ITButton>
                <ITButton onClick={handleSubmit} disabled={!operatorId || !actionType || loading}>
                    {loading ? "Asignando..." : "Asignar Llave"}
                </ITButton>
            </div>
        </div>
    </ITDialog>
  );
};
