import React, { useState } from 'react';
import {
    CheckCircle2,
    Shield,
    User,
    UserCog,
    UserPlus,
    Lightbulb,
    Eye,
    X
} from 'lucide-react';

import AdviserCoAdviser from './AdviserCoAdviser';
import { AuthContext } from '../../../contexts/AuthContext';

const UserDashboardBanner = ({
    displayData,
    adviserDisplay,
    coadviserDisplay,
    onAssignAdviser,
    onAssignCoAdviser,
    onProposeTitle,
    advisers,
    advisersLoading
}) => {
    // State para sa View Mentor Modal
    const [showMentorModal, setShowMentorModal] = useState(false);

    return (
        <>
            {/* VIEW MENTOR MODAL */}
            {showMentorModal && (
                <div
                    className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fadeIn p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowMentorModal(false);
                        }
                    }}
                >
                    <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowMentorModal(false)}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-blue-100 transition shadow-lg text-slate-600 hover:text-blue-700 cursor-pointer"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* AdviserCoAdviser Component */}
                        <AdviserCoAdviser
                            advisers={advisers}
                            advisersLoading={advisersLoading}
                            isOpen={showMentorModal}
                            onClose={() => setShowMentorModal(false)}
                        />
                    </div>
                </div>
            )}

            {/* BANNER - Blue and Yellow Theme */}
            <div className="relative overflow-hidden rounded-2xl bg-blue-600 text-white p-6 sm:p-8 shadow-xl shadow-blue-900/20">
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -left-10 -top-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-yellow-400 text-blue-900 border border-yellow-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-900" /> Active Group
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-md border border-white/20">
                                Section: <strong className="text-white">{displayData.group.section?.name || 'N/A'}</strong>
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-md border border-white/20">
                                Subject: <strong className="text-white">{displayData.group.section?.subject?.title || 'N/A'}</strong>
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{displayData.group.name}</h2>

                        {/* Adviser Display */}
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                            {adviserDisplay.exists ? (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/20">
                                        <Shield className="w-4 h-4 text-yellow-300" />
                                        <span className="text-sm font-medium text-white/80">Adviser:</span>
                                        <span className="text-sm font-semibold text-white">{adviserDisplay.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${adviserDisplay.status === 'approved'
                                                ? 'bg-emerald-500/30 text-emerald-200'
                                                : adviserDisplay.status === 'pending'
                                                    ? 'bg-yellow-500/30 text-yellow-200'
                                                    : 'bg-red-500/30 text-red-200'
                                            }`}>
                                            {adviserDisplay.status}
                                        </span>
                                        <span className="text-xs text-white/60">({adviserDisplay.role})</span>
                                    </div>
                                    {adviserDisplay.status === 'pending' && (
                                        <p className="text-[10px] text-yellow-300 ml-2">⚠️ Waiting for approval from approver</p>
                                    )}
                                    {adviserDisplay.status === 'approved' && (
                                        <p className="text-[10px] text-emerald-300 ml-2">✅ Adviser is approved and can manage the group</p>
                                    )}
                                    {adviserDisplay.status === 'rejected' && (
                                        <p className="text-[10px] text-red-300 ml-2">❌ Request has been rejected. Please contact approver.</p>
                                    )}
                                </div>
                            ) : (
                                <span className="text-sm text-white/60">No adviser assigned yet</span>
                            )}

                            {coadviserDisplay.exists ? (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/20">
                                        <User className="w-4 h-4 text-yellow-300" />
                                        <span className="text-sm font-medium text-white/80">Co-Adviser:</span>
                                        <span className="text-sm font-semibold text-white">{coadviserDisplay.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${coadviserDisplay.status === 'approved'
                                                ? 'bg-emerald-500/30 text-emerald-200'
                                                : coadviserDisplay.status === 'pending'
                                                    ? 'bg-yellow-500/30 text-yellow-200'
                                                    : 'bg-red-500/30 text-red-200'
                                            }`}>
                                            {coadviserDisplay.status}
                                        </span>
                                        <span className="text-xs text-white/60">({coadviserDisplay.role})</span>
                                    </div>
                                    {coadviserDisplay.status === 'pending' && (
                                        <p className="text-[10px] text-yellow-300 ml-2">⚠️ Waiting for approval from approver</p>
                                    )}
                                    {coadviserDisplay.status === 'approved' && (
                                        <p className="text-[10px] text-emerald-300 ml-2">✅ Co-adviser is approved and can assist the group</p>
                                    )}
                                    {coadviserDisplay.status === 'rejected' && (
                                        <p className="text-[10px] text-red-300 ml-2">❌ Request has been rejected. Please contact approver.</p>
                                    )}
                                </div>
                            ) : (
                                <span className="text-sm text-white/60">No co-adviser assigned yet</span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* VIEW MENTOR BUTTON - Yellow */}
                        <button
                            onClick={() => setShowMentorModal(true)}
                            className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition flex items-center gap-2"
                            title="View full mentor details"
                        >
                            <Eye className="w-4 h-4" />
                            View Mentor
                        </button>

                        {/* Assign Adviser - Yellow */}
                        <button
                            onClick={onAssignAdviser}
                            className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition flex items-center gap-2"
                        >
                            <UserCog className="w-4 h-4" />
                            {adviserDisplay.exists ? 'Change Adviser' : 'Assign Adviser'}
                        </button>
                        {/* Propose Title - Yellow */}
                        <a
                            href="#proposed-title-section"
                            className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition flex items-center gap-2"
                        >
                            <Lightbulb className="w-4 h-4" />
                            Propose New Title
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserDashboardBanner;