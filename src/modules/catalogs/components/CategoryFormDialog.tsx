import { ITButton, ITDialog, ITInput, ITSelect } from '@axzydev/axzy_ui_system';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '@app/core/store/toast/toast.slice';
import { FaPalette, FaTag } from 'react-icons/fa';
import { IncidentCategory, CatalogType } from '../types/catalogs.types';
import { COLOR_PRESETS, ICON_PRESETS } from '../constants/catalogs.constants';
import { createCategory, updateCategory } from '../services/CatalogManagementService';
import { useCatalogInvalidation } from '../hooks/useCatalogInvalidation';

interface CategoryFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    category: IncidentCategory | null;
    type: CatalogType;
}

const CategoryFormDialog = ({ isOpen, onClose, onSuccess, category, type }: CategoryFormDialogProps) => {
    const dispatch = useDispatch();
    const { invalidate } = useCatalogInvalidation();

    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [color, setColor] = useState<string>('#3B82F6');
    const [icon, setIcon] = useState<string>('tag');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (category) {
                setName(category.name);
                setValue(category.value);
                setColor(category.color ?? '#3B82F6');
                setIcon(category.icon ?? 'tag');
            } else {
                setName('');
                setValue('');
                setColor('#3B82F6');
                setIcon('tag');
            }
        }
    }, [isOpen, category]);

    const isEdit = Boolean(category);

    const handleNameBlur = () => {
        const formatted = name.toUpperCase().replace(/\s+/g, '_');
        if (formatted !== name) setName(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !value.trim()) {
            dispatch(showToast({ message: 'Nombre y etiqueta son obligatorios', type: 'warning' }));
            return;
        }
        setSubmitting(true);
        const payload = {
            name: name.trim().toUpperCase().replace(/\s+/g, '_'),
            value: value.trim(),
            color,
            icon,
            type,
        };
        const result = isEdit && category
            ? await updateCategory(category.id, payload)
            : await createCategory(payload);
        setSubmitting(false);

        if (result.success) {
            dispatch(showToast({
                message: isEdit ? 'Categoría actualizada' : 'Categoría creada',
                type: 'success',
            }));
            invalidate();
            onSuccess();
        } else {
            const msg = result.messages?.[0] ?? 'Error al guardar la categoría';
            dispatch(showToast({ message: msg, type: 'error' }));
        }
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => setColor(e.target.value);
    const handleIconChange = (e: React.ChangeEvent<HTMLSelectElement>) => setIcon(e.target.value);
    const noop = () => undefined;

    return (
        <ITDialog
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Editar categoría' : 'Nueva categoría'}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-2">
                <ITInput
                    name="name"
                    label="Nombre interno (sin espacios, mayúsculas)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleNameBlur}
                    placeholder="Ej. SEGURIDAD"
                    required
                />
                <ITInput
                    name="value"
                    label="Etiqueta visible"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={noop}
                    placeholder="Ej. Seguridad"
                    required
                />
                <div className="grid grid-cols-2 gap-3">
                    <ITSelect
                        name="color"
                        label="Color"
                        options={COLOR_PRESETS.map(c => ({ label: c.label, value: c.value }))}
                        valueField="value"
                        labelField="label"
                        value={color}
                        onChange={handleColorChange}
                        onBlur={noop}
                    />
                    <ITSelect
                        name="icon"
                        label="Icono"
                        options={ICON_PRESETS.map(i => ({ label: i.label, value: i.value }))}
                        valueField="value"
                        labelField="label"
                        value={icon}
                        onChange={handleIconChange}
                        onBlur={noop}
                    />
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                    />
                    <FaTag className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">
                        {value || '(Etiqueta)'} <span className="text-slate-400">·</span> <span className="text-xs text-slate-500">{name || '(Nombre)'}</span>
                    </span>
                    <FaPalette className="ml-auto text-slate-400" />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <ITButton variant="outline" type="button" onClick={onClose} disabled={submitting}>
                        Cancelar
                    </ITButton>
                    <ITButton variant="primary" type="submit" disabled={submitting}>
                        {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
                    </ITButton>
                </div>
            </form>
        </ITDialog>
    );
};

export default CategoryFormDialog;
