'use client'

import React from 'react'
import { Trash2, Loader2 } from 'lucide-react'

interface ConfirmImageDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  isDeleting?: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}

export function ConfirmImageDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  title = '¿Eliminar foto?',
  description = '¿Estás seguro de que deseas eliminar esta foto? Esta acción no se puede deshacer.',
  confirmText = 'Eliminar foto',
  cancelText = 'Cancelar'
}: ConfirmImageDeleteModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
      onClick={() => {
        if (!isDeleting) onClose()
      }}
    >
      <div 
        className="bg-white dark:bg-[#121215] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/40 rounded-xl flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-950 dark:text-white text-base">
              {title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmImageDeleteModal
