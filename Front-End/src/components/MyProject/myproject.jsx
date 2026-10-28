import React, { useState, useMemo, useContext, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { ProposedTitleContext } from '../../contexts/ProposedTitleContext/ProposedTitleContext';
import { GroupContext } from '../../contexts/GroupNameContext/GroupNameContext';
import { UserDisplayContext } from '../../contexts/UserManagementContext/UserManagementContext';
import { StatisticalContext } from '../../contexts/StatisticalContext/StatisticalContext';
import { CommentContext } from '../../contexts/CommentContext/CommentContext';
import { AuthContext } from '../../contexts/AuthContext';
import bipsuimage from "../../assets/bipsubg.jpg"

import PdfViewer from '../ReusablePDFviewer/PDFViewer';

const PROJECT_IMG =bipsuimage;

const GLOBAL_KEY = '__global__';

//SAME sequential chapters as ProposedTitle.jsx
const SEQUENTIAL_CHAPTERS = [
  'Preliminary Pages',
  'Chapter 1',
  'Chapter 2',
  'Chapter 3',
  'Chapter 4',
  'Chapter 5',
  'Appendices',
  'Full Manuscript',
];

// ⭐ Get approval flag for a chapter (matches ProposedTitle.jsx)
const getApprovalVal = (approvals, chapter) => {
  if (!approvals) return false;
  if (approvals instanceof Map) return approvals.get(chapter) === true;
  if (typeof approvals === 'object') return approvals[chapter] === true;
  return false;
};

const isFullyProceeded = (item) => {
  if (!item) return false;
  const approvals = item.chapterProgressionApprovals || {};
  return SEQUENTIAL_CHAPTERS.every((ch) => getApprovalVal(approvals, ch));
};

const getRemainingChaptersForDefense = (item) => {
  if (!item) return SEQUENTIAL_CHAPTERS.length;
  const approvals = item.chapterProgressionApprovals || {};
  return SEQUENTIAL_CHAPTERS.filter((ch) => !getApprovalVal(approvals, ch)).length;
};

// ⭐ Get next chapter to proceed
const getNextSequentialChapter = (item) => {
  if (!item) return null;
  const approvals = item.chapterProgressionApprovals || {};
  for (const ch of SEQUENTIAL_CHAPTERS) {
    if (!getApprovalVal(approvals, ch)) return ch;
  }
  return null;
};

// ⭐ Per-chapter status (mirrors getChapterStatus in ProposedTitle.jsx)
const getChapterStatus = (chapter, item) => {
  const tracking = (item?.titleUrlTracking || []).filter((t) => t.chapter === chapter);
  const completedChapters = item?.completedChapters || [];
  const approvals = item?.chapterProgressionApprovals || {};
  const progressionApprovedAt = item?.chapterProgressionApprovedAt || {};

  const isCompleted =
    completedChapters.includes(chapter) || tracking.some((t) => t.isCompleted === true);
  const isProceeded = getApprovalVal(approvals, chapter);
  const hasSubmissions = tracking.length > 0;

  const idx = SEQUENTIAL_CHAPTERS.indexOf(chapter);
  const isUnlocked = (() => {
    if (idx === 0) return true;
    const prevChapter = SEQUENTIAL_CHAPTERS[idx - 1];
    return getApprovalVal(approvals, prevChapter);
  })();

  let status = 'locked';
  if (isProceeded) status = 'proceeded';
  else if (isCompleted) status = 'completed';
  else if (hasSubmissions) status = 'submitted';
  else if (isUnlocked) status = 'unlocked';

  const latestEntry =
    tracking.length > 0
      ? [...tracking].sort(
          (a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0)
        )[0]
      : null;

  return {
    chapter,
    status,
    isCompleted,
    isProceeded,
    isUnlocked,
    hasSubmissions,
    latestEntry,
    submissions: tracking.length,
    approvals,
    progressionApprovedAt,
  };
};

const resolveUserFromGroup = (groupIdOrObj, list = []) => {
  if (!groupIdOrObj) return null;
  const id = groupIdOrObj._id || groupIdOrObj;
  const found = list.find((u) => u._id === id);
  if (found) return found;
  if (groupIdOrObj._id && (groupIdOrObj.first_name || groupIdOrObj.last_name)) {
    return groupIdOrObj;
  }
  return null;
};

const buildFullName = (u) => {
  if (!u) return 'Unassigned';
  if (u.fullName) return u.fullName;
  const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
  return name || 'Unassigned';
};

const buildCompleteName = (u) => {
  if (!u) return 'Unknown Contributor';
  const parts = [
    u.first_name,
    u.middle_name ? `${u.middle_name}.` : '',
    u.last_name,
    u.suffix,
  ].filter(Boolean);
  const full = parts.join(' ').replace(/\s+/g, ' ').trim();
  return full || u.username || u.email || 'Unknown Contributor';
};

const getInitialsFromUser = (u) => {
  if (!u) return '?';
  const f = (u.first_name || '').trim();
  const l = (u.last_name || '').trim();
  if (f || l) return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || '?';
  const fallback = (u.username || u.email || '?').trim();
  return fallback.charAt(0).toUpperCase();
};

const formatMilestoneDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

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

// ⭐ Status → visual tone mapping (Blue / Yellow + neutrals)
const getStatusTone = (status) => {
  const s = (status || '').toLowerCase().trim();
  if (['approved', 'done', 'ready for defense', 'confirmed', 'mentors confirmed'].includes(s)) {
    return {
      chip: 'bg-yellow-100 text-yellow-900 border-yellow-300',
      dot: 'bg-yellow-500',
      pill: 'bg-yellow-500 text-white',
    };
  }
  if (['for_schedule', 'scheduling', 'for defense scheduling'].includes(s)) {
    return {
      chip: 'bg-blue-100 text-blue-900 border-blue-300',
      dot: 'bg-blue-600',
      pill: 'bg-blue-600 text-white',
    };
  }
  if (['rejected'].includes(s)) {
    return {
      chip: 'bg-rose-100 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
      pill: 'bg-rose-600 text-white',
    };
  }
  if (['revision'].includes(s)) {
    return {
      chip: 'bg-purple-100 text-purple-800 border-purple-200',
      dot: 'bg-purple-500',
      pill: 'bg-purple-600 text-white',
    };
  }
  return {
    chip: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
    pill: 'bg-blue-600 text-white',
  };
};

export default function App() {
  const { proposedTitles, statisticsMentorship, GetPdfBlobUrl } = useContext(ProposedTitleContext);
  const { groupDetails, getGroupDetails } = useContext(GroupContext);
  const { advisers } = useContext(UserDisplayContext);
  useContext(StatisticalContext);
  const { comments, FetchCommentsByProposedTitle, ResetComments } = useContext(CommentContext);
  const { role } = useContext(AuthContext);

  const normalizedRole = (role || '').toLowerCase().trim();
  const isStudentViewOnly = normalizedRole === 'student';
  const canAnnotate = useMemo(() => {
    const r = (role || '').toLowerCase().trim();
    return r !== 'student' && [
      'adviser', 'coadviser', 'co-adviser', 'subject_instructor',
      'admin', 'organizer', 'panelist',
    ].includes(r);
  }, [role]);
  const effectiveReadOnly = isStudentViewOnly;

  const [viewMode, setViewMode] = useState('full');

  // ── PDF viewer state ──
  const [isViewMode, setIsViewMode] = useState(false);
  const [activeTrackingId, setActiveTrackingId] = useState(null);
  const [viewSubmission, setViewSubmission] = useState(null);
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

  const splitContainerRef = useRef(null);
  const anchorRefs = useRef({});
  const cardRefs = useRef({});

  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedContributor, setSelectedContributor] = useState(null);

  // ────────────────────────────────────────────────────────────
  // 🔥 FETCH GROUP DETAILS
  // ────────────────────────────────────────────────────────────
  const lastGroupKeyRef = useRef(null);

  useEffect(() => {
    if (typeof getGroupDetails !== 'function') return;

    const referenceKey =
      statisticsMentorship?.referralCode ||
      statisticsMentorship?.groupId ||
      statisticsMentorship?.groupName ||
      groupDetails?.group?.referralCode ||
      groupDetails?.group?._id ||
      null;

    if (!referenceKey) return;
    if (lastGroupKeyRef.current === referenceKey) return;

    lastGroupKeyRef.current = referenceKey;
    try {
      const result = getGroupDetails(referenceKey);
      if (result && typeof result.then === 'function') {
        result.catch(() => { lastGroupKeyRef.current = null; });
      }
    } catch {
      lastGroupKeyRef.current = null;
    }
  }, [
    getGroupDetails,
    statisticsMentorship?.referralCode,
    statisticsMentorship?.groupId,
    statisticsMentorship?.groupName,
    groupDetails?.group?.referralCode,
    groupDetails?.group?._id,
  ]);

  // ── Current proposed title ──
  const currentTitle = useMemo(() => {
    if (!Array.isArray(proposedTitles) || proposedTitles.length === 0) return null;
    const approved = proposedTitles.find(
      (t) => (t.status || '').toLowerCase() === 'approved'
    );
    return approved || proposedTitles[0];
  }, [proposedTitles]);

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

  useEffect(() => {
    if (!comments || comments.length === 0) return;
    setPdfAnnotations(prev => mergeBackendCommentsIntoAnnotations(prev, comments));
  }, [comments]);

  const showNotification = (msg, isError = false) => {
    setToastMessage({ msg, isError });
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  // ⭐⭐⭐ MILESTONES — driven by SEQUENTIAL_CHAPTERS
  const milestones = useMemo(() => {
    return SEQUENTIAL_CHAPTERS.map((chapter, idx) => {
      const ch = getChapterStatus(chapter, currentTitle);

      let status = 'pending';
      if (ch.status === 'proceeded') status = 'done';
      else if (ch.status === 'completed' || ch.status === 'submitted' || ch.status === 'unlocked') status = 'active';
      else status = 'pending';

      const desc =
        ch.status === 'proceeded'
          ? 'Approved by Subject Instructor — chapter cleared.'
          : ch.status === 'completed'
          ? 'Marked complete by adviser. Awaiting Subject Instructor approval.'
          : ch.status === 'submitted'
          ? `${ch.submissions} submission${ch.submissions > 1 ? 's' : ''} awaiting review.`
          : ch.status === 'unlocked'
          ? 'Unlocked — student can upload this chapter.'
          : 'Locked — previous chapter must be proceeded first.';

      const approvedDate = ch.progressionApprovedAt?.[chapter];
      const latestDate =
        approvedDate ||
        ch.latestEntry?.completedAt ||
        ch.latestEntry?.date ||
        ch.latestEntry?.createdAt ||
        null;

      return {
        id: `seq_${idx}`,
        chapter,
        status,
        title: chapter,
        desc,
        date: status === 'done'
          ? formatMilestoneDate(approvedDate || latestDate)
          : status === 'active'
          ? 'ACTIVE'
          : 'Pending',
        meta:
          ch.status === 'proceeded' ? 'Proceeded'
          : ch.status === 'completed' ? 'Ready to Proceed'
          : ch.status === 'submitted' ? 'Pending Review'
          : ch.status === 'unlocked' ? 'Unlocked'
          : 'Locked',
        url: ch.latestEntry?.url || null,
        submissions: ch.submissions,
        isProceeded: ch.isProceeded,
        isUnlocked: ch.isUnlocked,
        rawStatus: ch.status,
      };
    });
  }, [currentTitle]);

  // ─────────────────────────────────────────────────────────────
  // 🔥 GROUP INFO
  // ─────────────────────────────────────────────────────────────
  const group = groupDetails?.group || {};
  const groupSection = group.section || {};
  const groupSubject = groupSection.subject || {};

  const groupName =
    group.name ||
    group.groupName ||
    statisticsMentorship?.groupName ||
    'Unassigned';

  const referralCode =
    group.referralCode ||
    statisticsMentorship?.referralCode ||
    'N/A';

  const sectionName =
    groupSection.name ||
    statisticsMentorship?.sectionName ||
    'N/A';

  const subjectTitle =
    groupSubject.title ||
    statisticsMentorship?.subjectTitle ||
    'N/A';

  const academicPeriod = group.createdAt
    ? `A.Y. ${new Date(group.createdAt).getFullYear()}–${new Date(group.createdAt).getFullYear() + 1}`
    : 'A.Y. N/A';

  // ── Contributors ──
  const referredUsers = useMemo(() => {
    const raw = groupDetails?.referredUsers;
    if (!Array.isArray(raw)) return [];
    return raw.filter(u => u && (u._id || u.id));
  }, [groupDetails]);

  // ── Adviser / Co-Adviser ──
  const adviserName = useMemo(() => {
    if (statisticsMentorship?.adviser) {
      const n = buildFullName(statisticsMentorship.adviser);
      if (n !== 'Unassigned') return n;
    }
    const fromGroup = resolveUserFromGroup(group.adviserId, advisers);
    return buildFullName(fromGroup);
  }, [statisticsMentorship, group.adviserId, advisers]);

  const coAdviserName = useMemo(() => {
    if (statisticsMentorship?.coAdviser) {
      const n = buildFullName(statisticsMentorship.coAdviser);
      if (n !== 'Unassigned') return n;
    }
    const fromGroup = resolveUserFromGroup(group.coadviserId, advisers);
    return buildFullName(fromGroup);
  }, [statisticsMentorship, group.coadviserId, advisers]);

  const getInitials = (name) => {
    if (!name || name === 'Unassigned') return '?';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const visibleMilestones = viewMode === 'pending'
    ? milestones.filter((m) => m.status !== 'done')
    : milestones;

  // ⭐ Progress from sequential chapter proceeded count
  const totalChapters = SEQUENTIAL_CHAPTERS.length;
  const doneChapters = milestones.filter((m) => m.status === 'done').length;
  const progressPct = totalChapters > 0 ? Math.round((doneChapters / totalChapters) * 100) : 0;
  const fullyProceeded = isFullyProceeded(currentTitle);
  const remainingChapters = getRemainingChaptersForDefense(currentTitle);
  const nextSeqChapter = getNextSequentialChapter(currentTitle);

  const displayTitle = statisticsMentorship?.title || currentTitle?.title || 'Untitled Capstone Project';
  const displayStatus = statisticsMentorship?.status || currentTitle?.status || 'Draft';
  const displayDescription = statisticsMentorship?.description || currentTitle?.description || 'No abstract available yet for this capstone.';
  const displayCode = currentTitle?._id
    ? `CSE-${String(currentTitle._id).slice(-6).toUpperCase()}`
    : referralCode;

  const stepperNodes = milestones.slice(0, 8);
  const statusTone = getStatusTone(displayStatus);

  // ============================================================
  // 🔥 HANDLERS
  // ============================================================
  const handleViewLatestUpload = async () => {
    const tracking = currentTitle?.titleUrlTracking || [];
    if (!Array.isArray(tracking) || tracking.length === 0) {
      showNotification('⚠️ Walang upload na naka-attach sa title na ito.', true);
      return;
    }

    const sorted = [...tracking].sort((a, b) => {
      const ta = new Date(a.createdAt || a.completedAt || 0).getTime();
      const tb = new Date(b.createdAt || b.completedAt || 0).getTime();
      return tb - ta;
    });
    const latest = sorted[0];

    if (!latest?._id) {
      showNotification('❌ Walang valid tracking ID sa latest upload.', true);
      return;
    }

    resetAnnotationsForNewSubmission();
    try { if (ResetComments) ResetComments(); } catch (e) { console.warn(e); }

    setViewSubmission(currentTitle);
    setActiveTrackingId(latest._id);
    setIsViewMode(true);

    if (FetchCommentsByProposedTitle) {
      try {
        await FetchCommentsByProposedTitle(latest._id, 1, 100);
      } catch (err) {
        console.warn('⚠️ FetchComments error:', err);
      }
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

  const handleSaveAnnotatedPdf = async () => {
    if (!pdfBlobUrl || !activeTrackingId) {
      showNotification('❌ No PDF to generate', true);
      return;
    }
    const total =
      (pdfAnnotations[GLOBAL_KEY] || []).length +
      Object.entries(pdfAnnotations)
        .filter(([k]) => k !== GLOBAL_KEY)
        .reduce((s, [, l]) => s + (l?.length || 0), 0);

    if (total === 0) {
      showNotification('⚠️ No annotations to generate', true);
      return;
    }

    setIsSavingPdf(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const hexToRgb = (hex) => {
        const c = (hex || '#fbbf24').replace('#', '');
        return {
          r: parseInt(c.slice(0, 2), 16) / 255,
          g: parseInt(c.slice(2, 4), 16) / 255,
          b: parseInt(c.slice(4, 6), 16) / 255,
        };
      };

      const globals = (pdfAnnotations[GLOBAL_KEY] || []).map(a => ({ ...a, isGlobal: true }));
      const pageSpecific = Object.entries(pdfAnnotations)
        .filter(([k]) => k !== GLOBAL_KEY)
        .flatMap(([key, list]) => {
          const pageNum = parseInt(key.replace('page_', ''), 10);
          return (list || []).map(a => ({ ...a, pageNum }));
        });

      const arrayBuffer = await fetch(pdfBlobUrl).then(r => r.arrayBuffer());
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      const nums = {};
      [...globals, ...pageSpecific]
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .forEach((a, i) => { nums[a.id] = i + 1; });

      for (const g of globals) {
        const { r, g: gCol, b } = hexToRgb(g.color);
        for (const page of pages) {
          const { width: pw, height: ph } = page.getSize();
          page.drawRectangle({
            x: 0, y: 0, width: pw, height: ph,
            color: rgb(r, gCol, b), opacity: 0.06,
            borderColor: rgb(r, gCol, b), borderWidth: 1.5,
            borderDashArray: [6, 4],
          });
        }
      }

      for (const a of pageSpecific) {
        const page = pages[a.pageNum - 1];
        if (!page) continue;
        const { width: pw, height: ph } = page.getSize();
        const { r, g, b } = hexToRgb(a.color);

        if ((a.type === 'highlight' || a.type === 'region') && a.w && a.h) {
          const x = a.x * pw;
          const w = a.w * pw;
          const h = a.h * ph;
          const y = ph - (a.y * ph) - h;
          page.drawRectangle({
            x, y, width: w, height: h,
            color: rgb(r, g, b), opacity: 0.25,
            borderColor: rgb(r, g, b), borderWidth: 1.5,
          });
        }
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeTitle = (viewSubmission?.title || 'thesis').replace(/[^a-z0-9]/gi, '_').slice(0, 60);
      link.href = url;
      link.download = `${safeTitle}_annotated_${activeTrackingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      showNotification('✅ Annotated feedback PDF downloaded!');
    } catch (err) {
      console.error('❌ Generate failed:', err);
      showNotification(`❌ Generate failed: ${err.message}`, true);
    } finally {
      setIsSavingPdf(false);
    }
  };

  const handleAddPageComment = () => {
    showNotification('⚠️ View-only — hindi ka pwedeng mag-add ng feedback.', true);
  };
  const handleAddGlobalComment = () => {
    showNotification('⚠️ View-only — hindi ka pwedeng mag-add ng feedback.', true);
  };
  const handleClearPageViaContext = () => {
    showNotification('⚠️ View-only — hindi ka pwedeng mag-clear ng annotations.', true);
  };
  const handleClearGlobalAnnotations = () => {
    showNotification('⚠️ View-only — hindi ka pwedeng mag-clear ng annotations.', true);
  };
  const handleEraseFromSidebar = () => {
    showNotification('⚠️ View-only — hindi ka pwedeng mag-delete ng feedback.', true);
  };
  const handleContextAction = (action) => {
    if (!textMenu) return;
    if (action === 'copy') {
      navigator.clipboard.writeText(textMenu.selectedText);
      setTextMenu(null);
      return;
    }
    showNotification('⚠️ View-only — hindi ka pwedeng mag-add ng annotations.', true);
    setTextMenu(null);
  };
  const refreshComments = useCallback(async () => {
    if (!FetchCommentsByProposedTitle || !proposedTitleId) return;
    try { await FetchCommentsByProposedTitle(proposedTitleId, 1, 100); } catch (err) { console.warn(err); }
  }, [FetchCommentsByProposedTitle, proposedTitleId]);

  // ============================================================
  // 🔥 RENDER: PDF VIEWER MODE
  // ============================================================
  if (isViewMode && viewSubmission) {
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
        onBack={handleBackFromViewer}
        onSavePdf={handleSaveAnnotatedPdf}
        onRetryFetch={handleRetryPdf}
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

  // ============================================================
  // 🔥 RENDER: DASHBOARD
  // ============================================================
  return (
    <div className="bg-slate-50 text-slate-800 text-sm antialiased min-h-screen">
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 text-white text-xs font-medium rounded-xl shadow-2xl ${toastMessage.isError ? 'bg-red-600' : 'bg-slate-900'}`}>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* 🔥 CONTRIBUTOR POPUP MODAL */}
      {selectedContributor && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          onClick={() => setSelectedContributor(null)}
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-yellow-400 px-6 pt-8 pb-6 flex flex-col items-center text-white relative">
              <button
                onClick={() => setSelectedContributor(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                title="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
              <div className="w-20 h-20 rounded-full bg-white text-blue-900 flex items-center justify-center text-2xl font-extrabold shadow-lg mb-3 border-4 border-yellow-300">
                {getInitialsFromUser(selectedContributor)}
              </div>
              <p className="text-[11px] uppercase tracking-wider text-yellow-100 font-semibold">Contributor</p>
              <h3 className="text-lg font-bold text-center mt-0.5">
                {buildCompleteName(selectedContributor)}
              </h3>
            </div>

            <div className="px-5 py-4 space-y-2.5">
              {selectedContributor.email && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-[18px] text-blue-600">mail</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Email</p>
                    <p className="text-slate-900 font-medium truncate">{selectedContributor.email}</p>
                  </div>
                </div>
              )}
              {selectedContributor.username && selectedContributor.username !== selectedContributor.email && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-[18px] text-blue-600">badge</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Username</p>
                    <p className="text-slate-900 font-medium truncate">{selectedContributor.username}</p>
                  </div>
                </div>
              )}
              {selectedContributor.role && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-[18px] text-blue-600">school</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Role</p>
                    <p className="text-slate-900 font-medium capitalize">{selectedContributor.role}</p>
                  </div>
                </div>
              )}
              {selectedContributor.status && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-[18px] text-blue-600">verified_user</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Status</p>
                    <p className="text-slate-900 font-medium">{selectedContributor.status}</p>
                  </div>
                </div>
              )}
              {selectedContributor.referredBy && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-[18px] text-blue-600">link</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Referred By</p>
                    <p className="text-slate-900 font-mono font-semibold">{selectedContributor.referredBy}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 pt-1">
              <button
                onClick={() => setSelectedContributor(null)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="w-full min-h-screen bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto flex flex-col w-full pb-8 pt-4">
          {/* Breadcrumb */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              <span className="text-blue-600 font-bold">Research Record</span>
              <span>/</span>
              <span>{displayCode}</span>
              <span>/</span>
              <span className="text-slate-900 font-semibold">{displayStatus}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-xs font-mono bg-yellow-100 text-yellow-900 border border-yellow-300 px-2 py-1 rounded-full">
                <span className="material-symbols-outlined text-[15px] text-yellow-700">update</span>
                <span>
                  Last synced: Today,{' '}
                  {new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="relative overflow-hidden bg-white rounded-xl p-6 shadow-sm mt-1 border-l-4 border-blue-600">
            <div className="absolute -right-12 -bottom-16 w-80 h-80 opacity-5 pointer-events-none select-none text-blue-900">
              <svg fill="currentColor" viewBox="0 0 200 200">
                <path d="M100 0 L195 50 L195 150 L100 200 L5 150 L5 50 Z"></path>
              </svg>
            </div>
            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-900 text-yellow-200 text-[11px] font-semibold tracking-wide uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-300"></span>
                    Capstone Project IV (Senior Thesis)
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wide uppercase ${statusTone.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusTone.dot} animate-pulse`}></span>
                    {displayStatus}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-900 border border-yellow-300 text-[11px] uppercase font-semibold">
                    <span className="material-symbols-outlined text-[13px]">hub</span>
                    {sectionName}
                  </span>
                </div>
                <h1 className="text-2xl text-blue-900 tracking-tight max-w-4xl font-bold">
                  {displayTitle}
                </h1>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-2">
                  <div>
                    <span className="block text-[11px] text-slate-500 uppercase font-semibold">Research Cohort</span>
                    <span className="text-[13px] text-slate-900 font-semibold truncate block">{groupName}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500 uppercase font-semibold">Subject</span>
                    <span className="text-[13px] text-slate-900 font-semibold truncate block">{subjectTitle}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500 uppercase font-semibold">Academic Period</span>
                    <span className="text-[13px] text-slate-900 font-semibold truncate block">{academicPeriod}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500 uppercase font-semibold">Referral Code</span>
                    <span className="text-[13px] text-yellow-700 font-bold truncate block">{referralCode}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-1 shrink-0 lg:w-56">
                <button
                  className="inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-900 transition-colors shadow-sm ring-2 ring-yellow-300/50"
                  onClick={handleViewLatestUpload}
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  <span>View Latest Upload</span>
                </button>
              </div>
            </div>

            {/* ⭐ Progress — BLUE / YELLOW theme (fully-proceeded = full yellow) */}
            <div className={`mt-6 pt-4 rounded-lg p-4 border transition-colors ${
              fullyProceeded
                ? 'bg-gradient-to-r from-yellow-50 via-slate-50 to-yellow-100 border-yellow-300'
                : 'bg-gradient-to-r from-blue-50 via-slate-50 to-yellow-50 border-blue-100'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-blue-900">Overall Chapter Progression</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-bold ${
                    fullyProceeded ? 'bg-yellow-500 text-white' : statusTone.pill
                  }`}>
                    {progressPct}% Complete
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-900">
                  <span className="material-symbols-outlined text-blue-600 text-[20px]">menu_book</span>
                  <span className="text-[13px] font-semibold">
                    {doneChapters} / {totalChapters} Chapters Proceeded
                  </span>
                </div>
              </div>

              {/* ⭐ Progress Bar */}
              <div className="w-full h-3 rounded-full overflow-hidden relative bg-blue-900/20 border border-blue-300/40 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    fullyProceeded
                      ? 'bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.9)]'
                      : 'bg-gradient-to-r from-blue-500 via-blue-500 to-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.6)]'
                  }`}
                  style={{ width: `${progressPct}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-slate-500 text-xs font-mono mt-2 gap-2 flex-wrap">
                <span className="text-blue-800 font-semibold">
                  {doneChapters} Chapter{doneChapters !== 1 ? 's' : ''} Proceeded
                </span>
                <span className={`font-semibold ${fullyProceeded ? 'text-yellow-700' : 'text-blue-700'}`}>
                  {fullyProceeded
                    ? '🎓 All Chapters Proceeded — Defense Unlocked'
                    : `Next: ${nextSeqChapter || '—'}`}
                </span>
                <span className="text-slate-600">
                  {remainingChapters === 0
                    ? 'All Complete'
                    : `${remainingChapters} Remaining`}
                </span>
              </div>
            </div>
          </div>

          {/* Abstract + Right column */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
            {/* ── Abstract + Contributors ── */}
            <div className="lg:col-span-7 bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-blue-600 text-[22px]">subject</span>
                    <h2 className="text-base text-blue-900 font-bold">Abstract & Problem Definition</h2>
                  </div>
                  <span className={`text-[11px] uppercase px-2 py-1 rounded font-semibold border ${statusTone.chip}`}>
                    {displayStatus}
                  </span>
                </div>
                <p className="text-sm text-slate-900 leading-relaxed text-justify">
                  {displayDescription}
                </p>
              </div>

              {/* ✅ Contributors */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">groups</span>
                    <h3 className="text-[13px] text-blue-900 font-bold">Contributors</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {referredUsers.length} member{referredUsers.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {referredUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No contributors yet.</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {referredUsers.map((u) => {
                      const initials = getInitialsFromUser(u);
                      const completeName = buildCompleteName(u);
                      return (
                        <button
                          key={u._id || u.id || u.email}
                          onClick={() => setSelectedContributor(u)}
                          title={completeName}
                          aria-label={completeName}
                          className="group w-9 h-9 rounded-full bg-blue-900 text-white flex items-center justify-center text-[11px] font-bold shadow-sm ring-2 ring-yellow-300 hover:bg-yellow-500 hover:text-blue-900 hover:ring-yellow-500 hover:scale-110 transition-all"
                        >
                          {initials}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="relative overflow-hidden bg-white rounded-xl shadow-sm p-4 flex flex-col justify-between">
                <div className="relative h-44 w-full rounded-lg overflow-hidden mb-2">
                  <img className="w-full h-full object-cover rounded-lg" alt="Testbed" src={PROJECT_IMG} />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-900/20 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-yellow-200 font-semibold">Testbed Deployment</p>
                      <p className="text-[13px] font-semibold truncate">{groupName}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  {[
                    { label: 'Group', value: groupName },
                    { label: 'Section', value: sectionName },
                    { label: 'Subject', value: subjectTitle },
                    { label: 'Referral Code', value: referralCode },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-1 bg-slate-50 px-2 rounded">
                      <span className="text-slate-500 text-[13px]">{r.label}</span>
                      <span className="font-mono text-blue-900 font-semibold text-xs truncate max-w-[140px]">
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] uppercase font-bold text-slate-500">
                    Mentorship & Advisory Board
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <div className="p-2 bg-blue-50 rounded-lg flex items-center gap-2 border border-blue-100">
                    <div className="w-9 h-9 rounded-full bg-blue-900 text-yellow-200 flex items-center justify-center font-bold text-[13px] shrink-0">
                      {getInitials(adviserName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 truncate">{adviserName}</p>
                      <p className="text-[11px] text-slate-500 truncate">Primary Adviser</p>
                    </div>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded-lg flex items-center gap-2 border border-yellow-200">
                    <div className="w-9 h-9 rounded-full bg-yellow-400 text-blue-900 flex items-center justify-center font-bold text-[13px] shrink-0">
                      {getInitials(coAdviserName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 truncate">{coAdviserName}</p>
                      <p className="text-[11px] text-slate-500 truncate">Co-Adviser</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ⭐ Chapter Tracking — SEQUENTIAL CHAPTERS (Defense Gate Banner REMOVED) */}
          <div className="mt-4 bg-white rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-blue-600 text-[24px]">timeline</span>
                  <h2 className="text-base text-blue-900 font-bold">
                    Chapter Tracking & Completion Pathway
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sequential progression — each chapter unlocks after the previous is proceeded by the Subject Instructor.
                </p>
              </div>
              <div className="flex items-center gap-1 bg-blue-50 p-1 rounded-lg border border-blue-100">
                <button
                  className={`px-2 py-1 rounded text-[11px] transition-all ${viewMode === 'full' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-blue-700 hover:text-blue-900'}`}
                  onClick={() => setViewMode('full')}
                >Full View</button>
                <button
                  className={`px-2 py-1 rounded text-[11px] transition-all ${viewMode === 'pending' ? 'bg-yellow-400 text-blue-900 font-semibold shadow-sm' : 'text-yellow-700 hover:text-yellow-900'}`}
                  onClick={() => setViewMode('pending')}
                >Pending Only</button>
              </div>
            </div>

            {/* ⭐ Stepper — sequential nodes */}
            <div className="relative hidden xl:block py-2 mb-6">
              <div className="absolute top-6 left-6 right-6 h-0.5 bg-slate-300 -z-0"></div>
              <div
                className="absolute top-6 left-6 h-0.5 bg-gradient-to-r from-blue-600 to-yellow-400 -z-0"
                style={{
                  width: `${stepperNodes.length > 1
                    ? (doneChapters / (stepperNodes.length - 1)) * 100
                    : 0}%`,
                }}
              ></div>
              <div
                className="grid gap-1 relative z-10 text-center"
                style={{ gridTemplateColumns: `repeat(${stepperNodes.length}, minmax(0, 1fr))` }}
              >
                {stepperNodes.map((node) => (
                  <div key={node.id} className="flex flex-col items-center">
                    {node.status === 'done' && (
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-yellow-200 flex items-center justify-center font-bold shadow-sm ring-2 ring-yellow-300">
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </div>
                    )}
                    {node.status === 'active' && node.rawStatus === 'completed' && (
                      <div className="w-8 h-8 rounded-full bg-yellow-400 text-blue-900 flex items-center justify-center font-bold shadow-sm ring-2 ring-yellow-200">
                        <span className="material-symbols-outlined text-[16px]">bolt</span>
                      </div>
                    )}
                    {node.status === 'active' && node.rawStatus === 'submitted' && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-500 text-blue-700 flex items-center justify-center font-bold shadow-sm">
                        <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
                      </div>
                    )}
                    {node.status === 'active' && node.rawStatus === 'unlocked' && (
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-blue-600 text-blue-600 flex items-center justify-center font-bold shadow-sm relative">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping absolute"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      </div>
                    )}
                    {node.status === 'pending' && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                      </div>
                    )}
                    <span className={`text-[10px] mt-2 truncate max-w-full ${
                      node.status === 'done'
                        ? 'font-bold text-blue-900'
                        : node.rawStatus === 'unlocked'
                        ? 'font-bold text-blue-700'
                        : node.rawStatus === 'completed'
                        ? 'font-bold text-yellow-800'
                        : 'font-medium text-slate-500'
                    }`}>
                      {node.title}
                    </span>
                    <span className={`text-[10px] font-mono ${
                      node.status === 'done'
                        ? 'text-yellow-700 font-semibold'
                        : node.rawStatus === 'unlocked'
                        ? 'text-blue-600'
                        : 'text-slate-500'
                    }`}>
                      {node.meta}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ⭐ Milestone rows — sequential */}
            <div className="space-y-1">
              {visibleMilestones.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Walang chapter progression pa para sa title na ito.
                </div>
              )}
              {visibleMilestones.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col md:flex-row md:items-center justify-between p-2 rounded-lg transition-colors border ${
                    m.status === 'done'
                      ? 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200'
                      : m.rawStatus === 'completed'
                      ? 'bg-yellow-50/60 hover:bg-yellow-100 border-yellow-200'
                      : m.rawStatus === 'submitted'
                      ? 'bg-blue-50 hover:bg-blue-100 border-blue-200'
                      : m.rawStatus === 'unlocked'
                      ? 'bg-white hover:bg-blue-50 border-blue-200'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      m.status === 'done'
                        ? 'bg-blue-600 text-yellow-200'
                        : m.rawStatus === 'completed'
                        ? 'bg-yellow-400 text-blue-900'
                        : m.rawStatus === 'submitted'
                        ? 'bg-blue-100 text-blue-700 border border-blue-400'
                        : m.rawStatus === 'unlocked'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {m.status === 'done'
                          ? 'check_circle'
                          : m.rawStatus === 'completed'
                          ? 'bolt'
                          : m.rawStatus === 'submitted'
                          ? 'hourglass_top'
                          : m.rawStatus === 'unlocked'
                          ? 'unlock'
                          : 'lock'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className={`text-[13px] ${m.status === 'done' ? 'font-bold text-blue-900' : 'font-semibold text-slate-900'}`}>
                          {m.title}
                        </span>
                        {m.chapter === 'Full Manuscript' && (
                          <span className="text-[9px] font-bold bg-yellow-300 text-yellow-900 px-1.5 py-0.5 rounded">
                            FINAL GATE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-2xl">{m.desc}</p>
                    </div>
                  </div>
                  <div className="mt-2 md:mt-0 flex items-center gap-4 pl-10 md:pl-0">
                    <span className="text-xs font-mono text-slate-500">{m.date}</span>
                    <span className={`text-[11px] font-medium ${
                      m.status === 'done'
                        ? 'text-yellow-800'
                        : m.rawStatus === 'completed'
                        ? 'text-yellow-700'
                        : m.rawStatus === 'submitted'
                        ? 'text-blue-700'
                        : m.rawStatus === 'unlocked'
                        ? 'text-blue-600'
                        : 'text-slate-500'
                    }`}>{m.meta}</span>
                    {m.url && (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:text-yellow-700 hover:underline font-semibold"
                      >
                        Open
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}