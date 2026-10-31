import {
  CheckCircle2,
  XCircle,
  Info,
  Unlock,
  Lock,
} from 'lucide-react';

const getBadgeConfig = (status) => {
  switch (status) {
    case 'proceeded':
      return {
        style: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        label: 'Proceeded',
        icon: '✓',
      };
    case 'completed':
      return {
        style: 'bg-blue-100 text-blue-800 border-blue-300',
        label: 'Ready to Proceed',
        icon: '⚡',
      };
    case 'submitted':
      return {
        style: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        label: 'Pending Review',
        icon: '⏳',
      };
    case 'unlocked':
      return {
        style: 'bg-cyan-100 text-cyan-700 border-cyan-200',
        label: 'Unlocked',
        icon: '🔓',
      };
    default:
      return {
        style: 'bg-blue-50 text-blue-400 border-blue-200',
        label: 'Locked',
        icon: '🔒',
      };
  }
};

const ChapterListItem = ({
  ch,
  isExpanded,
  onToggle,
  onProceedClick,
  onRejectClick,
  isProcessing,
  formatDate,
}) => {
  const badge = getBadgeConfig(ch.status);
  const canProceed = ch.status === 'completed' && !ch.isProceeded;
  const canReject = ch.status === 'completed' && !ch.isProceeded;
  const isFinalChapter = ch.chapter === 'Full Manuscript';

  return (
    <div
      className={`rounded-lg border transition-all ${
        ch.status === 'proceeded'
          ? 'bg-yellow-50 border-yellow-300'
          : ch.status === 'completed'
          ? 'bg-blue-50 border-blue-300'
          : isFinalChapter
          ? 'bg-yellow-50 border-yellow-300'
          : 'bg-white border-blue-100'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-3 py-2 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-base">{badge.icon}</span>
          <div className="min-w-0">
            <div className="text-xs font-bold text-blue-950 truncate flex items-center gap-1">
              {ch.chapter}
              {isFinalChapter && (
                <span className="text-[9px] font-bold bg-yellow-400 text-blue-950 px-1.5 py-0.5 rounded">
                  FINAL GATE
                </span>
              )}
            </div>
            <div className="text-[10px] text-blue-500">
              {ch.submissions > 0
                ? `${ch.submissions} submission${ch.submissions > 1 ? 's' : ''}`
                : 'No submissions yet'}
            </div>
          </div>
        </div>
        <span
          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badge.style} shrink-0`}
        >
          {badge.label}
        </span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-blue-100 space-y-2">
          {ch.isProceeded && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-md p-2 text-[10px]">
              <p className="font-bold text-yellow-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Proceeded by Subject Instructor
              </p>
              {ch.progressionApprovedAt?.[ch.chapter] && (
                <p className="text-yellow-700 mt-0.5">
                  {formatDate(ch.progressionApprovedAt[ch.chapter])}
                </p>
              )}
            </div>
          )}

          {canProceed && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onProceedClick(ch.chapter)}
                disabled={isProcessing}
                className={`flex-1 px-2 py-1.5 text-white text-[10px] font-bold rounded-md disabled:opacity-50 transition flex items-center justify-center gap-1 ${
                  isFinalChapter
                    ? 'bg-yellow-400 hover:bg-yellow-300 text-blue-950'
                    : 'bg-blue-900 hover:bg-blue-950'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                Proceed {ch.chapter}
                {isFinalChapter && ' → Unlock Defense'}
              </button>
              {canReject && (
                <button
                  onClick={() => onRejectClick(ch.chapter)}
                  disabled={isProcessing}
                  className="px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-md disabled:opacity-50 transition flex items-center justify-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  Reject
                </button>
              )}
            </div>
          )}

          {ch.status === 'completed' && !ch.isProceeded && (
            <p className="text-[10px] text-blue-700 italic flex items-center gap-1">
              <Info className="w-3 h-3" />
              Adviser marked this complete. Ready for you to proceed.
            </p>
          )}

          {ch.status === 'unlocked' && (
            <p className="text-[10px] text-cyan-700 italic flex items-center gap-1">
              <Unlock className="w-3 h-3" />
              Student can now upload this chapter.
            </p>
          )}

          {ch.status === 'locked' && (
            <p className="text-[10px] text-blue-500 italic flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Previous chapter must be proceeded first.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ChapterListItem;