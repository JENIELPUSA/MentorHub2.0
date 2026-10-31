import { CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const ConfirmModal = ({ isOpen, config, onConfirm, onCancel, isLoading }) => {
  // Escape key handler
  useEffect(() => {
    if (!isOpen || isLoading) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen || !config) return null;

  const colorClasses = {
    blue:    { bg: 'bg-blue-50',   icon: 'text-blue-700',   button: 'bg-blue-900 hover:bg-blue-950',                          border: 'border-blue-200' },
    purple:  { bg: 'bg-purple-50', icon: 'text-purple-600', button: 'bg-purple-600 hover:bg-purple-700',                      border: 'border-purple-200' },
    rose:    { bg: 'bg-rose-50',   icon: 'text-rose-600',   button: 'bg-rose-600 hover:bg-rose-700',                          border: 'border-rose-200' },
    cyan:    { bg: 'bg-cyan-50',   icon: 'text-cyan-600',   button: 'bg-cyan-600 hover:bg-cyan-700',                          border: 'border-cyan-200' },
    amber:   { bg: 'bg-yellow-50', icon: 'text-yellow-700', button: 'bg-yellow-400 hover:bg-yellow-300 text-blue-950',        border: 'border-yellow-300' },
  };

  const c = colorClasses[config.color] || colorClasses.blue;
  const IconComponent = config.icon || CheckCircle2;
  const itemLabel = config.itemLabel || 'Thesis / Capstone Title';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="absolute inset-0 bg-blue-950/60 backdrop-blur-sm"
        onClick={isLoading ? undefined : onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-blue-200">
        <div className={`${c.bg} px-6 py-5 border-b ${c.border}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${c.icon}`}>
              <IconComponent className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 id="confirm-modal-title" className="text-lg font-bold text-blue-950">
              {config.title}
            </h3>
          </div>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {config.message}
          </p>

          {config.itemTitle && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-[10px] uppercase font-bold text-blue-500 mb-1">{itemLabel}</p>
              <p className="text-sm font-medium text-blue-950 line-clamp-2">{config.itemTitle}</p>
            </div>
          )}

          {config.warning && (
            <div className={`text-xs px-3 py-2 rounded-lg ${c.bg} ${c.icon} border ${c.border} font-medium`}>
              {config.warning}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-blue-50 border-t border-blue-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-blue-900 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm disabled:opacity-50 transition inline-flex items-center gap-2 ${c.button}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Processing...
              </>
            ) : (
              config.confirmLabel || 'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;