import React, { useState, useMemo, useContext, useEffect, useRef, useCallback } from 'react';
import PdfViewer from '../ReusablePDFviewer/PDFViewer';
import {
    Users, Clock, CheckCircle, Calendar, Search, X, Download,
    LayoutGrid, Table as TableIcon, SlidersHorizontal, RotateCcw,
    MoreVertical, MessageSquare, FileText, AlertCircle,
} from 'lucide-react';

import { ScheduleContext } from '../../contexts/ScheduleContext/ScheduleContext';
import { CommentContext } from '../../contexts/CommentContext/CommentContext';
import { ProposedTitleContext } from '../../contexts/ProposedTitleContext/ProposedTitleContext';

const GLOBAL_KEY = '__global__';

// ============================
// HELPERS
// ============================
const getPersonName = (p, fallback = '—') => {
    if (!p) return fallback;
    if (p.fullName) return p.fullName;
    const combo = `${p.first_name || ''} ${p.last_name || ''}`.trim();
    return combo || fallback;
};

const getInitials = (p) => {
    if (!p) return '—';
    const f = (p.first_name || p.fullName || '').trim();
    const l = (p.last_name || '').trim();
    if (!f && !l) return '?';
    return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || '?';
};

const mapTopicStatus = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('approved') || s.includes('ready for defense')) return 'approved';
    if (s.includes('revision')) return 'under_revision';
    if (s.includes('pending')) return 'pending_review';
    if (s.includes('rejected')) return 'under_revision';
    return 'pending_review';
};

const mapGroupStatus = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('accepted')) return 'accepted';
    if (s.includes('rejected')) return 'under_revision';
    if (s.includes('revision')) return 'under_revision';
    return 'pending_acceptance';
};

const statusBadge = (variant) => {
    const styles = {
        accepted: 'bg-blue-100 text-blue-800',
        approved: 'bg-blue-200 text-blue-900',
        pending_acceptance: 'bg-slate-100 text-slate-600',
        pending_review: 'bg-amber-100 text-amber-800',
        under_revision: 'bg-red-100 text-red-700',
    };
    const dots = {
        accepted: 'bg-blue-600',
        approved: 'bg-blue-800',
        pending_acceptance: 'bg-slate-400',
        pending_review: 'bg-amber-500',
        under_revision: 'bg-red-600',
    };
    return {
        container: styles[variant] || styles.pending_acceptance,
        dot: dots[variant] || dots.pending_acceptance,
    };
};

const timeAgo = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const diff = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.round(diff / 7)} weeks ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Backend comment → local annotation
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
        x, y, w, h,
        text: comment.text || '',
        quoted: comment.selectedText || '',
        color: comment.color || '#fbbf24',
        author,
        pageNum: comment.pageNumber ?? null,
        createdAt: comment.createdAt || new Date().toISOString(),
        __fromBackend: true,
    };
};

// Merge backend comments
const mergeBackendCommentsIntoAnnotations = (existing, backendComments) => {
    if (!Array.isArray(backendComments) || backendComments.length === 0) return existing;
    const next = { ...existing };
    const seenIds = new Set();
    Object.values(next).forEach(list => (list || []).forEach(a => {
        if (a.id) seenIds.add(String(a.id));
        if (a.backendId) seenIds.add(String(a.backendId));
    }));
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
// STAT TICKER
// ============================
const StatTicker = ({ icon: Icon, value, label, iconTone = 'text-blue-100' }) => (
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <Icon className={`w-5 h-5 ${iconTone}`} />
        </div>
        <div>
            <span className="text-2xl font-extrabold text-white leading-tight block">{value}</span>
            <span className="text-[10px] uppercase tracking-wider text-blue-200 font-semibold">{label}</span>
        </div>
    </div>
);

// ============================
// STATUS TAB
// ============================
const StatusTab = ({ active, label, count, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${active ? 'bg-blue-900 text-white shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
    >
        <span>{label}</span>
        <span className={`px-1.5 rounded-full text-[10px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-white text-blue-700'}`}>{count}</span>
    </button>
);

// ============================
// GROUP ROW
// ============================
const GroupRow = ({ group, onOpen }) => {
    const gBadge = statusBadge(group.groupStatus);
    const tBadge = statusBadge(group.topicStatus);
    return (
        <tr onClick={() => onOpen(group.code)} className="hover:bg-blue-50/60 transition-colors cursor-pointer border-b border-blue-100 last:border-0">
            <td className="py-4 px-4 align-top">
                <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-900 self-start">{group.code}</span>
                    <span className="text-sm font-bold text-blue-900">{group.name}</span>
                    <span className="text-[10px] text-blue-500">{group.track}</span>
                </div>
            </td>
            <td className="py-4 px-4 align-top">
                <div className="flex flex-col gap-1 max-w-sm">
                    <span className="text-sm font-semibold text-blue-800 line-clamp-1">{group.title}</span>
                    <p className="text-[11px] text-blue-500 line-clamp-2 leading-relaxed">{group.abstract}</p>
                </div>
            </td>
            <td className="py-4 px-4 align-top">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center -space-x-2">
                        {group.members.slice(0, 3).map((m, i) => (
                            <div key={m._id || i} className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ring-2 ring-white ${i === 0 ? 'bg-amber-100 text-amber-800' : i === 1 ? 'bg-blue-100 text-blue-800' : 'bg-blue-200 text-blue-900'}`} title={m.name}>{m.initials}</div>
                        ))}
                    </div>
                    <div className="text-[11px]">
                        {group.members.length > 0 ? (
                            <>
                                <span className="font-semibold text-blue-900">{group.members[0].name}</span>{' '}
                                <span className="text-[10px] text-amber-700 font-semibold">(Lead)</span>
                                {group.members.length > 1 && <div className="text-blue-500 text-[10px]">+ {group.members.slice(1).map((m) => m.name).join(', ')}</div>}
                            </>
                        ) : <span className="text-[10px] text-blue-400 italic">No members</span>}
                    </div>
                </div>
            </td>
            <td className="py-4 px-4 align-top">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-bold uppercase">ADV</span><span className="text-[11px] font-medium text-blue-900">{group.adviser}</span></div>
                    <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold uppercase">CO</span><span className="text-[11px] text-blue-500">{group.coAdviser}</span></div>
                </div>
            </td>
            <td className="py-4 px-2 text-center align-top"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${gBadge.container}`}><span className={`w-1.5 h-1.5 rounded-full ${gBadge.dot}`} />{group.groupStatusLabel}</span></td>
            <td className="py-4 px-2 text-center align-top"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tBadge.container}`}><span className={`w-1.5 h-1.5 rounded-full ${tBadge.dot}`} />{group.topicStatusLabel}</span></td>
            <td className="py-4 px-2 text-center align-top"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold"><MessageSquare className="w-3 h-3" /> {group.comments}</span></td>
            <td className="py-4 px-4 align-top whitespace-nowrap"><div className="flex flex-col"><span className="text-[11px] font-medium text-blue-900">{group.lastUpdatedLabel}</span><span className="text-[10px] text-blue-400">{group.lastUpdatedDate}</span></div></td>
            <td className="py-4 px-4 align-top text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => onOpen(group.code)} className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-900 hover:text-white text-blue-800 text-[11px] font-semibold transition-all">View Details</button>
                    <button className="p-1 rounded text-blue-400 hover:bg-blue-50"><MoreVertical className="w-4 h-4" /></button>
                </div>
            </td>
        </tr>
    );
};

// ============================
// GROUP CARD
// ============================
const GroupCard = ({ group, onOpen }) => {
    const badge = statusBadge(group.topicStatus);
    return (
        <div onClick={() => onOpen(group.code)} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 border border-blue-200">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-900">{group.code}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.container}`}><span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />{group.topicStatusLabel}</span>
                </div>
                <h2 className="text-base font-bold text-blue-900">{group.name}</h2>
                <p className="text-xs text-blue-500 line-clamp-2">{group.title}</p>
            </div>
            <div className="pt-3 border-t border-blue-100 space-y-1">
                <div className="flex items-center justify-between text-[11px]"><span className="text-blue-600">Lead: {group.members[0]?.name || '—'}</span><span className="text-amber-600 font-bold">{group.comments} Comments</span></div>
                <div className="flex items-center justify-between text-[10px]"><span className="text-blue-400">{group.adviser}</span><span className="text-blue-400">{group.lastUpdatedDate}</span></div>
            </div>
        </div>
    );
};

// ============================
// DRAWER — Latest submission only (English)
// ============================
const GroupDrawer = ({ open, onClose, group, onOpenPdf }) => {
    if (!group) return null;

    const titleUrlTracking = Array.isArray(group.titleUrlTracking) ? group.titleUrlTracking : [];
    const sortedTracking = [...titleUrlTracking].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    // ⭐ LATEST only
    const latestTracking = sortedTracking.length > 0 ? [sortedTracking[0]] : [];
    const hasMore = sortedTracking.length > 1;

    return (
        <>
            <div onClick={onClose} className={`fixed inset-0 bg-blue-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
            <div className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col z-50 transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-blue-900 text-white">{group.code}</span>
                        <div>
                            <h2 className="text-lg font-bold text-blue-900 leading-tight">{group.name}</h2>
                            <span className="text-[10px] text-blue-500 uppercase tracking-wider font-semibold">{group.track}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-blue-400 hover:bg-blue-100 hover:text-blue-900 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-2">
                        <span className="text-[10px] text-blue-500 uppercase tracking-wider font-bold">Research Title</span>
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-2">
                            <h4 className="text-sm font-bold text-blue-900">{group.title}</h4>
                            <p className="text-xs text-blue-600 leading-relaxed">{group.abstract}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                            <div className="text-[9px] text-blue-600 uppercase font-bold">Principal Adviser</div>
                            <div className="text-sm font-bold text-blue-900 mt-1">{group.adviser}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                            <div className="text-[9px] text-amber-600 uppercase font-bold">Co-Adviser</div>
                            <div className="text-sm font-bold text-blue-900 mt-1">{group.coAdviser}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-blue-500 uppercase tracking-wider font-bold">
                                Assigned Student Roster ({group.members.length} Members)
                            </span>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-blue-100">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-blue-50 text-blue-700 text-[10px] uppercase">
                                    <tr>
                                        <th className="py-2.5 px-4">Student Name</th>
                                        <th className="py-2.5 px-4">Username</th>
                                        <th className="py-2.5 px-4">Role</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-100 text-blue-900">
                                    {group.members.length === 0 ? (
                                        <tr><td colSpan={3} className="py-4 px-4 text-center text-blue-400 italic text-[11px]">No members found.</td></tr>
                                    ) : group.members.map((m, i) => (
                                        <tr key={m._id || i}>
                                            <td className="py-2.5 px-4 font-medium">{m.name}</td>
                                            <td className="py-2.5 px-4 font-mono text-[11px] text-blue-500">{m.username || '—'}</td>
                                            <td className="py-2.5 px-4">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600">{m.role || 'Student'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ⭐ LATEST SUBMISSION ONLY */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-blue-500 uppercase tracking-wider font-bold">Latest Submission</span>
                            <span className="text-[10px] text-blue-600 font-semibold">
                                {hasMore
                                    ? `Latest of ${sortedTracking.length} submissions`
                                    : `${sortedTracking.length} ${sortedTracking.length === 1 ? 'entry' : 'entries'}`}
                            </span>
                        </div>

                        <div className="rounded-xl overflow-hidden border border-blue-100">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-blue-50 text-blue-700 text-[10px] uppercase">
                                    <tr>
                                        <th className="py-2.5 px-3">Chapter</th>
                                        <th className="py-2.5 px-3">Action</th>
                                        <th className="py-2.5 px-3">Date</th>
                                        <th className="py-2.5 px-3">Remarks</th>
                                        <th className="py-2.5 px-3 text-right">Open</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-100 text-blue-900">
                                    {latestTracking.length === 0 ? (
                                        <tr><td colSpan={5} className="py-4 px-4 text-center text-blue-400 italic text-[11px]">No tracking entries available.</td></tr>
                                    ) : latestTracking.map((t) => (
                                        <tr key={t._id} className="hover:bg-blue-50/60">
                                            <td className="py-2.5 px-3 font-bold text-blue-900 whitespace-nowrap">{t.chapter || '—'}</td>
                                            <td className="py-2.5 px-3 text-[10px]">
                                                {t.action ? <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold uppercase">{t.action}</span> : <span className="text-blue-300">—</span>}
                                            </td>
                                            <td className="py-2.5 px-3 text-[11px] text-blue-500 whitespace-nowrap">
                                                {t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                            </td>
                                            <td className="py-2.5 px-3 text-[11px] text-blue-600 max-w-[180px] truncate" title={t.remarks || ''}>{t.remarks || '—'}</td>
                                            <td className="py-2.5 px-3 text-right">
                                                {t.url ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenPdf(t, group)}
                                                        data-tracking-id={t._id}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-900 hover:text-white text-blue-800 text-[10px] font-bold transition-all"
                                                        title={`titleUrlTracking[i]._id: ${t._id}`}
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        Open
                                                    </button>
                                                ) : <span className="text-[10px] text-blue-300 italic">No file</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {hasMore && (
                            <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-blue-700 leading-relaxed">
                                    <strong>{sortedTracking.length - 1} older submission{sortedTracking.length - 1 > 1 ? 's' : ''}</strong> hidden — only the latest submission is shown here.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-blue-50 border-t border-blue-200 flex items-center justify-between">
                    <button className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 text-[11px] font-semibold hover:bg-blue-100 transition-all flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Download PDF</button>
                    <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-blue-900 text-white text-[11px] font-bold hover:bg-blue-800 transition-all">Done</button>
                </div>
            </div>
        </>
    );
};

// ============================
// MAIN COMPONENT
// ============================
export default function MyResearchGroups() {
    const [viewMode, setViewMode] = useState('table');
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [drawerCode, setDrawerCode] = useState(null);
    const { schedules } = useContext(ScheduleContext);
    const {
        comments,
        FetchCommentsByProposedTitle,
        CreateComment,
        DeleteComment,
        ClearPageAnnotations,
        ResetComments,
    } = useContext(CommentContext);
    const { GetPdfBlobUrl } = useContext(ProposedTitleContext);

    // ===== PDF STATE =====
    const [isViewMode, setIsViewMode] = useState(false);
    const [viewSubmission, setViewSubmission] = useState(null);
    const [activeTrackingId, setActiveTrackingId] = useState(null);
    const [activeTrackingUrl, setActiveTrackingUrl] = useState(null);

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
    const [isClearing, setIsClearing] = useState(false);

    const splitContainerRef = useRef(null);
    const anchorRefs = useRef({});
    const cardRefs = useRef({});

    const canAnnotate = true;
    const effectiveReadOnly = false;

    // Derive proposedTitleId from activeTrackingId
    const proposedTitleId = useMemo(() => {
        if (!viewSubmission) return activeTrackingId || null;
        const tracking = viewSubmission?.titleUrlTracking;
        if (Array.isArray(tracking) && tracking.length > 0) {
            const latest = [...tracking].sort((a, b) =>
                new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0)
            )[0];
            if (latest?._id) return latest._id;
        }
        return activeTrackingId || viewSubmission?._id || null;
    }, [viewSubmission, activeTrackingId]);

    // ============================================================
    // MAP SCHEDULES → GROUPS
    // ============================================================
    const groups = useMemo(() => {
        if (!Array.isArray(schedules)) return [];
        return schedules.map((s) => {
            const pt = s.proposedTitle || {};
            const g = s.groupIds?.[0] || s.groupId || {};
            const members = Array.isArray(s.members) ? s.members : [];
            const topicStatusKey = mapTopicStatus(pt.status);
            const groupStatusKey = mapGroupStatus(pt.groupStatus || 'pending');
            const titleUrlTrackingArr = Array.isArray(pt.titleUrlTracking) ? pt.titleUrlTracking : [];
            return {
                code: g.referralCode || g.name || s._id,
                name: g.name || 'Unnamed Group',
                track: pt.track || '—',
                title: pt.title || 'Untitled',
                abstract: pt.description || '',
                members: members.map((m) => ({
                    _id: m._id,
                    name: getPersonName(m),
                    initials: getInitials(m),
                    username: m.username,
                    role: m.role || 'Student',
                })),
                adviser: getPersonName(pt.adviser, '—'),
                coAdviser: getPersonName(pt.coAdviser, '—'),
                groupStatus: groupStatusKey,
                groupStatusLabel: pt.groupStatus || (groupStatusKey === 'accepted' ? 'Accepted' : 'Pending'),
                topicStatus: topicStatusKey,
                topicStatusLabel: pt.status || 'Pending',
                comments: pt.commentCount || 0,
                newComments: 0,
                lastUpdatedLabel: timeAgo(s.updatedAt || s.createdAt),
                lastUpdatedDate: s.updatedAt ? new Date(s.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
                titleUrlTracking: titleUrlTrackingArr,
                proposedTitleId: pt._id || null,
                raw: s,
            };
        });
    }, [schedules]);

    const filteredGroups = useMemo(() => {
        const q = search.toLowerCase().trim();
        return groups.filter((g) => {
            const matchSearch = !q || [g.code, g.name, g.title, g.adviser, g.coAdviser].join(' ').toLowerCase().includes(q);
            const matchTab = activeTab === 'all' || g.topicStatus === activeTab;
            return matchSearch && matchTab;
        });
    }, [groups, search, activeTab]);

    const selectedGroup = useMemo(() => groups.find((g) => g.code === drawerCode) || null, [groups, drawerCode]);

    const tabs = useMemo(() => {
        const counts = {
            all: groups.length,
            pending_acceptance: groups.filter((g) => g.topicStatus === 'pending_acceptance').length,
            accepted: groups.filter((g) => g.topicStatus === 'approved').length,
            pending_review: groups.filter((g) => g.topicStatus === 'pending_review').length,
            under_revision: groups.filter((g) => g.topicStatus === 'under_revision').length,
            approved: groups.filter((g) => g.topicStatus === 'approved').length,
            completed: groups.filter((g) => (g.topicStatusLabel || '').toLowerCase() === 'done').length,
        };
        return [
            { key: 'all', label: 'All Groups', count: counts.all },
            { key: 'pending_acceptance', label: 'Pending Acceptance', count: counts.pending_acceptance },
            { key: 'accepted', label: 'Accepted', count: counts.accepted },
            { key: 'pending_review', label: 'Pending Review', count: counts.pending_review },
            { key: 'under_revision', label: 'Under Revision', count: counts.under_revision },
            { key: 'approved', label: 'Approved', count: counts.approved },
            { key: 'completed', label: 'Completed', count: counts.completed },
        ];
    }, [groups]);

    // ============================================================
    // Sync comments from context
    // ============================================================
    useEffect(() => {
        if (!comments || comments.length === 0) return;
        setPdfAnnotations(prev => mergeBackendCommentsIntoAnnotations(prev, comments));
    }, [comments]);

    // ============================================================
    // FETCH PDF via GetPdfBlobUrl
    // ============================================================
    useEffect(() => {
        let cancelled = false;
        const fetchPdf = async () => {
            if (!isViewMode || !activeTrackingId || !GetPdfBlobUrl) {
                setPdfBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
                setPdfBlobError(null);
                return;
            }
            setPdfBlobLoading(true);
            setPdfBlobError(null);
            try {
                const url = await GetPdfBlobUrl(activeTrackingId);
                if (cancelled) { if (url) URL.revokeObjectURL(url); return; }
                if (url) setPdfBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
                else setPdfBlobError('Failed to load thesis PDF. Backend returned no document.');
            } catch (err) {
                if (!cancelled) setPdfBlobError(err.message || 'Failed to load thesis PDF');
            } finally {
                if (!cancelled) setPdfBlobLoading(false);
            }
        };
        fetchPdf();
        return () => { cancelled = true; };
    }, [isViewMode, activeTrackingId, GetPdfBlobUrl]);

    useEffect(() => () => { if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl); }, []);

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

    const showNotification = (msg, isError = false) => {
        console.log(isError ? '[ERR]' : '[OK]', msg);
        if (isError) alert(msg);
    };

    // ============================================================
    // OPEN PDF VIEWER
    // ============================================================
    const handleOpenPdfViewer = (tracking, group) => {
        const titleUrlTrackingId = tracking?._id;
        if (!titleUrlTrackingId) {
            console.warn('No titleUrlTracking[i]._id found');
            return;
        }

        console.log('titleUrlTracking[i]._id -> comments fetch:', titleUrlTrackingId);

        resetAnnotationsForNewSubmission();
        try { if (ResetComments) ResetComments(); } catch (e) { console.warn(e); }

        setViewSubmission({
            ...group,
            title: tracking.chapter || group?.title || 'Latest Submission',
            uploaderName: group?.members?.[0]?.name || 'Researcher',
            titleUrlTracking: group?.titleUrlTracking || [],
        });
        setActiveTrackingId(titleUrlTrackingId);
        setIsViewMode(true);

        if (FetchCommentsByProposedTitle) {
            FetchCommentsByProposedTitle(titleUrlTrackingId, 1, 100).catch(err => {
                console.warn('FetchComments error:', err);
            });
        }
    };

    const handleBackFromViewer = () => {
        setIsViewMode(false);
        setViewSubmission(null);
        setActiveTrackingId(null);
        setPdfBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
        try { if (ResetComments) ResetComments(); } catch (e) { console.warn(e); }
    };

    const handleRetryPdf = () => {
        if (!activeTrackingId || !GetPdfBlobUrl) return;
        setPdfBlobError(null);
        setPdfBlobLoading(true);
        GetPdfBlobUrl(activeTrackingId).then(url => {
            if (url) setPdfBlobUrl(url);
            else setPdfBlobError('Failed to load PDF');
            setPdfBlobLoading(false);
        }).catch(err => {
            setPdfBlobError(err.message || 'Failed to load PDF');
            setPdfBlobLoading(false);
        });
    };

    const refreshComments = useCallback(async () => {
        if (!FetchCommentsByProposedTitle || !proposedTitleId) return;
        try { await FetchCommentsByProposedTitle(proposedTitleId, 1, 100); } catch (err) { console.warn(err); }
    }, [FetchCommentsByProposedTitle, proposedTitleId]);

    // ============================================================
    // Annotation handlers (English messages)
    // ============================================================
    const handleAddPageComment = async (pageNum) => {
        if (!canAnnotate) return showNotification('View-only mode — you cannot add feedback.', true);
        const value = window.prompt(`Page ${pageNum} — Describe the issue:`);
        if (!value?.trim() || !proposedTitleId) return;
        try {
            const res = await CreateComment(proposedTitleId, {
                text: value.trim(), pageNumber: pageNum, position: null, selectedText: null,
                color: annotationColor, annotationType: 'page', annotationLabel: 'Page Feedback', shape: 'pin',
            });
            if (res?.success) { await refreshComments(); showNotification(`Feedback added to Page ${pageNum}`); }
            else showNotification(`${res?.error || 'Failed to add page feedback'}`, true);
        } catch (err) { showNotification(`${err.message}`, true); }
    };

    const handleAddGlobalComment = async () => {
        if (!canAnnotate) return showNotification('View-only mode — you cannot add feedback.', true);
        const value = window.prompt('Applies to ALL pages — Describe the issue:');
        if (!value?.trim() || !proposedTitleId) return;
        try {
            const res = await CreateComment(proposedTitleId, {
                text: value.trim(), pageNumber: null, position: null, selectedText: null,
                color: '#f87171', annotationType: 'global', annotationLabel: 'All Pages Feedback', shape: 'pin',
            });
            if (res?.success) { await refreshComments(); showNotification('Global feedback added'); }
            else showNotification(`${res?.error || 'Failed to add global feedback'}`, true);
        } catch (err) { showNotification(`${err.message}`, true); }
    };

    const handleClearPage = async () => {
        if (!canAnnotate) return showNotification('View-only mode — you cannot clear annotations.', true);
        const annotations = pdfAnnotations[`page_${annotationPageNum}`] || [];
        if (annotations.length === 0 || !proposedTitleId) return;
        if (!window.confirm(`Delete all ${annotations.length} annotation(s) on page ${annotationPageNum}?`)) return;
        try {
            setIsClearing(true);
            const res = await ClearPageAnnotations(proposedTitleId, annotationPageNum);
            if (!res?.success) return showNotification(`${res?.error || 'Unknown error'}`, true);
            setPdfAnnotations(prev => ({ ...prev, [`page_${annotationPageNum}`]: [] }));
            await refreshComments();
            showNotification(`Cleared ${res.deletedCount || annotations.length} annotation(s)`);
        } catch (err) { showNotification(`${err.message}`, true); }
        finally { setIsClearing(false); }
    };

    const handleClearGlobalAnnotations = async () => {
        if (!canAnnotate) return showNotification('View-only mode — you cannot clear annotations.', true);
        const globals = pdfAnnotations[GLOBAL_KEY] || [];
        if (globals.length === 0) return;
        if (!window.confirm(`Delete all ${globals.length} "All Pages" feedback?`)) return;
        try {
            setIsClearing(true);
            for (const g of globals) {
                const backendId = g.backendId || (g.__fromBackend ? g.id : null);
                if (backendId && DeleteComment) try { await DeleteComment(backendId); } catch (err) { console.warn(err); }
            }
            setPdfAnnotations(prev => { const next = { ...prev }; delete next[GLOBAL_KEY]; return next; });
            await refreshComments();
            showNotification('All global feedback removed');
        } catch (err) { showNotification(`${err.message}`, true); }
        finally { setIsClearing(false); }
    };

    const handleEraseFromSidebar = async (target) => {
        if (!target) return;
        const backendId = target.backendId || (target.__fromBackend ? target.id : null);
        if (backendId && DeleteComment) {
            const res = await DeleteComment(backendId);
            if (!res?.success) return showNotification('Delete failed', true);
        }
        setPdfAnnotations(prev => {
            const key = target.type === 'global' || target.pageNum == null ? GLOBAL_KEY : `page_${target.pageNum || annotationPageNum}`;
            return { ...prev, [key]: (prev[key] || []).filter(a => a.id !== target.id) };
        });
        await refreshComments();
        showNotification('Feedback deleted');
    };

    const handleSaveAnnotatedPdf = async () => {
        if (!activeTrackingId) return showNotification('No active tracking ID', true);
        setIsSavingPdf(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/v1/proposed-titles/pdf/${activeTrackingId}/annotated-pdf`, { credentials: 'include' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const safeTitle = (viewSubmission?.title || 'thesis').replace(/[^a-z0-9]/gi, '_').slice(0, 60);
            a.download = `${safeTitle}_annotated_${activeTrackingId}.pdf`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1500);
            showNotification('Annotated PDF downloaded');
        } catch (err) { showNotification(`${err.message}`, true); }
        finally { setIsSavingPdf(false); }
    };

    // ============================================================
    // RENDER — PDF VIEWER MODE
    // ============================================================
    if (isViewMode && viewSubmission) {
        const totalAnnotationCount =
            (pdfAnnotations[GLOBAL_KEY] || []).length +
            Object.entries(pdfAnnotations).filter(([k]) => k !== GLOBAL_KEY).reduce((s, [, l]) => s + (l?.length || 0), 0);

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
                isSavingPdf={isSavingPdf || isClearing}
                totalAnnotationCount={totalAnnotationCount}
                onBack={handleBackFromViewer}
                onSavePdf={handleSaveAnnotatedPdf}
                onRetryFetch={handleRetryPdf}
                onAddPageComment={handleAddPageComment}
                onAddGlobalComment={handleAddGlobalComment}
                onClearPage={handleClearPage}
                onClearGlobalAnnotations={handleClearGlobalAnnotations}
                onEraseFromSidebar={handleEraseFromSidebar}
                onContextAction={() => setTextMenu(null)}
                refreshComments={refreshComments}
                showNotification={showNotification}
            />
        );
    }

    // ============================================================
    // RENDER — TABLE VIEW
    // ============================================================
    return (
        <div className="min-h-screen bg-blue-50 text-blue-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 p-6 text-white shadow-lg">
                    <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-2 max-w-3xl">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/15 text-amber-200">Faculty Review Cohort</span>
                                <span className="text-[10px] text-blue-300">•</span>
                                <span className="text-[10px] text-blue-100 font-medium">AY 2024-2025 • Term 2 Defense Cycle</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">My Research Groups</h1>
                            <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">Manage your assigned groups, review submitted research proposals, verify dual-mentorship agreements, and oversee oral defense progressions.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                            <div className="flex items-center bg-white/10 p-0.5 rounded-lg backdrop-blur-sm">
                                <button onClick={() => setViewMode('table')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${viewMode === 'table' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-100 hover:text-white'}`}><TableIcon className="w-3.5 h-3.5" />Table</button>
                                <button onClick={() => setViewMode('grid')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${viewMode === 'grid' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-100 hover:text-white'}`}><LayoutGrid className="w-3.5 h-3.5" />Grid</button>
                            </div>
                            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all backdrop-blur-sm"><SlidersHorizontal className="w-3.5 h-3.5" />Filter Columns</button>
                            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-blue-900 text-[11px] font-bold shadow-md transition-all"><Download className="w-3.5 h-3.5" />Export Roster</button>
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/15">
                        <StatTicker icon={Users} value={groups.length} label="Assigned Groups" iconTone="text-blue-100" />
                        <StatTicker icon={Clock} value={groups.filter((g) => g.topicStatus === 'pending_review').length} label="Awaiting Review" iconTone="text-amber-200" />
                        <StatTicker icon={CheckCircle} value={groups.filter((g) => g.topicStatus === 'approved').length} label="Approved Topics" iconTone="text-blue-100" />
                        <StatTicker icon={Calendar} value="—" label="Next Defense Panel" iconTone="text-amber-200" />
                    </div>
                </div>

                <div className="flex flex-col gap-4 bg-white rounded-xl p-4 shadow-sm border border-blue-200">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by group code, research title, or adviser..." className="w-full pl-11 pr-24 py-2.5 rounded-lg bg-blue-50 text-sm text-blue-900 placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {search && <button onClick={() => setSearch('')} className="p-1 rounded text-blue-400 hover:text-blue-900"><X className="w-3.5 h-3.5" /></button>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {tabs.map((t) => <StatusTab key={t.key} label={t.label} count={t.count} active={activeTab === t.key} onClick={() => setActiveTab(t.key)} />)}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-blue-100 pt-3">
                        <button onClick={() => { setSearch(''); setActiveTab('all'); }} className="text-blue-700 hover:text-blue-900 text-[11px] font-bold flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" />Reset Filters</button>
                    </div>
                </div>

                {viewMode === 'table' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-blue-200 flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-blue-50 text-blue-700 text-[10px] uppercase tracking-wider border-b border-blue-100">
                                        <th className="py-3.5 px-4 whitespace-nowrap">Group & Name</th>
                                        <th className="py-3.5 px-4 min-w-[280px]">Research Title</th>
                                        <th className="py-3.5 px-4 whitespace-nowrap">Members</th>
                                        <th className="py-3.5 px-4 min-w-[200px]">Advisers</th>
                                        <th className="py-3.5 px-2 text-center whitespace-nowrap">Group</th>
                                        <th className="py-3.5 px-2 text-center whitespace-nowrap">Topic</th>
                                        <th className="py-3.5 px-2 text-center whitespace-nowrap">Feedback</th>
                                        <th className="py-3.5 px-4 whitespace-nowrap">Updated</th>
                                        <th className="py-3.5 px-4 text-right whitespace-nowrap">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs text-blue-900">
                                    {filteredGroups.length === 0 ? (
                                        <tr><td colSpan={9} className="py-8 px-4 text-center text-blue-400"><AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No groups match your filters.</p></td></tr>
                                    ) : filteredGroups.map((g) => <GroupRow key={g.code} group={g} onOpen={setDrawerCode} />)}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 border-t border-blue-100 bg-blue-50/50">
                            <span className="text-[11px] text-blue-600">Showing <span className="font-bold text-blue-900">1-{filteredGroups.length}</span> of <span className="font-bold text-blue-900">{groups.length}</span> assigned groups</span>
                        </div>
                    </div>
                )}

                {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredGroups.length === 0 ? (
                            <div className="col-span-full bg-white rounded-xl p-8 text-center text-blue-400 border border-blue-200"><AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No groups match your filters.</p></div>
                        ) : filteredGroups.map((g) => <GroupCard key={g.code} group={g} onOpen={setDrawerCode} />)}
                    </div>
                )}
            </div>

            <GroupDrawer open={!!drawerCode} onClose={() => setDrawerCode(null)} group={selectedGroup} onOpenPdf={handleOpenPdfViewer} />
        </div>
    );
}