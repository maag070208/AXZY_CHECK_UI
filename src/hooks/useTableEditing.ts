import { useState } from 'react';

export interface EditingState<T> {
  originalData: T | null;
  editedData: T | null;
  changes: Partial<T>;
  index: number | null;
}

export interface UseTableEditingReturn<T> {
  editingRow: number | null;
  editedData: T | null;
  originalData: T | null;
  changes: Partial<T>;
  handleEdit: (row: T, index: number) => void;
  handleSave: (updatedRow: T, index: number) => void;
  handleCancel: () => void;
  resetEditing: () => void;
  getChanges: () => Partial<T>;
}

export function useTableEditing<T>(): UseTableEditingReturn<T> {
  const [editingState, setEditingState] = useState<EditingState<T>>({
    originalData: null,
    editedData: null,
    changes: {},
    index: null
  });

  const handleEdit = (row: T, index: number) => {
    setEditingState({
      originalData: { ...row },
      editedData: { ...row },
      changes: {},
      index
    });
  };

  const handleSave = (updatedRow: T) => {
    const changes = calculateChanges(editingState.originalData, updatedRow);
    setEditingState(prev => ({
      ...prev,
      editedData: updatedRow,
      changes,
      index: null
    }));
  };

  const handleCancel = () => {
    setEditingState({
      originalData: null,
      editedData: null,
      changes: {},
      index: null
    });
  };

  const resetEditing = () => {
    setEditingState({
      originalData: null,
      editedData: null,
      changes: {},
      index: null
    });
  };

  const getChanges = (): Partial<T> => {
    return editingState.changes;
  };

  // Función para calcular los cambios entre el original y el editado
  const calculateChanges = (original: T | null, edited: any): Partial<T> => {
    if (!original) return {};
    
    const changes: Partial<T> = {};
    
    Object.keys(edited).forEach(key => {
      const editedValue = edited[key as keyof T];
      const originalValue = original[key as keyof T];
      
      if (JSON.stringify(editedValue) !== JSON.stringify(originalValue)) {
        changes[key as keyof T] = editedValue;
      }
    });
    
    return changes;
  };

  return {
    editingRow: editingState.index,
    editedData: editingState.editedData,
    originalData: editingState.originalData,
    changes: editingState.changes,
    handleEdit,
    handleSave,
    handleCancel,
    resetEditing,
    getChanges
  };
}