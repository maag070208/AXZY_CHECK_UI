import { ITButton, ITSelect } from "axzy_ui_system";
import { NewUserForm } from "./NewUserForm";
import { getUserVehicles } from "../../service/entries.service";
import { useEffect, useState } from "react";

interface Props {
    isCreatingUser: boolean;
    setIsCreatingUser: (val: boolean) => void;
    selectedUserId: number | null;
    setSelectedUserId: (id: number) => void;
    users: { value: string; label: string; data: any }[];
    onUserCreated: (user: any) => void;
    onVehicleSelected: (vehicle: any) => void;
}


export const UserSelectionStep = ({ 
    isCreatingUser, 
    setIsCreatingUser, 
    selectedUserId, 
    setSelectedUserId, 
    users, 
    onUserCreated,
    onVehicleSelected
}: Props) => {
    const [vehicles, setVehicles] = useState<any[]>([]);

    useEffect(() => {
        if (selectedUserId) {
            getUserVehicles(selectedUserId).then(res => {
                if (res.success && res.data) {
                    setVehicles(res.data);
                } else {
                    setVehicles([]);
                }
            });
        } else {
            setVehicles([]);
        }
    }, [selectedUserId]);

    return (
        <div className="flex flex-col gap-6 p-4">
            {!isCreatingUser ? (
                <>
                    <label className="text-sm font-medium text-gray-700">
                        Buscar Cliente Existente
                    </label>

                    <ITSelect
                        label="Seleccionar Cliente"
                        name="userId"
                        value={selectedUserId ? String(selectedUserId) : ""}
                        onChange={(e) => setSelectedUserId(Number(e.target.value))}
                        options={users}
                        placeholder="Buscar por nombre..."
                    />
                    
                    {vehicles.length > 0 && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <h4 className="text-sm font-bold text-blue-800 mb-3">Vehículos Anteriores</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {vehicles.map((v) => (
                                    <button
                                        key={v.id}
                                        onClick={() => onVehicleSelected(v)}
                                        className="text-left bg-white p-3 rounded shadow-sm hover:shadow-md transition-all border border-blue-100 flex flex-col group"
                                    >
                                        <span className="font-bold text-gray-800 group-hover:text-blue-600">{v.brand} {v.model}</span>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-xs text-gray-500">{v.plates}</span>
                                            <span className="text-xs text-gray-400">{v.color}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-blue-600 mt-2">Selecciona un vehículo para autocompletar los datos.</p>
                        </div>
                    )}

                    <div className="flex items-center gap-4 my-2">
                        <span className="text-gray-400 text-sm">O</span>
                        <div className="h-px bg-gray-200 flex-1"></div>
                    </div>

                    <ITButton
                        color="secondary"
                        onClick={() => setIsCreatingUser(true)}
                    >
                        + Registrar Nuevo Cliente
                    </ITButton>
                </>
            ) : (
                <NewUserForm
                    onCancel={() => setIsCreatingUser(false)}
                    onSuccess={onUserCreated}
                />
            )}
        </div>
    );
};
