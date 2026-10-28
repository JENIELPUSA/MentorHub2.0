import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ArrowLeft, Loader2, MessageSquare,
  Highlighter, Crop, Menu, X,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertCircle, RefreshCw
} from 'lucide-react';

import { AuthContext } from '../../contexts/AuthContext';
import { CommentContext } from '../../contexts/CommentContext/CommentContext';

import CommentsSidebar from './CommentsSidebar';
import HighlightLayer from './HighlightLayer';
import SelectionPopup from './SelectionPopup';
import RegionDrawLayer from './RegionDrawLayer';
import RegionPopup from './RegionPopup';
import SidebarPDF from './SidebarPDF';

// ⭐ PDF WORKER
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min?worker';
pdfjs.GlobalWorkerOptions.workerPort = new pdfWorker();

console.log('📚 PDF.js version:', pdfjs.version);

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// ═══════════════════════════════════════════════════════════
// HELPER: Resolve PDF URL (single source of truth)
// ═══════════════════════════════════════════════════════════
const resolvePdfUrl = (submission, matched, trackingId) => {
  if (!submission) return null;

  // Priority 1: matchedTracking from GetByTrackingID
  if (matched?.url) return { url: matched.url, source: 'matchedTracking' };

  // Priority 2: specific trackingId entry
  if (trackingId && Array.isArray(submission.titleUrlTracking)) {
    const entry = submission.titleUrlTracking.find(
      t => String(t._id) === String(trackingId)
    );
    if (entry?.url) return { url: entry.url, source: 'titleUrlTracking[match]' };
  }

  // Priority 3: direct fileUrl
  if (submission.fileUrl) return { url: submission.fileUrl, source: 'fileUrl' };

  // Priority 4: latest from titleUrlTracking
  if (Array.isArray(submission.titleUrlTracking) && submission.titleUrlTracking.length > 0) {
    const sorted = [...submission.titleUrlTracking].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    if (sorted[0]?.url) return { url: sorted[0].url, source: 'titleUrlTracking[latest]' };
  }

  return null;
};

// ═══════════════════════════════════════════════════════════
// HELPER: Resolve initial comments
// ═══════════════════════════════════════════════════════════
const resolveComments = (submission, trackingId) => {
  if (!submission) return [];

  let comments = [];

  if (trackingId) {
    // Option A: commentsByTracking map
    if (submission.commentsByTracking?.[trackingId]) {
      comments = submission.commentsByTracking[trackingId];
    }
    // Option B: comments nested inside titleUrlTracking entry
    else if (Array.isArray(submission.titleUrlTracking)) {
      const entry = submission.titleUrlTracking.find(
        t => String(t._id) === String(trackingId)
      );
      if (Array.isArray(entry?.comments)) comments = entry.comments;
    }
  }

  // Fallback: top-level comments
  if (comments.length === 0 && Array.isArray(submission.comments)) {
    comments = submission.comments;
  }

  return [...comments].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
};

const PdfViewerMode = ({
  viewSubmission,
  matchedTracking,
  activeTrackingId,
  onBack,
  getStatusBadgeClass,
  getStatusIconComponent,
  getActualDisplayStatus,
  getRoleBadgeColor,
  formatCommentDate,
  showNotification,
}) => {
  const { userId, role, user } = useContext(AuthContext);
  const { CreateComment } = useContext(CommentContext);
  const normalizedRole = (role || '').toLowerCase().trim();

  // ─── PDF states ───
  const [fileUrl, setFileUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ─── Navigation debounce states ───
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [navigationDebounce, setNavigationDebounce] = useState(true);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [nextPageLoading, setNextPageLoading] = useState(false);
  const [prevPageLoading, setPrevPageLoading] = useState(false);

  const nextPageTimeoutRef = useRef(null);
  const prevPageTimeoutRef = useRef(null);
  const initialLoadTimeoutRef = useRef(null);
  const pdfPageRef = useRef(null);

  // ─── Comments & annotations ───
  const [localComments, setLocalComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hoveredCommentId, setHoveredCommentId] = useState(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [pendingSelection, setPendingSelection] = useState(null);
  const [selectionPopupPos, setSelectionPopupPos] = useState({ x: 0, y: 0 });
  const [isSubmittingAnnotation, setIsSubmittingAnnotation] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [pendingRegion, setPendingRegion] = useState(null);
  const [regionPopupPos, setRegionPopupPos] = useState({ x: 0, y: 0 });
  const [isSubmittingRegion, setIsSubmittingRegion] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // SCREEN SIZE
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScale(0.6);
        setIsMobile(true);
      } else {
        setScale(1.0);
        setIsMobile(false);
        setMobileMenuOpen(false);
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // INITIAL LOAD DEBOUNCE
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (fileUrl && numPages && !isInitialLoadComplete) {
      if (initialLoadTimeoutRef.current) clearTimeout(initialLoadTimeoutRef.current);
      initialLoadTimeoutRef.current = setTimeout(() => {
        setIsInitialLoadComplete(true);
        setNavigationDebounce(false);
        console.log('✅ Navigation enabled after debounce');
      }, 2000);
    }
    return () => {
      if (initialLoadTimeoutRef.current) clearTimeout(initialLoadTimeoutRef.current);
    };
  }, [fileUrl, numPages, isInitialLoadComplete]);

  // ═══════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    return () => {
      if (nextPageTimeoutRef.current) clearTimeout(nextPageTimeoutRef.current);
      if (prevPageTimeoutRef.current) clearTimeout(prevPageTimeoutRef.current);
      if (initialLoadTimeoutRef.current) clearTimeout(initialLoadTimeoutRef.current);
    };
  }, []);

  // ═══════════════════════════════════════════════════════════
  // ⭐ RESOLVE PDF URL + COMMENTS
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!viewSubmission) {
      console.log('⚠️ No viewSubmission');
      return;
    }

    const resolved = resolvePdfUrl(viewSubmission, matchedTracking, activeTrackingId);

    console.log('═══════════════════════════════════════');
    console.log('🔍 PDF URL RESOLUTION:');
    console.log('   activeTrackingId:', activeTrackingId);
    console.log('   matchedTracking?.url:', matchedTracking?.url);
    console.log('   viewSubmission.fileUrl:', viewSubmission.fileUrl);
    console.log('   titleUrlTracking count:', viewSubmission.titleUrlTracking?.length);
    console.log('   ✅ RESOLVED:', resolved);
    console.log('═══════════════════════════════════════');

    if (!resolved?.url) {
      setFileUrl(null);
      setPdfError('No PDF URL available for this submission');
      return;
    }

    setFileUrl(resolved.url);
    setPdfError(null);

    // Load comments
    const initialComments = resolveComments(viewSubmission, activeTrackingId);
    console.log('   📝 Initial comments:', initialComments.length);
    setLocalComments(initialComments);

    // Reset navigation state para fresh
    setIsInitialLoadComplete(false);
    setNavigationDebounce(true);
  }, [viewSubmission?._id, activeTrackingId, matchedTracking]);

  // ═══════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════
  const canNavigate = !isLoadingPage && isInitialLoadComplete && !navigationDebounce;

  const handleNextPage = useCallback(() => {
    if (pageNumber < numPages && canNavigate && !nextPageLoading) {
      setNavigationDebounce(true);
      setNextPageLoading(true);

      if (nextPageTimeoutRef.current) clearTimeout(nextPageTimeoutRef.current);
      nextPageTimeoutRef.current = setTimeout(() => {
        setIsLoadingPage(true);
        setPageNumber(prev => prev + 1);
        setTimeout(() => {
          setNavigationDebounce(false);
          setNextPageLoading(false);
        }, 100);
      }, 1500);
    }
  }, [pageNumber, numPages, canNavigate, nextPageLoading]);

  const handlePrevPage = useCallback(() => {
    if (pageNumber > 1 && canNavigate && !prevPageLoading) {
      setNavigationDebounce(true);
      setPrevPageLoading(true);

      if (prevPageTimeoutRef.current) clearTimeout(prevPageTimeoutRef.current);
      prevPageTimeoutRef.current = setTimeout(() => {
        setIsLoadingPage(true);
        setPageNumber(prev => prev - 1);
        setTimeout(() => {
          setNavigationDebounce(false);
          setPrevPageLoading(false);
        }, 100);
      }, 1500);
    }
  }, [pageNumber, canNavigate, prevPageLoading]);

  const handlePageChange = useCallback((newPage) => {
    if (
      newPage >= 1 &&
      newPage <= numPages &&
      newPage !== pageNumber &&
      canNavigate
    ) {
      setIsLoadingPage(true);
      if (newPage > pageNumber) setNextPageLoading(true);
      else if (newPage < pageNumber) setPrevPageLoading(true);
      setPageNumber(newPage);
    }
  }, [numPages, pageNumber, canNavigate]);

  // Auto-reset loading
  useEffect(() => {
    let timer;
    if (isLoadingPage) {
      timer = setTimeout(() => {
        setIsLoadingPage(false);
        setNextPageLoading(false);
        setPrevPageLoading(false);
      }, 5000);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [isLoadingPage]);

  // ═══════════════════════════════════════════════════════════
  // PDF LOAD HANDLERS
  // ═══════════════════════════════════════════════════════════
  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('✅ Document loaded. Pages:', numPages);
    setNumPages(numPages);
    setPdfError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('❌ PDF LOAD ERROR:', error);
    let errorMsg = 'Failed to render PDF';
    if (error.message?.includes('worker')) errorMsg = 'PDF worker failed to load.';
    else if (error.message?.includes('Invalid')) errorMsg = 'The PDF file is corrupted.';
    else if (error.message) errorMsg = error.message;
    setPdfError(errorMsg);
  };

  const handlePageLoadSuccess = () => {
    setIsLoadingPage(false);
    setNextPageLoading(false);
    setPrevPageLoading(false);
  };

  const handleRetry = () => {
    console.log('🔄 Retry clicked');
    setPdfError(null);
    setNumPages(null);

    const resolved = resolvePdfUrl(viewSubmission, matchedTracking, activeTrackingId);
    if (resolved?.url) {
      setFileUrl(null);
      setTimeout(() => setFileUrl(resolved.url), 0);
    } else {
      setPdfError('No PDF URL available');
    }
  };

  // ═══════════════════════════════════════════════════════════
  // ZOOM / FULLSCREEN
  // ═══════════════════════════════════════════════════════════
  const handleZoomIn = useCallback(() => setScale(prev => Math.min(prev + 0.2, 2.0)), []);
  const handleZoomOut = useCallback(() => setScale(prev => Math.max(prev - 0.2, 0.5)), []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // KEYBOARD
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft' && canNavigate && !prevPageLoading) {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === 'ArrowRight' && canNavigate && !nextPageLoading) {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'Escape' && isFullscreen) {
        handleToggleFullscreen();
      } else if (e.ctrlKey && e.key === '+') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canNavigate, nextPageLoading, prevPageLoading, handlePrevPage, handleNextPage, handleZoomIn, handleZoomOut, isFullscreen, handleToggleFullscreen]);

  // ═══════════════════════════════════════════════════════════
  // DOWNLOAD / PRINT
  // ═══════════════════════════════════════════════════════════
  const handleDownload = () => {
    if (!fileUrl) return;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${viewSubmission?.title || 'document'}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!fileUrl) return;
    const printWindow = window.open(fileUrl, '_blank');
    if (printWindow) {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 1000);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // TEXT SELECTION
  // ═══════════════════════════════════════════════════════════
  const handleTextSelection = useCallback(() => {
    if (!showAnnotations || isDrawingMode) return;

    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const text = selection.toString().trim();
      if (!text || text.length < 3) return;

      const range = selection.getRangeAt(0);
      const commonAncestor = range.commonAncestorContainer;
      const pageElement = (commonAncestor.nodeType === 1 ? commonAncestor : commonAncestor.parentElement)
        ?.closest('.react-pdf__Page');
      if (!pageElement) return;

      const rect = range.getBoundingClientRect();
      const pageRect = pageElement.getBoundingClientRect();

      const position = {
        x: (rect.left - pageRect.left) / scale,
        y: (rect.top - pageRect.top) / scale,
        width: rect.width / scale,
        height: rect.height / scale,
      };

      setPendingSelection({ text, pageNumber, position, selectedText: text });
      setSelectionPopupPos({
        x: Math.min(rect.left + rect.width / 2 - 160, window.innerWidth - 340),
        y: rect.bottom + 10,
      });
    }, 10);
  }, [pageNumber, showAnnotations, isDrawingMode, scale]);

  useEffect(() => {
    if (!showAnnotations || isDrawingMode) return;

    const handleMouseUp = (e) => {
      const pdfContainer = document.querySelector('.pdf-viewer-container');
      if (pdfContainer && pdfContainer.contains(e.target)) {
        handleTextSelection();
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [showAnnotations, isDrawingMode, handleTextSelection]);

  const handleCancelSelection = useCallback(() => {
    setPendingSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  // ═══════════════════════════════════════════════════════════
  // SUBMIT ANNOTATION
  // ═══════════════════════════════════════════════════════════
  const handleSubmitAnnotation = useCallback(async ({ text, color, annotationType, annotationLabel }) => {
    if (!viewSubmission || !pendingSelection) return;
    const targetId = activeTrackingId || viewSubmission._id;
    if (!targetId) return;

    setIsSubmittingAnnotation(true);
    try {
      const commentPayload = {
        text,
        color,
        annotationType: annotationType || 'text',
        annotationLabel: annotationLabel || null,
        pageNumber: pendingSelection.pageNumber,
        position: pendingSelection.position,
        selectedText: pendingSelection.selectedText,
      };

      const result = await CreateComment(targetId, commentPayload);

      if (result?.success) {
        const newComment = result.data || result.comment;
        if (newComment) {
          setLocalComments(prev => [...prev, {
            ...newComment,
            pageNumber: newComment.pageNumber || pendingSelection.pageNumber,
            position: newComment.position || pendingSelection.position,
            selectedText: newComment.selectedText || pendingSelection.selectedText,
            userName: newComment.userName || user?.name || 'You',
            userRole: newComment.userRole || role || 'user',
          }]);
        }
        showNotification('✅ Annotation added!');
        setPendingSelection(null);
        window.getSelection()?.removeAllRanges();
      } else {
        showNotification(`❌ Failed: ${result?.error || 'Unknown error'}`, true);
      }
    } catch (error) {
      showNotification(`❌ Failed: ${error.message}`, true);
    } finally {
      setIsSubmittingAnnotation(false);
    }
  }, [viewSubmission, pendingSelection, activeTrackingId, CreateComment, user, role, showNotification]);

  // ═══════════════════════════════════════════════════════════
  // REGION
  // ═══════════════════════════════════════════════════════════
  const handleRegionSelected = useCallback((region) => {
    const pageElement = pdfPageRef.current;
    if (!pageElement) return;
    const rect = pageElement.getBoundingClientRect();

    const normalized = {
      ...region,
      pageNumber,
      x: region.x / scale,
      y: region.y / scale,
      width: region.width / scale,
      height: region.height / scale,
    };

    setPendingRegion(normalized);
    setRegionPopupPos({
      x: rect.left + region.x + region.width / 2 - 190,
      y: rect.top + region.y + region.height + 10,
    });
    setIsDrawingMode(false);
  }, [pageNumber, scale]);

  const handleCancelRegion = useCallback(() => {
    setPendingRegion(null);
    setIsDrawingMode(false);
  }, []);

  const handleSubmitRegion = useCallback(async ({ text, annotationType, color, label }) => {
    if (!viewSubmission || !pendingRegion) return;
    const targetId = activeTrackingId || viewSubmission._id;
    if (!targetId) return;

    setIsSubmittingRegion(true);
    try {
      const commentPayload = {
        text,
        color,
        annotationType,
        annotationLabel: label,
        pageNumber: pendingRegion.pageNumber,
        position: {
          x: pendingRegion.x,
          y: pendingRegion.y,
          width: pendingRegion.width,
          height: pendingRegion.height,
        },
        selectedText: null,
      };

      const result = await CreateComment(targetId, commentPayload);

      if (result?.success) {
        const newComment = result.data || result.comment;
        if (newComment) {
          setLocalComments(prev => [...prev, {
            ...newComment,
            pageNumber: newComment.pageNumber || pendingRegion.pageNumber,
            position: newComment.position || {
              x: pendingRegion.x,
              y: pendingRegion.y,
              width: pendingRegion.width,
              height: pendingRegion.height,
            },
            userName: newComment.userName || user?.name || 'You',
            userRole: newComment.userRole || role || 'user',
          }]);
        }
        showNotification(`✅ ${label} annotation added!`);
        setPendingRegion(null);
      } else {
        showNotification(`❌ Failed: ${result?.error || 'Unknown error'}`, true);
      }
    } catch (error) {
      showNotification(`❌ Failed: ${error.message}`, true);
    } finally {
      setIsSubmittingRegion(false);
    }
  }, [viewSubmission, pendingRegion, activeTrackingId, CreateComment, user, role, showNotification]);

  // ═══════════════════════════════════════════════════════════
  // COMMENTS
  // ═══════════════════════════════════════════════════════════
  const handleAddComment = async () => {
    if (!commentText.trim()) { showNotification('Please enter a comment', true); return; }
    if (!viewSubmission) return;
    const targetId = activeTrackingId || viewSubmission._id;
    if (!targetId) return;

    setIsSubmittingComment(true);
    try {
      const result = await CreateComment(targetId, commentText);
      if (result?.success) {
        setCommentText('');
        const newComment = result.data || result.comment;
        if (newComment) {
          setLocalComments(prev => [...prev, {
            ...newComment,
            userName: newComment.userName || user?.name || 'You',
            userRole: newComment.userRole || role || 'user',
          }]);
        }
        showNotification('Comment added!');
      } else {
        showNotification(`Failed: ${result?.error || 'Unknown error'}`, true);
      }
    } catch (error) {
      showNotification(`❌ Failed: ${error.message}`, true);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const response = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (response.ok) {
        setLocalComments(prev => prev.filter(c => c._id !== commentId));
        showNotification('Comment deleted!');
      } else {
        showNotification('Failed to delete', true);
      }
    } catch (error) {
      showNotification('Failed to delete', true);
    }
  };

  const isCommentOwner = (comment) => {
    const commentUserId = comment.userId?._id || comment.userId || comment.author?._id;
    return commentUserId && commentUserId === userId;
  };

  const handleCommentClickFromSidebar = useCallback((comment) => {
    if (comment.pageNumber) setPageNumber(comment.pageNumber);
    setHoveredCommentId(comment._id);
    setTimeout(() => setHoveredCommentId(null), 3000);
  }, []);

  // ─── Derived ───
  const displayComments = localComments || [];
  const commentCount = displayComments.length;
  const annotationCount = displayComments.filter(c => c.pageNumber && c.position).length;
  const pageAnnotations = displayComments.filter(
    c => Number(c.pageNumber) === Number(pageNumber) && c.position
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 font-sans">
      <style>{`
        .pdf-viewer-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          height: 100%;
          overflow: auto;
          position: relative;
          background-color: #f0f0f0;
          padding: 10px;
        }
        @media (max-width: 768px) {
          .pdf-viewer-container { overflow: hidden !important; touch-action: none; }
        }
        .pdf-content { display: flex; flex-direction: column; align-items: center; width: 100%; }
        .pdf-page-container {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          background: white;
          border: 1px solid #eaeaea;
          margin-bottom: 10px;
          position: relative;
        }
        .mobile-floating-button {
          position: fixed; bottom: 20px; right: 20px;
          width: 60px; height: 60px; border-radius: 50%;
          background-color: #3b82f6; color: white;
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; border: none;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }
        .mobile-menu {
          position: fixed; bottom: 90px; right: 20px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 12px; padding: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1000; display: flex; flex-direction: column; gap: 12px;
        }
        .react-pdf__Page__textContent {
          user-select: text !important;
          pointer-events: auto !important;
        }
        .react-pdf__Page__textContent span {
          user-select: text !important;
        }
      `}</style>

      <div className="flex flex-col h-screen">
        {/* TOP HEADER */}
        <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 shadow-sm p-3 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-200 dark:bg-gray-600"></div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {viewSubmission?.title}
                </h2>
                {matchedTracking && (
                  <p className="text-[10px] text-slate-500 truncate">
                    Tracking: <span className="font-mono">{matchedTracking._id}</span>
                    {matchedTracking.action && (
                      <span className="ml-2 px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                        {matchedTracking.action}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setShowAnnotations(!showAnnotations)}
                className={`px-2.5 py-1.5 text-xs rounded-lg transition flex items-center gap-1 ${
                  showAnnotations ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{showAnnotations ? 'Annotate ON' : 'OFF'}</span>
                {annotationCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-white text-[9px] rounded-full">
                    {annotationCount}
                  </span>
                )}
              </button>

              {showAnnotations && normalizedRole !== 'student' && (
                <button
                  onClick={() => {
                    setIsDrawingMode(!isDrawingMode);
                    setPendingSelection(null);
                    window.getSelection()?.removeAllRanges();
                  }}
                  className={`px-2.5 py-1.5 text-xs rounded-lg transition flex items-center gap-1 ${
                    isDrawingMode ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isDrawingMode ? 'Drawing...' : 'Region'}</span>
                </button>
              )}

              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 rounded-lg transition flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isSidebarOpen ? 'Hide' : 'Show'}</span>
                {commentCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-[9px] rounded-full">
                    {commentCount}
                  </span>
                )}
              </button>

              <span className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold ${getStatusBadgeClass(getActualDisplayStatus(viewSubmission))}`}>
                {getStatusIconComponent(getActualDisplayStatus(viewSubmission))}
                <span className="ml-1.5 hidden sm:inline">
                  {getActualDisplayStatus(viewSubmission)}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden pdf-viewer-container">
            {/* MOBILE MENU */}
            {isMobile && numPages && (
              <>
                <button
                  className="mobile-floating-button print-hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                {mobileMenuOpen && (
                  <div className="mobile-menu print-hidden">
                    <div className="text-xs font-bold text-slate-700 mb-1">
                      Page {pageNumber} / {numPages}
                    </div>
                    <button onClick={handlePrevPage} disabled={pageNumber <= 1}>
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <button onClick={handleNextPage} disabled={pageNumber >= numPages}>
                      <ChevronRight size={16} /> Next
                    </button>
                    <button onClick={handleZoomIn}><ZoomIn size={16} /> Zoom In</button>
                    <button onClick={handleZoomOut}><ZoomOut size={16} /> Zoom Out</button>
                  </div>
                )}
              </>
            )}

            <div className="pdf-content">
              {/* ERROR */}
              {pdfError && (
                <div className="flex flex-col items-center justify-center min-h-[600px] w-full max-w-2xl p-6">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Failed to Load PDF</h3>
                  <p className="text-sm text-slate-600 text-center mb-4">{pdfError}</p>
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Retry
                  </button>
                </div>
              )}

              {/* PDF VIEWER */}
              {fileUrl && !pdfError && (
                <>
                  {showAnnotations && (
                    <div className="mb-3 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 flex items-center gap-2">
                      <Highlighter className="w-3.5 h-3.5" />
                      <span>
                        <strong>I-select</strong> ang text para sa comment o <strong>Region</strong> para sa margin/font issues
                      </span>
                    </div>
                  )}

                  <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex flex-col items-center justify-center h-[600px] w-full">
                        <div className="relative">
                          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                          <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/30"></div>
                        </div>
                        <p className="mt-4 text-sm text-slate-500 font-medium">Loading PDF...</p>
                      </div>
                    }
                    options={{
                      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                      cMapPacked: true,
                      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
                    }}
                  >
                    <div
                      ref={pdfPageRef}
                      className="pdf-page-container"
                      style={{ position: 'relative', display: 'inline-block' }}
                    >
                      <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderAnnotationLayer={true}
                        renderTextLayer={true}
                        onLoadSuccess={handlePageLoadSuccess}
                        loading={
                          <div className="flex items-center justify-center h-[600px] w-[500px] bg-white">
                            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                          </div>
                        }
                      />

                      {showAnnotations && (
                        <HighlightLayer
                          comments={localComments}
                          pageNumber={pageNumber}
                          scale={scale}
                          currentUserId={userId}
                          getRoleBadgeColor={getRoleBadgeColor}
                          onClickComment={(comment) => {
                            setHoveredCommentId(comment._id);
                            document.getElementById(`comment-${comment._id}`)
                              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            setTimeout(() => setHoveredCommentId(null), 3000);
                          }}
                        />
                      )}

                      <RegionDrawLayer
                        isDrawing={isDrawingMode}
                        onRegionSelected={handleRegionSelected}
                        onCancelDrawing={handleCancelRegion}
                        scale={scale}
                      />
                    </div>
                  </Document>

                  {annotationCount > 0 && (
                    <div className="mt-3 text-xs text-slate-500 flex items-center gap-2 justify-center">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
                        💬 {pageAnnotations.length} annotation(s) sa page na ito
                      </span>
                      <span className="text-slate-400">• {annotationCount} total</span>
                    </div>
                  )}
                </>
              )}

              {/* NO DOCUMENT */}
              {!fileUrl && !pdfError && (
                <div className="flex flex-col items-center justify-center h-[600px]">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                  <p className="mt-4 text-sm text-slate-500">Loading document...</p>
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="hidden xl:block w-[300px] flex-shrink-0">
            <SidebarPDF
              onPrint={handlePrint}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onDownload={handleDownload}
              scale={scale}
              numPages={numPages}
              pageNumber={pageNumber}
              setPageNumber={handlePageChange}
              fileUrl={fileUrl}
              fileData={viewSubmission}
              isLoading={!fileUrl}
              isPageLoading={isLoadingPage}
              isNextPageLoading={nextPageLoading}
              isPrevPageLoading={prevPageLoading}
              isInitialLoadComplete={isInitialLoadComplete}
              navigationDebounce={navigationDebounce}
              onNextPage={handleNextPage}
              onPrevPage={handlePrevPage}
              onToggleFullscreen={handleToggleFullscreen}
              isFullscreen={isFullscreen}
              showAnnotations={showAnnotations}
              setShowAnnotations={setShowAnnotations}
              isDrawingMode={isDrawingMode}
              setIsDrawingMode={setIsDrawingMode}
              annotationCount={annotationCount}
              commentCount={commentCount}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
            />
          </div>

          {/* COMMENTS SIDEBAR */}
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
            onCommentClick={handleCommentClickFromSidebar}
            hoveredCommentId={hoveredCommentId}
            setHoveredCommentId={setHoveredCommentId}
            currentPage={pageNumber}
            showAnnotations={showAnnotations}
          />
        </div>

        {/* POPUPS */}
        {pendingSelection && (
          <SelectionPopup
            position={selectionPopupPos}
            selectedText={pendingSelection.selectedText}
            onSubmit={handleSubmitAnnotation}
            onCancel={handleCancelSelection}
            isSubmitting={isSubmittingAnnotation}
          />
        )}

        {pendingRegion && (
          <RegionPopup
            position={regionPopupPos}
            region={pendingRegion}
            onSubmit={handleSubmitRegion}
            onCancel={handleCancelRegion}
            isSubmitting={isSubmittingRegion}
          />
        )}
      </div>
    </div>
  );
};

export default PdfViewerMode;