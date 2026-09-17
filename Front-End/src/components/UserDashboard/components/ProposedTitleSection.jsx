import React, { useState } from 'react';
import {
    Lightbulb,
    CheckCircle2,
    PenSquare,
    Paperclip,
    Loader2,
    ListCheck,
    Eye,
    RotateCcw,
    Check,
    X,
    MessageSquare,
    Download,
    Upload,
    Shield,
    UserCog,
    UserCircle,
    Sparkles,
    Clock,
    ChevronDown,
    FileText,
    GitBranch
} from 'lucide-react';

const ProposedTitleSection = ({
    handleRevisionSubmit,
    proposedTitles,
    totalProposedTitles,
    isLoading,
    approvedTitle,
    formState,
    setFormState,
    uploading,
    handleFormSubmit,
    handleResetForm,
    updateTitleStatus,
    handleDelete,
    handleViewFile,
    handleDownloadFile,
    getUserNameById,
    formatDate
}) => {

    // ============================================================
    // STATE para sa Revision Upload Modal
    // ============================================================
    const [revisionModal, setRevisionModal] = useState({
        open: false,
        titleId: null,
        titleName: '',
        file: null,
        remarks: ''
    });

    // ============================================================
    // STATE para sa collapsed tracking cards
    // ============================================================
    const [collapsedTracking, setCollapsedTracking] = useState({});

    console.log("proposedTitles", proposedTitles);

    // ============================================================
    // CHECKER: Pareho bang true ang adviser at coAdviser?
    // ============================================================
    const canUploadRevision = (t) => {
        return t.adviser === true && t.coAdviser === true;
    };

    const hasFullyApprovedTitle = proposedTitles?.some(
        t => t.adviser === true && t.coAdviser === true
    );

    // ============================================================
    // HANDLERS para sa Revision Upload Modal
    // ============================================================
    const handleOpenRevisionModal = (title) => {
        setRevisionModal({
            open: true,
            titleId: title._id,
            titleName: title.title || '',
            file: null,
            remarks: ''
        });
    };

    const handleCloseRevisionModal = () => {
        setRevisionModal({
            open: false,
            titleId: null,
            titleName: '',
            file: null,
            remarks: ''
        });
    };

    const handleRevisionFileChange = (e) => {
        setRevisionModal(prev => ({
            ...prev,
            file: e.target.files[0] || null
        }));
    };

    const handleRevisionFormSubmit = async (e) => {
        e.preventDefault();

        if (!revisionModal.file) {
            console.warn("⚠️ No file selected for revision upload");
            return;
        }

        if (!revisionModal.titleId) {
            console.error("❌ titleId is missing!");
            return;
        }

        const result = await handleRevisionSubmit({
            titleId: revisionModal.titleId,
            titleName: revisionModal.titleName,
            remarks: revisionModal.remarks,
            file: revisionModal.file
        });

        if (result?.success !== false) {
            handleCloseRevisionModal();
        }
    };

    // ============================================================
    // ✨ VIEW URL — GAMIT ANG PARENT handleViewFile
    // ============================================================
    const handleViewUrl = (url, fileName, action, titleName) => {
        if (!url) {
            console.warn("⚠️ No URL to view");
            return;
        }

        console.log("👁️ Viewing file:", {
            url,
            fileName,
            action,
            titleName
        });

        // ✅ I-delegate sa parent handler para consistent ang behavior
        // Parent handleViewFile ay tumatanggap ng URL o ID
        handleViewFile(url);
    };

    // ============================================================
    // ✨ DOWNLOAD URL — GAMIT ANG PARENT handleDownloadFile
    // ============================================================
    const handleDownloadUrl = async (url, fileName) => {
        if (!url) {
            console.warn("⚠️ No URL to download");
            return;
        }

        console.log("📥 Downloading file:", { url, fileName });

        // ✅ I-delegate sa parent handler
        // Parent handleDownloadFile ay tumatanggap ng (idOrUrl, fileNameOverride)
        await handleDownloadFile(url, fileName);
    };

    // ============================================================
    // HELPERS
    // ============================================================
    const getFileNameFromUrl = (url) => {
        if (!url) return 'document.pdf';
        try {
            const parts = url.split('/');
            const lastPart = parts[parts.length - 1];
            return lastPart.split('?')[0] || 'document.pdf';
        } catch (e) {
            return 'document.pdf';
        }
    };

    const toggleTracking = (titleId) => {
        setCollapsedTracking(prev => ({
            ...prev,
            [titleId]: !prev[titleId]
        }));
    };

    const formatTrackingDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Invalid date';
        }
    };

    const getRelativeTime = (dateStr) => {
        if (!dateStr) return '';
        try {
            const now = new Date();
            const then = new Date(dateStr);
            const diffMs = now - then;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            return '';
        } catch (e) {
            return '';
        }
    };

    const getActionConfig = (action) => {
        const configs = {
            create: {
                label: 'Initial Upload',
                shortLabel: 'CREATE',
                badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                dotClass: 'bg-blue-500',
                ringClass: 'ring-blue-300',
                iconColor: 'text-blue-500',
                bgClass: 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50'
            },
            revision: {
                label: 'Revision',
                shortLabel: 'REVISION',
                badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                dotClass: 'bg-purple-500',
                ringClass: 'ring-purple-300',
                iconColor: 'text-purple-500',
                bgClass: 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/50'
            },
            update: {
                label: 'Update',
                shortLabel: 'UPDATE',
                badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                dotClass: 'bg-amber-500',
                ringClass: 'ring-amber-300',
                iconColor: 'text-amber-500',
                bgClass: 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
            }
        };
        return configs[action] || configs.revision;
    };

    // ============================================================
    // GET LATEST URL FROM TRACKING
    // ============================================================
    const getLatestUrl = (title) => {
        if (!title.titleUrlTracking || title.titleUrlTracking.length === 0) {
            return title.fileUrl || '';
        }
        const sorted = [...title.titleUrlTracking].sort((a, b) => new Date(b.date) - new Date(a.date));
        return sorted[0]?.url || title.fileUrl || '';
    };

    return (
        <>
            <div id="proposed-title-section" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold">
                            <Lightbulb className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Project & Research Title Proposals</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Submit and manage proposed titles ({totalProposedTitles || proposedTitles.length} total)
                            </p>
                        </div>
                    </div>

                    {approvedTitle && (
                        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 px-3.5 py-2 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>Approved Title: <strong className="font-semibold">{approvedTitle.title}</strong></span>
                        </div>
                    )}
                </div>

                <div className={`grid grid-cols-1 ${hasFullyApprovedTitle ? '' : 'lg:grid-cols-12'} gap-6`}>
                    {/* LEFT: FORM */}
                    {!hasFullyApprovedTitle && (
                        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                    <PenSquare className="w-4 h-4 text-amber-500" />
                                    Submit Proposed Title
                                </h4>
                                <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">New</span>
                            </div>

                            <form onSubmit={handleFormSubmit} className="space-y-3.5">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Proposed Title <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formState.title}
                                        onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                                        placeholder="e.g. Student Referral & Performance Tracking System"
                                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Document File <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        required
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xls,.xlsx"
                                        onChange={(e) => setFormState({ ...formState, file: e.target.files[0] || null })}
                                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white shadow-sm file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 dark:file:bg-amber-900/50 dark:file:text-amber-300"
                                    />
                                    {formState.file && (
                                        <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 truncate">
                                            ✓ {formState.file.name} ({(formState.file.size / 1024).toFixed(1)} KB)
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Description / Objectives
                                    </label>
                                    <textarea
                                        rows="2"
                                        value={formState.description}
                                        onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                                        placeholder="Describe the background, target audience, and main features..."
                                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white shadow-sm resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Initial Remarks
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.remarks}
                                        onChange={(e) => setFormState({ ...formState, remarks: e.target.value })}
                                        placeholder="Optional notes for reviewers..."
                                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white shadow-sm"
                                    />
                                </div>

                                <div className="pt-1 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={handleResetForm}
                                        className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
                                        disabled={uploading}
                                    >
                                        Reset
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Paperclip className="w-4 h-4" /> Submit Proposal
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* NOTICE */}
                    {hasFullyApprovedTitle && (
                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg shrink-0">
                                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4" />
                                    Title Submission Closed
                                </p>
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                                    May fully approved title na (Adviser ✓ & Co-Adviser ✓). Hindi na pwedeng mag-submit ng panibagong title — mag-upload na lang ng <strong>Revision Capstone</strong> sa baba.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* RIGHT: PROPOSALS LIST */}
                    <div className={`${hasFullyApprovedTitle ? '' : 'lg:col-span-7'} space-y-3`}>
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                <ListCheck className="w-4 h-4 text-blue-500" />
                                Submitted Titles ({totalProposedTitles || proposedTitles.length})
                            </h4>
                            <span className="text-xs text-slate-400">Click 'Approve' to set final title</span>
                        </div>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                            {isLoading ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                                    <span className="ml-2 text-sm text-slate-400">Loading...</span>
                                </div>
                            ) : proposedTitles.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                    No title proposals submitted yet. Fill out the form to propose a project title!
                                </div>
                            ) : (
                                proposedTitles.map(t => {
                                    const isApproved = t.status === 'Approved';
                                    const isRejected = t.status === 'Rejected';
                                    const isRevision = t.status === 'Revision';
                                    const showRevisionUI = canUploadRevision(t);
                                    const hasTracking = t.titleUrlTracking && t.titleUrlTracking.length > 0;
                                    const isCollapsed = collapsedTracking[t._id] === true;

                                    // ✅ SORTED — pinakabago muna
                                    const sortedTracking = hasTracking
                                        ? [...t.titleUrlTracking].sort((a, b) => new Date(b.date) - new Date(a.date))
                                        : [];

                                    // ✅ LATEST URL — para sa main View/Download button
                                    const latestUrl = getLatestUrl(t);

                                    const revisionCount = hasTracking
                                        ? t.titleUrlTracking.filter(x => x.action === 'revision').length
                                        : 0;

                                    let statusBadgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
                                    if (isApproved) statusBadgeClass = 'bg-emerald-500 text-white font-bold';
                                    else if (isRejected) statusBadgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
                                    else if (isRevision) statusBadgeClass = 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';

                                    return (
                                        <div
                                            key={t._id}
                                            className={`p-4 rounded-xl border text-xs transition space-y-2.5 ${isApproved
                                                ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 shadow-sm'
                                                : isRejected
                                                    ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900/40 opacity-75'
                                                    : isRevision
                                                        ? 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/50'
                                                        : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                                                }`}
                                        >
                                            {/* HEADER ROW */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1 flex-1 min-w-0">
                                                    <div className="font-bold text-sm text-slate-900 dark:text-white leading-snug break-words">
                                                        {t.title}
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusBadgeClass}`}>
                                                            • {t.status}
                                                        </span>

                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${t.adviser
                                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                                            }`}>
                                                            <UserCog className="w-3 h-3" />
                                                            Adviser {t.adviser ? '✓' : '—'}
                                                        </span>

                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${t.coAdviser
                                                            ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'
                                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                                            }`}>
                                                            <UserCircle className="w-3 h-3" />
                                                            Co-Adviser {t.coAdviser ? '✓' : '—'}
                                                        </span>

                                                        {/* ✅ MAIN VIEW/DOWNLOAD — GAMIT ANG LATEST URL */}
                                                        {latestUrl && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleViewUrl(
                                                                        latestUrl,
                                                                        t.fileName || getFileNameFromUrl(latestUrl),
                                                                        'latest',
                                                                        t.title
                                                                    )}
                                                                    className="px-2.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 transition flex items-center gap-1.5"
                                                                    title="View latest file"
                                                                >
                                                                    <Eye className="w-3 h-3" /> View
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDownloadUrl(
                                                                        latestUrl,
                                                                        t.fileName || getFileNameFromUrl(latestUrl)
                                                                    )}
                                                                    className="px-2.5 py-0.5 rounded text-[10px] font-medium bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-300 hover:bg-green-100 transition flex items-center gap-1.5"
                                                                    title="Download latest file"
                                                                >
                                                                    <Download className="w-3 h-3" /> Download
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="shrink-0 flex items-center gap-1 flex-wrap">
                                                    {!isApproved && (
                                                        <button
                                                            onClick={() => updateTitleStatus(t._id, 'Approved')}
                                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-[11px] transition shadow-sm flex items-center gap-1"
                                                            title="Approve Title"
                                                        >
                                                            <Check className="w-3.5 h-3.5" /> Approve
                                                        </button>
                                                    )}

                                                    {!isApproved && (
                                                        <button
                                                            onClick={() => updateTitleStatus(t._id, 'Revision')}
                                                            className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/40 dark:hover:bg-purple-800/60 dark:text-purple-300 font-semibold rounded-lg text-[11px] transition flex items-center gap-1"
                                                            title="Request Revision"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" /> Revise
                                                        </button>
                                                    )}

                                                    {!isApproved && !isRejected && (
                                                        <button
                                                            onClick={() => updateTitleStatus(t._id, 'Rejected')}
                                                            className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 hover:text-rose-600 text-slate-600 dark:text-slate-300 font-medium rounded-lg text-[11px] transition"
                                                            title="Reject Proposal"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}

                                                    {!isApproved && (
                                                        <button
                                                            onClick={() => handleDelete(t._id)}
                                                            className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 hover:text-rose-600 text-slate-500 dark:text-slate-400 font-medium rounded-lg text-[11px] transition"
                                                            title="Delete"
                                                        >
                                                            <X className="w-3.5 h-3.5 text-rose-500" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {t.description && (
                                                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                                    {t.description}
                                                </p>
                                            )}

                                            {t.remarks && (
                                                <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/40 flex items-center gap-1.5">
                                                    <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                    <span><strong>Remarks:</strong> {t.remarks}</span>
                                                </div>
                                            )}

                                            {/* ✨ FILE HISTORY / URL TRACKING — TIMELINE */}
                                            {hasTracking && (
                                                <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleTracking(t._id)}
                                                        className="w-full flex items-center justify-between px-2.5 py-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <GitBranch className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                                                File History
                                                            </span>
                                                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                                {t.titleUrlTracking.length} file{t.titleUrlTracking.length > 1 ? 's' : ''}
                                                            </span>
                                                            {revisionCount > 0 && (
                                                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                                                    {revisionCount} revision{revisionCount > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <ChevronDown
                                                            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                                                        />
                                                    </button>

                                                    {!isCollapsed && (
                                                        <div className="p-3 bg-white dark:bg-slate-900/40">
                                                            <div className="relative">
                                                                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />

                                                                <div className="space-y-3">
                                                                    {sortedTracking.map((track, idx) => {
                                                                        const isLatest = idx === 0;
                                                                        const config = getActionConfig(track.action);

                                                                        return (
                                                                            <div key={track._id || idx} className="relative flex gap-3">
                                                                                {/* DOT */}
                                                                                <div className="relative z-10 shrink-0 pt-1">
                                                                                    <div className={`w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${config.dotClass} ${isLatest ? 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ' + config.ringClass : ''
                                                                                        }`} />
                                                                                </div>

                                                                                {/* CONTENT */}
                                                                                <div className={`flex-1 min-w-0 p-2.5 rounded-lg border text-[10px] ${config.bgClass}`}>
                                                                                    {/* TOP ROW */}
                                                                                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${config.badgeClass}`}>
                                                                                            {config.shortLabel}
                                                                                        </span>

                                                                                        {isLatest && (
                                                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500 text-white">
                                                                                                LATEST
                                                                                            </span>
                                                                                        )}

                                                                                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                                                            <Clock className="w-2.5 h-2.5" />
                                                                                            {formatTrackingDate(track.date)}
                                                                                        </span>

                                                                                        {getRelativeTime(track.date) && (
                                                                                            <span className="text-slate-400 dark:text-slate-500 italic">
                                                                                                ({getRelativeTime(track.date)})
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* REMARKS */}
                                                                                    {track.remarks && (
                                                                                        <p className="text-slate-700 dark:text-slate-300 mb-2 break-words">
                                                                                            {track.remarks}
                                                                                        </p>
                                                                                    )}

                                                                                    {/* FILE + ACTIONS — ✅ GAMIT ANG track.url */}
                                                                                    {track.url && (
                                                                                        <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/50">
                                                                                            <FileText className={`w-3.5 h-3.5 shrink-0 ${config.iconColor}`} />
                                                                                            <span className="text-slate-500 dark:text-slate-400 truncate flex-1 font-mono text-[9px]" title={track.url}>
                                                                                                {track.fileName || getFileNameFromUrl(track.url)}
                                                                                            </span>
                                                                                            <div className="flex items-center gap-1 shrink-0">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleViewUrl(
                                                                                                        track.url,
                                                                                                        track.fileName,
                                                                                                        track.action,
                                                                                                        t.title
                                                                                                    )}
                                                                                                    className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition"
                                                                                                    title="View this version"
                                                                                                >
                                                                                                    <Eye className="w-3 h-3" />
                                                                                                </button>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleDownloadUrl(
                                                                                                        track.url,
                                                                                                        track.fileName || getFileNameFromUrl(track.url)
                                                                                                    )}
                                                                                                    className="p-1 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition"
                                                                                                    title="Download this version"
                                                                                                >
                                                                                                    <Download className="w-3 h-3" />
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* ✨ REVISION CAPSTONE UPLOAD UI */}
                                            {showRevisionUI && (
                                                <div className="mt-2 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-xl">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                                                            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                                Fully Approved — Ready for Revision Upload
                                                            </p>
                                                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                                                Both Adviser & Co-Adviser have approved. You can now upload the revision capstone.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenRevisionModal(t)}
                                                        className="w-full px-3 py-2.5 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        Upload Revision Capstone
                                                    </button>
                                                </div>
                                            )}

                                            <div className="text-[10px] text-slate-400 flex flex-wrap justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800 gap-1">
                                                <span>Uploaded By: <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                                                    {t.uploaderName || getUserNameById(t.uploadedBy)}
                                                </strong></span>
                                                <span className="text-[9px] font-mono">ID: {t._id.substring(0, 12)}...</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* REVISION UPLOAD MODAL */}
            {revisionModal.open && (
                <div
                    className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center animate-fadeIn p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) handleCloseRevisionModal();
                    }}
                >
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                                    <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Upload Revision Capstone
                                </h3>
                            </div>
                            <button
                                onClick={handleCloseRevisionModal}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                            <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                <strong>Title:</strong> {revisionModal.titleName || 'Untitled'}
                            </p>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Adviser & Co-Adviser have both approved this title.
                            </p>
                        </div>

                        <form onSubmit={handleRevisionFormSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Revision File <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    required
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xls,.xlsx"
                                    onChange={handleRevisionFileChange}
                                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white shadow-sm file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 dark:file:bg-emerald-900/50 dark:file:text-emerald-300"
                                />
                                {revisionModal.file && (
                                    <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 truncate">
                                        ✓ {revisionModal.file.name} ({(revisionModal.file.size / 1024).toFixed(1)} KB)
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Remarks / Notes
                                </label>
                                <input
                                    type="text"
                                    value={revisionModal.remarks}
                                    onChange={(e) => setRevisionModal(prev => ({ ...prev, remarks: e.target.value }))}
                                    placeholder="Optional notes about this revision..."
                                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white shadow-sm"
                                />
                            </div>

                            <div className="pt-1 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={handleCloseRevisionModal}
                                    disabled={uploading}
                                    className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading || !revisionModal.file}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 dark:disabled:bg-emerald-900/50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" /> Upload Revision
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProposedTitleSection;