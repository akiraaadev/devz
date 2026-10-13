import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  title,
  itemName,
  description,
  confirmText = 'Sim, Excluir',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900">
          {title}
        </h3>

        {itemName ? (
          <p className="text-xs text-slate-600 mt-2 mb-1">
            Tem certeza de que deseja excluir <strong className="text-slate-900 font-bold">"{itemName}"</strong>?
          </p>
        ) : (
          <p className="text-xs text-slate-600 mt-2 mb-1">
            Tem certeza de que deseja confirmar esta operação?
          </p>
        )}

        {description && (
          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
            {description}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
