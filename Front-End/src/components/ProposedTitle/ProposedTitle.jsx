// src/components/ProposedTitle/ProposedTitle.jsx
import React, { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  Search, Eye, CheckCircle2, XCircle, Clock,
  ChevronLeft, ChevronRight, FileText,
  RefreshCw, UserCheck, User, Loader2,
  MessageSquare, Users, Shield, CalendarDays,
  BookOpen, Lock, Unlock, Award, Info, ArrowRight,
} from 'lucide-react';

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

import { AuthContext } from '../../contexts/AuthContext';
import { ProposedTitleContext } from '../../contexts/ProposedTitleContext/ProposedTitleContext';
import { CommentContext } from '../../contexts/CommentContext/CommentContext';

import DetailsModal from './DetailsModal';
import ProfessionalLoadingScreen from './ProfessionalLoadingScreen';
import PdfViewer from '../ReusablePDFviewer/PDFViewer';

// ============================================================
// ⭐ SEQUENTIAL CHAPTER CONSTANTS
// ============================================================
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

const REQUIRED_CHAPTERS = ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5'];

// ============================================================
// ⭐ DEFENSE GATE HELPERS
// ============================================================
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

const getNextSequentialChapter = (item) => {
  if (!item) return null;
  const approvals = item.chapterProgressionApprovals || {};
  for (const ch of SEQUENTIAL_CHAPTERS) {
    if (!getApprovalVal(approvals, ch)) return ch;
  }
  return null;
};

// ============================================================
// HELPERS
// ============================================================
const GLOBAL_KEY = '__global__';

const hexToRgb = (hex) => {
  const clean = (hex || '#fbbf24').replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
  };
};

const wrapTextForPdf = (text, font, fontSize, maxWidth) => {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
};

const getActualDisplayStatus = (item) => {
  if (item.status === 'Ready for Defense') return 'Ready for Defense';
  if (item.status === 'for_schedule') return 'For Defense Scheduling';
  if (item.status === 'Done') return 'Done';
  if (item.status === 'Approved') {
    if (item.adviser === true && item.coAdviser === true) return 'Mentors Confirmed';
    if (item.adviser === true && item.coAdviser === false) return 'Awaiting Co-Adviser Confirmation';
    if (item.adviser === false && item.coAdviser === true) return 'Awaiting Adviser Confirmation';
    return 'Pending Mentor Review';
  }
  return item.status || 'Pending';
};

const getStatusBadgeClass = (displayStatus) => {
  const badges = {
    'Mentors Confirmed': 'bg-blue-100 text-blue-900 border-blue-300',
    'Pending': 'bg-yellow-100 text-yellow-900 border-yellow-300',
    'Rejected': 'bg-rose-100 text-rose-800 border-rose-200',
    'Revision': 'bg-purple-100 text-purple-800 border-purple-200',
    'Awaiting Adviser Confirmation': 'bg-blue-100 text-blue-800 border-blue-200',
    'Awaiting Co-Adviser Confirmation': 'bg-blue-100 text-blue-800 border-blue-200',
    'Pending Mentor Review': 'bg-yellow-50 text-yellow-800 border-yellow-200',
    'Ready for Defense': 'bg-blue-900 text-yellow-300 border-blue-900',
    'For Defense Scheduling': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Done': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };
  return badges[displayStatus] || 'bg-slate-100 text-slate-800 border-slate-200';
};

const getStatusIconComponent = (displayStatus) => {
  switch (displayStatus) {
    case 'Mentors Confirmed': return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'Pending': return <Clock className="w-3.5 h-3.5" />;
    case 'Rejected': return <XCircle className="w-3.5 h-3.5" />;
    case 'Revision': return <RefreshCw className="w-3.5 h-3.5" />;
    case 'Awaiting Adviser Confirmation': return <User className="w-3.5 h-3.5" />;
    case 'Awaiting Co-Adviser Confirmation': return <UserCheck className="w-3.5 h-3.5" />;
    case 'Pending Mentor Review': return <Users className="w-3.5 h-3.5" />;
    case 'Ready for Defense': return <Shield className="w-3.5 h-3.5" />;
    case 'For Defense Scheduling': return <CalendarDays className="w-3.5 h-3.5" />;
    case 'Done': return <CheckCircle2 className="w-3.5 h-3.5" />;
    default: return <Clock className="w-3.5 h-3.5" />;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const getActionBadgeClass = (action) => {
  switch (action?.toLowerCase()) {
    case 'create': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'revision': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'ready for defense': return 'bg-blue-900 text-yellow-300 border-blue-900';
    case 'for schedule': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case 'done': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getLatestTrackingEntry = (submission) => {
  const tracking = submission?.titleUrlTracking;
  if (!Array.isArray(tracking) || tracking.length === 0) return null;
  return [...tracking].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];
};

const getChapterStatus = (chapter, item) => {
  const tracking = (item?.titleUrlTracking || []).filter((t) => t.chapter === chapter);
  const completedChapters = item?.completedChapters || [];
  const approvals = item?.chapterProgressionApprovals || {};
  const progressionApprovedAt = item?.chapterProgressionApprovedAt || {};

  const isCompleted = completedChapters.includes(chapter) ||
    tracking.some((t) => t.isCompleted === true);

  const isProceeded = getApprovalVal(approvals, chapter);

  const hasSubmissions = tracking.length > 0;
  const latestEntry = tracking.length > 0
    ? [...tracking].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;

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

// ============================================================
// STATUS STEPPER — ⭐ BLUE / YELLOW THEME
// ============================================================
const STATUS_STEPS = [
  { key: 'Pending', label: 'Proposal Submitted', icon: Clock },
  { key: 'Confirmed', label: 'Mentors Confirmed', icon: CheckCircle2 },
  { key: 'For Schedule', label: 'Defense Scheduling', icon: CalendarDays },
  { key: 'Ready for Defense', label: 'Ready for Defense', icon: Shield },
];

const getStepIndexFromStatus = (status) => {
  if (status === 'Ready for Defense' || status === 'Done') return 3;
  if (status === 'for_schedule') return 2;
  if (status === 'Approved') return 1;
  return 0;
};

const StatusStepper = ({ status, compact = false }) => {
  const currentStep = getStepIndexFromStatus(status);
  const isTerminalNegative = status === 'Rejected' || status === 'Revision';
  const isFullyDone = status === 'Ready for Defense' || status === 'Done';

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      {STATUS_STEPS.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = isFullyDone ? true : index < currentStep;
        const isActive = !isFullyDone && index === currentStep;
        const isRejected = isActive && isTerminalNegative;

        let circleClass = 'bg-blue-50 text-blue-300 border-blue-200';
        if (isCompleted) circleClass = 'bg-blue-900 text-yellow-300 border-blue-900';
        if (isActive && !isRejected) circleClass = 'bg-yellow-400 text-blue-950 border-yellow-400 ring-2 ring-yellow-200';
        if (isRejected) circleClass = 'bg-rose-500 text-white border-rose-500 ring-2 ring-rose-200';
        const lineClass = isFullyDone || index < currentStep ? 'bg-blue-900' : 'bg-blue-200';

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center rounded-full border-2 transition-all ${circleClass} ${compact ? 'w-6 h-6' : 'w-8 h-8'}`} title={step.label}>
                {isCompleted ? <CheckCircle2 className={compact ? 'w-3 h-3' : 'w-4 h-4'} /> : <Icon className={compact ? 'w-3 h-3' : 'w-4 h-4'} />}
              </div>
              {!compact && (
                <span className={`mt-1 text-[10px] font-medium whitespace-nowrap ${isCompleted || isActive ? 'text-blue-950' : 'text-blue-300'}`}>
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
// CONFIRM MODAL — ⭐ BLUE / YELLOW THEME
// ============================================================
const ConfirmModal = ({ isOpen, config, onConfirm, onCancel, isLoading }) => {
  if (!isOpen || !config) return null;

  const colorClasses = {
    emerald: { bg: 'bg-blue-50', icon: 'text-blue-700', button: 'bg-blue-900 hover:bg-blue-950', border: 'border-blue-200' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', button: 'bg-purple-600 hover:bg-purple-700', border: 'border-purple-200' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', button: 'bg-rose-600 hover:bg-rose-700', border: 'border-rose-200' },
    teal: { bg: 'bg-blue-50', icon: 'text-blue-700', button: 'bg-blue-900 hover:bg-blue-950', border: 'border-blue-200' },
    cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', button: 'bg-cyan-600 hover:bg-cyan-700', border: 'border-cyan-200' },
    amber: { bg: 'bg-yellow-50', icon: 'text-yellow-700', button: 'bg-yellow-400 hover:bg-yellow-300 text-blue-950', border: 'border-yellow-300' },
  };

  const c = colorClasses[config.color] || colorClasses.emerald;
  const IconComponent = config.icon || CheckCircle2;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-blue-950/60 backdrop-blur-sm" onClick={isLoading ? undefined : onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-blue-200">
        <div className={`${c.bg} px-6 py-5 border-b ${c.border}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${c.icon}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-blue-950">{config.title}</h3>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{config.message}</p>
          {config.itemTitle && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-[10px] uppercase font-bold text-blue-500 mb-1">Thesis / Capstone Title</p>
              <p className="text-sm font-medium text-blue-950 line-clamp-2">{config.itemTitle}</p>
            </div>
          )}
          {config.warning && (
            <div className={`text-xs px-3 py-2 rounded-lg ${c.bg} ${c.icon} border ${c.border} font-medium`}>{config.warning}</div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-blue-50 border-t border-blue-100">
          <button onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-blue-900 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition">Cancel</button>
          <button onClick={onConfirm} disabled={isLoading} className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm disabled:opacity-50 transition inline-flex items-center gap-2 ${c.button}`}>
            {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>) : (config.confirmLabel || 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CHAPTER PROGRESSION PANEL — ⭐ BLUE/YELLOW THEME
// ============================================================
const ChapterProgressionPanel = ({ item, onProceed, onReject, isProcessing }) => {
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [confirmChapter, setConfirmChapter] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const chapters = SEQUENTIAL_CHAPTERS.map((ch) => getChapterStatus(ch, item));
  const proceededCount = chapters.filter((c) => c.isProceeded).length;
  const totalCount = chapters.length;
  const fullManuscriptProceeded = isFullyProceeded(item);
  const remaining = getRemainingChaptersForDefense(item);

  const handleProceedClick = (chapter) => {
    setConfirmChapter(chapter);
    setActionType('proceed');
    setFeedbackText('');
  };

  const handleRejectClick = (chapter) => {
    setConfirmChapter(chapter);
    setActionType('reject');
    setFeedbackText('');
  };

  const handleConfirm = async () => {
    if (!confirmChapter) return;
    if (actionType === 'proceed') {
      await onProceed(item._id, confirmChapter, feedbackText);
    } else if (actionType === 'reject') {
      await onReject(item._id, confirmChapter, feedbackText);
    }
    setConfirmChapter(null);
    setActionType(null);
    setFeedbackText('');
  };

  const progressPercent = (proceededCount / totalCount) * 100;

  return (
    <div className="space-y-3">
      {/* ⭐ BLUE → YELLOW PROGRESS HEADER */}
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
            ? '✅ All chapters proceeded — Defense button available!'
            : `${remaining} chapter${remaining !== 1 ? 's' : ''} remaining before Defense button unlocks`}
        </p>
      </div>

      {/* Chapter List */}
      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {chapters.map((ch) => {
          const isExpanded = expandedChapter === ch.chapter;

          let badgeStyle = 'bg-blue-50 text-blue-400 border-blue-200';
          let badgeLabel = 'Locked';
          let badgeIcon = '🔒';

          if (ch.status === 'proceeded') {
            badgeStyle = 'bg-yellow-100 text-yellow-800 border-yellow-300';
            badgeLabel = 'Proceeded';
            badgeIcon = '✓';
          } else if (ch.status === 'completed') {
            badgeStyle = 'bg-blue-100 text-blue-800 border-blue-300';
            badgeLabel = 'Ready to Proceed';
            badgeIcon = '⚡';
          } else if (ch.status === 'submitted') {
            badgeStyle = 'bg-yellow-100 text-yellow-800 border-yellow-300';
            badgeLabel = 'Pending Review';
            badgeIcon = '⏳';
          } else if (ch.status === 'unlocked') {
            badgeStyle = 'bg-cyan-100 text-cyan-700 border-cyan-200';
            badgeLabel = 'Unlocked';
            badgeIcon = '🔓';
          }

          const canProceed = ch.status === 'completed' && !ch.isProceeded;
          const canReject = ch.status === 'completed' && !ch.isProceeded;
          const isFinalChapter = ch.chapter === 'Full Manuscript';

          return (
            <div
              key={ch.chapter}
              className={`rounded-lg border transition-all ${
                ch.status === 'proceeded'
                  ? 'bg-yellow-50 border-yellow-300'
                  : ch.status === 'completed'
                  ? 'bg-blue-50 border-blue-300'
                  : isFinalChapter
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-white border-blue-100'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedChapter(isExpanded ? null : ch.chapter)}
                className="w-full text-left px-3 py-2 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-base">{badgeIcon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-blue-950 truncate flex items-center gap-1">
                      {ch.chapter}
                      {isFinalChapter && (
                        <span className="text-[9px] font-bold bg-yellow-400 text-blue-950 px-1.5 py-0.5 rounded">
                          FINAL GATE
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-blue-500">
                      {ch.submissions > 0
                        ? `${ch.submissions} submission${ch.submissions > 1 ? 's' : ''}`
                        : 'No submissions yet'}
                    </div>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle} shrink-0`}>
                  {badgeLabel}
                </span>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-blue-100 space-y-2">
                  {ch.isProceeded && (
                    <div className="bg-yellow-100 border border-yellow-300 rounded-md p-2 text-[10px]">
                      <p className="font-bold text-yellow-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Proceeded by Subject Instructor
                      </p>
                      {ch.progressionApprovedAt?.[ch.chapter] && (
                        <p className="text-yellow-700 mt-0.5">
                          {formatDate(ch.progressionApprovedAt[ch.chapter])}
                        </p>
                      )}
                    </div>
                  )}

                  {canProceed && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleProceedClick(ch.chapter)}
                        disabled={isProcessing}
                        className={`flex-1 px-2 py-1.5 text-white text-[10px] font-bold rounded-md disabled:opacity-50 transition flex items-center justify-center gap-1 ${
                          isFinalChapter
                            ? 'bg-yellow-400 hover:bg-yellow-300 text-blue-950'
                            : 'bg-blue-900 hover:bg-blue-950'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Proceed {ch.chapter}
                        {isFinalChapter && ' → Unlock Defense'}
                      </button>
                      {canReject && (
                        <button
                          onClick={() => handleRejectClick(ch.chapter)}
                          disabled={isProcessing}
                          className="px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-md disabled:opacity-50 transition flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      )}
                    </div>
                  )}

                  {ch.status === 'completed' && !ch.isProceeded && (
                    <p className="text-[10px] text-blue-700 italic flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Adviser marked this complete. Ready for you to proceed.
                    </p>
                  )}

                  {ch.status === 'unlocked' && (
                    <p className="text-[10px] text-cyan-700 italic flex items-center gap-1">
                      <Unlock className="w-3 h-3" />
                      Student can now upload this chapter.
                    </p>
                  )}

                  {ch.status === 'locked' && (
                    <p className="text-[10px] text-blue-500 italic flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Previous chapter must be proceeded first.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ⭐ BLUE/YELLOW DEFENSE GATE BANNER */}
      <div className={`rounded-lg p-3 border-2 ${
        fullManuscriptProceeded
          ? 'bg-yellow-50 border-yellow-400'
          : 'bg-blue-50 border-blue-300'
      }`}>
        <div className="flex items-start gap-2">
          {fullManuscriptProceeded ? (
            <>
              <Shield className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-yellow-800">✅ Defense Button UNLOCKED</p>
                <p className="text-[10px] text-yellow-700 mt-0.5">
                  All chapters proceeded. Schedule Defense and Mark Ready buttons are now available.
                </p>
              </div>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-blue-900">🔒 Defense Button LOCKED</p>
                <p className="text-[10px] text-blue-700 mt-0.5">
                  Complete and Proceed all {totalCount} chapters (up to Full Manuscript) to unlock defense scheduling.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmChapter && actionType && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/60 backdrop-blur-sm" onClick={isProcessing ? undefined : () => setConfirmChapter(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                actionType === 'proceed'
                  ? confirmChapter === 'Full Manuscript'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
                  : 'bg-rose-100 text-rose-600'
              }`}>
                {actionType === 'proceed' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-950">
                  {actionType === 'proceed' ? 'Proceed Chapter?' : 'Reject Chapter?'}
                </h3>
                <p className="text-xs text-blue-500">{confirmChapter}</p>
              </div>
            </div>

            {confirmChapter === 'Full Manuscript' && actionType === 'proceed' && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-3">
                <p className="text-[11px] font-bold text-yellow-800">🎓 FINAL GATE</p>
                <p className="text-[10px] text-yellow-700 mt-0.5">
                  Proceeding Full Manuscript will UNLOCK the Defense buttons for this thesis!
                </p>
              </div>
            )}

            <p className="text-sm text-slate-600 mb-3">
              {actionType === 'proceed'
                ? `This will unlock the next chapter for the student. Are you sure ${confirmChapter} is complete and ready?`
                : `This will send ${confirmChapter} back for revision. Student must reupload.`}
            </p>

            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
              placeholder={actionType === 'proceed' ? 'Optional: Feedback for the student...' : 'Required: Reason for rejection...'}
              className="w-full px-3 py-2 text-xs rounded-lg bg-blue-50 border border-blue-200 focus:ring-2 focus:ring-blue-900 outline-none resize-none mb-3 text-slate-800 placeholder:text-blue-400"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmChapter(null)} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-blue-900 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50">Cancel</button>
              <button
                onClick={handleConfirm}
                disabled={isProcessing || (actionType === 'reject' && !feedbackText.trim())}
                className={`px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2 ${
                  actionType === 'proceed'
                    ? confirmChapter === 'Full Manuscript'
                      ? 'bg-yellow-400 hover:bg-yellow-300 text-blue-950'
                      : 'bg-blue-900 hover:bg-blue-950 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <>
                    {actionType === 'proceed' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {actionType === 'proceed'
                      ? confirmChapter === 'Full Manuscript'
                        ? 'Proceed & Unlock Defense'
                        : 'Proceed'
                      : 'Reject'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ProposedTitle() {
  const {
    proposedTitles, isLoading: contextLoading, totalPages,
    GetByTrackingID, GetPdfBlobUrl,
    currentPage: contextCurrentPage, setCurrentPage: setContextCurrentPage,
    limit, search, setSearch, statusFilter, setStatusFilter,
    dateFrom, dateTo, groupIdFilter, totalProposedTitles,
    FetchProposedTitles, UpdateProposedTitle, customError,
    ProceedChapter, RejectChapter,
  } = useContext(ProposedTitleContext);

  const { userId, role } = useContext(AuthContext);
  const normalizedRole = (role || '').toLowerCase().trim();
  const isStudentViewOnly = normalizedRole === 'student';

  const isSubjectInstructor = normalizedRole === 'subject_instructor';
  const isAdmin = ['admin', 'organizer'].includes(normalizedRole);
  const canProceedChapters = isSubjectInstructor || isAdmin;

  const canAnnotate = useMemo(() => {
    const r = (role || '').toLowerCase().trim();
    return r !== 'student' && [
      'adviser', 'coadviser', 'co-adviser', 'subject_instructor',
      'admin', 'organizer', 'panelist',
    ].includes(r);
  }, [role]);

  const effectiveReadOnly = isStudentViewOnly;

  const {
    comments, CreateComment, FetchCommentsByProposedTitle,
    DeleteComment, ClearPageAnnotations, ResetComments,
  } = useContext(CommentContext);

  const [localSearchTerm, setLocalSearchTerm] = useState(search || '');
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter || 'All');
  const [rowsPerPage, setRowsPerPage] = useState(limit || 5);

  const [modalItem, setModalItem] = useState(null);
  const [viewSubmission, setViewSubmission] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [activeTrackingId, setActiveTrackingId] = useState(null);

  const [trackingLoading, setTrackingLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, config: null, onConfirm: null, itemId: null, newStatus: null });
  const [isProcessing, setIsProcessing] = useState(false);

  const [progressionModalItem, setProgressionModalItem] = useState(null);
  const [isProceedingChapter, setIsProceedingChapter] = useState(false);

  const [rowProceedingId, setRowProceedingId] = useState(null);

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
  const [isClearing, setIsClearing] = useState(false);

  const proposedTitleId = useMemo(() => {
    if (!viewSubmission) return activeTrackingId || null;
    const latest = getLatestTrackingEntry(viewSubmission);
    if (latest?._id) return latest._id;
    return activeTrackingId || viewSubmission?._id || null;
  }, [viewSubmission, activeTrackingId]);

  useEffect(() => {
    if (!comments || comments.length === 0) return;
    setPdfAnnotations(prev => mergeBackendCommentsIntoAnnotations(prev, comments));
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

  useEffect(() => { anchorRefs.current = {}; }, [annotationPageNum]);

  useEffect(() => {
    let cancelled = false;
    const fetchPdf = async () => {
      if (!isViewMode || !activeTrackingId) {
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
  }, [isViewMode, activeTrackingId]);

  useEffect(() => () => { if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl); }, []);

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
  // ROLE DETECTION
  // ============================================================
  const isUserAdviser = useCallback((item) => {
    if (!item || !userId) return false;
    const groupInfo = item.groupInfo || {};
    const collect = (v) => (v ? (Array.isArray(v) ? v : [v]) : []);
    const candidates = [
      groupInfo.adviserId, groupInfo.adviser, groupInfo.mentorId, groupInfo.mentor,
      groupInfo.assignedAdviser, groupInfo.assignedMentor?.[0],
      ...collect(groupInfo.advisers).slice(0, 1),
      ...collect(groupInfo.mentors).slice(0, 1),
      ...collect(groupInfo.assignedMentors).slice(0, 1),
      item.adviserId, item.adviser, item.mentorId, item.mentor,
    ].filter(Boolean).map(p => typeof p === 'object' ? (p._id || p.userId || p.user?._id || p.user) : p)
      .filter(Boolean).map(id => String(id));
    return candidates.includes(String(userId));
  }, [userId]);

  const isUserCoAdviser = useCallback((item) => {
    if (!item || !userId) return false;
    const groupInfo = item.groupInfo || {};
    const collect = (v) => (v ? (Array.isArray(v) ? v : [v]) : []);
    const candidates = [
      groupInfo.coAdviserId, groupInfo.coadviserId, groupInfo.coAdviser, groupInfo.coadviser,
      groupInfo.assignedCoAdviser, groupInfo.assignedMentor?.[1],
      ...collect(groupInfo.coAdvisers).slice(0, 1),
      ...collect(groupInfo.coadvisers).slice(0, 1),
      ...collect(groupInfo.assignedMentors).slice(1, 2),
      item.coAdviserId, item.coadviserId, item.coAdviser, item.coadviser,
    ].filter(Boolean).map(p => typeof p === 'object' ? (p._id || p.userId || p.user?._id || p.user) : p)
      .filter(Boolean).map(id => String(id));
    return candidates.includes(String(userId));
  }, [userId]);

  const isUserPanelist = useCallback((item) => {
    if (!item || !userId) return false;
    const groupInfo = item.groupInfo || {};
    const collect = (v) => (v ? (Array.isArray(v) ? v : [v]) : []);
    const candidates = [
      ...collect(groupInfo.panelists), ...collect(groupInfo.panelistIds),
      ...collect(groupInfo.assignedPanelists), ...collect(groupInfo.panelMembers),
      ...collect(groupInfo.panelMemberIds), ...collect(groupInfo.panel),
      groupInfo.panelistId, groupInfo.panelist, groupInfo.assignedPanelist,
      ...collect(item.panelists), ...collect(item.panelistIds),
      ...collect(item.assignedPanelists), ...collect(item.panelMembers),
      ...collect(item.panelMemberIds), ...collect(item.panel),
      item.panelistId, item.panelist, item.assignedPanelist, item.panelMember,
    ].filter(Boolean).map(p => typeof p === 'object' ? (p._id || p.userId || p.user?._id || p.user) : p)
      .filter(Boolean).map(id => String(id));
    return candidates.includes(String(userId));
  }, [userId]);

  // ============================================================
  // CHAPTER PROGRESSION HANDLERS
  // ============================================================
  const handleProceedChapter = async (titleId, chapter, feedback = '') => {
    if (!canProceedChapters) {
      showNotification('❌ Only Subject Instructors can proceed chapters', true);
      return;
    }
    setIsProceedingChapter(true);
    try {
      const result = await ProceedChapter(titleId, chapter, feedback);
      if (result.success) {
        const isFinalChapter = chapter === 'Full Manuscript';
        showNotification(
          isFinalChapter
            ? `🎓 Full Manuscript proceeded! Defense button UNLOCKED!`
            : `✅ ${chapter} proceeded! ${result.nextChapter ? `${result.nextChapter} unlocked.` : 'All chapters complete!'}`
        );
        await FetchProposedTitles(contextCurrentPage, rowsPerPage, search, dateFrom, dateTo, statusFilter, groupIdFilter);
        setProgressionModalItem(null);
      } else {
        showNotification(`❌ Failed: ${result.error}`, true);
      }
    } finally {
      setIsProceedingChapter(false);
    }
  };

  const handleRejectChapter = async (titleId, chapter, feedback) => {
    if (!canProceedChapters) {
      showNotification('❌ Only Subject Instructors can reject chapters', true);
      return;
    }
    if (!feedback?.trim()) {
      showNotification('❌ Feedback is required to reject', true);
      return;
    }
    setIsProceedingChapter(true);
    try {
      const result = await RejectChapter(titleId, chapter, feedback);
      if (result.success) {
        showNotification(`✅ ${chapter} sent back for revision`);
        await FetchProposedTitles(contextCurrentPage, rowsPerPage, search, dateFrom, dateTo, statusFilter, groupIdFilter);
        setProgressionModalItem(null);
      } else {
        showNotification(`❌ Failed: ${result.error}`, true);
      }
    } finally {
      setIsProceedingChapter(false);
    }
  };

  const handleSequentialProceed = async (item) => {
    if (!canProceedChapters) {
      showNotification('❌ Only Subject Instructors can proceed chapters', true);
      return;
    }

    if (!(item.adviser === true && item.coAdviser === true)) {
      showNotification(
        '🔒 Cannot proceed chapter — mentors must approve the proposal first.',
        true
      );
      return;
    }

    const nextChapter = getNextSequentialChapter(item);
    if (!nextChapter) {
      showNotification('✅ All chapters already proceeded!', false);
      return;
    }

    const isFinal = nextChapter === 'Full Manuscript';
    const confirmed = window.confirm(
      isFinal
        ? `🎓 Proceed FULL MANUSCRIPT?\n\nThis will UNLOCK the Defense buttons for:\n"${item.title}"`
        : `Proceed "${nextChapter}" for:\n"${item.title}"?\n\nThis will unlock the next chapter for the student.`
    );
    if (!confirmed) return;

    setRowProceedingId(item._id);
    try {
      const result = await ProceedChapter(item._id, nextChapter, '');
      if (result.success) {
        showNotification(
          isFinal
            ? `🎓 Full Manuscript proceeded! Defense button UNLOCKED!`
            : `✅ ${nextChapter} proceeded! ${result.nextChapter ? `${result.nextChapter} unlocked.` : 'All chapters complete!'}`
        );
        await FetchProposedTitles(contextCurrentPage, rowsPerPage, search, dateFrom, dateTo, statusFilter, groupIdFilter);
      } else {
        showNotification(`❌ Failed: ${result.error}`, true);
      }
    } finally {
      setRowProceedingId(null);
    }
  };

  // ============================================================
  // CONFIRM MODAL CONFIG
  // ============================================================
  const buildConfirmConfig = (newStatus, item) => {
    switch (newStatus) {
      case 'Approved': {
        const isRevisionItem = (item?.status || '').toLowerCase() === 'revision' || item?.isRevesion === true;
        if (isRevisionItem) {
          return {
            title: 'Re-Approve Revised Proposal',
            message: 'The student has submitted a revision of this thesis/capstone proposal. Please review the updated document before re-approving.',
            itemTitle: item?.title,
            warning: '⚠️ Once you re-approve, the proposal returns to "Approved" status and the student can proceed to the next stage (documents, defense scheduling).',
            confirmLabel: 'Yes, Re-Approve Revision',
            color: 'emerald', icon: CheckCircle2,
          };
        }
        return {
          title: 'Approve Thesis Proposal',
          message: 'Are you sure you want to APPROVE this thesis/capstone proposal as a mentor?',
          itemTitle: item?.title,
          warning: 'Once approved, you can view the thesis documents and your approval will count as mentor confirmation for the defense.',
          confirmLabel: 'Yes, Approve Proposal',
          color: 'emerald', icon: CheckCircle2,
        };
      }
      case 'Revision': {
        const wasApproved = (item?.status || '').toLowerCase() === 'approved';
        const bothApproved = item?.adviser === true && item?.coAdviser === true;
        if (wasApproved && bothApproved) {
          return {
            title: 'Request Post-Approval Revision',
            message: 'This proposal has already been approved by both mentors. Requesting revision now will send it BACK to the students for rework.',
            itemTitle: item?.title,
            warning: '⚠️ Both mentor approvals will be reset. After the student resubmits, you and the co-adviser must re-approve.',
            confirmLabel: 'Yes, Request Revision',
            color: 'purple', icon: RefreshCw,
          };
        }
        if (wasApproved) {
          return {
            title: 'Request Revision (Already Approved)',
            message: 'This proposal was already approved by one mentor. Requesting revision will send it back to the student for rework.',
            itemTitle: item?.title,
            warning: '⚠️ The existing approval will be reset. The student must resubmit and both mentors must re-approve.',
            confirmLabel: 'Yes, Request Revision',
            color: 'purple', icon: RefreshCw,
          };
        }
        return {
          title: 'Request Proposal Revision',
          message: 'Are you sure you want to request a REVISION of this proposal?',
          itemTitle: item?.title,
          warning: 'The student researchers will be notified to revise their manuscript.',
          confirmLabel: 'Yes, Request Revision',
          color: 'purple', icon: RefreshCw,
        };
      }
      case 'Rejected': return {
        title: 'Reject Thesis Proposal',
        message: 'Are you sure you want to REJECT this thesis/capstone proposal?',
        itemTitle: item?.title,
        warning: '⚠️ This action cannot be undone. Student researchers must resubmit.',
        confirmLabel: 'Yes, Reject Proposal',
        color: 'rose', icon: XCircle,
      };
      case 'for_schedule': return {
        title: 'Schedule Defense',
        message: 'Are you sure you want to move this proposal to DEFENSE SCHEDULING?',
        itemTitle: item?.title,
        warning: '✅ All chapters proceeded. Panel will now review and schedule the defense.',
        confirmLabel: 'Yes, Schedule Defense',
        color: 'cyan', icon: CalendarDays,
      };
      default: return {
        title: 'Confirm Action',
        message: `Set this proposal to "${newStatus}"?`,
        itemTitle: item?.title,
        confirmLabel: 'Confirm',
        color: 'emerald', icon: CheckCircle2,
      };
    }
  };

  const handleStatusChange = (id, newStatus) => {
    try {
      const item = currentRows.find(r => String(r._id) === String(id));
      if (!item) { showNotification('❌ Proposal not found', true); return; }
      const userIsAdviser = isUserAdviser(item);
      const userIsCoAdviser = isUserCoAdviser(item);
      const userIsPanelist = isUserPanelist(item);
      const isPrivileged = ['admin', 'organizer'].includes(normalizedRole);

      if (newStatus === 'for_schedule') {
        if (!isFullyProceeded(item)) {
          const remaining = getRemainingChaptersForDefense(item);
          showNotification(
            `🔒 Cannot schedule defense yet. ${remaining} chapter${remaining !== 1 ? 's' : ''} still need Subject Instructor approval (including Full Manuscript).`,
            true
          );
          return;
        }
        const canSchedule = normalizedRole === 'adviser' || userIsAdviser || (userIsPanelist && normalizedRole === 'panelist') || isPrivileged || isSubjectInstructor;
        if (!canSchedule) { showNotification('❌ Not authorized to schedule this defense', true); return; }
        if (item.status !== 'Approved') { showNotification('⚠️ Both mentors must approve first', true); return; }
      } else {
        if (!userIsAdviser && !userIsCoAdviser && !userIsPanelist && !isPrivileged) {
          showNotification('❌ Not authorized', true); return;
        }
        if (newStatus !== 'Revision') {
          if (userIsAdviser && item.adviser === true && !userIsPanelist && !item.isRevesion) {
            showNotification('⚠️ You already approved this proposal', true); return;
          }
          if (userIsCoAdviser && item.coAdviser === true && !userIsPanelist && !item.isRevesion) {
            showNotification('⚠️ You already approved this proposal', true); return;
          }
          if (userIsPanelist && item.panelist === true && !userIsAdviser) {
            showNotification('⚠️ You already approved this proposal', true); return;
          }
        }
      }
      setConfirmModal({ isOpen: true, config: buildConfirmConfig(newStatus, item), onConfirm: () => executeStatusChange(id, newStatus), itemId: id, newStatus });
    } catch (error) { showNotification(`❌ Failed: ${error.message}`, true); }
  };

  const executeStatusChange = async (id, newStatus) => {
    setIsProcessing(true);
    try {
      const itemBefore = currentRows.find(r => String(r._id) === String(id));
      const wasRevision = (itemBefore?.status || '').toLowerCase() === 'revision';
      const wasApproved = (itemBefore?.status || '').toLowerCase() === 'approved';

      const result = await UpdateProposedTitle(id, { status: newStatus });
      if (result.success) {
        let successMsg = '';
        if (newStatus === 'Approved') {
          const wasEverRevision = wasRevision || itemBefore?.isRevesion === true;
          successMsg = wasEverRevision ? '✅ Revision re-approved! You can now view the updated documents.' : '✅ Proposal approved! You can now view the documents.';
        } else if (newStatus === 'for_schedule') {
          successMsg = '✅ Proposal moved to Defense Scheduling!';
        } else if (newStatus === 'Revision') {
          successMsg = wasApproved ? '✅ Post-approval revision requested. Approvals reset — student notified.' : '✅ Revision requested. Student will be notified.';
        } else if (newStatus === 'Rejected') {
          successMsg = '✅ Proposal rejected.';
        } else {
          successMsg = `✅ Proposal ${newStatus} successfully!`;
        }
        showNotification(successMsg);
        FetchProposedTitles(contextCurrentPage, rowsPerPage, search, dateFrom, dateTo, statusFilter, groupIdFilter);
      } else {
        showNotification(`❌ Failed: ${result.error || 'Unknown error'}`, true);
      }
    } catch (error) {
      showNotification(`❌ Failed: ${error.message}`, true);
    } finally {
      setIsProcessing(false);
      setConfirmModal({ isOpen: false, config: null, onConfirm: null, itemId: null, newStatus: null });
    }
  };

  const handleCancelConfirm = () => {
    if (isProcessing) return;
    setConfirmModal({ isOpen: false, config: null, onConfirm: null, itemId: null, newStatus: null });
  };

  const handleConfirmModal = () => { if (confirmModal.onConfirm) confirmModal.onConfirm(); };

  const handleReadyForDefense = async (id) => {
    const allowedRoles = ['subject_instructor', 'admin', 'organizer'];
    if (!allowedRoles.includes(normalizedRole)) { showNotification('❌ Not authorized to mark defense readiness', true); return; }

    const itemCheck = currentRows.find(r => String(r._id) === String(id));
    if (itemCheck && !isFullyProceeded(itemCheck)) {
      const remaining = getRemainingChaptersForDefense(itemCheck);
      showNotification(
        `🔒 Cannot mark Ready for Defense yet. ${remaining} chapter${remaining !== 1 ? 's' : ''} still need Subject Instructor approval (including Full Manuscript).`,
        true
      );
      return;
    }

    if (!window.confirm('Mark this thesis/capstone as Ready for Defense?')) return;
    try {
      const item = currentRows.find(r => String(r._id) === String(id));
      if (!item) { showNotification('❌ Proposal not found', true); return; }
      if (!(item.adviser === true && item.coAdviser === true)) { showNotification('⚠️ Both adviser and co-adviser must approve first', true); return; }
      const result = await UpdateProposedTitle(id, { status: 'Ready for Defense' });
      if (result.success) {
        showNotification('🛡️ Marked as Ready for Defense!');
        FetchProposedTitles(contextCurrentPage, rowsPerPage, search, dateFrom, dateTo, statusFilter, groupIdFilter);
      } else { showNotification(`❌ Failed: ${result.error}`, true); }
    } catch (error) { showNotification(`❌ Failed: ${error.message}`, true); }
  };

  const showNotification = (msg, isError = false) => {
    setToastMessage({ msg, isError });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenModal = (item) => setModalItem(item);
  const handleCloseModal = () => setModalItem(null);

  const handleOpenProgressionModal = (item) => setProgressionModalItem(item);
  const handleCloseProgressionModal = () => setProgressionModalItem(null);

  const refreshComments = useCallback(async () => {
    if (!FetchCommentsByProposedTitle || !proposedTitleId) return;
    try { await FetchCommentsByProposedTitle(proposedTitleId, 1, 100); } catch (err) { console.warn(err); }
  }, [FetchCommentsByProposedTitle, proposedTitleId]);

  const handleOpenPdfViewer = async (item, urlOverride, trackingId = null) => {
    const latestTracking = getLatestTrackingEntry(item);
    const finalTrackingId = trackingId || latestTracking?._id;
    if (!finalTrackingId) { showNotification('❌ No tracking ID available for this thesis', true); return; }
    setModalItem(null);

    try { if (ResetComments) ResetComments(); } catch (err) { console.warn(err); }
    resetAnnotationsForNewSubmission();

    try {
      setTrackingLoading(true);
      const result = await GetByTrackingID(finalTrackingId);
      const data = result?.data || item;
      setViewSubmission(data);
      setActiveTrackingId(finalTrackingId);
      setIsViewMode(true);
      if (FetchCommentsByProposedTitle) {
        try { await FetchCommentsByProposedTitle(finalTrackingId, 1, 100); } catch (err) { console.warn(err); }
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
    setPdfBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    try { if (ResetComments) ResetComments(); } catch (err) { console.warn(err); }
  };

  // ============================================================
  // ANNOTATION ACTIONS
  // ============================================================
  const handleClearPageViaContext = async () => {
    if (!canAnnotate) { showNotification('⚠️ View-only — you cannot clear annotations.', true); return; }
    const annotations = pdfAnnotations[`page_${annotationPageNum}`] || [];
    if (annotations.length === 0) { showNotification('⚠️ No annotations on this page', true); return; }
    if (!window.confirm(`Delete all ${annotations.length} annotation(s) on page ${annotationPageNum}?`)) return;
    try {
      setIsClearing(true);
      const res = await ClearPageAnnotations(proposedTitleId, annotationPageNum);
      if (!res?.success) { showNotification(`❌ Clear failed: ${res?.error || 'Unknown'}`, true); return; }
      setPdfAnnotations(prev => ({ ...prev, [`page_${annotationPageNum}`]: [] }));
      await refreshComments();
      showNotification(`✅ Cleared ${res.deletedCount || annotations.length} annotation(s)`);
    } catch (err) {
      showNotification(`❌ Failed: ${err.message}`, true);
    } finally {
      setIsClearing(false);
    }
  };

  const handleAddPageComment = async (pageNum) => {
    if (!canAnnotate) { showNotification('⚠️ View-only — you cannot add feedback.', true); return; }
    const value = window.prompt(`Page ${pageNum} — Describe the issue (e.g., "Wrong font", "Formatting issue"):`);
    if (!value?.trim()) return;
    if (!proposedTitleId) { showNotification('❌ Missing proposedTitleId', true); return; }
    try {
      const res = await CreateComment(proposedTitleId, {
        text: value.trim(), pageNumber: pageNum, position: null,
        selectedText: null, color: annotationColor,
        annotationType: 'page', annotationLabel: 'Page Feedback', shape: 'pin',
      });
      if (res?.success) await refreshComments();
      else if (res?.error) showNotification(`❌ ${res.error}`, true);
    } catch (err) {
      showNotification(`❌ Failed: ${err.message}`, true);
    }
  };

  const handleAddGlobalComment = async () => {
    if (!canAnnotate) { showNotification('⚠️ View-only — you cannot add feedback.', true); return; }
    const value = window.prompt('🌐 Applies to ALL pages — Describe the issue (e.g., "Wrong font used throughout"):');
    if (!value?.trim()) return;
    if (!proposedTitleId) { showNotification('❌ Missing proposedTitleId', true); return; }
    try {
      const res = await CreateComment(proposedTitleId, {
        text: value.trim(), pageNumber: null, position: null,
        selectedText: null, color: '#f87171',
        annotationType: 'global', annotationLabel: 'All Pages Feedback', shape: 'pin',
      });
      if (res?.success) await refreshComments();
      else if (res?.error) showNotification(`❌ ${res.error}`, true);
    } catch (err) {
      showNotification(`❌ Failed: ${err.message}`, true);
    }
  };

  const handleClearGlobalAnnotations = async () => {
    if (!canAnnotate) { showNotification('⚠️ View-only — you cannot clear annotations.', true); return; }
    const globals = pdfAnnotations[GLOBAL_KEY] || [];
    if (globals.length === 0) return;
    if (!window.confirm(`Delete all ${globals.length} "All Pages" feedback?`)) return;
    try {
      setIsClearing(true);
      for (const g of globals) {
        const backendId = g.backendId || (g.__fromBackend ? g.id : null);
        if (backendId && DeleteComment) {
          try { await DeleteComment(backendId); } catch (err) { console.warn(err); }
        }
      }
      setPdfAnnotations(prev => {
        const next = { ...prev };
        delete next[GLOBAL_KEY];
        return next;
      });
      await refreshComments();
      showNotification('✅ All global feedback removed');
    } catch (err) {
      showNotification(`❌ Failed: ${err.message}`, true);
    } finally {
      setIsClearing(false);
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
        if (!res?.success) { showNotification(`❌ Delete failed: ${res?.error || 'Unknown error'}`, true); return; }
      }
      const pageKey = target.type === 'global' ? 'global' : (target.pageNum || annotationPageNum);
      setPdfAnnotations(prev => {
        const key = pageKey === 'global' ? GLOBAL_KEY : `page_${pageKey}`;
        return { ...prev, [key]: (prev[key] || []).filter(a => a.id !== target.id) };
      });
      await refreshComments();
      showNotification('✅ Feedback deleted');
    } catch (err) {
      showNotification(`❌ Failed: ${err.message}`, true);
    }
  };

  // ============================================================
  // SAVE ANNOTATED PDF
  // ============================================================
  const handleSaveAnnotatedPdf = async () => {
    if (!pdfBlobUrl || !activeTrackingId) { showNotification('❌ No PDF to generate', true); return; }

    const globals = (pdfAnnotations[GLOBAL_KEY] || []).map(a => ({ ...a, isGlobal: true }));
    const pageSpecific = Object.entries(pdfAnnotations)
      .filter(([key]) => key !== GLOBAL_KEY)
      .flatMap(([key, list]) => {
        const pageNum = parseInt(key.replace('page_', ''), 10);
        return (list || []).map(a => ({ ...a, pageNum }));
      });

    if (globals.length === 0 && pageSpecific.length === 0) {
      showNotification('⚠️ No annotations to generate', true); return;
    }

    setIsSavingPdf(true);
    try {
      const arrayBuffer = await fetch(pdfBlobUrl).then(r => r.arrayBuffer());
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();

      const totalAnn = [...globals, ...pageSpecific];
      const nums = {};
      totalAnn
        .slice()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .forEach((a, i) => { nums[a.id] = i + 1; });

      const drawNumberBadge = (page, cx, cy, num, colorRgb, size = 14) => {
        page.drawCircle({ x: cx, y: cy, size: size / 2, color: colorRgb, borderColor: rgb(1, 1, 1), borderWidth: 1.5 });
        const numStr = String(num);
        const textWidth = fontBold.widthOfTextAtSize(numStr, size * 0.55);
        page.drawText(numStr, { x: cx - textWidth / 2, y: cy - size * 0.2, size: size * 0.55, font: fontBold, color: rgb(1, 1, 1) });
      };

      const drawRectangleOnPage = (page, a, pw, ph, colorRgb) => {
        const x = a.x * pw;
        const w = a.w * pw;
        const h = a.h * ph;
        const y = ph - (a.y * ph) - h;
        page.drawRectangle({ x, y, width: w, height: h, color: colorRgb, opacity: 0.25, borderColor: colorRgb, borderWidth: 1.5 });
      };

      for (const g of globals) {
        const { r, g: gCol, b } = hexToRgb(g.color);
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const { width: pw, height: ph } = page.getSize();
          page.drawRectangle({ x: 0, y: 0, width: pw, height: ph, color: rgb(r, gCol, b), opacity: 0.06, borderColor: rgb(r, gCol, b), borderWidth: 1.5, borderDashArray: [6, 4] });
          drawNumberBadge(page, pw - 20, ph - 20, nums[g.id], rgb(r, gCol, b), 16);
          page.drawText('ALL PAGES', { x: pw - 74, y: ph - 38, size: 6.5, font: fontBold, color: rgb(r, gCol, b) });
        }
      }

      const sideByPage = {};
      for (const a of pageSpecific) {
        if ((a.type === 'highlight' || a.type === 'comment') && a.text) {
          if (!sideByPage[a.pageNum]) sideByPage[a.pageNum] = [];
          sideByPage[a.pageNum].push(a);
        }
      }
      Object.values(sideByPage).forEach(list => list.sort((x, y) => x.y - y.y));

      for (const a of pageSpecific) {
        const page = pages[a.pageNum - 1];
        if (!page) continue;
        const { width: pw, height: ph } = page.getSize();
        const { r, g, b } = hexToRgb(a.color);

        if (a.type === 'highlight') {
          drawRectangleOnPage(page, a, pw, ph, rgb(r, g, b));
          const x = a.x * pw;
          const h = a.h * ph;
          const y = ph - (a.y * ph) - h;
          drawNumberBadge(page, x - 6, y + h + 6, nums[a.id], rgb(r, g, b));
        }

        if (a.type === 'region') {
          drawRectangleOnPage(page, a, pw, ph, rgb(r, g, b));
          const x = a.x * pw;
          const h = a.h * ph;
          const y = ph - (a.y * ph) - h;
          drawNumberBadge(page, x - 6, y + h + 6, nums[a.id], rgb(r, g, b));
          if (a.text) {
            const fontSize = 8, pad = 4;
            const maxW = Math.min(a.w * pw, 240);
            const lines = wrapTextForPdf(a.text, font, fontSize, maxW - pad * 2);
            const lineH = 10;
            const boxH = pad * 2 + lines.length * lineH;
            let bx = x, by = y + h + 4;
            if (by + boxH > ph - 6) by = y - boxH - 4;
            page.drawRectangle({ x: bx, y: by, width: maxW, height: boxH, color: rgb(1, 1, 1), borderColor: rgb(r, g, b), borderWidth: 0.8 });
            let cy = by + boxH - pad - fontSize;
            for (const line of lines) {
              page.drawText(line, { x: bx + pad, y: cy, size: fontSize, font, color: rgb(0.15, 0.15, 0.2) });
              cy -= lineH;
            }
          }
        }

        if (a.type === 'page') {
          const bannerH = Math.min(120, 40 + (a.text || '').split('\n').length * 12);
          const bannerY = ph - bannerH - 8;
          page.drawRectangle({ x: 8, y: bannerY, width: pw - 16, height: bannerH, color: rgb(1, 1, 1), borderColor: rgb(r, g, b), borderWidth: 1.5 });
          page.drawRectangle({ x: 8, y: bannerY, width: 5, height: bannerH, color: rgb(r, g, b) });
          drawNumberBadge(page, pw - 20, bannerY + bannerH - 14, nums[a.id], rgb(r, g, b));
          page.drawText(`Page ${a.pageNum} - Mentor Feedback`, { x: 20, y: bannerY + bannerH - 16, size: 10, font: fontBold, color: rgb(r, g, b) });
          const bodyLines = wrapTextForPdf(a.text || '', font, 9, pw - 40);
          let cy = bannerY + bannerH - 32;
          for (const line of bodyLines.slice(0, 6)) {
            page.drawText(line, { x: 20, y: cy, size: 9, font, color: rgb(0.15, 0.15, 0.2) });
            cy -= 11;
          }
        }

        if (a.type === 'margin') {
          const boxW = 160, pad = 6, fontSize = 8, lineH = 10;
          const lines = wrapTextForPdf(a.text || '', font, fontSize, boxW - pad * 2);
          const boxH = pad * 2 + 14 + lines.length * lineH;
          let bx = pw - boxW - 6;
          let by = ph - (a.y * ph) - boxH / 2;
          by = Math.max(6, Math.min(ph - boxH - 6, by));
          page.drawRectangle({ x: bx, y: by, width: boxW, height: boxH, color: rgb(1, 1, 1), borderColor: rgb(r, g, b), borderWidth: 0.9 });
          page.drawRectangle({ x: bx, y: by + boxH - 14, width: boxW, height: 14, color: rgb(r, g, b) });
          drawNumberBadge(page, bx + 10, by + boxH - 7, nums[a.id], rgb(1, 1, 1), 12);
          page.drawText('MARGIN NOTE', { x: bx + pad + 14, y: by + boxH - 11, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
          let cy = by + boxH - 14 - pad - fontSize;
          for (const line of lines) {
            page.drawText(line, { x: bx + pad, y: cy, size: fontSize, font, color: rgb(0.15, 0.15, 0.2) });
            cy -= lineH;
          }
        }

        if (a.type === 'comment') {
          const pinSize = 14;
          const x = a.x * pw;
          const y = ph - (a.y * ph) - pinSize / 2;
          page.drawCircle({ x, y, size: pinSize / 2, color: rgb(r, g, b), borderColor: rgb(1, 1, 1), borderWidth: 1 });
          page.drawText('i', { x: x - 2, y: y - 3, size: 9, font: fontBold, color: rgb(1, 1, 1) });
          drawNumberBadge(page, x + pinSize, y + pinSize / 2, nums[a.id], rgb(r, g, b), 12);
        }
      }

      for (const [pageNumStr, list] of Object.entries(sideByPage)) {
        const pageNum = parseInt(pageNumStr, 10);
        const page = pages[pageNum - 1];
        if (!page) continue;
        const { width: pw, height: ph } = page.getSize();
        const boxW = Math.min(200, pw * 0.28);
        const pad = 6, fontSize = 8, lineH = 10, rightMargin = 6;
        const boxX = pw - boxW - rightMargin;
        let lastBoxBottom = ph + 20;
        for (const a of list) {
          const { r, g, b } = hexToRgb(a.color);
          const lines = wrapTextForPdf(a.text || '', font, fontSize, boxW - pad * 2 - 6);
          const boxH = pad * 2 + 14 + lines.length * lineH;
          const anchorX = a.type === 'highlight' ? (a.x + a.w) * pw : a.x * pw;
          const anchorY = a.type === 'highlight' ? ph - (a.y + a.h / 2) * ph : ph - a.y * ph;

          let boxTop = anchorY + boxH / 2;
          if (boxTop > lastBoxBottom - 6) boxTop = lastBoxBottom - 6;
          if (boxTop - boxH < 10) boxTop = boxH + 10;
          const boxY = boxTop - boxH;

          page.drawRectangle({ x: boxX, y: boxY, width: boxW, height: boxH, color: rgb(1, 1, 1), opacity: 0.55, borderColor: rgb(r, g, b), borderWidth: 0.8 });
          page.drawRectangle({ x: boxX, y: boxY, width: 3, height: boxH, color: rgb(r, g, b) });
          drawNumberBadge(page, boxX + 8, boxY + boxH - 8, nums[a.id], rgb(r, g, b), 11);
          page.drawText(a.type === 'highlight' ? 'HIGHLIGHT' : 'COMMENT', { x: boxX + 16, y: boxY + boxH - 10, size: 6.5, font: fontBold, color: rgb(r, g, b) });
          let cy = boxY + boxH - 14 - pad;
          for (const line of lines) {
            page.drawText(line, { x: boxX + pad, y: cy, size: fontSize, font, color: rgb(0.1, 0.1, 0.15) });
            cy -= lineH;
          }
          page.drawLine({ start: { x: anchorX, y: anchorY }, end: { x: boxX, y: boxY + boxH / 2 }, color: rgb(r, g, b), thickness: 0.7, opacity: 0.6, dashArray: [3, 2] });
          lastBoxBottom = boxY;
        }
      }

      const newPdfBytes = await pdfDoc.save();
      const newBlob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(newBlob);
      const downloadLink = document.createElement('a');
      const safeTitle = (viewSubmission?.title || 'thesis').replace(/[^a-z0-9]/gi, '_').slice(0, 60);
      downloadLink.href = downloadUrl;
      downloadLink.download = `${safeTitle}_annotated_${activeTrackingId}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);

      if (canAnnotate) {
        const formData = new FormData();
        formData.append('annotatedPdf', newBlob, `thesis-annotated-${activeTrackingId}.pdf`);
        formData.append('trackingId', activeTrackingId);
        formData.append('annotations', JSON.stringify([...globals, ...pageSpecific]));
        const API_BASE = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || '';
        try {
          const res = await axios.post(`${API_BASE}/proposed-titles/${activeTrackingId}/save-annotated-pdf`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          if (res.data?.success) {
            const freshUrl = await GetPdfBlobUrl(activeTrackingId);
            if (freshUrl) setPdfBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return freshUrl; });
          }
        } catch (uploadErr) {
          console.warn('⚠️ Server upload failed (download still succeeded):', uploadErr);
        }
      }

      showNotification(canAnnotate ? '✅ PDF generated with all annotations & downloaded!' : '✅ Annotated feedback PDF downloaded!');
    } catch (err) {
      console.error('❌ Generate annotated PDF error:', err);
      showNotification(`❌ Generate failed: ${err.message}`, true);
    } finally {
      setIsSavingPdf(false);
    }
  };

  // ============================================================
  // TABLE-LEVEL COMPUTED
  // ============================================================
  const isLoading = contextLoading;
  const currentRows = proposedTitles || [];
  const totalCount = totalProposedTitles || 0;
  const totalPagesCount = totalPages || 1;
  const startItem = totalCount === 0 ? 0 : (contextCurrentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(contextCurrentPage * rowsPerPage, totalCount);

  // ============================================================
  // AVAILABLE ACTIONS
  // ============================================================
  const getAvailableActions = (item) => {
    const { status, adviser, coAdviser } = item;
    const fullyProceeded = isFullyProceeded(item);

    if (status === 'Done') {
      return { showApprove: false, showReject: false, showRevision: false, showReadyForDefense: false, showForSchedule: false, isFullyApproved: false, isReadyForDefense: false, isForSchedule: false, isDone: true, canAct: false, alreadyApproved: false, fullyProceeded };
    }

    const userIsAdviser = isUserAdviser(item);
    const userIsCoAdviser = isUserCoAdviser(item);
    const userIsPanelist = isUserPanelist(item);
    const bothApproved = adviser === true && coAdviser === true;
    const isReady = status === 'Ready for Defense';
    const isForSchedule = status === 'for_schedule';
    const isApprovedStatus = status === 'Approved';
    const fullyApproved = isApprovedStatus && bothApproved;
    const isRejected = status === 'Rejected';
    const isRevisionStatus = (status || '').toLowerCase() === 'revision';
    const canMarkReadyForDefense = ['subject_instructor', 'admin', 'organizer'].includes(normalizedRole);

    const isRevisedAndApproved = item.isRevesion === true && isApprovedStatus;

    if (isRevisedAndApproved) {
      if (normalizedRole === 'panelist' && userIsPanelist && !userIsAdviser && !userIsCoAdviser) {
        const alreadyApprovedPanelist = item.panelist === true;
        if (alreadyApprovedPanelist) {
          return { showApprove: false, showReject: false, showRevision: false, showReadyForDefense: false, showForSchedule: false, isFullyApproved: bothApproved, isReadyForDefense: false, isForSchedule: false, canAct: false, alreadyApproved: true, isRevision: true, fullyProceeded };
        }
        return { showApprove: true, showReject: true, showRevision: false, showReadyForDefense: false, showForSchedule: false, isFullyApproved: bothApproved, isReadyForDefense: false, isForSchedule: false, canAct: true, alreadyApproved: false, isRevision: true, fullyProceeded };
      }

      const adviserStillNeedsAction = userIsAdviser && adviser !== true;
      const coAdviserStillNeedsAction = userIsCoAdviser && coAdviser !== true;

      if (adviserStillNeedsAction || coAdviserStillNeedsAction) {
        return { showApprove: true, showReject: true, showRevision: false, showReadyForDefense: false, showForSchedule: false, isFullyApproved: bothApproved, isReadyForDefense: false, isForSchedule: false, canAct: true, alreadyApproved: false, isRevision: true, fullyProceeded };
      }

      const isPrivileged = ['admin', 'organizer'].includes(normalizedRole);
      return {
        showApprove: false, showReject: false, showRevision: false,
        showReadyForDefense: canMarkReadyForDefense && !isReady && !isForSchedule && fullyProceeded,
        showForSchedule: (normalizedRole === 'adviser' || userIsAdviser) && !isForSchedule && fullyProceeded,
        isFullyApproved: bothApproved, isReadyForDefense: isReady, isForSchedule,
        canAct: canMarkReadyForDefense || isPrivileged, alreadyApproved: false, isRevision: true,
        fullyProceeded,
      };
    }

    if (normalizedRole === 'panelist' && !userIsAdviser && !userIsCoAdviser) {
      const alreadyApproved = item.panelist === true;
      const isDoneLocal = isReady || isForSchedule || isRejected || fullyApproved;
      if (isDoneLocal || !userIsPanelist) {
        return { showApprove: false, showReject: false, showRevision: false, showReadyForDefense: false, showForSchedule: false, isFullyApproved: fullyApproved, isReadyForDefense: isReady, isForSchedule, canAct: false, alreadyApproved, fullyProceeded };
      }
      if (alreadyApproved) {
        return { showApprove: false, showReject: false, showRevision: false, showReadyForDefense: false, showForSchedule: false, isFullyApproved: false, isReadyForDefense: false, isForSchedule: false, canAct: false, alreadyApproved: true, fullyProceeded };
      }
      return { showApprove: true, showReject: true, showRevision: true, showReadyForDefense: false, showForSchedule: false, isFullyApproved: false, isReadyForDefense: false, isForSchedule: false, canAct: true, alreadyApproved: false, fullyProceeded };
    }

    if (normalizedRole === 'student') return { showApprove: false, showReject: false, showRevision: false, showReadyForDefense: false, showForSchedule: false, isFullyApproved: fullyApproved, isReadyForDefense: isReady, isForSchedule, canAct: false, alreadyApproved: false, fullyProceeded };

    if (normalizedRole === 'subject_instructor') {
      return {
        showApprove: false,
        showReject: false,
        showRevision: false,
        showReadyForDefense: canMarkReadyForDefense && (fullyApproved || isForSchedule) && !isReady && fullyProceeded,
        showForSchedule: false, // ⭐ Subject Instructor should NOT see the Schedule Defense button
        isFullyApproved: fullyApproved,
        isReadyForDefense: isReady,
        isForSchedule,
        canAct: canMarkReadyForDefense && (fullyApproved || isForSchedule) && !isReady && fullyProceeded,
        alreadyApproved: false,
        fullyProceeded,
      };
    }

    if (isReady) return { showApprove: false, showReject: false, showRevision: false, showReadyForDefense: false, showForSchedule: false, isFullyApproved: true, isReadyForDefense: true, isForSchedule: false, canAct: false, alreadyApproved: false, fullyProceeded };
    if (isForSchedule) return { showApprove: false, showReject: false, showRevision: false, showReadyForDefense: canMarkReadyForDefense && fullyProceeded, showForSchedule: false, isFullyApproved: true, isReadyForDefense: false, isForSchedule: true, canAct: canMarkReadyForDefense && fullyProceeded, alreadyApproved: false, fullyProceeded };
    if (isRejected) return { showApprove: false, showReject: false, showRevision: false, showReadyForDefense: false, showForSchedule: false, isFullyApproved: false, isReadyForDefense: false, isForSchedule: false, canAct: false, alreadyApproved: false, fullyProceeded };

    if (isRevisionStatus) {
      if (!userIsAdviser && !userIsCoAdviser && !userIsPanelist && !['admin', 'organizer'].includes(normalizedRole)) {
        return { showApprove: false, showReject: false, showRevision: false, showReadyForDefense: false, showForSchedule: false, isFullyApproved: false, isReadyForDefense: false, isForSchedule: false, canAct: false, alreadyApproved: false, isRevision: true, fullyProceeded };
      }
      return { showApprove: true, showReject: true, showRevision: false, showReadyForDefense: false, showForSchedule: false, isFullyApproved: false, isReadyForDefense: false, isForSchedule: false, canAct: true, alreadyApproved: false, isRevision: true, fullyProceeded };
    }

    if (bothApproved) {
      const canActNow = canMarkReadyForDefense || normalizedRole === 'adviser' || userIsAdviser || userIsPanelist;
      return {
        showApprove: false, showReject: true, showRevision: true,
        showReadyForDefense: canMarkReadyForDefense && !isReady && !isForSchedule && fullyProceeded,
        showForSchedule: (normalizedRole === 'adviser' || userIsAdviser) && !isForSchedule && !isReady && fullyProceeded,
        isFullyApproved: true, isReadyForDefense: isReady, isForSchedule,
        canAct: canActNow, alreadyApproved: false,
        fullyProceeded,
      };
    }

    if (fullyApproved) return {
      showApprove: false, showReject: true, showRevision: true,
      showReadyForDefense: canMarkReadyForDefense && !userIsAdviser && fullyProceeded,
      showForSchedule: (normalizedRole === 'adviser' || userIsAdviser) && fullyProceeded,
      isFullyApproved: true, isReadyForDefense: false, isForSchedule: false,
      canAct: canMarkReadyForDefense || normalizedRole === 'adviser' || userIsAdviser,
      alreadyApproved: false,
      fullyProceeded,
    };

    if (userIsAdviser) {
      if (adviser === true) return { showApprove: false, showReject: true, showRevision: true, showReadyForDefense: false, showForSchedule: false, isFullyApproved: false, isReadyForDefense: false, isForSchedule: false, canAct: true, alreadyApproved: true, fullyProceeded };
      return { showApprove: true, showReject: true, showRevision: true, showReadyForDefense: false, showForSchedule: false, isFullyApproved: false, isReadyForDefense: false, isForSchedule: false, canAct: true, alreadyApproved: false, fullyProceeded };
    }
    if (userIsCoAdviser) {
      if (coAdviser === true) return { showApprove: false, showReject: true, showRevision: true, showReadyForDefense: false, showForSchedule: false, isFullyApproved: false, isReadyForDefense: false, isForSchedule: false, canAct: true, alreadyApproved: true, fullyProceeded };
      return { showApprove: true, showReject: true, showRevision: true, showReadyForDefense: false, showForSchedule: false, isFullyApproved: false, isReadyForDefense: false, isForSchedule: false, canAct: true, alreadyApproved: false, fullyProceeded };
    }
    if (isApprovedStatus && !bothApproved) return { showApprove: false, showReject: true, showRevision: true, showReadyForDefense: false, showForSchedule: false, isFullyApproved: false, isReadyForDefense: false, isForSchedule: false, canAct: true, alreadyApproved: false, fullyProceeded };
    return {
      showApprove: status !== 'Approved' && status !== 'Rejected' && status !== 'Revision' && status !== 'Ready for Defense' && status !== 'for_schedule',
      showReject: status !== 'Rejected' && status !== 'Approved' && status !== 'Ready for Defense' && status !== 'for_schedule',
      showRevision: status !== 'Revision' && status !== 'Approved' && status !== 'Ready for Defense' && status !== 'for_schedule',
      showReadyForDefense: canMarkReadyForDefense && status !== 'Ready for Defense' && status !== 'Rejected' && status !== 'Revision' && status !== 'for_schedule' && fullyProceeded,
      showForSchedule: false, isFullyApproved: false, isReadyForDefense: false, isForSchedule: false,
      canAct: status !== 'Ready for Defense' && status !== 'Rejected' && status !== 'for_schedule',
      alreadyApproved: false,
      fullyProceeded,
    };
  };

  // ============================================================
  // RENDER — PDF VIEWER MODE
  // ============================================================
  if (trackingLoading) return <ProfessionalLoadingScreen message="Loading thesis document..." />;

  if (isViewMode && viewSubmission) {
    const handleContextAction = (action) => {
      if (!textMenu) return;
      if (action === 'copy') {
        navigator.clipboard.writeText(textMenu.selectedText);
        setTextMenu(null); return;
      }
      if (!canAnnotate) {
        showNotification('⚠️ View-only — you cannot add annotations.', true);
        setTextMenu(null); return;
      }
      if (action === 'highlight') {
        if (textMenu.selectionRect) {
          const r = textMenu.selectionRect;
          setExternalComment({ type: 'highlight', x: r.x, y: r.y, w: r.w, h: r.h, selectedText: textMenu.selectedText || '' });
        } else {
          setExternalComment({ type: 'highlight', x: textMenu.nx, y: textMenu.ny, w: 0.15, h: 0.03, selectedText: textMenu.selectedText || '' });
        }
        window.getSelection()?.removeAllRanges();
        setTextMenu(null); return;
      }
      if (action === 'comment') {
        setExternalComment({
          x: textMenu.selectionRect ? textMenu.selectionRect.x : textMenu.nx,
          y: textMenu.selectionRect ? textMenu.selectionRect.y : textMenu.ny,
          selectedText: textMenu.selectedText || '', type: 'comment',
        });
        window.getSelection()?.removeAllRanges();
        setTextMenu(null); return;
      }
      if (action === 'margin') {
        setExternalComment({
          x: 0.85,
          y: textMenu.selectionRect ? textMenu.selectionRect.y : textMenu.ny,
          selectedText: textMenu.selectedText || '', type: 'margin',
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
          GetPdfBlobUrl(activeTrackingId).then(url => {
            if (url) setPdfBlobUrl(url);
            else setPdfBlobError('Failed to load PDF');
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

  // ============================================================
  // RENDER — TABLE VIEW (⭐ BLUE / YELLOW THEME)
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-sky-50 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {toastMessage && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 text-white text-xs font-medium rounded-xl shadow-2xl animate-bounce ${toastMessage.isError ? 'bg-red-600' : 'bg-blue-900'}`}>
            {toastMessage.isError ? <XCircle className="w-4 h-4 text-red-200" /> : <CheckCircle2 className="w-4 h-4 text-yellow-300" />}
            <span>{toastMessage.msg}</span>
          </div>
        )}

        <ConfirmModal isOpen={confirmModal.isOpen} config={confirmModal.config} onConfirm={handleConfirmModal} onCancel={handleCancelConfirm} isLoading={isProcessing} />

        {/* Progression Modal */}
        {progressionModalItem && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-blue-950/60 backdrop-blur-sm" onClick={isProceedingChapter ? undefined : handleCloseProgressionModal} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-blue-200">
              <div className="sticky top-0 bg-blue-900 border-b-4 border-yellow-400 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-300" />
                    Chapter Progression
                  </h3>
                  <p className="text-xs text-blue-200 mt-0.5 line-clamp-1">
                    {progressionModalItem.title}
                  </p>
                </div>
                <button onClick={handleCloseProgressionModal} disabled={isProceedingChapter} className="p-1 rounded hover:bg-blue-800 disabled:opacity-50 text-blue-100">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <ChapterProgressionPanel
                  item={progressionModalItem}
                  onProceed={handleProceedChapter}
                  onReject={handleRejectChapter}
                  isProcessing={isProceedingChapter}
                />
              </div>
            </div>
          </div>
        )}

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

        {customError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{customError}</div>}

        {/* HEADER — navy blue with yellow accent */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-900 p-6 rounded-2xl shadow-md border-b-4 border-yellow-400">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-800 text-yellow-300 rounded-xl"><BookOpen className="w-6 h-6" /></div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Thesis & Capstone Mentoring</h1>
              <p className="text-xs text-blue-200 mt-0.5">
                Review student proposals, provide mentor feedback, and manage defense readiness
                {totalCount > 0 && <span className="ml-2 text-yellow-300 font-medium">({totalCount} total)</span>}
              </p>
            </div>
          </div>
        </header>

        {/* ⭐ FILTER BAR — white card with blue inputs */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-blue-400" />
              <input type="text" placeholder="Search thesis titles, researchers..."
                value={localSearchTerm} onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-slate-800 placeholder:text-blue-400 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400" />
            </div>
            <div>
              <select value={localStatusFilter} onChange={(e) => setLocalStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-blue-900 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400">
                <option value="All">All Status</option>
                <option value="Pending">Pending Proposal</option>
                <option value="Approved">Mentors Confirmed</option>
                <option value="for_schedule">For Defense Scheduling</option>
                <option value="Rejected">Rejected</option>
                <option value="Revision">Needs Revision</option>
                <option value="Ready for Defense">Ready for Defense</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-900 border border-yellow-300 rounded-lg"><Clock className="w-3 h-3" />{currentRows.filter(s => s.status === 'Pending').length} Pending</span>
                <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-900 border border-blue-300 rounded-lg"><CheckCircle2 className="w-3 h-3" />{currentRows.filter(s => s.status === 'Approved' && s.adviser === true && s.coAdviser === true).length} Confirmed</span>
              </div>
            </div>
          </div>
        </div>

        {/* ⭐ TABLE CARD */}
        <div className="bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-900 rounded-full animate-spin"></div>
                <span className="text-sm text-blue-700">Loading thesis proposals...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-blue-100 border-b-2 border-yellow-400 text-[11px] uppercase tracking-wider text-blue-950 font-bold">
                      <th className="py-3.5 px-4 min-w-[200px]">Thesis / Capstone Title</th>
                      <th className="py-3.5 px-4 min-w-[150px]">Student Researcher</th>
                      <th className="py-3.5 px-4 min-w-[150px]">Group / Course</th>
                      <th className="py-3.5 px-4 min-w-[180px]">Mentor Approvals</th>
                      <th className="py-3.5 px-4 min-w-[180px]">Status</th>
                      <th className="py-3.5 px-4 min-w-[200px] text-center">Mentoring Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100 text-xs">
                    {currentRows.length > 0 ? (
                      currentRows.map((item) => {
                        const displayStatus = getActualDisplayStatus(item);
                        const statusBadgeClass = getStatusBadgeClass(displayStatus);
                        const StatusIcon = getStatusIconComponent(displayStatus);
                        const { showApprove, showReject, showRevision, showReadyForDefense, canAct, alreadyApproved, isReadyForDefense, isForSchedule, fullyProceeded } = getAvailableActions(item);
                        const isFullyApprovedStatus = item.status === 'Approved' && item.adviser === true && item.coAdviser === true;
                        const isRejectedStatus = item.status === 'Rejected';
                        const isDoneStatus = item.status === 'Done';
                        const isRevisionStatus = (item.status || '').toLowerCase() === 'revision';
                        const isDone = isReadyForDefense || isForSchedule || isRejectedStatus || isDoneStatus;
                        const userIsAdviser = isUserAdviser(item);
                        const userIsCoAdviser = isUserCoAdviser(item);
                        const userIsPanelistItem = isUserPanelist(item);
                        const isReApproval = item.isRevesion === true;

                        const thisMentorApproved =
                          (userIsAdviser && item.adviser === true) ||
                          (userIsCoAdviser && item.coAdviser === true) ||
                          (userIsPanelistItem && item.panelist === true);

                        const canView =
                          isFullyApprovedStatus || isReadyForDefense || isForSchedule ||
                          isDoneStatus || isRevisionStatus || item.isRevesion === true || thisMentorApproved;

                        // ⭐ Hide "Schedule Defense" button for subject_instructor
                        const showForScheduleButton =
                          normalizedRole !== 'subject_instructor' &&
                          item.status === 'Approved' && fullyProceeded &&
                          (normalizedRole === 'adviser' || userIsAdviser || (normalizedRole === 'panelist' && userIsPanelistItem));

                        const showActionBlock =
                          !isDone && !isReadyForDefense && !isForSchedule && !isRejectedStatus &&
                          normalizedRole !== 'subject_instructor' && normalizedRole !== 'student';

                        const chapterProgress = (() => {
                          if (!isSubjectInstructor && !fullyProceeded) return null;
                          const total = SEQUENTIAL_CHAPTERS.length;
                          const approvals = item.chapterProgressionApprovals || {};
                          const proceeded = SEQUENTIAL_CHAPTERS.filter((ch) => getApprovalVal(approvals, ch)).length;
                          return { proceeded, total };
                        })();

                        const nextSeqChapter = getNextSequentialChapter(item);
                        const isNextFinal = nextSeqChapter === 'Full Manuscript';
                        const isRowLoading = rowProceedingId === item._id;
                        const mentorsBothApproved = item.adviser === true && item.coAdviser === true;

                        return (
                          <tr key={item._id} className="odd:bg-white even:bg-blue-50/60 hover:bg-yellow-50 transition">
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <div className="font-bold text-blue-950 line-clamp-2">{item.title}</div>
                                <div className="text-[11px] text-slate-500 line-clamp-2">{item.description}</div>
                                {item.commentCount > 0 && (
                                  <div className="flex items-center gap-1 text-[10px] text-blue-700">
                                    <MessageSquare className="w-3 h-3" />
                                    <span>{item.commentCount} feedback note{item.commentCount > 1 ? 's' : ''}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-900 flex items-center justify-center text-yellow-300 font-medium text-xs">{item.uploaderName?.charAt(0).toUpperCase() || 'S'}</div>
                                <div className="font-medium text-blue-950">{item.uploaderName || 'Unknown'}</div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div>
                                <div className="font-medium text-blue-950">{item.groupInfo?.name || item.groupName || 'N/A'}</div>
                                <div className="text-[10px] text-blue-500">Code: {item.groupInfo?.referralCode || 'N/A'}</div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <div className={`flex items-center gap-1.5 text-xs font-medium ${item.adviser ? 'text-blue-800' : 'text-yellow-700'}`}>
                                  <User className="w-3.5 h-3.5" /> Adviser: {item.adviser ? '✅ Approved' : '⏳ Pending'}
                                </div>
                                <div className={`flex items-center gap-1.5 text-xs font-medium ${item.coAdviser ? 'text-blue-800' : 'text-yellow-700'}`}>
                                  <UserCheck className="w-3.5 h-3.5" /> Co-Adviser: {item.coAdviser ? '✅ Approved' : '⏳ Pending'}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border w-fit ${statusBadgeClass}`}>{StatusIcon} {displayStatus}</span>
                                <StatusStepper status={item.status} compact />
                                {isRevisionStatus && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 w-fit">
                                    <RefreshCw className="w-3 h-3" /> Awaiting Re-Approval
                                  </span>
                                )}
                                {item.isRevesion === true && !isRevisionStatus && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-200 w-fit">
                                    <RefreshCw className="w-3 h-3" /> Revised Title
                                  </span>
                                )}
                                {chapterProgress && (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border w-fit ${fullyProceeded ? 'bg-yellow-50 text-yellow-800 border-yellow-300' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                    {fullyProceeded ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                    {chapterProgress.proceeded}/{chapterProgress.total} Proceeded
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <button onClick={() => canView && handleOpenModal(item)} disabled={!canView}
                                  title={canView ? 'View thesis document and mentor feedback' : 'Waiting for mentor approval before documents can be viewed'}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                                    canView
                                      ? thisMentorApproved && !isFullyApprovedStatus
                                        ? 'text-blue-900 bg-blue-100 hover:bg-blue-200 ring-1 ring-blue-300'
                                        : 'text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100'
                                      : 'text-blue-300 bg-blue-50 cursor-not-allowed opacity-60'
                                  }`}>
                                  <Eye className="w-3.5 h-3.5" /> View
                                </button>

                                {isSubjectInstructor && (
                                  <button onClick={() => handleOpenProgressionModal(item)} title="Manage chapter progression" className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg shadow-sm transition">
                                    <Award className="w-3.5 h-3.5" /> Progression
                                  </button>
                                )}

                                {canProceedChapters && (() => {
                                  if (!mentorsBothApproved) {
                                    return (
                                      <span
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-500 bg-blue-50 border border-blue-200 rounded-lg cursor-help"
                                        title="Waiting for adviser & co-adviser to approve this proposal before proceeding chapters"
                                      >
                                        <Lock className="w-3.5 h-3.5" /> Waiting Mentors
                                      </span>
                                    );
                                  }
                                  if (!nextSeqChapter) {
                                    return (
                                      <span
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-yellow-800 bg-yellow-50 border border-yellow-300 rounded-lg"
                                        title="All 8 sequential chapters have been proceeded — defense buttons are now unlocked"
                                      >
                                        <Unlock className="w-3.5 h-3.5" /> All Proceeded
                                      </span>
                                    );
                                  }
                                  return (
                                    <button
                                      onClick={() => handleSequentialProceed(item)}
                                      disabled={isRowLoading}
                                      title={
                                        isNextFinal
                                          ? `Proceed FULL MANUSCRIPT — this will UNLOCK the Defense buttons`
                                          : `Proceed "${nextSeqChapter}" — unlock next chapter for the student`
                                      }
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg shadow-sm transition disabled:opacity-50 ${
                                        isNextFinal
                                          ? 'bg-yellow-400 hover:bg-yellow-300 text-blue-950 ring-2 ring-yellow-300'
                                          : 'bg-blue-900 hover:bg-blue-950 text-white'
                                      }`}
                                    >
                                      {isRowLoading ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Proceeding...
                                        </>
                                      ) : isNextFinal ? (
                                        <>
                                          <ArrowRight className="w-3.5 h-3.5" /> Proceed → Unlock Defense
                                        </>
                                      ) : (
                                        <>
                                          <ArrowRight className="w-3.5 h-3.5" /> Proceed {nextSeqChapter}
                                        </>
                                      )}
                                    </button>
                                  );
                                })()}

                                {showActionBlock && (
                                  <>
                                    {showApprove && canAct && (
                                      <button onClick={() => handleStatusChange(item._id, 'Approved')}
                                        title={isReApproval ? 'Re-approve the revised proposal' : 'Approve this proposal'}
                                        className={`px-2.5 py-1 text-xs font-medium text-white rounded-lg shadow-sm transition inline-flex items-center gap-1 ${isReApproval ? 'bg-blue-900 hover:bg-blue-950 ring-2 ring-yellow-300' : 'bg-blue-900 hover:bg-blue-950'}`}>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {isReApproval ? 'Re-Approve' : 'Approve'}
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

                                {showForScheduleButton && (
                                  <button onClick={() => handleStatusChange(item._id, 'for_schedule')} className="px-2.5 py-1 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm transition inline-flex items-center gap-1">
                                    <CalendarDays className="w-3.5 h-3.5" /> Schedule Defense
                                  </button>
                                )}

                                {(isFullyApprovedStatus || isForSchedule) && showReadyForDefense && canAct && !userIsAdviser && (
                                  <button onClick={() => handleReadyForDefense(item._id)} className="px-2.5 py-1 text-xs font-medium text-blue-950 bg-yellow-400 hover:bg-yellow-300 rounded-lg shadow-sm transition inline-flex items-center gap-1">
                                    <Shield className="w-3.5 h-3.5" /> Ready
                                  </button>
                                )}

                                {isFullyApprovedStatus && !fullyProceeded && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg cursor-help" title="Defense button locked — Subject Instructor must proceed all chapters (including Full Manuscript) first">
                                    <Lock className="w-3.5 h-3.5" /> Defense Locked
                                  </span>
                                )}

                                {isForSchedule && <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-cyan-700 bg-cyan-50 rounded-lg"><CalendarDays className="w-3.5 h-3.5" /> Scheduling</span>}
                                {isReadyForDefense && <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-900 text-yellow-300 rounded-lg"><Shield className="w-3.5 h-3.5" /> Defense Ready</span>}
                                {isDoneStatus && <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5" /> Done</span>}
                                {isFullyApprovedStatus && !isReadyForDefense && !isForSchedule && !isDoneStatus && !showRevision && !showApprove && fullyProceeded && <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-900 bg-blue-100 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5" /> Confirmed</span>}
                                {isRejectedStatus && <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 rounded-lg"><XCircle className="w-3.5 h-3.5" /> Rejected</span>}
                                {alreadyApproved && !isDone && !isFullyApprovedStatus && !showRevision && !showApprove && <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-900 bg-blue-100 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5" /> You Approved</span>}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-12 text-center">
                          <BookOpen className="w-12 h-12 text-blue-200 mx-auto mb-2" />
                          <span className="text-blue-500 font-medium">No thesis/capstone proposals found</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-blue-50 border-t border-blue-100 text-xs text-blue-700">
                <div className="flex flex-wrap items-center gap-3">
                  <div>Showing <span className="font-bold text-blue-950">{startItem}</span> to <span className="font-bold text-blue-950">{endItem}</span> of <span className="font-bold text-blue-950">{totalCount}</span> proposals</div>
                  <div className="flex items-center gap-2">
                    <label className="text-blue-600">Rows:</label>
                    <select value={rowsPerPage} onChange={handleRowsPerPageChange} className="px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs font-medium text-blue-900 outline-none focus:ring-2 focus:ring-yellow-400">
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button disabled={contextCurrentPage === 1 || isLoading} onClick={() => handlePageChange(contextCurrentPage - 1)} className="p-2 bg-white border border-blue-300 text-blue-900 rounded-lg hover:bg-yellow-100 hover:border-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="font-semibold text-blue-950 px-2">Page {contextCurrentPage} of {totalPagesCount || 1}</span>
                  <button disabled={contextCurrentPage === totalPagesCount || totalPagesCount === 0 || isLoading} onClick={() => handlePageChange(contextCurrentPage + 1)} className="p-2 bg-white border border-blue-300 text-blue-900 rounded-lg hover:bg-yellow-100 hover:border-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}