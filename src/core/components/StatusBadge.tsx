import { ITBadget } from "@axzydev/axzy_ui_system";

interface Props {
    status: string;
    label?: string; // Optional override
}

export const StatusBadge = ({ status, label }: Props) => {
    const s = status ? status.toUpperCase() : "UNKNOWN";
    let color: "success" | "warning" | "danger" | "primary" | "secondary" | "purple" = "secondary";
    let displayLabel = label || status;

    // Standard Mapping
    switch (s) {
        // SUCCESS (Green)
        case "ACTIVE":
        case "ACTIVO":
        case "INGRESO":
        case "DELIVERED":
        case "ENTREGADO":
        case "COMPLETED":
        case "COMPLETADO":
            color = "success";
            break;

        // WARNING (Yellow)
        case "PENDING":
        case "PENDIENTE":
        case "LLAVES":
        case "REQUESTED":
        case "SOLICITADO":
            color = "warning";
            break;

        // DANGER (Red)
        case "CANCELLED":
        case "CANCELADO":
            color = "danger";
            break;
        
        // PRIMARY (Slate/Blueish - using Primary or Purple for distinction)
        case "MOVED":
        case "MOVIDO":
        case "MOVIMIENTO":
        case "IN_PROGRESS":
        case "EN PROGRESO":
            color = "purple"; // Using purple/primary for "Active but moved/working"
            break;

        // SECONDARY (Gray) - History/Done
        case "EXITED":
        case "SALIDA":
        case "LLAVES_FIN":
            color = "secondary";
            break;
            
        default:
            color = "secondary";
            break;
    }

    // Label Translations (Common) if no label provided
    if (!label) {
        const map: any = {
            'ACTIVE': 'ACTIVO',
            'MOVED': 'MOVIDO',
            'EXITED': 'SALIDA',
            'CANCELLED': 'CANCELADO',
            'PENDING': 'PENDIENTE',
            'IN_PROGRESS': 'EN PROGRESO',
            'COMPLETED': 'COMPLETADO',
            'DELIVERED': 'ENTREGADO',
            'REQUESTED': 'SOLICITADO',
            'INGRESO': 'INGRESO',
            'MOVIMIENTO': 'MOVIMIENTO',
            'LLAVES': 'LLAVES',
            'LLAVES_FIN': 'LLAVES (FIN)',
            'SALIDA': 'SALIDA'
        };
        displayLabel = map[s] || s;
    }

    return (
        <ITBadget color={color} variant="outlined" size="small">
            {displayLabel}
        </ITBadget>
    );
};
