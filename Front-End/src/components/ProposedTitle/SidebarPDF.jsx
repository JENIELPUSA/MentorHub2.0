import React, { useContext, useRef, useEffect, useState } from "react";
import { 
  ZoomIn, ZoomOut, Printer, ChevronLeft, ChevronRight, 
  Download, CheckCircle, Loader2, FileText, Maximize2, 
  Minimize2, Settings, Type, Calendar, Tag, User, 
  Award, UserCheck, UsersIcon, Clock, Highlighter, Crop,
  MessageSquare
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";

const SidebarPDF = ({
  onPrint,
  onZoomIn,
  onZoomOut,
  onDownload,
  scale,
  numPages,
  pageNumber,
  setPageNumber,
  fileUrl,
  fileData,
  isLoading = false,
  isPageLoading = false,
  isNextPageLoading = false,
  isPrevPageLoading = false,
  isInitialLoadComplete = false,
  navigationDebounce = true,
  onNextPage,
  onPrevPage,
  onToggleFullscreen,
  isFullscreen = false,
  // Annotation props
  showAnnotations,
  setShowAnnotations,
  isDrawingMode,
  setIsDrawingMode,
  annotationCount,
  commentCount,
  isSidebarOpen,
  setIsSidebarOpen,
  onOpenComments,
}) => {
  const { role } = useContext(AuthContext);
  const [goToPageInput, setGoToPageInput] = useState('');
  const [currentZoom, setCurrentZoom] = useState(scale || 1);

  useEffect(() => {
    if (scale && scale !== currentZoom) setCurrentZoom(scale);
  }, [scale]);

  const isDocumentLoading = isLoading || !isInitialLoadComplete;
  const isDocumentLoaded = fileUrl && numPages > 0;
  const isNavigationDisabled = isDocumentLoading || !isDocumentLoaded || isPageLoading || !isInitialLoadComplete || navigationDebounce;
  const isPrevDisabled = isNavigationDisabled || pageNumber <= 1 || isPrevPageLoading;
  const isNextDisabled = isNavigationDisabled || pageNumber >= numPages || isNextPageLoading;

  const handlePageInput = (e) => {
    if (e.key === 'Enter') {
      const value = parseInt(goToPageInput);
      if (!isNaN(value) && value >= 1 && value <= numPages && !isPageLoading && isInitialLoadComplete && !navigationDebounce) {
        setPageNumber(value);
        setGoToPageInput('');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const documentTitle = fileData?.title || 'Untitled Document';
  const documentSize = fileData?.fileSize ? `${(fileData.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A';
  const uploadDate = formatDate(fileData?.createdAt);
  const status = fileData?.status || 'Unknown';

  return (
    <nav className="print-hidden flex h-full w-full flex-col gap-4 overflow-y-auto border-l border-gray-300/50 dark:border-gray-700/50 bg-gradient-to-b from-white to-gray-50/80 p-4 text-gray-800 backdrop-blur-xl dark:from-gray-900 dark:to-gray-800/80 dark:text-gray-200 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">Document Viewer</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{documentTitle}</p>
        </div>
      </div>

      {/* Initial load indicator */}
      {!isInitialLoadComplete && fileUrl && (
        <div className="rounded-xl bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 p-3 border border-yellow-200/50 dark:border-yellow-500/20">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-300 text-sm">Initializing Navigation</p>
              <p className="text-xs text-yellow-600/70">Please wait...</p>
            </div>
          </div>
        </div>
      )}

      {/* Page loading indicators */}
      {isNextPageLoading && (
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200/50">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Loading page {pageNumber + 1}...
            </p>
          </div>
        </div>
      )}

      {isPrevPageLoading && (
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200/50">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Loading page {pageNumber - 1}...
            </p>
          </div>
        </div>
      )}

      {/* Annotation Toggles */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Annotations</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg transition ${
              showAnnotations 
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>{showAnnotations ? 'ON' : 'OFF'}</span>
          </button>

          {showAnnotations && role !== 'student' && (
            <button
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg transition ${
                isDrawingMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>{isDrawingMode ? 'Drawing' : 'Region'}</span>
            </button>
          )}
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{isSidebarOpen ? 'Hide' : 'Show'} Comments</span>
          {commentCount > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[9px] rounded-full">
              {commentCount}
            </span>
          )}
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Zoom</h3>
          <Type className="h-3.5 w-3.5 text-gray-400" />
        </div>
        
        <div className="text-center mb-2">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            {(currentZoom * 100).toFixed(0)}%
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-3">
          <button 
            onClick={onZoomOut} 
            disabled={isNavigationDisabled}
            className="flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition border border-gray-200 dark:border-gray-700"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          
          <button 
            onClick={onZoomIn} 
            disabled={isNavigationDisabled}
            className="flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition border border-gray-200 dark:border-gray-700"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Page Navigation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Navigation</h3>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        </div>
        
        <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-3 border border-gray-200/50 dark:border-gray-700/50">
          <div className="text-center mb-3">
            <div className={`text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent ${
              isPageLoading || isNextPageLoading || isPrevPageLoading ? 'animate-pulse' : ''
            }`}>
              {pageNumber}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              of <span className="font-semibold">{numPages || '?'}</span> pages
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              onClick={onPrevPage}
              disabled={isPrevDisabled}
              className={`flex items-center justify-center rounded-xl px-3 py-2 transition flex-1 text-sm ${
                isPrevDisabled 
                  ? "opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400" 
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {isPrevPageLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span>Prev</span>
                </>
              )}
            </button>

            <button
              onClick={onNextPage}
              disabled={isNextDisabled}
              className={`flex items-center justify-center rounded-xl px-3 py-2 transition flex-1 text-sm ${
                isNextDisabled 
                  ? "opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400" 
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {isNextPageLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          </div>

          <input
            type="number"
            min="1"
            max={numPages}
            value={goToPageInput}
            onChange={(e) => setGoToPageInput(e.target.value)}
            onKeyDown={handlePageInput}
            placeholder={`Go to page (1-${numPages})`}
            className="w-full text-center text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isNavigationDisabled}
          />

          {numPages > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{Math.round((pageNumber / numPages) * 100) || 0}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${(pageNumber / numPages) * 100 || 0}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Actions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</h3>
          <Settings className="h-3.5 w-3.5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onDownload} 
            disabled={isNavigationDisabled}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 px-3 py-2.5 text-white hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-40 transition shadow-lg text-xs font-semibold"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>

          <button 
            onClick={onPrint} 
            disabled={isNavigationDisabled}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-3 py-2.5 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-40 transition shadow-lg text-xs font-semibold"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
        </div>

        <button
          onClick={onToggleFullscreen}
          disabled={isNavigationDisabled}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 disabled:opacity-40 transition border border-gray-200 dark:border-gray-700"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </button>
      </div>

      {/* Document Info */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Document Info</h3>
        <div className="rounded-xl bg-white/80 dark:bg-gray-800/80 p-3 border border-gray-200/50 dark:border-gray-700/50 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              status === 'Approved' 
                ? 'bg-green-100 text-green-800' 
                : status === 'Rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Size</span>
            <span className="font-medium">{documentSize}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Pages</span>
            <span className="font-medium">{numPages || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Uploaded</span>
            <span className="font-medium">{uploadDate}</span>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="mt-auto pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
        <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Shortcuts</p>
        <div className="space-y-1.5 text-[10px] text-gray-500">
          <div className="flex items-center justify-between">
            <span>Previous page</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-mono">←</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Next page</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-mono">→</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Zoom</span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-mono">Ctrl</kbd>
              <span className="mx-1">+</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-mono">+/-</kbd>
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SidebarPDF;