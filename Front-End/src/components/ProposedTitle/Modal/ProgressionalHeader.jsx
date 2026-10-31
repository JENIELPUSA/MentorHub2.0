import { Award, CheckCircle2 } from 'lucide-react';

const ProgressionHeader = ({
  fullManuscriptProceeded,
  proceededCount,
  totalCount,
  progressPercent,
  remaining,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-yellow-400 rounded-xl p-4 text-white shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {fullManuscriptProceeded ? (
            <CheckCircle2 className="w-4 h-4 text-yellow-200" />
          ) : (
            <Award className="w-4 h-4 text-yellow-200" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-white drop-shadow">
            Chapter Progression
          </span>
        </div>
        <span className="text-lg font-extrabold text-yellow-200 drop-shadow">
          {proceededCount}/{totalCount}
        </span>
      </div>

      <div className="h-2.5 bg-blue-950/40 rounded-full overflow-hidden shadow-inner border border-blue-300/30">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.8)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className="text-[10px] text-yellow-100 mt-1.5 font-medium drop-shadow">
        {fullManuscriptProceeded
          ? ' All chapters proceeded — Defense button available!'
          : `${remaining} chapter${remaining !== 1 ? 's' : ''} remaining before Defense button unlocks`}
      </p>
    </div>
  );
};

export default ProgressionHeader;