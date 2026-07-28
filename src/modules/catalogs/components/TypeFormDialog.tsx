import { ITButton, ITDialog, ITInput, ITSelect } from '@axzydev/axzy_ui_system';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '@app/core/store/toast/toast.slice';
import { IncidentCategory, IncidentType } from '../types/catalogs.types';
import { createType, updateType } from '../services/CatalogManagementService';
import { useCatalogInvalidation } from '../hooks/useCatalogInvalidation';

interface TypeFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    type: IncidentType | null;
    categories: IncidentCategory[];
    defaultCategoryId?: number;
}

const TypeFormDialog = ({ isOpen, onClose, onSuccess, type, categories, defaultCategoryId }: TypeFormDialogProps) => {
    const dispatch = useDispatch();
    const { invalidate } = useCatalogInvalidation();

    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (type) {
                setName(type.name);
                setValue(type.value);
                setCategoryId(String(type.categoryId));
            } else {
                setName('');
                setValue('');
                setCategoryId(defaultCategoryId ? String(defaultCategoryId) : '');
            }
        }
    }, [isOpen, type, defaultCategoryId]);

    const isEdit = Boolean(type);

    const handleNameBlur = () => {
        const formatted = name.toUpperCase().replace(/\s+/g, '_');
        if (formatted !== name) setName(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !value.trim() || !categoryId) {
            dispatch(showToast({ message: 'Todos los campos son obligatorios', type: 'warning' }));
            return;
        }
        setSubmitting(true);
        const payload = {
            name: name.trim().toUpperCase().replace(/\s+/g, '_'),
            value: value.trim(),
            categoryId: Number(categoryId),
        };
        const result = isEdit && type
            ? await updateType(type.id, payload)
            : await createType(payload);
        setSubmitting(false);

        if (result.success) {
            dispatch(showToast({
                message: isEdit ? 'Tipo actualizado' : 'Tipo creado',
                type: 'success',
            }));
            invalidate();
            onSuccess();
        } else {
            const msg = result.messages?.[0] ?? 'Error al guardar el tipo';
            dispatch(showToast({ message: msg, type: 'error' }));
        }
    };

    const categoryOptions = categories.map(c => ({
        label: c.value,
        value: String(c.id),
    }));

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => setCategoryId(e.target.value);
    const noop = () => undefined;

    return (
        <ITDialog
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Editar tipo' : 'Nuevo tipo'}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-2">
                <ITSelect
                    name="categoryId"
                    label="Categoría padre"
                    options={categoryOptions}
                    valueField="value"
                    labelField="label"
                    value={categoryId}
                    onChange={handleCategoryChange}
                    onBlur={noop}
                />
                <ITInput
                    name="name"
                    label="Nombre interno (sin espacios, mayúsculas)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleNameBlur}
                    placeholder="Ej. ROBO"
                    required
                />
                <ITInput
                    name="value"
                    label="Etiqueta visible"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={noop}
                    placeholder="Ej. Robo / Hurto"
                    required
                />
                <div className="flex justify-end gap-2 pt-2">
                    <ITButton variant="outline" type="button" onClick={onClose} disabled={submitting}>
                        Cancelar
                    </ITButton>
                    <ITButton variant="primary" type="submit" disabled={submitting}>
                        {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear tipo'}
                    </ITButton>
                </div>
            </form>
        </ITDialog>
    );
};

export default TypeFormDialog;
