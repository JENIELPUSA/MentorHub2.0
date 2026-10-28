// src/components/ProposedTitle/PdfViewer.jsx
import React, { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import {
  MousePointer2, Highlighter, MessageSquare, Crop, FileText, Eraser,
  Globe, Trash2, X, Loader2, Copy, Lock, ArrowLeft, GraduationCap,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RefreshCw, XCircle,
  ArrowRight, ArrowLeft as ArrowLeftIcon, ArrowUp, ArrowDown,
} from 'lucide-react';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`;

import { CommentContext } from '../../contexts/CommentContext/CommentContext';

// ============================================================
// CONSTANTS
// ============================================================
const GLOBAL_KEY = '__global__';
const ANNOTATION_COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#f87171'];

const ANNOTATION_TYPE_META = {
  highlight: { label: 'Highlight', color: 'bg-yellow-100 text-yellow-800' },
  comment:   { label: 'Comment',   color: 'bg-blue-100 text-blue-800' },
  margin:    { label: 'Margin',    color: 'bg-purple-100 text-purple-800' },
  page:      { label: 'Page',      color: 'bg-amber-100 text-amber-800' },
  region:    { label: 'Region',    color: 'bg-emerald-100 text-emerald-800' },
  global:    { label: '🌐 All Pages', color: 'bg-rose-100 text-rose-800' },
};

// ============================================================
// HELPERS
// ============================================================
const computeAnnotationNumbers = (allAnnots) => {
  const flat = [
    ...(allAnnots[GLOBAL_KEY] || []).map(a => ({ ...a, _scope: 'global' })),
    ...Object.entries(allAnnots)
      .filter(([k]) => k !== GLOBAL_KEY)
      .flatMap(([k, list]) => {
        const p = parseInt(k.replace('page_', ''), 10);
        return (list || []).map(a => ({ ...a, _scope: 'page', _pageNum: p }));
      }),
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const numberMap = {};
  flat.forEach((a, i) => { numberMap[a.id] = i + 1; });
  return numberMap;
};

// ============================================================
// SHAPE RENDERER
// ============================================================
const ShapeRenderer = ({ x, y, w, h, color, strokeWidth = 2, opacity = 0.9, isEraser = false, onClick }) => {
  const style = {
    position: 'absolute',
    left: `${x * 100}%`, top: `${y * 100}%`,
    width: `${w * 100}%`, height: `${h * 100}%`,
    zIndex: 15,
    pointerEvents: isEraser ? 'auto' : 'none',
    cursor: isEraser ? 'not-allowed' : 'default',
    border: `${strokeWidth}px solid ${color}`,
    backgroundColor: `${color}15`,
    borderRadius: 2,
    opacity,
  };

  const handleClick = (e) => {
    if (isEraser && onClick) {
      e.stopPropagation();
      e.preventDefault();
      onClick();
    }
  };

  return <div style={style} onClick={handleClick} />;
};

// ============================================================
// MARGIN EDGE ARROWS — LEFT · RIGHT · TOP · BOTTOM
// ------------------------------------------------------------
// Arrows point OUTWARD from the page edge, matching the
// "<---   --->" visual style:
//   LEFT   edge:  <---   (points left, out of the page)
//   RIGHT  edge:  --->   (points right, out of the page)
//   TOP    edge:  ^      (points up, out of the page)
//   BOTTOM edge:  v      (points down, out of the page)
// ============================================================
const MarginEdgeArrows = ({ color, size = 20, offset = 6 }) => {
  const baseClass = 'absolute flex items-center justify-center rounded-full shadow-md border-2 border-white pointer-events-none';
  const commonStyle = {
    width: size,
    height: size,
    backgroundColor: color,
    color: 'white',
    zIndex: 22,
  };

  return (
    <>
      {/* LEFT — arrow points LEFT (outward from the page)  <--- */}
      <div
        className={baseClass}
        style={{ ...commonStyle, left: `${offset}px`, top: '50%', transform: 'translateY(-50%)' }}
        title="Margin note (left edge)"
      >
        <ArrowLeftIcon className="w-3 h-3" strokeWidth={3} />
      </div>

      {/* RIGHT — arrow points RIGHT (outward from the page)  ---> */}
      <div
        className={baseClass}
        style={{ ...commonStyle, right: `${offset}px`, top: '50%', transform: 'translateY(-50%)' }}
        title="Margin note (right edge)"
      >
        <ArrowRight className="w-3 h-3" strokeWidth={3} />
      </div>

      {/* TOP — arrow points UP (outward from the page)  ^ */}
      <div
        className={baseClass}
        style={{ ...commonStyle, top: `${offset}px`, left: '50%', transform: 'translateX(-50%)' }}
        title="Margin note (top edge)"
      >
        <ArrowUp className="w-3 h-3" strokeWidth={3} />
      </div>

      {/* BOTTOM — arrow points DOWN (outward from the page)  v */}
      <div
        className={baseClass}
        style={{ ...commonStyle, bottom: `${offset}px`, left: '50%', transform: 'translateX(-50%)' }}
        title="Margin note (bottom edge)"
      >
        <ArrowDown className="w-3 h-3" strokeWidth={3} />
      </div>
    </>
  );
};

// ============================================================
// PDF ANNOTATION BAR — ⭐ NAVY / GOLD THEME
// ============================================================
const PdfAnnotationBar = ({
  activeTool, setActiveTool, activeColor, setActiveColor,
  onClearPage, annotationCount, onAddPageComment, currentPageNum,
  onAddGlobalComment, hasGlobalAnnotations, onClearGlobalAnnotations,
}) => {
  const tools = [
    { key: 'cursor',    icon: MousePointer2, label: 'Select' },
    { key: 'highlight', icon: Highlighter,   label: 'Highlight + Comment' },
    { key: 'comment',   icon: MessageSquare, label: 'Pin Comment' },
    { key: 'region',    icon: Crop,          label: 'Draw Feedback Region' },
    { key: 'margin',    icon: FileText,      label: 'Margin Note' },
    { key: 'eraser',    icon: Eraser,        label: 'Erase — click a comment to delete' },
  ];

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-blue-200 shadow-sm flex-wrap flex-shrink-0">
      <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg p-1">
        {tools.map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setActiveTool(key)} title={label}
            className={`p-2 rounded-md transition ${
              activeTool === key
                ? 'bg-blue-900 text-yellow-300 shadow-sm ring-1 ring-yellow-400'
                : 'text-blue-700 hover:bg-blue-100'
            }`}>
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 border-l border-blue-200 pl-3">
        {ANNOTATION_COLORS.map(c => (
          <button key={c} onClick={() => setActiveColor(c)}
            className={`w-6 h-6 rounded-full border-2 transition ${
              activeColor === c
                ? 'border-blue-900 scale-110 ring-2 ring-yellow-300'
                : 'border-white hover:scale-105'
            }`}
            style={{ backgroundColor: c }} />
        ))}
      </div>

      <button onClick={() => onAddPageComment(currentPageNum)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-yellow-800 bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 rounded-lg transition"
        title="Feedback for THIS page only">
        <FileText className="w-3.5 h-3.5" /> This Page
      </button>

      <button onClick={onAddGlobalComment}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
        title="Feedback that applies to ALL pages">
        <Globe className="w-3.5 h-3.5" /> All Pages
      </button>

      <span className="text-[11px] text-blue-700 font-semibold">
        {annotationCount} note{annotationCount !== 1 ? 's' : ''}
      </span>

      {hasGlobalAnnotations && (
        <button onClick={onClearGlobalAnnotations}
          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-md transition">
          <Globe className="w-3 h-3" /> Clear global
        </button>
      )}

      <button onClick={onClearPage} disabled={annotationCount === 0}
        className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed">
        <Trash2 className="w-3.5 h-3.5" /> Clear Page
      </button>
    </div>
  );
};

// ============================================================
// HIGHLIGHT + COMMENT INPUT — ⭐ NAVY / GOLD THEME
// ============================================================
const HighlightCommentInput = ({ highlight, color, onSubmit, onCancel }) => {
  const [text, setText] = useState('');
  const handleSubmit = () => { if (text.trim()) onSubmit(text); };

  const approxHeightPct = 22;
  const flipUp = highlight.y * 100 + approxHeightPct > 85;
  const topPct = flipUp
    ? Math.max(2, highlight.y * 100 - approxHeightPct - 2)
    : Math.min(90, (highlight.y + highlight.h) * 100 + 2);
  const leftPct = Math.min(highlight.x * 100, 55);

  return (
    <div className="absolute z-50 bg-white/95 backdrop-blur-sm border-2 rounded-xl shadow-2xl shadow-blue-900/20 p-3 w-[300px]"
      style={{ left: `${leftPct}%`, top: `${topPct}%`, borderColor: color }}
      onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: color }}>✎</div>
          <p className="text-xs font-bold text-blue-950">Ano ang mali dito?</p>
        </div>
        <button onClick={onCancel} className="text-blue-400 hover:text-blue-700">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {highlight.quoted && (
        <p className="mb-2 px-2 py-1 rounded border border-dashed text-[10px] text-blue-800 italic line-clamp-2"
          style={{ backgroundColor: `${color}15`, borderColor: color }}>
          "{highlight.quoted.slice(0, 100)}{highlight.quoted.length > 100 ? '…' : ''}"
        </p>
      )}

      <textarea autoFocus rows={4} value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
          if (e.key === 'Enter' && e.ctrlKey) handleSubmit();
        }}
        className="w-full text-xs border border-blue-200 rounded p-2 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 resize-none text-blue-950 placeholder:text-blue-400"
        placeholder="e.g., 'Wrong font', 'Incorrect spelling'..." />

      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-blue-400">Ctrl+Enter</p>
        <div className="flex gap-1.5">
          <button onClick={onCancel} className="px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-50 rounded">Cancel</button>
          <button onClick={handleSubmit} disabled={!text.trim()}
            className="px-2.5 py-1 text-xs text-white rounded font-medium disabled:opacity-40"
            style={{ backgroundColor: color }}>Save</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PDF ANNOTATION OVERLAY — ⭐ NAVY / GOLD THEME
// ============================================================
const PdfAnnotationOverlay = ({
  pageNum, width, height, scale = 1,
  annotations, activeTool, activeColor,
  addAnnotation, removeAnnotation,
  externalComment, onExternalCommentDone, annotationNumbers,
  proposedTitleId, refreshComments, showNotification,
  readOnly = false, onAnchorHover, onAnchorRef,
}) => {
  const overlayRef = useRef(null);
  const [dragRect, setDragRect] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [commentPin, setCommentPin] = useState(null);
  const [pendingHighlight, setPendingHighlight] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { CreateComment, DeleteComment } = useContext(CommentContext);

  const pageAnnots = [
    ...(annotations[GLOBAL_KEY] || []),
    ...(annotations[`page_${pageNum}`] || []),
  ];

  useEffect(() => {
    if (externalComment && !readOnly) {
      if (externalComment.type === 'highlight') {
        setPendingHighlight({
          x: externalComment.x, y: externalComment.y,
          w: externalComment.w || 0.15, h: externalComment.h || 0.03,
          quoted: externalComment.selectedText || '',
        });
      } else {
        setCommentPin({
          x: externalComment.x, y: externalComment.y, value: '',
          quoted: externalComment.selectedText || '',
          type: externalComment.type || 'comment',
        });
      }
      onExternalCommentDone?.();
    }
  }, [externalComment, onExternalCommentDone, readOnly]);

  const getCoords = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  };

  const handleErase = async (target) => {
    if (readOnly || !target) return;
    const isBackend = target.__fromBackend === true || !!target.backendId;
    const backendId = target.backendId || (target.__fromBackend ? target.id : null);
    if (!window.confirm('Delete this feedback?')) return;

    try {
      setIsDeleting(true);
      if (isBackend && backendId && DeleteComment) {
        const res = await DeleteComment(backendId);
        if (!res?.success) {
          showNotification?.(`❌ Delete failed: ${res?.error || 'Unknown error'}`, true);
          return;
        }
      }
      removeAnnotation(target.type === 'global' ? 'global' : pageNum, target.id);
      if (refreshComments) { try { await refreshComments(); } catch (e) { console.warn(e); } }
      showNotification?.('✅ Feedback deleted');
    } catch (err) {
      showNotification?.(`❌ Delete failed: ${err.message}`, true);
    } finally {
      setIsDeleting(false);
    }
  };

  const findAnnotationAt = (x, y) => {
    const reversed = [...pageAnnots].reverse();
    return reversed.find(a => {
      if (a.type === 'highlight' || a.type === 'region') {
        return x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h;
      }
      if (a.type === 'comment') return Math.hypot(x - a.x, y - a.y) < 0.05;
      if (a.type === 'margin')  return Math.hypot(x - a.x, y - a.y) < 0.06;
      if (a.type === 'page' && y > 0.10 && y < 0.40) return true;
      if (a.type === 'global' && y < 0.12) return true;
      return false;
    }) || null;
  };

  const handleMouseDown = (e) => {
    if (readOnly) return;
    if (activeTool === 'eraser') {
      const { x, y } = getCoords(e);
      const target = findAnnotationAt(x, y);
      if (target) { e.preventDefault(); e.stopPropagation(); handleErase(target); }
      return;
    }
    if (activeTool !== 'highlight' && activeTool !== 'region') return;
    const { x, y } = getCoords(e);
    setDragStart({ x, y });
    setDragRect({ x1: x, y1: y, x2: x, y2: y });
  };

  const handleMouseMove = (e) => {
    if (readOnly || activeTool === 'eraser') return;
    if ((activeTool !== 'highlight' && activeTool !== 'region') || !dragStart) return;
    const { x, y } = getCoords(e);
    setDragRect({ x1: dragStart.x, y1: dragStart.y, x2: x, y2: y });
  };

  const handleMouseUp = () => {
    if (readOnly || activeTool === 'eraser') return;
    if ((activeTool !== 'highlight' && activeTool !== 'region') || !dragRect) return;
    const x = Math.min(dragRect.x1, dragRect.x2);
    const y = Math.min(dragRect.y1, dragRect.y2);
    const w = Math.abs(dragRect.x2 - dragRect.x1);
    const h = Math.abs(dragRect.y2 - dragRect.y1);
    if (w > 0.005 && h > 0.005) {
      const data = {
        type: activeTool === 'region' ? 'region' : 'highlight',
        shape: 'rectangle', x, y, w, h,
        color: activeColor, createdAt: new Date().toISOString(),
      };
      if (activeTool === 'region') addAnnotation(pageNum, data);
      else setPendingHighlight({ ...data, quoted: '' });
    }
    setDragRect(null);
    setDragStart(null);
  };

  const handleClick = (e) => {
    if (readOnly || activeTool === 'eraser') return;
    const { x, y } = getCoords(e);
    if (activeTool === 'comment') setCommentPin({ x, y, value: '', type: 'comment' });
    else if (activeTool === 'margin') setCommentPin({ x: Math.min(x, 0.85), y, value: '', type: 'margin' });
  };

  const createBackendComment = async ({
    text, pageNumber = null, position = null, selectedText = null,
    color = '#fbbf24', annotationType = 'text', annotationLabel = null, shape = 'rectangle',
  }) => {
    if (readOnly) return null;
    if (!proposedTitleId) { showNotification?.('❌ Missing proposedTitleId', true); return null; }
    if (!CreateComment) { showNotification?.('❌ CreateComment not available', true); return null; }

    try {
      setIsPosting(true);
      const enhancedPosition = position ? { ...position, shape } : position;
      const res = await CreateComment(proposedTitleId, {
        text, pageNumber, position: enhancedPosition, selectedText, color,
        annotationType, annotationLabel, shape,
      });
      if (res?.success && res?.data) {
        const backendId = res.data._id || null;
        if (refreshComments) { try { await refreshComments(); } catch (e) { console.warn(e); } }
        return backendId;
      }
      if (res?.error) showNotification?.(`❌ ${res.error}`, true);
      return null;
    } catch (err) {
      showNotification?.(`❌ Failed: ${err.message}`, true);
      return null;
    } finally {
      setIsPosting(false);
    }
  };

  const submitComment = async () => {
    if (!commentPin?.value?.trim()) { setCommentPin(null); return; }
    const text = commentPin.value.trim();
    const type = commentPin.type || 'comment';
    await createBackendComment({
      text, pageNumber: pageNum,
      position: { x: commentPin.x, y: commentPin.y, w: 0.04, h: 0.04 },
      selectedText: commentPin.quoted || null, color: activeColor,
      annotationType: type,
      annotationLabel: type === 'margin' ? 'Margin Note' : 'Mentor Comment',
      shape: 'pin',
    });
    setCommentPin(null);
  };

  const submitHighlightWithComment = async (text) => {
    if (!pendingHighlight || !text?.trim()) return;
    await createBackendComment({
      text: text.trim(), pageNumber: pageNum,
      position: { x: pendingHighlight.x, y: pendingHighlight.y, w: pendingHighlight.w, h: pendingHighlight.h },
      selectedText: pendingHighlight.quoted || null, color: activeColor,
      annotationType: 'highlight', annotationLabel: 'Highlighted Feedback', shape: 'rectangle',
    });
    setPendingHighlight(null);
  };

  const cursorStyle = readOnly ? 'default'
    : activeTool === 'eraser' ? 'not-allowed'
    : (activeTool === 'highlight' || activeTool === 'region') ? 'crosshair'
    : activeTool === 'comment' ? 'copy'
    : activeTool === 'margin' ? 'cell' : 'default';

  const byType = {
    global:    pageAnnots.filter(a => a.type === 'global'),
    page:      pageAnnots.filter(a => a.type === 'page'),
    highlight: pageAnnots.filter(a => a.type === 'highlight'),
    region:    pageAnnots.filter(a => a.type === 'region'),
    margin:    pageAnnots.filter(a => a.type === 'margin'),
    comment:   pageAnnots.filter(a => a.type === 'comment'),
  };

  const NumberBadge = ({ annotId, size = 18, color }) => {
    const n = annotationNumbers?.[annotId];
    if (!n) return null;
    return (
      <div className="flex items-center justify-center rounded-full text-white font-bold shadow-md border-2 border-white"
        style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.55 }}>
        {n}
      </div>
    );
  };

  const eraserActive = !readOnly && activeTool === 'eraser';
  const registerAnchor = (id, node) => { if (onAnchorRef) onAnchorRef(id, node); };
  const globalColor = byType.global[0]?.color || '#f87171';

  return (
    <div ref={overlayRef} className="absolute inset-0"
      style={{ cursor: cursorStyle, zIndex: 10 }}
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp} onClick={handleClick}>

      {byType.global.length > 0 && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 12, border: `2px dashed ${globalColor}`, backgroundColor: `${globalColor}0D`, boxShadow: `inset 0 0 0 1px ${globalColor}33` }}>
          {byType.global.map((a, idx) => (
            <div key={a.id} ref={(n) => registerAnchor(a.id, n)}
              className="absolute pointer-events-auto"
              style={{ top: `${6 + idx * 24}px`, right: '6px', cursor: eraserActive ? 'not-allowed' : 'default' }}
              onMouseEnter={() => onAnchorHover?.(a.id)} onMouseLeave={() => onAnchorHover?.(null)}
              onClick={(e) => { if (eraserActive) { e.stopPropagation(); e.preventDefault(); handleErase(a); } }}>
              <NumberBadge annotId={a.id} color={a.color || '#e11d48'} size={18} />
            </div>
          ))}
        </div>
      )}

      {eraserActive && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-rose-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg pointer-events-none flex items-center gap-1.5 animate-pulse">
          <Eraser className="w-3.5 h-3.5" /> Click any annotation to delete
        </div>
      )}

      {byType.highlight.map(a => (
        <React.Fragment key={a.id}>
          <ShapeRenderer x={a.x} y={a.y} w={a.w} h={a.h} color={a.color}
            strokeWidth={1.5} opacity={0.9} isEraser={eraserActive} onClick={() => handleErase(a)} />
          <div ref={(n) => registerAnchor(a.id, n)} className="absolute"
            style={{ left: `calc(${(a.x + a.w) * 100}% + 4px)`, top: `calc(${(a.y + a.h / 2) * 100}% - 9px)`, zIndex: 25 }}
            onMouseEnter={() => onAnchorHover?.(a.id)} onMouseLeave={() => onAnchorHover?.(null)}>
            <NumberBadge annotId={a.id} color={a.color} size={18} />
          </div>
        </React.Fragment>
      ))}

      {byType.region.map(a => (
        <React.Fragment key={a.id}>
          <ShapeRenderer x={a.x} y={a.y} w={a.w} h={a.h} color={a.color}
            strokeWidth={2} opacity={0.9} isEraser={eraserActive} onClick={() => handleErase(a)} />
          <div ref={(n) => registerAnchor(a.id, n)} className="absolute"
            style={{ left: `calc(${(a.x + a.w) * 100}% + 4px)`, top: `calc(${(a.y + a.h / 2) * 100}% - 9px)`, zIndex: 25 }}
            onMouseEnter={() => onAnchorHover?.(a.id)} onMouseLeave={() => onAnchorHover?.(null)}>
            <NumberBadge annotId={a.id} color={a.color} size={18} />
          </div>
        </React.Fragment>
      ))}

      {byType.page.length > 0 && (
        <div className="absolute top-2 left-2 right-2 pointer-events-none z-30 space-y-1">
          {byType.page.map(a => (
            <div key={a.id} ref={(n) => registerAnchor(a.id, n)}
              className="bg-white/95 backdrop-blur-sm border-l-4 rounded-md shadow-md shadow-blue-900/10 px-3 py-1.5"
              style={{
                borderColor: a.color,
                pointerEvents: eraserActive ? 'auto' : 'none',
                cursor: eraserActive ? 'not-allowed' : 'default',
                outline: eraserActive ? '2px dashed rgba(225, 29, 72, 0.4)' : 'none',
                outlineOffset: '2px',
              }}
              onClick={(e) => { if (eraserActive) { e.stopPropagation(); e.preventDefault(); handleErase(a); } }}
              onMouseEnter={() => onAnchorHover?.(a.id)} onMouseLeave={() => onAnchorHover?.(null)}>
              <div className="flex items-center gap-2">
                <NumberBadge annotId={a.id} color={a.color} size={16} />
                <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: a.color }} />
                <p className="text-[10px] font-semibold text-blue-950">Page {a.pageNum || pageNum} Feedback</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ⭐ MARGIN NOTES — ARROWS ON ALL 4 EDGES (outward) */}
      {byType.margin.map(a => (
        <React.Fragment key={a.id}>
          <MarginEdgeArrows color={a.color} size={20} offset={6} />
          <div ref={(n) => registerAnchor(a.id, n)}
            className="absolute pointer-events-auto"
            style={{ right: '2%', top: `${Math.min(a.y * 100, 94)}%`, zIndex: 19, transform: 'translateY(-50%)' }}
            onMouseEnter={() => onAnchorHover?.(a.id)} onMouseLeave={() => onAnchorHover?.(null)}>
            <NumberBadge annotId={a.id} color={a.color} size={18} />
          </div>
        </React.Fragment>
      ))}

      {byType.comment.map(a => (
        <React.Fragment key={a.id}>
          <div className="absolute pointer-events-none"
            style={{
              left: `calc(${a.x * 100}% - 6px)`, top: `calc(${a.y * 100}% - 6px)`,
              width: 12, height: 12, borderRadius: '50%',
              backgroundColor: a.color, border: '2px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)', zIndex: 21,
            }} />
          <div ref={(n) => registerAnchor(a.id, n)} className="absolute pointer-events-auto"
            style={{ left: `calc(${a.x * 100}% + 6px)`, top: `calc(${a.y * 100}% - 12px)`, zIndex: 25 }}
            onMouseEnter={() => onAnchorHover?.(a.id)} onMouseLeave={() => onAnchorHover?.(null)}>
            <NumberBadge annotId={a.id} color={a.color} size={18} />
          </div>
        </React.Fragment>
      ))}

      {dragRect && (
        <div className="absolute border-2 border-dashed pointer-events-none"
          style={{
            left: `${Math.min(dragRect.x1, dragRect.x2) * 100}%`,
            top: `${Math.min(dragRect.y1, dragRect.y2) * 100}%`,
            width: `${Math.abs(dragRect.x2 - dragRect.x1) * 100}%`,
            height: `${Math.abs(dragRect.y2 - dragRect.y1) * 100}%`,
            backgroundColor: activeColor, opacity: 0.4, borderColor: activeColor,
          }} />
      )}

      {pendingHighlight && !readOnly && (
        <HighlightCommentInput highlight={pendingHighlight} color={activeColor}
          onSubmit={submitHighlightWithComment} onCancel={() => setPendingHighlight(null)} />
      )}

      {commentPin && !readOnly && (() => {
        const FIXED_WIDTH = 320, GAP = 10;
        const clickXPct = commentPin.x * 100;
        const flipLeft = clickXPct > 60;
        const computedLeft = flipLeft
          ? `calc(${clickXPct}% - ${FIXED_WIDTH}px - ${GAP}px)`
          : `calc(${clickXPct}% + ${GAP}px)`;
        const computedTop = `${Math.min(commentPin.y * 100, 70)}%`;
        return (
          <div className="absolute z-50 bg-white/95 backdrop-blur-sm border-2 border-blue-200 rounded-lg shadow-2xl shadow-blue-900/20 p-3"
            style={{ left: computedLeft, top: computedTop, width: `${FIXED_WIDTH}px`, maxWidth: 'calc(100vw - 40px)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-blue-950">
                {commentPin.type === 'margin' ? '✏️ Add Margin Note' : '💬 Add Mentor Feedback'}
              </p>
              <button onClick={() => setCommentPin(null)} className="text-blue-400 hover:text-blue-700" type="button">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {commentPin.quoted && (
              <p className="text-[11px] italic text-blue-800 bg-yellow-50 border-l-2 border-yellow-400 px-2 py-1 mb-2 rounded line-clamp-3">
                "{commentPin.quoted.slice(0, 120)}{commentPin.quoted.length > 120 ? '…' : ''}"
              </p>
            )}
            <textarea autoFocus rows={3} value={commentPin.value}
              onChange={(e) => setCommentPin({ ...commentPin, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setCommentPin(null);
                if (e.key === 'Enter' && e.ctrlKey) submitComment();
              }}
              className="w-full text-xs border border-blue-200 rounded p-2 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 resize-none text-blue-950 placeholder:text-blue-400"
              placeholder="Type your feedback... (Ctrl+Enter to post)" />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setCommentPin(null)} className="px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-50 rounded" type="button">Cancel</button>
              <button onClick={submitComment} disabled={isPosting || !commentPin.value?.trim()}
                className="px-2.5 py-1 text-xs text-white bg-blue-900 hover:bg-blue-950 rounded disabled:opacity-50 inline-flex items-center gap-1" type="button">
                {isPosting && <Loader2 className="w-3 h-3 animate-spin" />} Post Feedback
              </button>
            </div>
          </div>
        );
      })()}

      {isDeleting && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg shadow-xl shadow-blue-900/20 px-4 py-3 flex items-center gap-2 border border-blue-200">
            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
            <span className="text-xs font-semibold text-blue-950">Deleting feedback…</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// LEADER LINE LAYER
// ============================================================
const LeaderLineLayer = ({ containerRef, anchorRefs, cardRefs, annotations, hoveredId }) => {
  const [paths, setPaths] = useState([]);

  useEffect(() => {
    let rafId = null;
    const compute = () => {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const newPaths = [];

      annotations.forEach(a => {
        const anchorNode = anchorRefs.current?.[a.id];
        const cardNode = cardRefs.current?.[a.id];
        if (!anchorNode || !cardNode) return;

        const aRect = anchorNode.getBoundingClientRect();
        const cRect = cardNode.getBoundingClientRect();
        if (aRect.bottom < containerRect.top - 200 || aRect.top > containerRect.bottom + 200) return;

        const x1 = aRect.right - containerRect.left;
        const y1 = aRect.top + aRect.height / 2 - containerRect.top;
        const x2 = cRect.left - containerRect.left;
        const y2 = cRect.top + cRect.height / 2 - containerRect.top;
        const dx = Math.max(20, (x2 - x1) * 0.5);

        newPaths.push({
          id: a.id, color: a.color || '#fbbf24',
          d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`,
          x1, y1, x2, y2,
        });
      });
      setPaths(newPaths);
    };

    const scheduleCompute = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(compute);
    };

    scheduleCompute();
    const t1 = setTimeout(compute, 50);
    const t2 = setTimeout(compute, 250);

    window.addEventListener('resize', scheduleCompute);
    const scrollTargets = [];
    let el = containerRef.current;
    while (el) {
      if (el.scrollHeight > el.clientHeight) scrollTargets.push(el);
      el = el.parentElement;
    }
    scrollTargets.forEach(t => t.addEventListener('scroll', scheduleCompute, { passive: true }));

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(t1); clearTimeout(t2);
      window.removeEventListener('resize', scheduleCompute);
      scrollTargets.forEach(t => t.removeEventListener('scroll', scheduleCompute));
    };
  }, [annotations, anchorRefs, cardRefs, containerRef]);

  if (paths.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 15, overflow: 'visible' }} width="100%" height="100%">
      {paths.map(p => {
        const isHovered = hoveredId === p.id;
        return (
          <g key={p.id}>
            <path d={p.d} fill="none" stroke={p.color} strokeWidth={isHovered ? 3.5 : 1.5}
              strokeDasharray={isHovered ? '0' : '5,4'} opacity={isHovered ? 0.35 : 0.15}
              strokeLinecap="round" style={{ filter: 'blur(2px)' }} />
            <path d={p.d} fill="none" stroke={p.color} strokeWidth={isHovered ? 2 : 1.2}
              strokeDasharray={isHovered ? '0' : '5,4'} opacity={isHovered ? 1 : 0.65}
              strokeLinecap="round" style={{ transition: 'stroke-width 0.15s, opacity 0.15s' }} />
            <circle cx={p.x1} cy={p.y1} r={isHovered ? 3.5 : 2.5} fill={p.color} opacity={0.9} />
            <circle cx={p.x2} cy={p.y2} r={isHovered ? 3.5 : 2.5} fill={p.color} opacity={0.9} />
          </g>
        );
      })}
    </svg>
  );
};

// ============================================================
// SIDEBAR FEEDBACK PANEL — ⭐ NAVY / GOLD THEME
// ============================================================
const SidebarFeedbackPanel = ({
  pdfAnnotations, annotationNumbers, pageNum, pdfNumPages,
  setAnnotationPageNum, onHoverCard, hoveredId, canAnnotate, activeTool, onErase, cardRefs,
}) => {
  const pageAnnots = [
    ...(pdfAnnotations[GLOBAL_KEY] || []),
    ...(pdfAnnotations[`page_${pageNum}`] || []),
  ];

  const sorted = [...pageAnnots].sort((a, b) => {
    if (a.type === 'global' && b.type !== 'global') return -1;
    if (b.type === 'global' && a.type !== 'global') return 1;
    if (a.type === 'page' && b.type !== 'page') return -1;
    if (b.type === 'page' && a.type !== 'page') return 1;
    return (a.y || 0) - (b.y || 0);
  });

  const eraserActive = canAnnotate && activeTool === 'eraser';

  const cardColors = {
    highlight: { border: 'border-l-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-800' },
    comment:   { border: 'border-l-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-800' },
    margin:    { border: 'border-l-purple-400', bg: 'bg-purple-50', text: 'text-purple-800' },
    page:      { border: 'border-l-amber-400',  bg: 'bg-amber-50',  text: 'text-amber-800' },
    region:    { border: 'border-l-emerald-400',bg: 'bg-emerald-50',text: 'text-emerald-800' },
    global:    { border: 'border-l-rose-400',   bg: 'bg-rose-50',   text: 'text-rose-800' },
  };

  return (
    <div className="w-[340px] flex-shrink-0 bg-white border-l border-blue-200 flex flex-col overflow-hidden relative min-h-0 h-full">
      <div className="px-4 py-3 border-b border-blue-200 bg-blue-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
            Mentor Feedback <span className="ml-1.5 text-yellow-600 font-extrabold">({pageAnnots.length})</span>
          </h3>
          <div className="flex items-center gap-1 text-[10px] text-blue-500">
            <span className="font-semibold text-blue-900">Pg {pageNum}</span>
            <span className="text-blue-400">/ {pdfNumPages || '—'}</span>
          </div>
        </div>
        <p className="text-[10px] text-blue-500 mt-0.5">Dashed lines connect feedback to the PDF</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0 bg-gradient-to-b from-white to-blue-50/30">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-blue-300" />
            </div>
            <p className="text-xs font-semibold text-blue-700">No feedback yet</p>
            <p className="text-[10px] text-blue-500 mt-1 leading-relaxed">
              {canAnnotate
                ? 'Use the toolbar above the PDF to add a highlight, comment, or margin note.'
                : 'Mentor feedback will appear here once submitted.'}
            </p>
          </div>
        ) : (
          sorted.map((a) => {
            const meta = ANNOTATION_TYPE_META[a.type] || ANNOTATION_TYPE_META.comment;
            const colors = cardColors[a.type] || cardColors.comment;
            const num = annotationNumbers[a.id];
            const isHovered = hoveredId === a.id;

            return (
              <div key={a.id}
                ref={(n) => { if (cardRefs?.current) cardRefs.current[a.id] = n; }}
                onMouseEnter={() => onHoverCard?.(a.id)}
                onMouseLeave={() => onHoverCard?.(null)}
                className={`relative bg-white rounded-lg border-l-4 ${colors.border} border border-blue-100 shadow-sm transition-all ${
                  isHovered ? 'ring-2 ring-yellow-400 shadow-lg shadow-blue-900/10 scale-[1.02]' : 'hover:shadow-md'
                }`}>
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 ${colors.bg} border-b border-blue-100 rounded-t-md`}>
                  <div className="flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold flex-shrink-0 border-2 border-white shadow-sm"
                    style={{ backgroundColor: a.color }}>{num}</div>
                  <span className={`text-[9px] font-bold uppercase tracking-wide ${colors.text}`}>{meta.label}</span>
                  <span className="ml-auto text-[9px] text-blue-400">
                    {a.type === 'global' ? 'ALL' : a.type === 'page' ? `Pg ${a.pageNum || pageNum}` : ''}
                  </span>
                </div>
                <div className="px-2.5 py-2">
                  {a.quoted && (
                    <p className="text-[10px] italic text-blue-700 leading-tight mb-1.5 pl-1.5 border-l-2 line-clamp-2"
                      style={{ borderColor: a.color }}>
                      "{a.quoted.slice(0, 80)}{a.quoted.length > 80 ? '…' : ''}"
                    </p>
                  )}
                  <p className="text-[11px] text-blue-950 leading-snug whitespace-pre-wrap break-words">
                    {a.text || <span className="italic text-blue-400">(no text)</span>}
                  </p>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 bg-blue-50/60 border-t border-blue-100 rounded-b-md">
                  <span className="text-[9px] text-blue-600 font-medium">{a.author || 'Mentor'}</span>
                  {eraserActive && (
                    <button onClick={() => onErase?.(a)}
                      className="text-[9px] font-semibold text-rose-600 hover:bg-rose-100 px-1.5 py-0.5 rounded transition"
                      title="Delete this feedback">✕ Delete</button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-3 py-2 border-t border-blue-200 bg-blue-50 flex items-center justify-center gap-2 flex-shrink-0">
        <button disabled={pageNum <= 1} onClick={() => setAnnotationPageNum(p => Math.max(1, p - 1))}
          className="p-1 bg-white border border-blue-200 text-blue-900 rounded hover:bg-yellow-50 hover:border-yellow-400 disabled:opacity-40 transition">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-semibold text-blue-900 min-w-[60px] text-center">
          Page {pageNum} / {pdfNumPages || '—'}
        </span>
        <button disabled={pageNum >= pdfNumPages} onClick={() => setAnnotationPageNum(p => Math.min(pdfNumPages, p + 1))}
          className="p-1 bg-white border border-blue-200 text-blue-900 rounded hover:bg-yellow-50 hover:border-yellow-400 disabled:opacity-40 transition">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// CONTEXT MENU + TEXT LAYER WRAPPER — ⭐ NAVY / GOLD THEME
// ============================================================
const PdfTextContextMenu = ({ menu, onClose, onAction, readOnly = false }) => {
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (!menu) return null;
  const hasText = !!menu.selectedText;

  return (
    <div ref={ref} className="fixed z-[999] bg-white border border-blue-200 rounded-xl shadow-2xl shadow-blue-900/20 py-1 w-56"
      style={{ left: Math.min(menu.clientX, window.innerWidth - 240), top: Math.min(menu.clientY, window.innerHeight - 200) }}>
      {hasText && (
        <div className="px-3 py-2 border-b border-blue-100 bg-blue-50">
          <p className="text-[10px] uppercase font-bold text-blue-500 mb-1">Selected</p>
          <p className="text-xs text-blue-950 line-clamp-2 italic">
            "{menu.selectedText.slice(0, 80)}{menu.selectedText.length > 80 ? '…' : ''}"
          </p>
        </div>
      )}
      {!readOnly && (
        <>
          <button onClick={() => onAction('highlight')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-950 hover:bg-yellow-50 transition">
            <Highlighter className="w-4 h-4 text-yellow-500" /> Highlight {hasText ? 'text' : 'area'} <span className="text-blue-400 ml-auto text-[10px]">+ comment</span>
          </button>
          <button onClick={() => onAction('comment')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-950 hover:bg-blue-50 transition">
            <MessageSquare className="w-4 h-4 text-blue-500" /> Add mentor feedback
          </button>
          <button onClick={() => onAction('margin')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-950 hover:bg-purple-50 transition">
            <FileText className="w-4 h-4 text-purple-500" /> Add margin note
          </button>
        </>
      )}
      {hasText && (
        <button onClick={() => onAction('copy')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-950 hover:bg-blue-50 transition">
          <Copy className="w-4 h-4 text-blue-500" /> Copy text
        </button>
      )}
      {readOnly && (
        <div className="px-3 py-2 text-[10px] text-blue-500 border-t border-blue-100 mt-1 flex items-center gap-1.5">
          <Lock className="w-3 h-3" /> View-only mode
        </div>
      )}
      <div className="border-t border-blue-100 mt-1">
        <button onClick={onClose} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-500 hover:bg-blue-50 transition">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
};

const PdfTextLayerWrapper = ({ children, onTextContextMenu }) => {
  const wrapperRef = useRef(null);
  const handleContextMenu = (e) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    let rect = null;
    if (selection && selection.rangeCount > 0 && selectedText) {
      rect = selection.getRangeAt(0).getBoundingClientRect();
    }
    const wrapperRect = wrapperRef.current?.getBoundingClientRect();
    if (!wrapperRect) return;
    onTextContextMenu?.({
      clientX: e.clientX, clientY: e.clientY,
      nx: (e.clientX - wrapperRect.left) / wrapperRect.width,
      ny: (e.clientY - wrapperRect.top) / wrapperRect.height,
      selectedText,
      selectionRect: rect ? {
        x: (rect.left - wrapperRect.left) / wrapperRect.width,
        y: (rect.top - wrapperRect.top) / wrapperRect.height,
        w: rect.width / wrapperRect.width,
        h: rect.height / wrapperRect.height,
      } : null,
    });
  };
  return <div ref={wrapperRef} onContextMenu={handleContextMenu} className="relative">{children}</div>;
};

// ============================================================
// MAIN PDF VIEWER (exported) — ⭐ NAVY / GOLD THEME
// ============================================================
export default function PdfViewer({
  viewSubmission, activeTrackingId, proposedTitleId,
  pdfBlobUrl, pdfBlobLoading, pdfBlobError,
  pdfAnnotations, setPdfAnnotations,
  annotationTool, setAnnotationTool,
  annotationColor, setAnnotationColor,
  annotationPageNum, setAnnotationPageNum,
  pdfNumPages, setPdfNumPages,
  pdfScale, setPdfScale,
  pdfPageSize, setPdfPageSize,
  textMenu, setTextMenu,
  externalComment, setExternalComment,
  hoveredAnnotationId, setHoveredAnnotationId,
  canAnnotate, effectiveReadOnly,
  splitContainerRef, anchorRefs, cardRefs,
  isSavingPdf, totalAnnotationCount,
  onBack, onSavePdf, onRetryFetch,
  onAddPageComment, onAddGlobalComment,
  onClearPage, onClearGlobalAnnotations,
  onEraseFromSidebar, onContextAction,
  refreshComments, showNotification,
}) {
  const addAnnotation = useCallback((pageNum, data) => {
    if (!canAnnotate) return;
    setPdfAnnotations(prev => {
      const key = pageNum === 'global' ? GLOBAL_KEY : `page_${pageNum}`;
      return { ...prev, [key]: [...(prev[key] || []), { ...data, id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }] };
    });
  }, [canAnnotate, setPdfAnnotations]);

  const removeAnnotation = useCallback((pageNum, id) => {
    if (!canAnnotate) return;
    setPdfAnnotations(prev => {
      const key = pageNum === 'global' ? 'global' : `page_${pageNum}`;
      return { ...prev, [key]: (prev[key] || []).filter(a => a.id !== id) };
    });
  }, [canAnnotate, setPdfAnnotations]);

  const annotationNumbers = useMemo(() => computeAnnotationNumbers(pdfAnnotations), [pdfAnnotations]);

  const currentPageAnnots = [
    ...(pdfAnnotations[GLOBAL_KEY] || []),
    ...(pdfAnnotations[`page_${annotationPageNum}`] || []),
  ];

  return (
    <div className="h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-sky-50 flex flex-col overflow-hidden font-sans">
      {/* ⭐ HEADER — NAVY + GOLD */}
      <div className="bg-blue-900 border-b-4 border-yellow-400 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap flex-shrink-0 shadow-md shadow-blue-900/20">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-yellow-200 bg-blue-800 hover:bg-blue-700 border border-blue-700 rounded-lg transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-800 text-yellow-300 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white line-clamp-1">{viewSubmission?.title || 'Thesis Document'}</h2>
              <p className="text-[11px] text-blue-200">
                {viewSubmission?.uploaderName || 'Unknown Researcher'} · Track ID: {activeTrackingId}
              </p>
            </div>
          </div>
        </div>
        <button onClick={onSavePdf}
          disabled={isSavingPdf || totalAnnotationCount === 0}
          title={totalAnnotationCount === 0 ? 'No mentor feedback to include yet' : `Download PDF with ${totalAnnotationCount} annotation(s) baked in`}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-950 bg-yellow-400 hover:bg-yellow-300 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
          {isSavingPdf
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
            : <><FileText className="w-3.5 h-3.5" /> Generate PDF</>}
        </button>
      </div>

      {canAnnotate ? (
        <PdfAnnotationBar
          activeTool={annotationTool} setActiveTool={setAnnotationTool}
          activeColor={annotationColor} setActiveColor={setAnnotationColor}
          onClearPage={onClearPage}
          annotationCount={currentPageAnnots.length}
          onAddPageComment={onAddPageComment}
          currentPageNum={annotationPageNum}
          onAddGlobalComment={onAddGlobalComment}
          hasGlobalAnnotations={(pdfAnnotations[GLOBAL_KEY] || []).length > 0}
          onClearGlobalAnnotations={onClearGlobalAnnotations}
        />
      ) : (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-300 text-[11px] text-yellow-800 flex items-center gap-2 font-medium flex-shrink-0">
          <Lock className="w-3.5 h-3.5" />
          View-only mode — You can read mentor feedback and download the annotated PDF, but you cannot add or delete annotations.
        </div>
      )}

      <div ref={splitContainerRef} className="flex-1 flex overflow-hidden relative min-h-0">
        <LeaderLineLayer containerRef={splitContainerRef} anchorRefs={anchorRefs} cardRefs={cardRefs}
          annotations={currentPageAnnots} hoveredId={hoveredAnnotationId} />

        <div className="flex-1 overflow-auto flex justify-center items-start py-6 bg-gradient-to-br from-blue-100 via-slate-100 to-blue-50 min-w-0 min-h-0">
          <div className="relative bg-white shadow-xl shadow-blue-900/20 flex-shrink-0 border border-blue-200">
            {pdfBlobLoading ? (
              <div className="flex items-center justify-center p-20 min-w-[600px]">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-900 mx-auto mb-3" />
                  <p className="text-sm text-blue-700">Fetching thesis PDF from server...</p>
                </div>
              </div>
            ) : pdfBlobError ? (
              <div className="flex items-center justify-center p-20 min-w-[600px]">
                <div className="text-center max-w-md">
                  <XCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
                  <p className="text-base font-bold text-rose-600 mb-2">Failed to load thesis</p>
                  <p className="text-xs text-blue-600 mb-4">{pdfBlobError}</p>
                  <button onClick={onRetryFetch}
                    className="inline-flex items-center gap-1 px-4 py-2 text-xs text-white bg-blue-900 hover:bg-blue-950 rounded-lg shadow-sm">
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </div>
              </div>
            ) : pdfBlobUrl ? (
              <PdfTextLayerWrapper onTextContextMenu={setTextMenu}>
                <Document
                  file={pdfBlobUrl}
                  onLoadSuccess={({ numPages }) => setPdfNumPages(numPages)}
                  onLoadError={(err) => console.error('❌ PDF.js Load Error:', err)}
                  loading={<div className="p-20 flex flex-col items-center gap-2"><Loader2 className="w-6 h-6 animate-spin text-blue-900" /><p className="text-xs text-blue-600">Parsing thesis document...</p></div>}
                  error={<div className="p-20 text-center"><XCircle className="w-10 h-10 text-rose-600 mx-auto mb-2" /><p className="text-sm font-bold text-rose-600">PDF parse error</p></div>}>
                  <Page
                    pageNumber={annotationPageNum}
                    scale={pdfScale}
                    renderAnnotationLayer={false}
                    renderTextLayer
                    onLoadSuccess={(page) => {
                      setPdfPageSize({ width: page.view[2] * pdfScale, height: page.view[3] * pdfScale });
                    }}
                  />
                </Document>

                {pdfPageSize.width > 0 && (
                  <PdfAnnotationOverlay
                    pageNum={annotationPageNum}
                    width={pdfPageSize.width}
                    height={pdfPageSize.height}
                    scale={pdfScale}
                    annotations={pdfAnnotations}
                    activeTool={annotationTool}
                    activeColor={annotationColor}
                    addAnnotation={addAnnotation}
                    removeAnnotation={removeAnnotation}
                    externalComment={externalComment}
                    onExternalCommentDone={() => setExternalComment(null)}
                    annotationNumbers={annotationNumbers}
                    proposedTitleId={proposedTitleId}
                    refreshComments={refreshComments}
                    showNotification={showNotification}
                    readOnly={effectiveReadOnly}
                    onAnchorHover={setHoveredAnnotationId}
                    onAnchorRef={(id, node) => {
                      if (node) anchorRefs.current[id] = node;
                      else delete anchorRefs.current[id];
                    }}
                  />
                )}
              </PdfTextLayerWrapper>
            ) : (
              <div className="flex items-center justify-center p-20 min-w-[600px]">
                <p className="text-sm text-blue-400">No thesis PDF loaded.</p>
              </div>
            )}
          </div>
        </div>

        <SidebarFeedbackPanel
          pdfAnnotations={pdfAnnotations}
          annotationNumbers={annotationNumbers}
          pageNum={annotationPageNum}
          pdfNumPages={pdfNumPages}
          setAnnotationPageNum={setAnnotationPageNum}
          hoveredId={hoveredAnnotationId}
          onHoverCard={setHoveredAnnotationId}
          canAnnotate={canAnnotate}
          activeTool={annotationTool}
          onErase={onEraseFromSidebar}
          cardRefs={cardRefs}
        />
      </div>

      <div className="bg-blue-50 border-t border-blue-200 px-4 py-2 flex items-center justify-center gap-3 flex-wrap flex-shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={() => setPdfScale(s => Math.max(0.5, +(s - 0.2).toFixed(1)))}
            className="p-1.5 bg-white border border-blue-200 text-blue-900 hover:bg-yellow-50 hover:border-yellow-400 rounded transition" title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-blue-900 font-semibold min-w-[44px] text-center">{Math.round(pdfScale * 100)}%</span>
          <button onClick={() => setPdfScale(s => Math.min(3, +(s + 0.2).toFixed(1)))}
            className="p-1.5 bg-white border border-blue-200 text-blue-900 hover:bg-yellow-50 hover:border-yellow-400 rounded transition" title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      <PdfTextContextMenu
        menu={textMenu}
        onClose={() => setTextMenu(null)}
        onAction={onContextAction}
        readOnly={effectiveReadOnly}
      />
    </div>
  );
}