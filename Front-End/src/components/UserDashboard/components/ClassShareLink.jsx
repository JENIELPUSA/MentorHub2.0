import React from 'react';
import {
    Share2,
    Copy
} from 'lucide-react';

const ClassShareLink = ({
    referralUrl,
    referralCode,
    onCopy
}) => {
    const fullUrl = `${referralUrl}/${referralCode}`;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/80 p-5 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Class Share Link</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Students can automatically join this group section using this generated referral link.
            </p>
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                    type="text"
                    readOnly
                    value={fullUrl}
                    className="w-full bg-transparent text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none"
                />
                <button
                    onClick={() => onCopy(fullUrl, 'Share link copied!')}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shrink-0"
                >
                    <Copy className="w-3.5 h-3.5 inline mr-1" /> Copy
                </button>
            </div>
        </div>
    );
};

export default ClassShareLink;