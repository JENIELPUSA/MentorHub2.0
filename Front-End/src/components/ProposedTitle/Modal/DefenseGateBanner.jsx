import { Shield, Lock } from 'lucide-react';

const DefenseGateBanner = ({ fullManuscriptProceeded, totalCount }) => {
  return (
    <div
      className={`rounded-lg p-3 border-2 ${
        fullManuscriptProceeded
          ? 'bg-yellow-50 border-yellow-400'
          : 'bg-blue-50 border-blue-300'
      }`}
    >
      <div className="flex items-start gap-2">
        {fullManuscriptProceeded ? (
          <>
            <Shield className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-yellow-800">
                {' '}
                Defense Button UNLOCKED
              </p>
              <p className="text-[10px] text-yellow-700 mt-0.5">
                All chapters proceeded. Schedule Defense and Mark Ready buttons are now available.
              </p>
            </div>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-blue-900">
                🔒 Defense Button LOCKED
              </p>
              <p className="text-[10px] text-blue-700 mt-0.5">
                Complete and Proceed all {totalCount} chapters (up to Full Manuscript) to unlock defense scheduling.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DefenseGateBanner;