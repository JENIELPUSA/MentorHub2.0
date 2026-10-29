// src/components/ProposedTopics/ProposedTopics.jsx
import React, { useState, useMemo, useCallback, useContext, useEffect } from 'react';
import {
    BookOpen,
    Clock,
    CheckCircle,
    Search,
    ArrowDownUp,
    FileText,
    MessageSquare,
    History,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    AlertCircle,
    ArrowRight,
    Gavel,
    Globe,
    Save,
    Shield,
    Loader2,
} from 'lucide-react';

import { AuthContext } from '../../contexts/AuthContext';
import { ProposedTitleContext } from '../../contexts/ProposedTitleContext/ProposedTitleContext';
import { CommentContext } from '../../contexts/CommentContext/CommentContext';

import PdfViewer from '../ReusablePDFviewer/PDFViewer';

// ============================
// STATUS CONFIG
// ============================
const statusConfig = {
    Pending: {
        container: 'bg-amber-100 text-amber-800',
        dot: 'bg-amber-500',
        accent: 'bg-amber-500',
    },
    Approved: {
        container: 'bg-blue-100 text-blue-800',
        dot: 'bg-blue-700',
        accent: 'bg-blue-700',
    },
    Revision: {
        container: 'bg-red-100 text-red-700',
        dot: 'bg-red-600',
        accent: 'bg-red-600',
    },
    Rejected: {
        container: 'bg-rose-100 text-rose-700',
        dot: 'bg-rose-600',
        accent: 'bg-rose-600',
    },
    for_schedule: {
        container: 'bg-cyan-100 text-cyan-800',
        dot: 'bg-cyan-600',
        accent: 'bg-cyan-600',
    },
    'Ready for Defense': {
        container: 'bg-teal-100 text-teal-800',
        dot: 'bg-teal-600',
        accent: 'bg-teal-600',
    },
    Done: {
        container: 'bg-emerald-100 text-emerald-800',
        dot: 'bg-emerald-600',
        accent: 'bg-emerald-600',
    },
};

const scopeToneMap = {
    green: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
};

// ============================
// HELPERS
// ============================
const getStatusLabel = (status) => {
    const map = {
        Pending: 'NEEDS PANEL REVIEW',
        Approved: 'SCOPE APPROVED',
        Revision: 'REVISIONS UNDERWAY',
        Rejected: 'REJECTED',
        for_schedule: 'DEFENSE SCHEDULING',
        'Ready for Defense': 'READY FOR DEFENSE',
        Done: 'COMPLETED',
    };
    return map[status] || String(status || 'PENDING').toUpperCase();
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const getInitials = (firstName, lastName) => {
    const f = (firstName || '').charAt(0).toUpperCase();
    const l = (lastName || '').charAt(0).toUpperCase();
    return `${f}${l}` || 'U';
};

const getDisplayName = (user) => {
    if (!user) return 'Unassigned';
    if (typeof user === 'string') return 'Assigned';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unassigned';
};

const getLatestTrackingEntry = (submission) => {
    const tracking = submission?.titleUrlTracking;
    if (!Array.isArray(tracking) || tracking.length === 0) return null;
    return [...tracking].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];
};

const GLOBAL_KEY = '__global__';

const backendCommentToAnnotation = (comment) => {
    const pos = comment.position || {};
    const x = pos.x ?? 0.1;
    const y = pos.y ?? 0.1;
    const w = pos.width ?? pos.w ?? 0.03;
    const h = pos.height ?? pos.h ?? 0.03;

    let localType = 'comment';
    const backendType = comment.annotationType || 'text';
    if (backendType === 'highlight') localType = 'highlight';
    else if (backendType === 'margin') localType = 'margin';
    else if (backendType === 'page') localType = 'page';
    else if (backendType === 'region') localType = 'region';
    else if (backendType === 'global') localType = 'global';

    const author = comment.userId
        ? `${comment.userId.first_name || ''} ${comment.userId.last_name || ''}`.trim() || 'Mentor'
        : 'Mentor';

    return {
        id: comment._id,
        backendId: comment._id,
        type: localType,
        shape: comment.shape || pos.shape || 'rectangle',
        x,
        y,
        w,
        h,
        text: comment.text || '',
        quoted: comment.selectedText || '',
        color: comment.color || '#fbbf24',
        author,
        pageNum: comment.pageNumber ?? null,
        createdAt: comment.createdAt || new Date().toISOString(),
        __fromBackend: true,
    };
};

const mergeBackendCommentsIntoAnnotations = (existing, backendComments) => {
    if (!Array.isArray(backendComments) || backendComments.length === 0) return existing;

    const next = { ...existing };
    const seenIds = new Set();
    Object.values(next).forEach((list) => {
        (list || []).forEach((a) => {
            if (a.id) seenIds.add(String(a.id));
            if (a.backendId) seenIds.add(String(a.backendId));
        });
    });

    backendComments.forEach((c) => {
        const cid = String(c._id);
        if (seenIds.has(cid)) return;
        const ann = backendCommentToAnnotation(c);
        seenIds.add(cid);

        const key = ann.type === 'global' ? GLOBAL_KEY : `page_${ann.pageNum || 1}`;
        if (!next[key]) next[key] = [];
        next[key].push(ann);
    });

    return next;
};

// ============================
// INLINE PDF LOADING SCREEN (replaces ProfessionalLoadingScreen)
// ============================
const PdfLoadingScreen = ({ message = 'Loading thesis document...' }) => (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
                <FileText className="w-6 h-6 text-blue-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
                <p className="text-sm font-bold text-blue-900">{message}</p>
                <p className="text-[11px] text-blue-500 mt-1">Preparing document viewer...</p>
            </div>
        </div>
    </div>
);

// ============================
// TOPIC LIST ITEM
// ============================
const TopicListItem = ({ topic, isActive, onClick, onViewManuscript }) => {
    const cfg = statusConfig[topic.status] || statusConfig.Pending;

    const advisers = [];
    const adv = topic.groupInfo?.adviserId;
    const coAdv = topic.groupInfo?.coAdviserId;

    if (adv) {
        advisers.push({
            name: getDisplayName(adv),
            role: 'Primary Adviser',
            initials: typeof adv === 'object' ? getInitials(adv.first_name, adv.last_name) : 'A',
            tone: 'blue',
        });
    }
    if (coAdv) {
        advisers.push({
            name: getDisplayName(coAdv),
            role: 'Co-Adviser',
            initials: typeof coAdv === 'object' ? getInitials(coAdv.first_name, coAdv.last_name) : 'C',
            tone: 'amber',
        });
    }

    const approvals = topic.chapterProgressionApprovals || {};
    const progressedCount = Object.keys(approvals).filter((k) => approvals[k] === true).length;
    const totalChapters = 8;
    const fullyProceeded = progressedCount >= totalChapters;

    const scopeNote = fullyProceeded ? 'Defense Unlocked' : `${progressedCount}/${totalChapters} Chapters`;
    const scopeTone = fullyProceeded ? 'green' : progressedCount > 0 ? 'amber' : 'red';

    const mentorsConfirmed = topic.adviser === true && topic.coAdviser === true;

    return (
        <div
            onClick={() => onClick(topic)}
            className={`p-5 transition-all cursor-pointer relative ${
                isActive ? 'bg-blue-50 border-l-4 border-blue-700' : 'bg-white hover:bg-blue-50/50'
            }`}
        >
            <div className="flex flex-col gap-3">
                {/* Top row */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-blue-700 font-mono">
                            {topic._id?.slice(-8).toUpperCase() || 'N/A'}
                        </span>
                        <span className="text-blue-300">•</span>
                        <span className="text-[11px] font-semibold text-blue-900">
                            {topic.groupInfo?.name || topic.groupName || 'Unnamed Group'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold">
                            {topic.groupInfo?.course || topic.course || 'N/A'}
                        </span>
                    </div>
                    <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${cfg.container}`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {getStatusLabel(topic.status)}
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-sm font-bold text-blue-900 leading-snug line-clamp-2">
                    {topic.title || 'Untitled Proposal'}
                </h2>

                {/* Meta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 text-blue-600">
                        <History className="w-3.5 h-3.5" />
                        <span className="text-[11px]">
                            <strong className="text-blue-900 font-semibold">
                                {topic.isRevesion ? 'Revised' : 'Original'}
                            </strong>{' '}
                            • Submitted {formatDate(topic.createdAt)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-600">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[11px]">
                            Mentors:{' '}
                            <span className="font-semibold text-blue-800">
                                {mentorsConfirmed
                                    ? 'Both Confirmed'
                                    : topic.adviser || topic.coAdviser
                                    ? '1/2 Confirmed'
                                    : 'Pending'}
                            </span>
                        </span>
                    </div>
                </div>

                {/* Advisers + Rubric */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {advisers.length > 0 ? (
                                advisers.map((a, i) => (
                                    <div
                                        key={i}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white ${
                                            a.tone === 'blue' ? 'bg-blue-900 text-white' : 'bg-amber-500 text-white'
                                        }`}
                                        title={a.name}
                                    >
                                        {a.initials}
                                    </div>
                                ))
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                                    ?
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] text-blue-900 font-medium leading-tight">
                                {advisers.map((a) => a.name).join(' & ') || 'No advisers assigned'}
                            </span>
                            <span className="text-[10px] text-blue-500">
                                {advisers.map((a) => a.role).join(' & ') || '—'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${scopeToneMap[scopeTone]}`}>
                            {scopeNote}
                        </span>
                        {topic.commentCount > 0 && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium">
                                {topic.commentCount} feedback
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewManuscript(topic);
                            }}
                            className="text-blue-700 text-[11px] font-semibold flex items-center gap-1 hover:underline"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            View Manuscript
                        </button>
                        <button className="text-blue-500 text-[11px] font-semibold flex items-center gap-1 hover:text-blue-900">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Thread ({topic.commentCount || 0})
                        </button>
                    </div>
                    <button
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                            isActive
                                ? 'bg-amber-500 text-white hover:bg-amber-600'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-900 hover:text-white'
                        }`}
                    >
                        {isActive ? 'Evaluating Active' : 'Evaluate Topic'}
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================
// RUBRIC STEPPER
// ============================
const RubricStepper = ({ label, value, onChange, tone = 'blue' }) => {
    const toneMap = {
        blue: 'text-blue-700',
        amber: 'text-amber-600',
        red: 'text-red-600',
        green: 'text-blue-800',
    };
    return (
        <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100 flex flex-col gap-1">
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">{label}</span>
            <div className="flex items-center justify-between mt-1">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(1, value - 0.5))}
                    className="w-7 h-7 rounded bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-sm flex items-center justify-center"
                >
                    −
                </button>
                <span className={`text-xl font-extrabold ${toneMap[tone]}`}>{value.toFixed(1)}</span>
                <button
                    type="button"
                    onClick={() => onChange(Math.min(5, value + 0.5))}
                    className="w-7 h-7 rounded bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-sm flex items-center justify-center"
                >
                    +
                </button>
            </div>
        </div>
    );
};

// ============================
// MAIN COMPONENT
// ============================
export default function ProposedTopics() {
    const {
        proposedTitles,
        isLoading,
        totalProposedTitles,
        FetchProposedTitles,
        GetByTrackingID,
        GetPdfBlobUrl,
        search: contextSearch,
        setSearch: setContextSearch,
        currentPage,
        setCurrentPage,
        limit,
        customError,
    } = useContext(ProposedTitleContext);

    const {
        comments,
        CreateComment,
        FetchCommentsByProposedTitle,
        DeleteComment,
        ClearPageAnnotations,
        ResetComments,
    } = useContext(CommentContext);

    const { role } = useContext(AuthContext);
    const normalizedRole = (role || '').toLowerCase().trim();

    const canAnnotate = useMemo(() => {
        return ['adviser', 'coadviser', 'co-adviser', 'subject_instructor', 'admin', 'organizer', 'panelist'].includes(
            normalizedRole
        );
    }, [normalizedRole]);

    const effectiveReadOnly = normalizedRole === 'student';

    // ── List state ─────────────────────────────────────────────
    const [selectedId, setSelectedId] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState(contextSearch || '');

    const [rubric, setRubric] = useState({
        significance: 3.0,
        novelty: 3.0,
        rigor: 3.0,
        feasibility: 3.0,
    });
    const [decision, setDecision] = useState('revision');
    const [feedback, setFeedback] = useState('');

    // ── PDF Viewer state ──────────────────────────────────────
    const [isViewMode, setIsViewMode] = useState(false);
    const [viewSubmission, setViewSubmission] = useState(null);
    const [activeTrackingId, setActiveTrackingId] = useState(null);
    const [trackingLoading, setTrackingLoading] = useState(false);

    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
    const [pdfBlobLoading, setPdfBlobLoading] = useState(false);
    const [pdfBlobError, setPdfBlobError] = useState(null);

    const [pdfAnnotations, setPdfAnnotations] = useState({});
    const [annotationTool, setAnnotationTool] = useState('cursor');
    const [annotationColor, setAnnotationColor] = useState('#fbbf24');
    const [annotationPageNum, setAnnotationPageNum] = useState(1);
    const [pdfNumPages, setPdfNumPages] = useState(0);
    const [pdfScale, setPdfScale] = useState(1.2);
    const [pdfPageSize, setPdfPageSize] = useState({ width: 0, height: 0 });
    const [textMenu, setTextMenu] = useState(null);
    const [externalComment, setExternalComment] = useState(null);
    const [hoveredAnnotationId, setHoveredAnnotationId] = useState(null);
    const [isSavingPdf, setIsSavingPdf] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    const splitContainerRef = React.useRef(null);
    const anchorRefs = React.useRef({});
    const cardRefs = React.useRef({});

    const proposedTitleId = useMemo(() => {
        if (!viewSubmission) return activeTrackingId || null;
        const latest = getLatestTrackingEntry(viewSubmission);
        if (latest?._id) return latest._id;
        return activeTrackingId || viewSubmission?._id || null;
    }, [viewSubmission, activeTrackingId]);

    const showNotification = useCallback((msg, isError = false) => {
        setToastMessage({ msg, isError });
        setTimeout(() => setToastMessage(null), 3000);
    }, []);

    // Fetch on mount
    useEffect(() => {
        FetchProposedTitles(1, limit || 10, '', '', '', '', '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => {
            if (search !== contextSearch) {
                setContextSearch(search);
                setCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    // Auto-select first
    useEffect(() => {
        if (proposedTitles?.length && !selectedId) {
            setSelectedId(proposedTitles[0]._id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [proposedTitles]);

    const selectedTopic = useMemo(
        () => proposedTitles?.find((t) => t._id === selectedId) || proposedTitles?.[0] || null,
        [proposedTitles, selectedId]
    );

    useEffect(() => {
        if (selectedTopic) {
            setRubric({ significance: 3.0, novelty: 3.0, rigor: 3.0, feasibility: 3.0 });
            setDecision('revision');
            setFeedback(selectedTopic.description || '');
        }
    }, [selectedTopic?._id]);

    // Merge backend comments
    useEffect(() => {
        if (!comments || comments.length === 0) return;
        setPdfAnnotations((prev) => mergeBackendCommentsIntoAnnotations(prev, comments));
    }, [comments]);

    const resetAnnotationsForNewSubmission = useCallback(() => {
        setPdfAnnotations({});
        setAnnotationTool('cursor');
        setAnnotationColor('#fbbf24');
        setAnnotationPageNum(1);
        setPdfNumPages(0);
        setPdfPageSize({ width: 0, height: 0 });
        setTextMenu(null);
        setExternalComment(null);
        setHoveredAnnotationId(null);
        anchorRefs.current = {};
        cardRefs.current = {};
    }, []);

    useEffect(() => {
        if (activeTrackingId) resetAnnotationsForNewSubmission();
    }, [activeTrackingId, resetAnnotationsForNewSubmission]);

    useEffect(() => {
        anchorRefs.current = {};
    }, [annotationPageNum]);

    // Fetch PDF blob
    useEffect(() => {
        let cancelled = false;
        const fetchPdf = async () => {
            if (!isViewMode || !activeTrackingId) {
                setPdfBlobUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return null;
                });
                setPdfBlobError(null);
                return;
            }
            setPdfBlobLoading(true);
            setPdfBlobError(null);
            try {
                const url = await GetPdfBlobUrl(activeTrackingId);
                if (cancelled) {
                    if (url) URL.revokeObjectURL(url);
                    return;
                }
                if (url)
                    setPdfBlobUrl((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return url;
                    });
                else setPdfBlobError('Failed to load thesis PDF. Backend returned no document.');
            } catch (err) {
                if (!cancelled) setPdfBlobError(err.message || 'Failed to load thesis PDF');
            } finally {
                if (!cancelled) setPdfBlobLoading(false);
            }
        };
        fetchPdf();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isViewMode, activeTrackingId]);

    useEffect(
        () => () => {
            if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const refreshComments = useCallback(async () => {
        if (!FetchCommentsByProposedTitle || !proposedTitleId) return;
        try {
            await FetchCommentsByProposedTitle(proposedTitleId, 1, 100);
        } catch (err) {
            console.warn(err);
        }
    }, [FetchCommentsByProposedTitle, proposedTitleId]);

    // ── Open PDF Viewer ────────────────────────────────────────
    const handleOpenPdfViewer = async (item, trackingId = null) => {
        const latestTracking = getLatestTrackingEntry(item);
        const finalTrackingId = trackingId || latestTracking?._id;
        if (!finalTrackingId) {
            showNotification('❌ No tracking ID available for this thesis', true);
            return;
        }

        try {
            if (ResetComments) ResetComments();
        } catch (err) {
            console.warn(err);
        }
        resetAnnotationsForNewSubmission();

        try {
            setTrackingLoading(true);
            const result = await GetByTrackingID(finalTrackingId);
            const data = result?.data || item;
            setViewSubmission(data);
            setActiveTrackingId(finalTrackingId);
            setIsViewMode(true);
            if (FetchCommentsByProposedTitle) {
                try {
                    await FetchCommentsByProposedTitle(finalTrackingId, 1, 100);
                } catch (err) {
                    console.warn(err);
                }
            }
        } catch (error) {
            console.error('Error fetching tracking data:', error);
            setViewSubmission(item);
            setActiveTrackingId(finalTrackingId);
            setIsViewMode(true);
        } finally {
            setTrackingLoading(false);
        }
    };

    const handleBackToList = () => {
        setIsViewMode(false);
        setViewSubmission(null);
        setActiveTrackingId(null);
        setPdfBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        try {
            if (ResetComments) ResetComments();
        } catch (err) {
            console.warn(err);
        }
    };

    // ── Annotation actions ────────────────────────────────────
    const handleClearPageViaContext = async () => {
        if (!canAnnotate) {
            showNotification('⚠️ View-only — you cannot clear annotations.', true);
            return;
        }
        const annotations = pdfAnnotations[`page_${annotationPageNum}`] || [];
        if (annotations.length === 0) {
            showNotification('⚠️ No annotations on this page', true);
            return;
        }
        if (!window.confirm(`Delete all ${annotations.length} annotation(s) on page ${annotationPageNum}?`)) return;
        try {
            const res = await ClearPageAnnotations(proposedTitleId, annotationPageNum);
            if (!res?.success) {
                showNotification(`❌ Clear failed: ${res?.error || 'Unknown'}`, true);
                return;
            }
            setPdfAnnotations((prev) => ({ ...prev, [`page_${annotationPageNum}`]: [] }));
            await refreshComments();
            showNotification(`✅ Cleared ${res.deletedCount || annotations.length} annotation(s)`);
        } catch (err) {
            showNotification(`❌ Failed: ${err.message}`, true);
        }
    };

    const handleAddPageComment = async (pageNum) => {
        if (!canAnnotate) {
            showNotification('⚠️ View-only — you cannot add feedback.', true);
            return;
        }
        const value = window.prompt(`Page ${pageNum} — Describe the issue:`);
        if (!value?.trim()) return;
        if (!proposedTitleId) {
            showNotification('❌ Missing proposedTitleId', true);
            return;
        }
        try {
            const res = await CreateComment(proposedTitleId, {
                text: value.trim(),
                pageNumber: pageNum,
                position: null,
                selectedText: null,
                color: annotationColor,
                annotationType: 'page',
                annotationLabel: 'Page Feedback',
                shape: 'pin',
            });
            if (res?.success) await refreshComments();
            else if (res?.error) showNotification(`❌ ${res.error}`, true);
        } catch (err) {
            showNotification(`❌ Failed: ${err.message}`, true);
        }
    };

    const handleAddGlobalComment = async () => {
        if (!canAnnotate) {
            showNotification('⚠️ View-only — you cannot add feedback.', true);
            return;
        }
        const value = window.prompt('🌐 Applies to ALL pages — Describe the issue:');
        if (!value?.trim()) return;
        if (!proposedTitleId) {
            showNotification('❌ Missing proposedTitleId', true);
            return;
        }
        try {
            const res = await CreateComment(proposedTitleId, {
                text: value.trim(),
                pageNumber: null,
                position: null,
                selectedText: null,
                color: '#f87171',
                annotationType: 'global',
                annotationLabel: 'All Pages Feedback',
                shape: 'pin',
            });
            if (res?.success) await refreshComments();
            else if (res?.error) showNotification(`❌ ${res.error}`, true);
        } catch (err) {
            showNotification(`❌ Failed: ${err.message}`, true);
        }
    };

    const handleClearGlobalAnnotations = async () => {
        if (!canAnnotate) {
            showNotification('⚠️ View-only — you cannot clear annotations.', true);
            return;
        }
        const globals = pdfAnnotations[GLOBAL_KEY] || [];
        if (globals.length === 0) return;
        if (!window.confirm(`Delete all ${globals.length} "All Pages" feedback?`)) return;
        try {
            for (const g of globals) {
                const backendId = g.backendId || (g.__fromBackend ? g.id : null);
                if (backendId && DeleteComment) {
                    try {
                        await DeleteComment(backendId);
                    } catch (err) {
                        console.warn(err);
                    }
                }
            }
            setPdfAnnotations((prev) => {
                const next = { ...prev };
                delete next[GLOBAL_KEY];
                return next;
            });
            await refreshComments();
            showNotification('✅ All global feedback removed');
        } catch (err) {
            showNotification(`❌ Failed: ${err.message}`, true);
        }
    };

    const handleEraseFromSidebar = async (target) => {
        if (!canAnnotate || !target) return;
        const isBackend = target.__fromBackend === true || !!target.backendId;
        const backendId = target.backendId || (target.__fromBackend ? target.id : null);
        if (!window.confirm('Delete this feedback?')) return;
        try {
            if (isBackend && backendId && DeleteComment) {
                const res = await DeleteComment(backendId);
                if (!res?.success) {
                    showNotification(`❌ Delete failed: ${res?.error || 'Unknown error'}`, true);
                    return;
                }
            }
            const pageKey = target.type === 'global' ? 'global' : target.pageNum || annotationPageNum;
            setPdfAnnotations((prev) => {
                const key = pageKey === 'global' ? GLOBAL_KEY : `page_${pageKey}`;
                return { ...prev, [key]: (prev[key] || []).filter((a) => a.id !== target.id) };
            });
            await refreshComments();
            showNotification('✅ Feedback deleted');
        } catch (err) {
            showNotification(`❌ Failed: ${err.message}`, true);
        }
    };

    const handleSaveAnnotatedPdf = async () => {
        showNotification('💾 PDF export initialized...');
        setIsSavingPdf(false);
    };

    const handleSaveDraft = () => {
        console.log('Save draft:', { selectedId, rubric, decision, feedback });
        showNotification('📝 Draft saved (local only)');
    };

    const handleSubmitEvaluation = () => {
        console.log('Submit evaluation:', { selectedId, rubric, decision, feedback });
        showNotification('✅ Evaluation submitted (local only)');
    };

    // ── Derived ────────────────────────────────────────────────
    const filteredTopics = useMemo(() => {
        if (!proposedTitles) return [];
        const q = search.toLowerCase().trim();
        return proposedTitles.filter((t) => {
            const matchSearch =
                !q ||
                (String(t.title || '') +
                    String(t.groupInfo?.name || '') +
                    String(t.description || '') +
                    String(t.groupInfo?.course || ''))
                    .toLowerCase()
                    .includes(q);
            const matchTab = activeTab === 'all' || t.status === activeTab;
            return matchSearch && matchTab;
        });
    }, [proposedTitles, search, activeTab]);

    const handleSelect = useCallback((topic) => {
        setSelectedId(topic._id);
    }, []);

    const counts = useMemo(() => {
        if (!proposedTitles || proposedTitles.length === 0) {
            return { all: 0, Pending: 0, Revision: 0, Approved: 0 };
        }
        return proposedTitles.reduce(
            (acc, t) => {
                acc.all = (acc.all || 0) + 1;
                acc[t.status] = (acc[t.status] || 0) + 1;
                return acc;
            },
            { all: 0, Pending: 0, Revision: 0, Approved: 0 }
        );
    }, [proposedTitles]);

    const tabs = [
        { key: 'all', label: `All Topics (${counts.all || 0})` },
        { key: 'Pending', label: `Needs My Review (${counts.Pending || 0})`, count: counts.Pending },
        { key: 'Revision', label: `Under Panel Revision (${counts.Revision || 0})`, count: counts.Revision },
        { key: 'Approved', label: `Approved Topics (${counts.Approved || 0})`, count: counts.Approved },
    ];

    const totalPages = Math.max(1, Math.ceil((totalProposedTitles || 0) / (limit || 10)));

    // ═══════════════════════════════════════════════════════════
    // RENDER — PDF TRACKING LOADING (inline, no ProfessionalLoadingScreen)
    // ═══════════════════════════════════════════════════════════
    if (trackingLoading) {
        return <PdfLoadingScreen message="Loading thesis document..." />;
    }

    // ═══════════════════════════════════════════════════════════
    // RENDER — PDF VIEWER MODE
    // ═══════════════════════════════════════════════════════════
    if (isViewMode && viewSubmission) {
        const handleContextAction = (action) => {
            if (!textMenu) return;
            if (action === 'copy') {
                navigator.clipboard.writeText(textMenu.selectedText);
                setTextMenu(null);
                return;
            }
            if (!canAnnotate) {
                showNotification('⚠️ View-only — you cannot add annotations.', true);
                setTextMenu(null);
                return;
            }
            if (action === 'highlight') {
                if (textMenu.selectionRect) {
                    const r = textMenu.selectionRect;
                    setExternalComment({
                        type: 'highlight',
                        x: r.x,
                        y: r.y,
                        w: r.w,
                        h: r.h,
                        selectedText: textMenu.selectedText || '',
                    });
                } else {
                    setExternalComment({
                        type: 'highlight',
                        x: textMenu.nx,
                        y: textMenu.ny,
                        w: 0.15,
                        h: 0.03,
                        selectedText: textMenu.selectedText || '',
                    });
                }
                window.getSelection()?.removeAllRanges();
                setTextMenu(null);
                return;
            }
            if (action === 'comment') {
                setExternalComment({
                    x: textMenu.selectionRect ? textMenu.selectionRect.x : textMenu.nx,
                    y: textMenu.selectionRect ? textMenu.selectionRect.y : textMenu.ny,
                    selectedText: textMenu.selectedText || '',
                    type: 'comment',
                });
                window.getSelection()?.removeAllRanges();
                setTextMenu(null);
                return;
            }
            if (action === 'margin') {
                setExternalComment({
                    x: 0.85,
                    y: textMenu.selectionRect ? textMenu.selectionRect.y : textMenu.ny,
                    selectedText: textMenu.selectedText || '',
                    type: 'margin',
                });
                window.getSelection()?.removeAllRanges();
                setTextMenu(null);
            }
        };

        const totalAnnotationCount =
            (pdfAnnotations[GLOBAL_KEY] || []).length +
            Object.entries(pdfAnnotations)
                .filter(([k]) => k !== GLOBAL_KEY)
                .reduce((s, [, l]) => s + (l?.length || 0), 0);

        return (
            <PdfViewer
                viewSubmission={viewSubmission}
                activeTrackingId={activeTrackingId}
                proposedTitleId={proposedTitleId}
                pdfBlobUrl={pdfBlobUrl}
                pdfBlobLoading={pdfBlobLoading}
                pdfBlobError={pdfBlobError}
                pdfAnnotations={pdfAnnotations}
                setPdfAnnotations={setPdfAnnotations}
                annotationTool={annotationTool}
                setAnnotationTool={setAnnotationTool}
                annotationColor={annotationColor}
                setAnnotationColor={setAnnotationColor}
                annotationPageNum={annotationPageNum}
                setAnnotationPageNum={setAnnotationPageNum}
                pdfNumPages={pdfNumPages}
                setPdfNumPages={setPdfNumPages}
                pdfScale={pdfScale}
                setPdfScale={setPdfScale}
                pdfPageSize={pdfPageSize}
                setPdfPageSize={setPdfPageSize}
                textMenu={textMenu}
                setTextMenu={setTextMenu}
                externalComment={externalComment}
                setExternalComment={setExternalComment}
                hoveredAnnotationId={hoveredAnnotationId}
                setHoveredAnnotationId={setHoveredAnnotationId}
                canAnnotate={canAnnotate}
                effectiveReadOnly={effectiveReadOnly}
                splitContainerRef={splitContainerRef}
                anchorRefs={anchorRefs}
                cardRefs={cardRefs}
                isSavingPdf={isSavingPdf}
                totalAnnotationCount={totalAnnotationCount}
                onBack={handleBackToList}
                onSavePdf={handleSaveAnnotatedPdf}
                onRetryFetch={() => {
                    setPdfBlobError(null);
                    setPdfBlobLoading(true);
                    GetPdfBlobUrl(activeTrackingId)
                        .then((url) => {
                            if (url) setPdfBlobUrl(url);
                            else setPdfBlobError('Failed to load PDF');
                            setPdfBlobLoading(false);
                        })
                        .catch((err) => {
                            setPdfBlobError(err.message || 'Failed to load PDF');
                            setPdfBlobLoading(false);
                        });
                }}
                onAddPageComment={handleAddPageComment}
                onAddGlobalComment={handleAddGlobalComment}
                onClearPage={handleClearPageViaContext}
                onClearGlobalAnnotations={handleClearGlobalAnnotations}
                onEraseFromSidebar={handleEraseFromSidebar}
                onContextAction={handleContextAction}
                refreshComments={refreshComments}
                showNotification={showNotification}
            />
        );
    }

    // ═══════════════════════════════════════════════════════════
    // RENDER — LIST MODE
    // ═══════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-blue-50 text-blue-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                {/* Toast */}
                {toastMessage && (
                    <div
                        className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 text-white text-xs font-medium rounded-xl shadow-2xl ${
                            toastMessage.isError ? 'bg-red-600' : 'bg-slate-900'
                        }`}
                    >
                        <span>{toastMessage.msg}</span>
                    </div>
                )}

                {/* === HEADER === */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-col max-w-3xl">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight">
                            Proposed Research Topics
                        </h1>
                        <p className="text-sm text-blue-600 mt-1 leading-relaxed">
                            Review, evaluate, and monitor thesis topic submissions, problem statements, and
                            academic scope approval for assigned candidate groups.
                        </p>
                    </div>
                </div>

                {customError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        {customError}
                    </div>
                )}

                {/* === FILTER TOOLBAR === */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200 flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search topic titles, keywords, methodologies, or research groups..."
                                className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-blue-50 text-sm text-blue-900 placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <select className="appearance-none bg-blue-50 pl-3.5 pr-8 py-2.5 rounded-lg text-[11px] font-semibold text-blue-800 cursor-pointer focus:outline-none border border-blue-200">
                                    <option>Track: All</option>
                                </select>
                            </div>
                            <div className="relative">
                                <select className="appearance-none bg-blue-50 pl-3.5 pr-8 py-2.5 rounded-lg text-[11px] font-semibold text-blue-800 cursor-pointer focus:outline-none border border-blue-200">
                                    <option>Adviser: All</option>
                                </select>
                            </div>
                            <button className="flex items-center gap-1 px-3 py-2.5 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all">
                                <ArrowDownUp className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-[11px] font-semibold text-blue-800">Priority</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key)}
                                className={`px-4 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                    activeTab === t.key
                                        ? 'bg-amber-500 text-white shadow-sm'
                                        : 'text-blue-600 hover:text-blue-900 hover:bg-blue-50'
                                }`}
                            >
                                <span>{t.label}</span>
                                {t.count > 0 && (
                                    <span
                                        className={`px-1.5 rounded-full text-[10px] font-bold ${
                                            activeTab === t.key
                                                ? 'bg-blue-900 text-amber-400'
                                                : 'bg-blue-100 text-blue-700'
                                        }`}
                                    >
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* === MAIN GRID === */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* LEFT: LIST */}
                    <div className="xl:col-span-7 flex flex-col gap-4">
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-blue-200 flex flex-col">
                            <div className="px-5 py-4 bg-white flex items-center justify-between border-b border-blue-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-blue-900">
                                        Assigned Review Topics
                                    </span>
                                    <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded text-blue-700 font-bold">
                                        Live Data
                                    </span>
                                </div>
                                <span className="text-[10px] text-blue-500">
                                    Showing {filteredTopics.length} of {totalProposedTitles || 0}
                                </span>
                            </div>

                            <div className="flex flex-col divide-y divide-blue-100">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                        <span className="ml-3 text-sm text-blue-600">Loading topics...</span>
                                    </div>
                                ) : filteredTopics.length === 0 ? (
                                    <div className="p-8 text-center text-blue-400">
                                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No topics match your filters.</p>
                                    </div>
                                ) : (
                                    filteredTopics.map((t) => (
                                        <TopicListItem
                                            key={t._id}
                                            topic={t}
                                            isActive={t._id === selectedId}
                                            onClick={handleSelect}
                                            onViewManuscript={handleOpenPdfViewer}
                                        />
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-blue-50 flex items-center justify-between border-t border-blue-100">
                                <span className="text-[10px] text-blue-500">
                                    Page {currentPage || 1} of {totalPages} • {totalProposedTitles || 0} records
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                                        disabled={(currentPage || 1) <= 1 || isLoading}
                                        className="w-8 h-8 rounded flex items-center justify-center text-blue-400 hover:bg-blue-100 disabled:opacity-40"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-8 h-8 rounded bg-blue-900 text-white text-[11px] font-bold flex items-center justify-center">
                                        {currentPage || 1}
                                    </span>
                                    <button
                                        onClick={() =>
                                            (currentPage || 1) < totalPages &&
                                            setCurrentPage((currentPage || 1) + 1)
                                        }
                                        disabled={(currentPage || 1) >= totalPages || isLoading}
                                        className="w-8 h-8 rounded flex items-center justify-center text-blue-400 hover:bg-blue-100 disabled:opacity-40"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: DOSSIER */}
                    <div className="xl:col-span-5 flex flex-col gap-4 sticky top-4">
                        {!selectedTopic ? (
                            <div className="bg-white rounded-xl shadow-md p-8 border border-blue-200 text-center">
                                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-blue-300" />
                                <p className="text-sm text-blue-500">Select a topic to view dossier.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-blue-200">
                                <div className="p-5 bg-blue-50 flex flex-col gap-2 border-b border-blue-200">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                                            Selected Topic Dossier
                                        </span>
                                        <div className="flex items-center gap-1 text-blue-500">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-[10px] font-mono">
                                                Submitted: {formatDate(selectedTopic.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-base font-bold text-blue-900 leading-tight">
                                        {selectedTopic.title || 'Untitled'}
                                    </h3>
                                    <div className="flex items-center gap-2 text-blue-500 flex-wrap">
                                        <span className="text-[11px] font-bold text-amber-600 font-mono">
                                            {selectedTopic._id?.slice(-8).toUpperCase() || 'N/A'}
                                        </span>
                                        <span className="text-blue-300">•</span>
                                        <span className="text-[11px] font-medium text-blue-900">
                                            {selectedTopic.groupInfo?.name ||
                                                selectedTopic.groupName ||
                                                'Unnamed Group'}
                                        </span>
                                        <span className="text-blue-300">•</span>
                                        <span className="text-[11px] text-blue-800 font-bold">
                                            {selectedTopic.isRevesion ? 'Revised' : 'Original'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleOpenPdfViewer(selectedTopic)}
                                        className="self-start mt-1 text-[11px] text-blue-700 font-semibold flex items-center gap-1 hover:underline"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        View Full Manuscript (PDF)
                                    </button>
                                </div>

                                <div className="p-5 flex flex-col gap-5">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-blue-900 font-bold uppercase tracking-wider">
                                                Problem Statement &amp; Scope
                                            </span>
                                            <button
                                                onClick={() => handleOpenPdfViewer(selectedTopic)}
                                                className="text-[10px] text-amber-600 hover:underline font-semibold flex items-center gap-0.5"
                                            >
                                                View Full
                                                <ExternalLink className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-blue-700 leading-relaxed bg-blue-50 p-3 rounded-lg">
                                            {selectedTopic.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    {Array.isArray(selectedTopic.objectives) &&
                                        selectedTopic.objectives.length > 0 && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] text-blue-900 font-bold uppercase tracking-wider">
                                                    Key Objectives &amp; Milestones
                                                </span>
                                                <div className="space-y-2 mt-1">
                                                    {selectedTopic.objectives.map((obj, i) => (
                                                        <label
                                                            key={i}
                                                            className="flex items-start gap-2 bg-blue-50 p-2.5 rounded-lg cursor-pointer"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                defaultChecked={obj.completed}
                                                                className="mt-1 accent-blue-700"
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-semibold text-blue-900">
                                                                    {i + 1}. {obj.title || obj}
                                                                </span>
                                                                {obj.detail && (
                                                                    <span className="text-[10px] text-blue-500">
                                                                        {obj.detail}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    {selectedTopic.sdg && (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                                            <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                                                <Globe className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-blue-500 font-bold uppercase">
                                                    SDG &amp; Institutional Target
                                                </span>
                                                <span className="text-[11px] font-semibold text-blue-900">
                                                    {selectedTopic.sdg}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-blue-900 font-bold uppercase tracking-wider">
                                                Evaluation Rubric
                                            </span>
                                            <span className="text-[10px] text-blue-500 font-mono font-semibold">
                                                Scale: 1.0 – 5.0
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <RubricStepper
                                                label="1. Scientific Significance"
                                                value={rubric.significance}
                                                onChange={(v) =>
                                                    setRubric((r) => ({ ...r, significance: v }))
                                                }
                                                tone="blue"
                                            />
                                            <RubricStepper
                                                label="2. Technical Novelty"
                                                value={rubric.novelty}
                                                onChange={(v) => setRubric((r) => ({ ...r, novelty: v }))}
                                                tone="blue"
                                            />
                                            <RubricStepper
                                                label="3. Methodology Rigor"
                                                value={rubric.rigor}
                                                onChange={(v) => setRubric((r) => ({ ...r, rigor: v }))}
                                                tone="amber"
                                            />
                                            <RubricStepper
                                                label="4. Resource Feasibility"
                                                value={rubric.feasibility}
                                                onChange={(v) =>
                                                    setRubric((r) => ({ ...r, feasibility: v }))
                                                }
                                                tone="red"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1 mt-1">
                                            <span className="text-[10px] text-blue-900 font-bold uppercase tracking-wider">
                                                Formal Panel Determination
                                            </span>
                                            <div className="space-y-1.5">
                                                <label className="flex items-center gap-2 p-2 rounded-lg bg-white hover:bg-blue-100 cursor-pointer transition-all border border-blue-100">
                                                    <input
                                                        type="radio"
                                                        name="decision"
                                                        value="endorse"
                                                        checked={decision === 'endorse'}
                                                        onChange={() => setDecision('endorse')}
                                                        className="accent-blue-700"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-semibold text-blue-900">
                                                            Endorse for Title Defense
                                                        </span>
                                                        <span className="text-[10px] text-blue-500">
                                                            Cleared to schedule oral defense
                                                        </span>
                                                    </div>
                                                </label>
                                                <label className="flex items-center gap-2 p-2 rounded-lg bg-white hover:bg-blue-100 cursor-pointer transition-all border border-blue-100">
                                                    <input
                                                        type="radio"
                                                        name="decision"
                                                        value="revision"
                                                        checked={decision === 'revision'}
                                                        onChange={() => setDecision('revision')}
                                                        className="accent-amber-500"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-amber-700">
                                                            Request Major Methodology Revision
                                                        </span>
                                                        <span className="text-[10px] text-blue-500">
                                                            Refine test parameters before re-check
                                                        </span>
                                                    </div>
                                                </label>
                                                <label className="flex items-center gap-2 p-2 rounded-lg bg-white hover:bg-blue-100 cursor-pointer transition-all border border-blue-100">
                                                    <input
                                                        type="radio"
                                                        name="decision"
                                                        value="downsize"
                                                        checked={decision === 'downsize'}
                                                        onChange={() => setDecision('downsize')}
                                                        className="accent-red-600"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-semibold text-blue-900">
                                                            Recommend Scope Downsizing
                                                        </span>
                                                        <span className="text-[10px] text-blue-500">
                                                            Restrict flight trials to simulated environment
                                                        </span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1 mt-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-blue-900 font-bold uppercase tracking-wider">
                                                    Panel Feedback
                                                </span>
                                                <span className="text-[9px] text-blue-400 font-mono">
                                                    Markdown supported
                                                </span>
                                            </div>
                                            <textarea
                                                rows={3}
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                                placeholder="Provide panel feedback..."
                                                className="w-full p-3 rounded-lg bg-white border border-blue-200 text-xs text-blue-800 placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 pt-1">
                                            <button
                                                onClick={handleSubmitEvaluation}
                                                className="flex-1 py-2.5 px-4 rounded-lg bg-blue-900 text-white text-[11px] font-bold hover:bg-blue-800 shadow-sm flex items-center justify-center gap-1.5 transition-all"
                                            >
                                                <Gavel className="w-3.5 h-3.5" />
                                                Submit Evaluation
                                            </button>
                                            <button
                                                onClick={handleSaveDraft}
                                                className="py-2.5 px-4 rounded-lg bg-white border border-blue-200 text-blue-800 text-[11px] font-bold hover:bg-blue-50 transition-all flex items-center gap-1"
                                            >
                                                <Save className="w-3.5 h-3.5" />
                                                Save Draft
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                            <Shield className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-blue-900">
                                    Institutional Governance Rule 4.2
                                </span>
                                <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">
                                    Proposed topics require concurrence from at least 2 assigned panel reviewers
                                    and both mentors before advancing to the Title Defense Calendar.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}