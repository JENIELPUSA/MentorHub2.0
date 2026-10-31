import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const ConfirmActionModal = ({
  confirmChapter,
  actionType,
  feedbackText,
  setFeedbackText,
  onConfirm,
  onCancel,
  isProcessing,
}) => {
  if (!confirmChapter || !actionType) return null;

  const isProceed = actionType === 'proceed';
  const isFinalChapter = confirmChapter === 'Full Manuscript';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-blue-950/60 backdrop-blur-sm"
        onClick={isProcessing ? undefined : onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isProceed
                ? isFinalChapter
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-blue-100 text-blue-700'
                : 'bg-rose-100 text-rose-600'
            }`}
          >
            {isProceed ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <XCircle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-950">
              {isProceed ? 'Proceed Chapter?' : 'Reject Chapter?'}
            </h3>
            <p className="text-xs text-blue-500">{confirmChapter}</p>
          </div>
        </div>

        {isFinalChapter && isProceed && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-3">
            <p className="text-[11px] font-bold text-yellow-800">🎓 FINAL GATE</p>
            <p className="text-[10px] text-yellow-700 mt-0.5">
              Proceeding Full Manuscript will UNLOCK the Defense buttons for this thesis!
            </p>
          </div>
        )}

        <p className="text-sm text-slate-600 mb-3">
          {isProceed
            ? `This will unlock the next chapter for the student. Are you sure ${confirmChapter} is complete and ready?`
            : `This will send ${confirmChapter} back for revision. Student must reupload.`}
        </p>

        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          rows={3}
          placeholder={
            isProceed
              ? 'Optional: Feedback for the student...'
              : 'Required: Reason for rejection...'
          }
          className="w-full px-3 py-2 text-xs rounded-lg bg-blue-50 border border-blue-200 focus:ring-2 focus:ring-blue-900 outline-none resize-none mb-3 text-slate-800 placeholder:text-blue-400"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-blue-900 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing || (!isProceed && !feedbackText.trim())}
            className={`px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2 ${
              isProceed
                ? isFinalChapter
                  ? 'bg-yellow-400 hover:bg-yellow-300 text-blue-950'
                  : 'bg-blue-900 hover:bg-blue-950 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                {isProceed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {isProceed
                  ? isFinalChapter
                    ? 'Proceed & Unlock Defense'
                    : 'Proceed'
                  : 'Reject'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;