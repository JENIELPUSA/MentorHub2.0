import React, { useState, useEffect, useCallback, useContext } from 'react';
import { ProposedTitleContext } from '../../contexts/ProposedTitleContext/ProposedTitleContext';
import { Document, Page, pdfjs } from 'react-pdf';
import {
    Search, Eye, CheckCircle2, XCircle, Clock,
    ChevronLeft, ChevronRight, FileText, Download,
    RefreshCw, UserCheck, User, Loader2, ArrowLeft,
    MessageSquare, History, Users, Shield, CalendarDays
} from 'lucide-react';

import { AuthContext } from '../../contexts/AuthContext';
import { CommentContext } from '../../contexts/CommentContext/CommentContext';

import DetailsModal from './DetailsModal';
import CommentsSidebar from './CommentsSidebar';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// ============================================================
// HELPERS
// ============================================================
const getActualDisplayStatus = (item) => {
    if (item.status === 'Ready for Defense') return 'Ready for Defense';
    if (item.status === 'for_schedule') return 'For Schedule';

    if (item.status === 'Approved') {
        if (item.adviser === true && item.coAdviser === true) return 'Confirmed';
        if (item.adviser === true && item.coAdviser === false) return 'Waiting for Co-Adviser Confirmation';
        if (item.adviser === false && item.coAdviser === true) return 'Waiting for Adviser Confirmation';
        return 'Pending Review';
    }
    return item.status || 'Pending';
};

const getStatusBadgeClass = (displayStatus) => {
    const badges = {
        'Confirmed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
        'Rejected': 'bg-rose-100 text-rose-800 border-rose-200',
        'Revision': 'bg-purple-100 text-purple-800 border-purple-200',
        'Waiting for Adviser Confirmation': 'bg-blue-100 text-blue-800 border-blue-200',
        'Waiting for Co-Adviser Confirmation': 'bg-indigo-100 text-indigo-800 border-indigo-200',
        'Pending Review': 'bg-slate-100 text-slate-800 border-slate-200',
        'Ready for Defense': 'bg-teal-100 text-teal-800 border-teal-200',
        'For Schedule': 'bg-cyan-100 text-cyan-800 border-cyan-200'
    };
    return badges[displayStatus] || 'bg-slate-100 text-slate-800 border-slate-200';
};

const getStatusIconComponent = (displayStatus) => {
    switch (displayStatus) {
        case 'Confirmed': return <CheckCircle2 className="w-3.5 h-3.5" />;
        case 'Pending': return <Clock className="w-3.5 h-3.5" />;
        case 'Rejected': return <XCircle className="w-3.5 h-3.5" />;
        case 'Revision': return <RefreshCw className="w-3.5 h-3.5" />;
        case 'Waiting for Adviser Confirmation': return <User className="w-3.5 h-3.5" />;
        case 'Waiting for Co-Adviser Confirmation': return <UserCheck className="w-3.5 h-3.5" />;
        case 'Pending Review': return <Users className="w-3.5 h-3.5" />;
        case 'Ready for Defense': return <Shield className="w-3.5 h-3.5" />;
        case 'For Schedule': return <CalendarDays className="w-3.5 h-3.5" />;
        default: return <Clock className="w-3.5 h-3.5" />;
    }
};

const getRoleBadgeColor = (role) => {
    if (!role) return 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300';
    const roleMap = {
        'adviser': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        'coadviser': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
        'co-adviser': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
        'admin': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        'organizer': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    };
    return roleMap[role.toLowerCase()] || 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300';
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const getActionBadgeClass = (action) => {
    switch (action?.toLowerCase()) {
        case 'create': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'revision': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
        case 'ready for defense': return 'bg-teal-100 text-teal-700 border-teal-200';
        case 'for schedule': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
};

const formatCommentDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

// ============================================================
// STATUS STEPPER COMPONENT
// ============================================================
const STATUS_STEPS = [
    { key: 'Pending', label: 'Pending', icon: Clock },
    { key: 'Confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'For Schedule', label: 'For Schedule', icon: CalendarDays },
    { key: 'Ready for Defense', label: 'Ready for Defense', icon: Shield },
];

const getStepIndexFromStatus = (status) => {
    if (status === 'Ready for Defense') return 3;
    if (status === 'for_schedule') return 2;
    if (status === 'Approved') return 1;
    return 0;
};

const StatusStepper = ({ status, compact = false }) => {
    const currentStep = getStepIndexFromStatus(status);
    const isTerminalNegative = status === 'Rejected' || status === 'Revision';
    const isFullyDone = status === 'Ready for Defense';

    return (
        <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
            {STATUS_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = isFullyDone ? true : index < currentStep;
                const isActive = !isFullyDone && index === currentStep;
                const isRejected = isActive && isTerminalNegative;

                let circleClass = 'bg-slate-100 text-slate-400 border-slate-200';
                if (isCompleted) circleClass = 'bg-emerald-500 text-white border-emerald-500';
                if (isActive && !isRejected) circleClass = 'bg-blue-500 text-white border-blue-500 ring-2 ring-blue-200';
                if (isRejected) circleClass = 'bg-rose-500 text-white border-rose-500 ring-2 ring-rose-200';

                const lineClass = isFullyDone || index < currentStep ? 'bg-emerald-500' : 'bg-slate-200';

                return (
                    <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center">
                            <div
                                className={`flex items-center justify-center rounded-full border-2 transition-all ${circleClass} ${compact ? 'w-6 h-6' : 'w-8 h-8'}`}
                                title={step.label}
                            >
                                {isCompleted ? (
                                    <CheckCircle2 className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
                                ) : (
                                    <Icon className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
                                )}
                            </div>
                            {!compact && (
                                <span className={`mt-1 text-[10px] font-medium whitespace-nowrap ${isCompleted || isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                                    {step.label}
                                </span>
                            )}
                        </div>
                        {index < STATUS_STEPS.length - 1 && (
                            <div className={`h-0.5 ${compact ? 'w-4' : 'w-6 md:w-8'} ${lineClass} rounded-full transition-all`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ============================================================
// CONFIRMATION MODAL COMPONENT
// ============================================================
const ConfirmModal = ({ isOpen, config, onConfirm, onCancel, isLoading }) => {
    if (!isOpen || !config) return null;

    const colorClasses = {
        emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', button: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500', border: 'border-emerald-200' },
        purple: { bg: 'bg-purple-50', icon: 'text-purple-600', button: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500', border: 'border-purple-200' },
        rose: { bg: 'bg-rose-50', icon: 'text-rose-600', button: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500', border: 'border-rose-200' },
        teal: { bg: 'bg-teal-50', icon: 'text-teal-600', button: 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500', border: 'border-teal-200' },
        cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', button: 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500', border: 'border-cyan-200' }
    };

    const c = colorClasses[config.color] || colorClasses.emerald;
    const IconComponent = config.icon || CheckCircle2;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={isLoading ? undefined : onCancel} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
                <div className={`${c.bg} px-6 py-5 border-b ${c.border}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${c.icon}`}>
                            <IconComponent className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{config.title}</h3>
                    </div>
                </div>

                <div className="p-6 space-y-3">
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{config.message}</p>
                    {config.itemTitle && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Submission Title</p>
                            <p className="text-sm font-medium text-slate-800 line-clamp-2">{config.itemTitle}</p>
                        </div>
                    )}
                    {config.warning && (
                        <div className={`text-xs px-3 py-2 rounded-lg ${c.bg} ${c.icon} border ${c.border} font-medium`}>
                            {config.warning}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <button onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={isLoading} className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition inline-flex items-center gap-2 ${c.button}`}>
                        {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>) : (config.confirmLabel || 'Confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ProposedTitle() {
    const {
        proposedTitles, isLoading: contextLoading, totalPages,
        currentPage: contextCurrentPage, setCurrentPage: setContextCurrentPage,
        limit, search, setSearch, statusFilter, setStatusFilter,
        dateFrom, dateTo, groupIdFilter, totalProposedTitles,
        FetchProposedTitles, UpdateProposedTitle, customError
    } = useContext(ProposedTitleContext);

    const { userId, role } = useContext(AuthContext);
    const { CreateComment } = useContext(CommentContext);

    console.log("🔑 AUTH DEBUG → role:", role, "| userId:", userId);

    const normalizedRole = (role || '').toLowerCase().trim();

    const [localSearchTerm, setLocalSearchTerm] = useState(search || '');
    const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter || 'All');
    const [rowsPerPage, setRowsPerPage] = useState(limit || 5);

    const [modalItem, setModalItem] = useState(null);
    const [viewSubmission, setViewSubmission] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState(null);
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
    const [useIframe, setUseIframe] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, config: null, onConfirm: null, itemId: null, newStatus: null
    });
    const [isProcessing, setIsProcessing] = useState(false);

    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [localComments, setLocalComments] = useState([]);
    const [activeTrackingId, setActiveTrackingId] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearchTerm !== search) {
                setSearch(localSearchTerm);
                setContextCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localSearchTerm, search, setSearch, setContextCurrentPage]);

    useEffect(() => {
        const backendStatus = localStatusFilter === 'All' ? '' : localStatusFilter;
        if (backendStatus !== statusFilter) {
            setStatusFilter(backendStatus);
            setContextCurrentPage(1);
        }
    }, [localStatusFilter, statusFilter, setStatusFilter, setContextCurrentPage]);

    useEffect(() => {
        if (viewSubmission && viewSubmission.comments) {
            const sorted = [...viewSubmission.comments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            setLocalComments(sorted);
        } else {
            setLocalComments([]);
        }
    }, [viewSubmission]);

    const handleRowsPerPageChange = (e) => {
        const newLimit = parseInt(e.target.value);
        setRowsPerPage(newLimit);
        setContextCurrentPage(1);
        FetchProposedTitles(1, newLimit, search, dateFrom, dateTo, statusFilter, groupIdFilter);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= (totalPages || 1)) {
            setContextCurrentPage(newPage);
            FetchProposedTitles(newPage, rowsPerPage, search, dateFrom, dateTo, statusFilter, groupIdFilter);
        }
    };

    // ============================================================
    // IDENTITY HELPERS
    // ============================================================
    const isUserAdviser = useCallback((item) => {
        if (!item || !userId) return false;
        const groupInfo = item.groupInfo || {};

        const candidates = [
            groupInfo.adviserId,
            groupInfo.adviser?._id,
            groupInfo.adviser,
            groupInfo.assignedMentor?.[0]?._id,
            groupInfo.assignedMentor?.[0],
            groupInfo.mentorId,
            groupInfo.mentor?._id,
            groupInfo.mentor,
            item.adviserId,
            item.adviser?._id
        ]
            .filter(Boolean)
            .map(id => (typeof id === 'object' ? id._id : id))
            .filter(Boolean)
            .map(id => String(id));

        return candidates.includes(String(userId));
    }, [userId]);

    const isUserCoAdviser = useCallback((item) => {
        if (!item || !userId) return false;
        const groupInfo = item.groupInfo || {};

        const candidates = [
            groupInfo.coAdviserId,
            groupInfo.coadviserId,
            groupInfo.coAdviser?._id,
            groupInfo.coAdviser,
            groupInfo.coadviser?._id,
            groupInfo.coadviser,
            groupInfo.assignedMentor?.[1]?._id,
            groupInfo.assignedMentor?.[1],
            item.coAdviserId,
            item.coAdviser?._id
        ]
            .filter(Boolean)
            .map(id => (typeof id === 'object' ? id._id : id))
            .filter(Boolean)
            .map(id => String(id));

        return candidates.includes(String(userId));
    }, [userId]);

    const buildConfirmConfig = (newStatus, item) => {
        switch (newStatus) {
            case 'Approved':
                return {
                    title: 'Confirm Submission',
                    message: 'Are you sure you want to CONFIRM this submission?',
                    itemTitle: item?.title,
                    warning: 'Once confirmed, this will be counted as your approval.',
                    confirmLabel: 'Yes, Confirm',
                    color: 'emerald', icon: CheckCircle2
                };
            case 'Revision':
                return {
                    title: 'Request Revision',
                    message: 'Are you sure you want to request a REVISION for this submission?',
                    itemTitle: item?.title,
                    warning: 'The student will be notified to revise their submission.',
                    confirmLabel: 'Yes, Request Revision',
                    color: 'purple', icon: RefreshCw
                };
            case 'Rejected':
                return {
                    title: 'Reject Submission',
                    message: 'Are you sure you want to REJECT this submission?',
                    itemTitle: item?.title,
                    warning: '⚠️ This action cannot be undone.',
                    confirmLabel: 'Yes, Reject',
                    color: 'rose', icon: XCircle
                };
            case 'for_schedule':
                return {
                    title: 'Set For Schedule',
                    message: 'Are you sure you want to mark this submission as FOR SCHEDULE?',
                    itemTitle: item?.title,
                    warning: 'This will move the submission to the scheduling stage.',
                    confirmLabel: 'Yes, Set For Schedule',
                    color: 'cyan', icon: CalendarDays
                };
            default:
                return {
                    title: 'Confirm Action',
                    message: `Are you sure you want to set this submission to "${newStatus}"?`,
                    itemTitle: item?.title,
                    confirmLabel: 'Confirm',
                    color: 'emerald', icon: CheckCircle2
                };
        }
    };

    const handleStatusChange = (id, newStatus) => {
        try {
            const item = currentRows.find(r => String(r._id) === String(id));
            if (!item) {
                showNotification('❌ Submission not found', true);
                return;
            }

            const userIsAdviser = isUserAdviser(item);
            const userIsCoAdviser = isUserCoAdviser(item);
            const isPrivileged = ['admin', 'organizer'].includes(normalizedRole);

            if (newStatus === 'for_schedule') {
                // ⭐ Simple: adviser role lang + status Approved
                if (normalizedRole !== 'adviser') {
                    showNotification('❌ Only the Adviser can set this to For Schedule', true);
                    return;
                }
                if (item.status !== 'Approved') {
                    showNotification('⚠️ Submission must be in Approved status first', true);
                    return;
                }
            } else {
                if (!userIsAdviser && !userIsCoAdviser && !isPrivileged) {
                    showNotification('❌ You are not allowed to act on this submission', true);
                    return;
                }

                if (userIsAdviser && item.adviser === true) {
                    showNotification('⚠️ You have already confirmed this submission', true);
                    return;
                }
                if (userIsCoAdviser && item.coAdviser === true) {
                    showNotification('⚠️ You have already confirmed this submission', true);
                    return;
                }
            }

            setConfirmModal({
                isOpen: true,
                config: buildConfirmConfig(newStatus, item),
                onConfirm: () => executeStatusChange(id, newStatus),
                itemId: id, newStatus
            });
        } catch (error) {
            showNotification(`❌ Failed: ${error.message}`, true);
        }
    };

    const executeStatusChange = async (id, newStatus) => {
        setIsProcessing(true);
        try {
            const result = await UpdateProposedTitle(id, { status: newStatus });
            if (result.success) {
                const displayLabel =
                    newStatus === 'Approved' ? 'Confirmed' :
                    newStatus === 'for_schedule' ? 'For Schedule' :
                    newStatus;
                showNotification(`✅ Submission ${displayLabel} successfully!`);
                FetchProposedTitles(contextCurrentPage, rowsPerPage, search, dateFrom, dateTo, statusFilter, groupIdFilter);
            } else {
                showNotification(`❌ Failed to update status: ${result.error || 'Unknown error'}`, true);
            }
        } catch (error) {
            showNotification(`❌ Failed to update status: ${error.message}`, true);
        } finally {
            setIsProcessing(false);
            setConfirmModal({ isOpen: false, config: null, onConfirm: null, itemId: null, newStatus: null });
        }
    };

    const handleCancelConfirm = () => {
        if (isProcessing) return;
        setConfirmModal({ isOpen: false, config: null, onConfirm: null, itemId: null, newStatus: null });
    };

    const handleConfirmModal = () => {
        if (confirmModal.onConfirm) confirmModal.onConfirm();
    };

    const handleReadyForDefense = async (id) => {
        const allowedRoles = ['subject_instructor', 'admin', 'organizer'];
        if (!allowedRoles.includes(normalizedRole)) {
            showNotification('❌ You are not allowed to mark this as Ready for Defense', true);
            return;
        }

        if (!window.confirm('Mark this submission as Ready for Defense?')) return;

        try {
            const item = currentRows.find(r => String(r._id) === String(id));
            if (!item) {
                showNotification('❌ Submission not found', true);
                return;
            }

            if (!(item.adviser === true && item.coAdviser === true)) {
                showNotification('⚠️ Both Adviser and Co-Adviser must confirm first', true);
                return;
            }

            const result = await UpdateProposedTitle(id, { status: 'Ready for Defense' });
            if (result.success) {
                showNotification('🛡️ Submission marked as Ready for Defense!');
                FetchProposedTitles(contextCurrentPage, rowsPerPage, search, dateFrom, dateTo, statusFilter, groupIdFilter);
            } else {
                showNotification(`❌ Failed: ${result.error || 'Unknown error'}`, true);
            }
        } catch (error) {
            showNotification(`❌ Failed: ${error.message}`, true);
        }
    };

    const showNotification = (msg, isError = false) => {
        setToastMessage({ msg, isError });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleOpenModal = (item) => setModalItem(item);
    const handleCloseModal = () => setModalItem(null);

    const handleOpenPdfViewer = (item, urlOverride, trackingId = null) => {
        setModalItem(null);
        setViewSubmission(item);
        setIsViewMode(true);
        setNumPages(null);
        setPageNumber(1);
        setPdfError(null);
        setPdfBlobUrl(null);
        setUseIframe(false);
        setCommentText('');
        setIsSidebarOpen(true);
        setActiveTrackingId(trackingId);

        if (trackingId) {
            const trackingComments = (item.commentsByTracking && item.commentsByTracking[trackingId]) ||
                (Array.isArray(item.titleUrlTracking) ? item.titleUrlTracking.find(t => t._id === trackingId)?.comments : null) || [];
            setLocalComments([...trackingComments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
        } else if (item.comments) {
            setLocalComments([...item.comments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
        } else {
            setLocalComments([]);
        }

        const fileUrl = urlOverride || item.fileUrl;
        if (!fileUrl) {
            setIsPdfLoading(false);
            setPdfError('No file attached to this submission');
            return;
        }
        if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
            setIsPdfLoading(false);
            setPdfError('Invalid file URL');
            return;
        }
        fetchPdfAsBlob(fileUrl);
    };

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setIsPdfLoading(false);
        setPdfError(null);
        setUseIframe(false);
    };

    const onDocumentLoadError = (error) => {
        console.error('PDF load error:', error);
        setIsPdfLoading(false);
        setPdfError('Failed to load PDF with react-pdf. Trying alternative viewer...');
        setUseIframe(true);
    };

    const fetchPdfAsBlob = async (url) => {
        try {
            setIsPdfLoading(true);
            setPdfError(null);
            setUseIframe(false);

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/pdf, application/octet-stream, */*' },
                credentials: 'include'
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const blob = await response.blob();
            setPdfBlobUrl(URL.createObjectURL(blob));
        } catch (error) {
            console.error('Error fetching PDF:', error);
            setPdfError(`Failed to load PDF: ${error.message}`);
            setIsPdfLoading(false);
            setUseIframe(true);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) {
            showNotification('Please enter a comment', true);
            return;
        }
        if (!viewSubmission) {
            showNotification('No submission selected', true);
            return;
        }

        const targetId = activeTrackingId || viewSubmission._id;
        if (!targetId) {
            showNotification('No target ID for comment', true);
            return;
        }

        setIsSubmittingComment(true);
        try {
            const result = await CreateComment(targetId, commentText);
            if (result?.success === true) {
                setCommentText('');
                const newComment = result.data || result.comment;
                if (newComment) setLocalComments(prev => [...prev, newComment]);
                showNotification('Comment added successfully!');
                FetchProposedTitles();
            } else {
                showNotification(`Failed to add comment: ${result?.error || 'Unknown error'}`, true);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            showNotification(`❌ Failed to add comment: ${error.message}`, true);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;

        try {
            const response = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
            if (response.ok) {
                setLocalComments(prev => prev.filter(c => c._id !== commentId));
                setViewSubmission(prev => ({
                    ...prev,
                    comments: prev.comments?.filter(c => c._id !== commentId) || [],
                    commentCount: (prev.commentCount || 1) - 1
                }));
                showNotification('Comment deleted successfully!');
            } else {
                showNotification('Failed to delete comment', true);
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            showNotification('Failed to delete comment', true);
        }
    };

    const isCommentOwner = (comment) => {
        const commentUserId = comment.userId?._id || comment.userId || comment.author?._id;
        return commentUserId && commentUserId === userId;
    };

    const handleBackToList = () => {
        setIsViewMode(false);
        setViewSubmission(null);
        setNumPages(null);
        setPageNumber(1);
        setPdfBlobUrl(null);
        setUseIframe(false);
        setPdfError(null);
        setCommentText('');
        setLocalComments([]);
        setActiveTrackingId(null);
    };

    const isLoading = contextLoading;
    const currentRows = proposedTitles || [];
    const totalCount = totalProposedTitles || 0;
    const totalPagesCount = totalPages || 1;

    const startItem = totalCount === 0 ? 0 : (contextCurrentPage - 1) * rowsPerPage + 1;
    const endItem = Math.min(contextCurrentPage * rowsPerPage, totalCount);

    // ============================================================
    // GET AVAILABLE ACTIONS
    // ============================================================
    const getAvailableActions = (item) => {
        const { status, adviser, coAdviser } = item;

        const userIsAdviser = isUserAdviser(item);
        const userIsCoAdviser = isUserCoAdviser(item);

        const bothApproved = adviser === true && coAdviser === true;
        const isReady = status === 'Ready for Defense';
        const isForSchedule = status === 'for_schedule';
        const isApprovedStatus = status === 'Approved';
        const fullyApproved = isApprovedStatus && bothApproved;
        const isRejected = status === 'Rejected';

        const canMarkReadyForDefense =
            ['subject_instructor', 'admin', 'organizer'].includes(normalizedRole);

        if (normalizedRole === 'student') {
            return {
                showApprove: false, showReject: false, showRevision: false,
                showReadyForDefense: false, showForSchedule: false,
                isFullyApproved: fullyApproved, isReadyForDefense: isReady,
                isForSchedule, canAct: false, alreadyApproved: false
            };
        }

        if (normalizedRole === 'subject_instructor') {
            return {
                showApprove: false, showReject: false, showRevision: false,
                showReadyForDefense: canMarkReadyForDefense && (fullyApproved || isForSchedule) && !isReady,
                showForSchedule: false,
                isFullyApproved: fullyApproved, isReadyForDefense: isReady,
                isForSchedule,
                canAct: canMarkReadyForDefense && (fullyApproved || isForSchedule) && !isReady,
                alreadyApproved: false
            };
        }

        if (isReady) {
            return {
                showApprove: false, showReject: false, showRevision: false,
                showReadyForDefense: false, showForSchedule: false,
                isFullyApproved: true, isReadyForDefense: true,
                isForSchedule: false, canAct: false, alreadyApproved: false
            };
        }

        if (isForSchedule) {
            return {
                showApprove: false, showReject: false, showRevision: false,
                showReadyForDefense: canMarkReadyForDefense,
                showForSchedule: false,
                isFullyApproved: true, isReadyForDefense: false,
                isForSchedule: true,
                canAct: canMarkReadyForDefense, alreadyApproved: false
            };
        }

        if (isRejected) {
            return {
                showApprove: false, showReject: false, showRevision: false,
                showReadyForDefense: false, showForSchedule: false,
                isFullyApproved: false, isReadyForDefense: false,
                isForSchedule: false, canAct: false, alreadyApproved: false
            };
        }

        // ⭐ FULLY APPROVED
        if (fullyApproved) {
            return {
                showApprove: false, showReject: false, showRevision: false,
                showReadyForDefense: canMarkReadyForDefense && !userIsAdviser,
                showForSchedule: normalizedRole === 'adviser', // ⭐ SIMPLE: role lang
                isFullyApproved: true, isReadyForDefense: false,
                isForSchedule: false,
                canAct: canMarkReadyForDefense || normalizedRole === 'adviser',
                alreadyApproved: false
            };
        }

        if (userIsAdviser) {
            if (adviser === true) {
                return {
                    showApprove: false, showReject: false, showRevision: false,
                    showReadyForDefense: false, showForSchedule: false,
                    isFullyApproved: false, isReadyForDefense: false,
                    isForSchedule: false, canAct: false, alreadyApproved: true
                };
            }
            return {
                showApprove: true, showReject: true, showRevision: true,
                showReadyForDefense: false, showForSchedule: false,
                isFullyApproved: false, isReadyForDefense: false,
                isForSchedule: false, canAct: true, alreadyApproved: false
            };
        }

        if (userIsCoAdviser) {
            if (coAdviser === true) {
                return {
                    showApprove: false, showReject: false, showRevision: false,
                    showReadyForDefense: false, showForSchedule: false,
                    isFullyApproved: false, isReadyForDefense: false,
                    isForSchedule: false, canAct: false, alreadyApproved: true
                };
            }
            return {
                showApprove: true, showReject: true, showRevision: true,
                showReadyForDefense: false, showForSchedule: false,
                isFullyApproved: false, isReadyForDefense: false,
                isForSchedule: false, canAct: true, alreadyApproved: false
            };
        }

        if (isApprovedStatus && !bothApproved) {
            return {
                showApprove: false, showReject: true, showRevision: true,
                showReadyForDefense: false, showForSchedule: false,
                isFullyApproved: false, isReadyForDefense: false,
                isForSchedule: false, canAct: true, alreadyApproved: false
            };
        }

        return {
            showApprove: status !== 'Approved' && status !== 'Rejected' && status !== 'Revision' && status !== 'Ready for Defense' && status !== 'for_schedule',
            showReject: status !== 'Rejected' && status !== 'Approved' && status !== 'Ready for Defense' && status !== 'for_schedule',
            showRevision: status !== 'Revision' && status !== 'Approved' && status !== 'Ready for Defense' && status !== 'for_schedule',
            showReadyForDefense: canMarkReadyForDefense && status !== 'Ready for Defense' && status !== 'Rejected' && status !== 'Revision' && status !== 'for_schedule',
            showForSchedule: false,
            isFullyApproved: false, isReadyForDefense: false,
            isForSchedule: false,
            canAct: status !== 'Ready for Defense' && status !== 'Rejected' && status !== 'for_schedule',
            alreadyApproved: false
        };
    };

    // ============================================================
    // FULL PDF VIEWER MODE
    // ============================================================
    if (isViewMode && viewSubmission) {
        const displayComments = localComments || [];
        const commentCount = displayComments.length;

        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-900 font-sans">
                <div className="flex flex-col h-screen">
                    {toastMessage && (
                        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 text-white text-xs font-medium rounded-xl shadow-2xl animate-bounce ${toastMessage.isError ? 'bg-red-600' : 'bg-slate-900'}`}>
                            {toastMessage.isError ? <XCircle className="w-4 h-4 text-red-200" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            <span>{toastMessage.msg}</span>
                        </div>
                    )}

                    <ConfirmModal
                        isOpen={confirmModal.isOpen}
                        config={confirmModal.config}
                        onConfirm={handleConfirmModal}
                        onCancel={handleCancelConfirm}
                        isLoading={isProcessing}
                    />

                    <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 shadow-sm p-4 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button onClick={handleBackToList} className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition">
                                    <ArrowLeft className="w-5 h-5" />
                                    <span className="text-sm font-medium hidden sm:inline">Back to List</span>
                                </button>
                                <div className="h-6 w-px bg-slate-200 dark:bg-gray-600"></div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{viewSubmission.title}</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {activeTrackingId ? `Commenting on tracking: ${activeTrackingId}` : (viewSubmission.fileUrl?.split('/').pop() || 'No file')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 rounded-lg transition flex items-center gap-1">
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="hidden sm:inline">{isSidebarOpen ? 'Hide' : 'Show'} Comments</span>
                                    {commentCount > 0 && (<span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-[10px] rounded-full">{commentCount}</span>)}
                                </button>
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(getActualDisplayStatus(viewSubmission))}`}>
                                    {getStatusIconComponent(getActualDisplayStatus(viewSubmission))}
                                    <span className="ml-1.5">{getActualDisplayStatus(viewSubmission)}</span>
                                </span>
                                <div className="hidden md:block px-2">
                                    <StatusStepper status={viewSubmission.status} compact />
                                </div>
                                {viewSubmission.fileUrl && (
                                    <>
                                        <a href={viewSubmission.fileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition flex items-center gap-1">
                                            <Download className="w-4 h-4" /> Open
                                        </a>
                                        <a href={viewSubmission.fileUrl} download className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition flex items-center gap-1">
                                            <Download className="w-4 h-4" /> Download
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        <div className={`flex-1 overflow-auto p-4 bg-slate-50 dark:bg-gray-900 transition-all duration-300 ${isSidebarOpen ? 'lg:pr-0' : ''}`}>
                            <div className="max-w-5xl mx-auto">
                                {isPdfLoading ? (
                                    <div className="flex flex-col items-center justify-center h-[600px]">
                                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading PDF...</p>
                                        <button onClick={() => { if (viewSubmission?.fileUrl) window.open(viewSubmission.fileUrl, '_blank'); }} className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2">
                                            <Download className="w-4 h-4" /> Open in New Tab
                                        </button>
                                    </div>
                                ) : pdfError && useIframe ? (
                                    <div className="flex flex-col h-full">
                                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg mb-4 text-sm"><strong>Note:</strong> Using alternative viewer. {pdfError}</div>
                                        <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden" style={{ minHeight: '600px' }}>
                                            <iframe src={viewSubmission.fileUrl} className="w-full h-full" title="PDF Viewer Fallback" style={{ border: 'none', minHeight: '600px' }} />
                                        </div>
                                    </div>
                                ) : pdfError ? (
                                    <div className="flex flex-col items-center justify-center h-[600px]">
                                        <XCircle className="w-12 h-12 text-red-500" />
                                        <p className="mt-4 text-sm text-red-500">{pdfError}</p>
                                        <div className="flex gap-3 mt-4">
                                            <button onClick={() => handleOpenPdfViewer(viewSubmission)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">Retry</button>
                                            <a href={viewSubmission.fileUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2">
                                                <Download className="w-4 h-4" /> Open Directly
                                            </a>
                                        </div>
                                    </div>
                                ) : pdfBlobUrl ? (
                                    <div className="flex flex-col items-center">
                                        <Document file={pdfBlobUrl} onLoadSuccess={onDocumentLoadSuccess} onLoadError={onDocumentLoadError}
                                            loading={<div className="flex items-center justify-center h-[600px]"><Loader2 className="w-12 h-12 text-blue-500 animate-spin" /><p className="mt-4 text-sm text-slate-500">Rendering PDF...</p></div>}
                                            error={
                                                <div className="flex flex-col items-center justify-center h-[600px]">
                                                    <XCircle className="w-12 h-12 text-red-500" />
                                                    <p className="mt-4 text-sm text-red-500">Failed to render PDF</p>
                                                    <button onClick={() => { setUseIframe(true); setPdfError('Switching to alternative viewer...'); }} className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">Try Alternative Viewer</button>
                                                </div>
                                            }
                                        >
                                            <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} className="shadow-lg rounded-lg" />
                                        </Document>

                                        {numPages > 1 && (
                                            <div className="flex items-center gap-4 mt-4 p-2 bg-white dark:bg-gray-900 rounded-lg shadow">
                                                <button onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))} disabled={pageNumber <= 1} className="px-3 py-1 text-sm bg-slate-100 dark:bg-gray-700 rounded hover:bg-slate-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                                                <span className="text-sm">Page {pageNumber} of {numPages}</span>
                                                <button onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))} disabled={pageNumber >= numPages} className="px-3 py-1 text-sm bg-slate-100 dark:bg-gray-700 rounded hover:bg-slate-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <button onClick={() => setScale(prev => Math.max(prev - 0.1, 0.5))} className="px-2 py-1 text-sm bg-slate-100 dark:bg-gray-700 rounded hover:bg-slate-200 dark:hover:bg-gray-600">-</button>
                                                    <span className="text-sm">{Math.round(scale * 100)}%</span>
                                                    <button onClick={() => setScale(prev => Math.min(prev + 0.1, 2))} className="px-2 py-1 text-sm bg-slate-100 dark:bg-gray-700 rounded hover:bg-slate-200 dark:hover:bg-gray-600">+</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[600px]">
                                        <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No document loaded</p>
                                        <button onClick={() => { if (viewSubmission?.fileUrl) window.open(viewSubmission.fileUrl, '_blank'); }} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">Open Document</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <CommentsSidebar
                            isOpen={isSidebarOpen}
                            onClose={() => setIsSidebarOpen(false)}
                            comments={localComments}
                            activeTrackingId={activeTrackingId}
                            commentText={commentText}
                            setCommentText={setCommentText}
                            onSubmit={handleAddComment}
                            isSubmitting={isSubmittingComment}
                            isCommentOwner={isCommentOwner}
                            onDeleteComment={handleDeleteComment}
                            formatCommentDate={formatCommentDate}
                            getRoleBadgeColor={getRoleBadgeColor}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    // MAIN TABLE VIEW
    // ============================================================
    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                {toastMessage && (
                    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 text-white text-xs font-medium rounded-xl shadow-2xl animate-bounce ${toastMessage.isError ? 'bg-red-600' : 'bg-slate-900'}`}>
                        {toastMessage.isError ? <XCircle className="w-4 h-4 text-red-200" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        <span>{toastMessage.msg}</span>
                    </div>
                )}

                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    config={confirmModal.config}
                    onConfirm={handleConfirmModal}
                    onCancel={handleCancelConfirm}
                    isLoading={isProcessing}
                />

                <DetailsModal
                    item={modalItem}
                    onClose={handleCloseModal}
                    onOpenPdfViewer={handleOpenPdfViewer}
                    getActualDisplayStatus={getActualDisplayStatus}
                    getStatusBadgeClass={getStatusBadgeClass}
                    getStatusIconComponent={getStatusIconComponent}
                    getActionBadgeClass={getActionBadgeClass}
                    formatDate={formatDate}
                    StatusStepper={StatusStepper}
                />

                {customError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{customError}</div>
                )}

                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileText className="w-6 h-6" /></div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Submissions Management</h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                View and manage student title applications and documents
                                {totalCount > 0 && <span className="ml-2 text-blue-600 font-medium">({totalCount} total submissions)</span>}
                                {normalizedRole === 'adviser' && <span className="ml-2 text-emerald-600 font-medium">● Adviser View</span>}
                                {normalizedRole === 'coadviser' && <span className="ml-2 text-indigo-600 font-medium">● Co-Adviser View</span>}
                                {normalizedRole === 'subject_instructor' && <span className="ml-2 text-slate-600 font-medium">● Subject Instructor View</span>}
                                {normalizedRole === 'student' && <span className="ml-2 text-slate-600 font-medium">● Student View (Read-only)</span>}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Last updated: {new Date().toLocaleDateString()}</span>
                    </div>
                </header>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative md:col-span-1">
                            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                            <input type="text" placeholder="Search title, uploader, group..." value={localSearchTerm} onChange={(e) => setLocalSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                        </div>
                        <div>
                            <select value={localStatusFilter} onChange={(e) => setLocalStatusFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Confirmed</option>
                                <option value="for_schedule">For Schedule</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Revision">Revision</option>
                                <option value="Ready for Defense">Ready for Defense</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                            <div className="flex items-center gap-2 text-xs flex-wrap">
                                <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg"><Clock className="w-3 h-3" /> {currentRows.filter(s => s.status === 'Pending').length} Pending</span>
                                <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg"><CheckCircle2 className="w-3 h-3" /> {currentRows.filter(s => s.status === 'Approved' && s.adviser === true && s.coAdviser === true).length} Confirmed</span>
                                <span className="flex items-center gap-1 px-2 py-1 bg-cyan-50 text-cyan-700 rounded-lg"><CalendarDays className="w-3 h-3" /> {currentRows.filter(s => s.status === 'for_schedule').length} For Schedule</span>
                                <span className="flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-700 rounded-lg"><Shield className="w-3 h-3" /> {currentRows.filter(s => s.status === 'Ready for Defense').length} Ready</span>
                                <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg"><User className="w-3 h-3" /> {currentRows.filter(s => s.status === 'Approved' && !(s.adviser === true && s.coAdviser === true)).length} Waiting</span>
                                <span className="flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-700 rounded-lg"><XCircle className="w-3 h-3" /> {currentRows.filter(s => s.status === 'Rejected').length} Rejected</span>
                                <span className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-lg"><RefreshCw className="w-3 h-3" /> {currentRows.filter(s => s.status === 'Revision').length} Revision</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                <span className="text-sm text-slate-500">Loading submissions...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                                            <th className="py-3.5 px-4 min-w-[200px]">Title & Description</th>
                                            <th className="py-3.5 px-4 min-w-[150px]">Uploader</th>
                                            <th className="py-3.5 px-4 min-w-[150px]">Group / Course</th>
                                            <th className="py-3.5 px-4 min-w-[180px]">Adviser Status</th>
                                            <th className="py-3.5 px-4 min-w-[180px]">Status</th>
                                            <th className="py-3.5 px-4 min-w-[200px] text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {currentRows.length > 0 ? (
                                            currentRows.map((item) => {
                                                const displayStatus = getActualDisplayStatus(item);
                                                const statusBadgeClass = getStatusBadgeClass(displayStatus);
                                                const StatusIcon = getStatusIconComponent(displayStatus);

                                                const {
                                                    showApprove, showReject, showRevision,
                                                    showReadyForDefense,
                                                    canAct, alreadyApproved,
                                                    isReadyForDefense, isForSchedule
                                                } = getAvailableActions(item);

                                                const isFullyApprovedStatus =
                                                    item.status === 'Approved' &&
                                                    item.adviser === true &&
                                                    item.coAdviser === true;

                                                const isRejectedStatus = item.status === 'Rejected';

                                                const isDone =
                                                    isReadyForDefense ||
                                                    isForSchedule ||
                                                    isRejectedStatus;

                                                const canView = isFullyApprovedStatus || isReadyForDefense || isForSchedule;

                                                const userIsAdviser = isUserAdviser(item);
                                                const userIsCoAdviser = isUserCoAdviser(item);

                                                // ⭐ SIMPLE: adviser + Approved status lang
                                                const showForScheduleButton =
                                                    normalizedRole === 'adviser' &&
                                                    item.status === 'Approved';

                                                return (
                                                    <tr key={item._id} className="hover:bg-slate-50/60 transition">
                                                        <td className="py-3.5 px-4">
                                                            <div className="space-y-1">
                                                                <div className="font-bold text-slate-900 line-clamp-2">{item.title}</div>
                                                                <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{item.description}</div>
                                                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                                    <span className="truncate max-w-[150px]">{item.fileUrl?.split('/').pop() || 'No file'}</span>
                                                                    <span className="text-slate-300">•</span>
                                                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                                {item.commentCount > 0 && (
                                                                    <div className="flex items-center gap-1 text-[10px] text-blue-600">
                                                                        <MessageSquare className="w-3 h-3" />
                                                                        <span>{item.commentCount} comment{item.commentCount > 1 ? 's' : ''}</span>
                                                                    </div>
                                                                )}
                                                                {Array.isArray(item.titleUrlTracking) && item.titleUrlTracking.length > 0 && (
                                                                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                                        <History className="w-3 h-3" />
                                                                        <span>{item.titleUrlTracking.length} URL tracking entr{item.titleUrlTracking.length > 1 ? 'ies' : 'y'}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs">
                                                                    {item.uploaderName?.charAt(0).toUpperCase() || 'U'}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-slate-900">{item.uploaderName || 'Unknown'}</div>
                                                                    <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{item.uploaderInfo?.username || 'N/A'}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div>
                                                                <div className="font-medium text-slate-900">{item.groupInfo?.name || 'N/A'}</div>
                                                                <div className="text-[10px] text-slate-400">Code: {item.groupInfo?.referralCode || 'N/A'}</div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="space-y-1">
                                                                <div className={`flex items-center gap-1.5 text-xs font-medium ${item.adviser ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                    <User className="w-3.5 h-3.5" /> Adviser: {item.adviser ? '✅ Confirmed' : '⏳ Pending'}
                                                                </div>
                                                                <div className={`flex items-center gap-1.5 text-xs font-medium ${item.coAdviser ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                    <UserCheck className="w-3.5 h-3.5" /> Co-Adviser: {item.coAdviser ? '✅ Confirmed' : '⏳ Pending'}
                                                                </div>
                                                                {userIsAdviser && <div className="text-[9px] text-emerald-600 font-medium">● You are the assigned Adviser</div>}
                                                                {userIsCoAdviser && <div className="text-[9px] text-indigo-600 font-medium">● You are the assigned Co-Adviser</div>}
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex flex-col gap-2">
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border w-fit ${statusBadgeClass}`}>
                                                                    {StatusIcon} {displayStatus}
                                                                </span>
                                                                <StatusStepper status={item.status} compact />
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                                <button
                                                                    onClick={() => canView && handleOpenModal(item)}
                                                                    disabled={!canView}
                                                                    title={canView ? 'View details' : 'Available only when Confirmed, For Schedule, or Ready for Defense'}
                                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                                                                        canView
                                                                            ? 'text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 cursor-pointer'
                                                                            : 'text-slate-400 bg-slate-100 cursor-not-allowed opacity-60'
                                                                    }`}
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" /> View
                                                                </button>

                                                                {item.fileUrl && (
                                                                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg transition">
                                                                        <Download className="w-3.5 h-3.5" /> File
                                                                    </a>
                                                                )}

                                                                {/* Confirm / Reject / Revision */}
                                                                {!isDone && !isFullyApprovedStatus && normalizedRole !== 'subject_instructor' && normalizedRole !== 'student' && (
                                                                    <>
                                                                        {showApprove && canAct && (
                                                                            <button onClick={() => handleStatusChange(item._id, 'Approved')} className="px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition">
                                                                                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Confirm
                                                                            </button>
                                                                        )}
                                                                        {showReject && canAct && (
                                                                            <button onClick={() => handleStatusChange(item._id, 'Rejected')} className="px-2.5 py-1 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition">
                                                                                <XCircle className="w-3.5 h-3.5 inline mr-1" /> Reject
                                                                            </button>
                                                                        )}
                                                                        {showRevision && canAct && (
                                                                            <button onClick={() => handleStatusChange(item._id, 'Revision')} className="px-2.5 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition">
                                                                                <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Revision
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}

                                                                {/* ⭐ FOR SCHEDULE — SIMPLE: role adviser + status Approved */}
                                                                {showForScheduleButton && (
                                                                    <button
                                                                        onClick={() => handleStatusChange(item._id, 'for_schedule')}
                                                                        className="px-2.5 py-1 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm transition inline-flex items-center gap-1"
                                                                    >
                                                                        <CalendarDays className="w-3.5 h-3.5" /> For Schedule
                                                                    </button>
                                                                )}

                                                                {/* READY FOR DEFENSE */}
                                                                {(isFullyApprovedStatus || isForSchedule) && showReadyForDefense && canAct && !userIsAdviser && (
                                                                    <button
                                                                        onClick={() => handleReadyForDefense(item._id)}
                                                                        className="px-2.5 py-1 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition inline-flex items-center gap-1"
                                                                    >
                                                                        <Shield className="w-3.5 h-3.5" /> Ready for Defense
                                                                    </button>
                                                                )}

                                                                {isForSchedule && (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-cyan-700 bg-cyan-50 rounded-lg">
                                                                        <CalendarDays className="w-3.5 h-3.5" /> For Schedule
                                                                    </span>
                                                                )}

                                                                {isReadyForDefense && (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg">
                                                                        <Shield className="w-3.5 h-3.5" /> Ready for Defense
                                                                    </span>
                                                                )}

                                                                {isFullyApprovedStatus && !isReadyForDefense && !isForSchedule && (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg">
                                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                                                                    </span>
                                                                )}

                                                                {isRejectedStatus && (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 rounded-lg">
                                                                        <XCircle className="w-3.5 h-3.5" /> Rejected
                                                                    </span>
                                                                )}

                                                                {alreadyApproved && !isDone && !isFullyApprovedStatus && (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-lg">
                                                                        <CheckCircle2 className="w-3.5 h-3.5" /> You Confirmed
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="py-12 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <FileText className="w-12 h-12 text-slate-300" />
                                                        <span className="text-slate-400 font-medium">No submissions found</span>
                                                        <span className="text-xs text-slate-300">
                                                            {localSearchTerm || localStatusFilter !== 'All' ? 'Try adjusting your search or filters' : 'No submissions available'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50/50 border-t border-slate-200 text-xs text-slate-500">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div>Showing <span className="font-bold text-slate-800">{startItem}</span> to <span className="font-bold text-slate-800">{endItem}</span> of <span className="font-bold text-slate-800">{totalCount}</span> results</div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-slate-500">Rows per page:</label>
                                        <select value={rowsPerPage} onChange={handleRowsPerPageChange} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button disabled={contextCurrentPage === 1 || isLoading} onClick={() => handlePageChange(contextCurrentPage - 1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="font-semibold text-slate-700 px-2">Page {contextCurrentPage} of {totalPagesCount || 1}</span>
                                    <button disabled={contextCurrentPage === totalPagesCount || totalPagesCount === 0 || isLoading} onClick={() => handlePageChange(contextCurrentPage + 1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}