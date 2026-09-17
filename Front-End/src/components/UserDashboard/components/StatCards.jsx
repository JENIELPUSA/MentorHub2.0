import React from 'react';
import {
    Users,
    Copy,
    QrCode,
    BookOpen,
    Server,
    Clock,
    Sparkles,
    UserPlus,
    Hash
} from 'lucide-react';

const StatCards = ({
    userCount,
    referralCode,
    sectionName,
    subjectTitle,
    status,
    updatedAt,
    onCopyReferralCode,
    onViewQR
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* REFERRED USERS */}
            <div className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-sm hover:shadow-md hover:shadow-blue-100 transition-all duration-300">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                            <UserPlus className="w-3.5 h-3.5" />
                            Referred Users
                        </p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                            {userCount}
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center border-2 border-yellow-400">
                        <Users className="w-6 h-6" />
                    </div>
                </div>
                <p className="mt-3 text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Active students registered via referral</span>
                </p>
            </div>

            {/* REFERRAL CODE */}
            <div className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-sm hover:shadow-md hover:shadow-blue-100 transition-all duration-300">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                            <Hash className="w-3.5 h-3.5" />
                            Referral Code
                        </p>
                        <h3 className="text-xl sm:text-2xl font-mono font-bold text-blue-600 mt-1">
                            {referralCode}
                        </h3>
                    </div>
                    <button
                        onClick={onCopyReferralCode}
                        className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition flex items-center justify-center border-2 border-yellow-400"
                    >
                        <Copy className="w-5 h-5" />
                    </button>
                </div>
                <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
                    <span>Click icon to copy code</span>
                    <button
                        onClick={onViewQR}
                        className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                        <QrCode className="w-3.5 h-3.5" />
                        View QR
                    </button>
                </div>
            </div>

            {/* CLASS SECTION */}
            <div className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-sm hover:shadow-md hover:shadow-blue-100 transition-all duration-300">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            Class Section
                        </p>
                        <h3 className="text-xl font-bold text-slate-900 mt-1">
                            {sectionName}
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center border-2 border-yellow-400">
                        <BookOpen className="w-6 h-6" />
                    </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                    Subject Code Title:{' '}
                    <strong className="text-blue-700">
                        {subjectTitle}
                    </strong>
                </div>
            </div>

            {/* RESPONSE STATUS */}
            <div className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-sm hover:shadow-md hover:shadow-blue-100 transition-all duration-300">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                            <Server className="w-3.5 h-3.5" />
                            Response Status
                        </p>
                        <h3 className="text-xl font-bold text-blue-600 mt-1 capitalize">
                            {status}
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center border-2 border-yellow-400">
                        <Server className="w-6 h-6" />
                    </div>
                </div>
                <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Updated: {updatedAt}</span>
                </div>
            </div>
        </div>
    );
};

export default StatCards;