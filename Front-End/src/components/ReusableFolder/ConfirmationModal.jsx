import React from 'react';
import { AlertTriangle, Trash2, X, Loader2, CheckCircle2 } from 'lucide-react';

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    isLoading = false,
    variant = 'danger',
    icon = null,
    confirmIcon = null,
}) {
    if (!isOpen) return null;

    // ==================== VARIANTS ====================
    const VARIANTS = {
        // Default — para sa delete (red para malinaw na destructive)
        danger: {
            iconBg: 'bg-rose-100',
            iconColor: 'text-rose-600',
            buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white',
            border: 'border-rose-200',
            accent: 'border-rose-200',
            defaultIcon: <Trash2 className="w-10 h-10 text-rose-600" />,
            defaultConfirmIcon: <Trash2 className="w-4 h-4" />,
        },
        // Warning — yellow theme
        warning: {
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-700',
            buttonBg: 'bg-yellow-400 hover:bg-yellow-300 text-blue-950',
            border: 'border-yellow-200',
            accent: 'border-yellow-400',
            defaultIcon: <AlertTriangle className="w-10 h-10 text-yellow-700" />,
            defaultConfirmIcon: <AlertTriangle className="w-4 h-4" />,
        },
        // Info / Confirm — blue & yellow theme (matches app palette)
        info: {
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-900',
            buttonBg: 'bg-blue-900 hover:bg-blue-950 text-white',
            border: 'border-blue-200',
            accent: 'border-yellow-400',
            defaultIcon: <CheckCircle2 className="w-10 h-10 text-blue-900" />,
            defaultConfirmIcon: <CheckCircle2 className="w-4 h-4" />,
        },
        // Success — yellow accent, blue button
        success: {
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-700',
            buttonBg: 'bg-blue-900 hover:bg-blue-950 text-white',
            border: 'border-yellow-200',
            accent: 'border-yellow-400',
            defaultIcon: <CheckCircle2 className="w-10 h-10 text-yellow-600" />,
            defaultConfirmIcon: <CheckCircle2 className="w-4 h-4" />,
        },
    };

    const v = VARIANTS[variant] || VARIANTS.danger;

    // ==================== HANDLERS ====================
    const handleConfirm = async () => {
        if (isLoading) return;
        try {
            await onConfirm?.();
        } catch (err) {
            console.error('ConfirmationModal onConfirm error:', err);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !isLoading) {
            onClose?.();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !isLoading) onClose?.();
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm animate-fadeIn"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-modal-title"
        >
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-blue-200 relative animate-scaleIn overflow-hidden">
                {/* ✅ Top accent bar (blue & yellow theme) */}
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-900 via-blue-700 to-yellow-400" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-4 right-4 p-2 text-blue-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition disabled:opacity-50"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6">
                    {/* Icon + Text */}
                    <div className="flex flex-col items-center text-center gap-4 py-2">
                        <div className={`p-4 ${v.iconBg} rounded-full shadow-sm ring-4 ring-blue-50`}>
                            {icon || v.defaultIcon}
                        </div>

                        <div className="px-2">
                            <h3
                                id="confirmation-modal-title"
                                className="text-lg font-bold text-blue-950"
                            >
                                {title}
                            </h3>
                            <div className={`text-sm text-blue-700 mt-2 leading-relaxed ${v.border}`}>
                                {message}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center gap-2 pt-4 mt-4 border-t border-blue-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-5 py-2.5 font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={`flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${v.buttonBg}`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {confirmIcon || v.defaultConfirmIcon}
                                    {confirmText}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}