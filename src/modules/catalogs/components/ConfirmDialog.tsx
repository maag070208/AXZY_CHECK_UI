import { ITDialog, ITButton } from '@axzydev/axzy_ui_system';

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'success' | 'primary';
}

const VARIANT_CLASSES: Record<NonNullable<ConfirmDialogProps['variant']>, string> = {
    danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700',
    success: 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700',
    primary: 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700',
};

const ConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'primary',
}: ConfirmDialogProps) => {
    if (!open) return null;

    return (
        <ITDialog isOpen={open} onClose={onClose} title={title}>
            <div className="p-2 flex flex-col gap-5">
                <p className="text-slate-700">{message}</p>
                <div className="flex justify-end gap-2">
                    <ITButton variant="outlined" onClick={onClose}>
                        {cancelLabel}
                    </ITButton>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-xl font-bold shadow transition-all ${VARIANT_CLASSES[variant]}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </ITDialog>
    );
};

export default ConfirmDialog;
