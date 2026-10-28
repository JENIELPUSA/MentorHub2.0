import React, { useContext, useState, useMemo, useRef } from "react";
import {
  Lightbulb, CheckCircle2, PenSquare, Paperclip, Loader2, ListCheck,
  RotateCcw, Check, X, MessageSquare, Download, Upload, Shield, UserCog,
  UserCircle, Sparkles, Clock, ChevronDown, FileText, GitBranch, History,
  Filter, ArrowUpRight, Trash2, CircleDot,
} from "lucide-react";
import { AuthContext } from "../../../contexts/AuthContext";

const STATUS_FILTERS = ["all", "pending", "approved", "revision", "rejected"];

const ProposedTitleSection = ({
  proposedTitles = [],
  totalProposedTitles,
  isLoading,
  approvedTitle,
  uploading,
  onCreateSubmit,
  onRevisionSubmit,
  updateTitleStatus,
  handleDelete,
  handleViewFile,
  handleDownloadFile,
  getUserNameById,
  formatDate,
  isGroupLoading,
}) => {
  const { role } = useContext(AuthContext);
  const isStudent = role?.toLowerCase() === "student";

  // ============================================================
  // STATE
  // ============================================================
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    remarks: "",
    file: null,
  });

  const [revisionModal, setRevisionModal] = useState({
    open: false,
    titleId: null,
    titleName: "",
    description: "",
    file: null,
    remarks: "",
  });

  const [collapsedTracking, setCollapsedTracking] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [dragOver, setDragOver] = useState(false);
  const revisionFormRef = useRef(null);

  // ============================================================
  // CHECKERS
  // ============================================================
  // ✅ Allow revision upload kapag fully approved OR naka-"Revision" status
  const canUploadRevision = (t) => {
    const s = (t.status || "").toLowerCase();
    return (
      (t.adviser === true && t.coAdviser === true) || s === "revision"
    );
  };

  const hasTrackingUrl = (t) =>
    Array.isArray(t.titleUrlTracking) && t.titleUrlTracking.length > 0;

  const isApprovedStatus = (t) => (t.status || "").toLowerCase() === "approved";

  const hasApprovedWithTracking = useMemo(
    () =>
      proposedTitles?.some(
        (t) => hasTrackingUrl(t) && isApprovedStatus(t)
      ) || false,
    [proposedTitles]
  );

  const hasFullyApprovedTitle = useMemo(
    () =>
      proposedTitles?.some(
        (t) => t.adviser === true && t.coAdviser === true
      ) || false,
    [proposedTitles]
  );

  // ✅ NEW: May existing proposal na naka-"Revision" status?
  const hasRevisionStatus = useMemo(
    () =>
      proposedTitles?.some(
        (t) => (t.status || "").toLowerCase() === "revision"
      ) || false,
    [proposedTitles]
  );

  const isRevisionMode =
    hasApprovedWithTracking || hasFullyApprovedTitle || hasRevisionStatus;

  const hasAnyTitles =
    (totalProposedTitles || 0) > 0 || proposedTitles.length > 0;

  // ============================================================
  // FORM HANDLERS
  // ============================================================
  const handleResetForm = () => {
    setFormState({ title: "", description: "", remarks: "", file: null });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file only.");
      e.target.value = "";
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("File too large. Max 50MB.");
      e.target.value = "";
      return;
    }
    setFormState((s) => ({ ...s, file }));
  };

  const handleCreateFormSubmit = async (e) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      alert("Please enter a project title!");
      return;
    }
    if (!formState.file) {
      alert("Please select a document file!");
      return;
    }
    const result = await onCreateSubmit({
      title: formState.title,
      description: formState.description,
      remarks: formState.remarks,
      file: formState.file,
      action: "create",
    });
    if (result?.success) handleResetForm();
  };

  // ============================================================
  // REVISION MODAL HANDLERS
  // ============================================================
  const handleOpenRevisionModal = (title) => {
    setRevisionModal({
      open: true,
      titleId: title._id,
      titleName: title.title || "",
      description: title.description || "",
      file: null,
      remarks: "",
    });
  };

  const handleCloseRevisionModal = () => {
    setRevisionModal({
      open: false,
      titleId: null,
      titleName: "",
      description: "",
      file: null,
      remarks: "",
    });
  };

  const handleRevisionFileChange = (e) => {
    setRevisionModal((prev) => ({ ...prev, file: e.target.files[0] || null }));
  };

  const handleRevisionFormSubmit = async (e) => {
    e.preventDefault();
    if (!revisionModal.file) {
      alert("Please select a revision file.");
      return;
    }
    if (!revisionModal.titleId) {
      alert("Missing title ID.");
      return;
    }
    const result = await onRevisionSubmit({
      titleId: revisionModal.titleId,
      title: revisionModal.titleName,
      description: revisionModal.description,
      remarks: revisionModal.remarks,
      file: revisionModal.file,
      action: "revision",
    });
    if (result?.success !== false) handleCloseRevisionModal();
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const getFileNameFromUrl = (url) => {
    if (!url) return "document.pdf";
    try {
      const parts = url.split("/");
      const lastPart = parts[parts.length - 1];
      return lastPart.split("?")[0] || "document.pdf";
    } catch {
      return "document.pdf";
    }
  };

  const toggleTracking = (titleId) => {
    setCollapsedTracking((prev) => ({ ...prev, [titleId]: !prev[titleId] }));
  };

  const formatTrackingDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getLatestUrl = (title) => {
    if (!title.titleUrlTracking || title.titleUrlTracking.length === 0) {
      return title.fileUrl || "";
    }
    const sorted = [...title.titleUrlTracking].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    return sorted[0]?.url || title.fileUrl || "";
  };

  const getActionConfig = (action) => {
    const configs = {
      create: {
        label: "Initial Upload",
        shortLabel: "CREATE",
        badgeClass:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        dotClass: "bg-blue-500",
        ringClass: "ring-blue-300",
        iconColor: "text-blue-500",
        bgClass:
          "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50",
      },
      revision: {
        label: "Revision",
        shortLabel: "REVISION",
        badgeClass:
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
        dotClass: "bg-indigo-500",
        ringClass: "ring-indigo-300",
        iconColor: "text-indigo-500",
        bgClass:
          "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/50",
      },
    };
    return configs[action] || configs.create;
  };

  // ============================================================
  // FILTER + COUNTS
  // ============================================================
  const counts = useMemo(() => {
    const c = {
      all: proposedTitles.length,
      pending: 0,
      approved: 0,
      revision: 0,
      rejected: 0,
    };
    proposedTitles.forEach((t) => {
      const s = (t.status || "pending").toLowerCase();
      if (c[s] !== undefined) c[s]++;
    });
    return c;
  }, [proposedTitles]);

  const filteredTitles = useMemo(() => {
    if (statusFilter === "all") return proposedTitles;
    return proposedTitles.filter(
      (t) => (t.status || "pending").toLowerCase() === statusFilter
    );
  }, [proposedTitles, statusFilter]);

  const validateAndSetFile = (file, setter, stateKey) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file only.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("File too large. Max 50MB.");
      return;
    }
    setter((s) => ({ ...s, [stateKey]: file }));
  };

  // ✅ Status colors — blue-friendly palette (tolerates variants)
  const statusMeta = (status) => {
    const s = String(status || "").toLowerCase().trim();

    if (s === "approved" || s === "approve") {
      return {
        cls: "bg-blue-600 text-white",
        icon: CheckCircle2,
        rail: "bg-blue-600",
      };
    }
    if (s === "rejected" || s === "reject") {
      return {
        cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
        icon: X,
        rail: "bg-rose-500",
      };
    }
    if (
      s === "revision" ||
      s === "revise" ||
      s === "for revision" ||
      s === "revised"
    ) {
      return {
        cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
        icon: RotateCcw,
        rail: "bg-indigo-500",
      };
    }
    return {
      cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
      icon: Clock,
      rail: "bg-sky-500",
    };
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <div
        id="proposed-title-section"
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden"
      >
        {/* ============ HEADER ============ */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {isRevisionMode ? "Upload Revision Capstone" : "Upload Title"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRevisionMode
                  ? "Submit revised PDF for your title."
                  : "Submit and manage proposed titles."}
              </p>
            </div>
          </div>

          {hasAnyTitles && (
            <div className="flex flex-wrap items-center gap-2">
              {[
                {
                  k: "all",
                  label: "Total",
                  cls: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
                },
                {
                  k: "pending",
                  label: "Pending",
                  cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
                },
                {
                  k: "approved",
                  label: "Approved",
                  cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                },
                {
                  k: "revision",
                  label: "Revision",
                  cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
                },
              ].map((p) => (
                <span
                  key={p.k}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${p.cls}`}
                >
                  {counts[p.k] ?? 0} {p.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ============ APPROVED TITLE BANNER ============ */}
        {approvedTitle && (
          <div className="px-6 py-3 bg-blue-50/60 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30 flex items-center gap-3 overflow-x-auto">
            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-xs font-medium text-blue-800 dark:text-blue-300 shrink-0">
              Approved Title:
            </span>
            <strong className="text-xs text-blue-900 dark:text-blue-200 truncate">
              {approvedTitle.title}
            </strong>
          </div>
        )}

        {/* ============ MAIN GRID ============ */}
        <div
          className={`p-6 grid grid-cols-1 ${
            isRevisionMode ? "" : hasAnyTitles ? "lg:grid-cols-12" : ""
          } gap-6`}
        >
          {/* ======== LEFT: CREATE FORM (hidden kapag revision mode) ======== */}
          {!isRevisionMode && (
            <div
              className={`${
                hasAnyTitles ? "lg:col-span-5" : "lg:col-span-12"
              } bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col`}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 px-5 py-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <PenSquare className="w-4 h-4 text-blue-500" /> Submit
                  Proposed Title
                </h4>
                <span className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  New
                </span>
              </div>

              <form
                onSubmit={handleCreateFormSubmit}
                className="p-5 space-y-4 flex-1 flex flex-col"
              >
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Proposed Title <span className="text-rose-500">*</span>
                    </label>
                    <span
                      className={`text-[10px] ${
                        formState.title.length > 120
                          ? "text-rose-500"
                          : "text-slate-400"
                      }`}
                    >
                      {formState.title.length}/150
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={formState.title}
                    onChange={(e) =>
                      setFormState({ ...formState, title: e.target.value })
                    }
                    placeholder="e.g. Student Referral & Performance Tracking System"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                  />
                </div>

                {/* File drop-zone */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Document File <span className="text-rose-500">*</span>
                  </label>
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      validateAndSetFile(
                        e.dataTransfer.files?.[0],
                        setFormState,
                        "file"
                      );
                    }}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl border-2 border-dashed cursor-pointer transition ${
                      dragOver
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-300 dark:border-slate-600 hover:border-blue-400 bg-white dark:bg-slate-800"
                    }`}
                  >
                    <Paperclip className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate flex-1">
                      {formState.file
                        ? formState.file.name
                        : "Click or drop a PDF here (max 50MB)"}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  {formState.file && (
                    <p className="mt-1 text-[10px] text-blue-600 dark:text-blue-400 truncate">
                      ✓ {(formState.file.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>

                {/* Description / Objectives — Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Description / Objectives
                    </label>
                    <span
                      className={`text-[10px] ${
                        formState.description.length > 500
                          ? "text-rose-500"
                          : "text-slate-400"
                      }`}
                    >
                      {formState.description.length}/600
                    </span>
                  </div>
                  <textarea
                    rows="5"
                    maxLength={600}
                    value={formState.description}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the background, target audience, objectives, and main features of your proposed project..."
                    className="w-full px-3 py-2.5 text-xs leading-relaxed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm resize-y min-h-[110px]"
                  />
                </div>

                {/* Remarks — Textarea */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Remarks
                  </label>
                  <textarea
                    rows="3"
                    value={formState.remarks}
                    onChange={(e) =>
                      setFormState({ ...formState, remarks: e.target.value })
                    }
                    placeholder="e.g. Initial submission, notes for adviser..."
                    className="w-full px-3 py-2.5 text-xs leading-relaxed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm resize-y min-h-[70px]"
                  />
                </div>

                {/* Actions */}
                <div className="mt-auto pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    disabled={uploading}
                    className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || isGroupLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Paperclip className="w-4 h-4" /> Upload Title
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======== REVISION NOTICE ======== */}
          {isRevisionMode && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg shrink-0">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {hasRevisionStatus
                    ? "Revision Requested"
                    : "Title Submission Closed"}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                  {hasRevisionStatus ? (
                    <>
                      Pinabalik ng adviser ang iyong title para sa revision.
                      I-update ang PDF sa listahan sa ibaba — hindi ka na
                      pwedeng mag-submit ng bagong title.
                    </>
                  ) : (
                    <>
                      May approved title ka na. I-upload ang iyong{" "}
                      <strong>Revision Capstone</strong> sa listahan sa ibaba.
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() =>
                  revisionFormRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  })
                }
                className="shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition"
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Go
              </button>
            </div>
          )}

          {/* ======== RIGHT: LIST ======== */}
          {hasAnyTitles && (
            <div
              className={`${
                isRevisionMode ? "" : "lg:col-span-7"
              } space-y-3`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ListCheck className="w-4 h-4 text-blue-500" />
                  Submitted Titles ({filteredTitles.length})
                </h4>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-lg">
                  <Filter className="w-3 h-3 text-slate-400 ml-1" />
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-2 py-1 rounded-md text-[10px] font-semibold capitalize transition ${
                        statusFilter === f
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-slate-400">
                      Loading...
                    </span>
                  </div>
                ) : filteredTitles.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    No title proposals match this filter.
                  </div>
                ) : (
                  filteredTitles.map((t) => {
                    const status = (t.status || "pending").toLowerCase();
                    const meta = statusMeta(status);
                    const StatusIcon = meta.icon;
                    const isApproved = status === "approved";
                    const isRejected = status === "rejected";
                    const isRevision = status === "revision";
                    const showRevisionUI = canUploadRevision(t);
                    const hasTracking =
                      t.titleUrlTracking && t.titleUrlTracking.length > 0;
                    const isCollapsed = collapsedTracking[t._id] === true;
                    const sortedTracking = hasTracking
                      ? [...t.titleUrlTracking].sort(
                          (a, b) => new Date(b.date) - new Date(a.date)
                        )
                      : [];
                    const latestUrl = getLatestUrl(t);
                    const revisionCount = hasTracking
                      ? Math.max(0, t.titleUrlTracking.length - 1)
                      : 0;

                    return (
                      <div
                        key={t._id}
                        className={`relative pl-4 pr-4 py-3 rounded-xl border text-xs transition space-y-2.5 overflow-hidden ${
                          isApproved
                            ? "bg-blue-50/70 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-sm"
                            : isRejected
                            ? "bg-rose-50/50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900/40 opacity-80"
                            : isRevision
                            ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/50"
                            : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className={`absolute left-0 top-0 bottom-0 w-1 ${meta.rail}`}
                        />

                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="font-bold text-sm text-slate-900 dark:text-white leading-snug break-words">
                              {t.title}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${meta.cls}`}
                              >
                                <StatusIcon className="w-3 h-3" /> {t.status}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${
                                  t.adviser
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                                }`}
                              >
                                <UserCog className="w-3 h-3" /> Adviser{" "}
                                {t.adviser ? "✓" : "—"}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${
                                  t.coAdviser
                                    ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                                }`}
                              >
                                <UserCircle className="w-3 h-3" /> Co-Adviser{" "}
                                {t.coAdviser ? "✓" : "—"}
                              </span>
                              {latestUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownloadFile(
                                      latestUrl,
                                      t.fileName ||
                                        getFileNameFromUrl(latestUrl)
                                    )
                                  }
                                  aria-label="Download latest file"
                                  className="px-2.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 transition flex items-center gap-1.5"
                                >
                                  <Download className="w-3 h-3" /> Download
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1 flex-wrap">
                            {!isStudent && !isApproved && (
                              <>
                                <button
                                  onClick={() =>
                                    updateTitleStatus(t._id, "Approved")
                                  }
                                  title="Approve"
                                  aria-label="Approve"
                                  className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    updateTitleStatus(t._id, "Revision")
                                  }
                                  title="Request revision"
                                  aria-label="Request revision"
                                  className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:hover:bg-indigo-800/60 dark:text-indigo-300 rounded-lg transition"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                {!isRejected && (
                                  <button
                                    onClick={() =>
                                      updateTitleStatus(t._id, "Rejected")
                                    }
                                    title="Reject"
                                    aria-label="Reject"
                                    className="p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 hover:text-rose-600 text-slate-600 dark:text-slate-300 rounded-lg transition"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(t._id)}
                                  title="Delete"
                                  aria-label="Delete"
                                  className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 hover:text-rose-600 text-rose-500 rounded-lg transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {t.description && (
                          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/50 whitespace-pre-line">
                            {t.description}
                          </p>
                        )}

                        {t.remarks && (
                          <div className="text-[11px] text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/40 flex items-start gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <span className="whitespace-pre-line">
                              <strong>Remarks:</strong> {t.remarks}
                            </span>
                          </div>
                        )}

                        {hasTracking && (
                          <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleTracking(t._id)}
                              className="w-full flex items-center justify-between px-2.5 py-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <GitBranch className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                  File History
                                </span>
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {t.titleUrlTracking.length} file
                                  {t.titleUrlTracking.length > 1 ? "s" : ""}
                                </span>
                                {revisionCount > 0 && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                    {revisionCount} revision
                                    {revisionCount > 1 ? "s" : ""}
                                  </span>
                                )}
                                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-semibold text-slate-500">
                                  <CircleDot className="w-2.5 h-2.5 text-blue-500" />{" "}
                                  CREATE
                                  <CircleDot className="w-2.5 h-2.5 text-indigo-500 ml-1" />{" "}
                                  REVISION
                                </span>
                              </div>
                              <ChevronDown
                                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                                  isCollapsed ? "" : "rotate-180"
                                }`}
                              />
                            </button>

                            {!isCollapsed && (
                              <div className="p-3 bg-white dark:bg-slate-900/40">
                                <div className="relative">
                                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />
                                  <div className="space-y-3">
                                    {sortedTracking.map((track, idx) => {
                                      const isLatest = idx === 0;
                                      const visualAction =
                                        idx === 0 ? "create" : "revision";
                                      const config =
                                        getActionConfig(visualAction);
                                      return (
                                        <div
                                          key={track._id || idx}
                                          className="relative flex gap-3"
                                        >
                                          <div className="relative z-10 shrink-0 pt-1">
                                            <div
                                              className={`w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                                                config.dotClass
                                              } ${
                                                isLatest
                                                  ? "ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 " +
                                                    config.ringClass
                                                  : ""
                                              }`}
                                            />
                                          </div>
                                          <div
                                            className={`flex-1 min-w-0 p-2.5 rounded-lg border text-[10px] ${config.bgClass}`}
                                          >
                                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                              <span
                                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${config.badgeClass}`}
                                              >
                                                {config.shortLabel}
                                              </span>
                                              {isLatest && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white">
                                                  LATEST
                                                </span>
                                              )}
                                              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" />
                                                {formatTrackingDate(track.date)}
                                              </span>
                                            </div>
                                            {track.remarks && (
                                              <p className="text-slate-700 dark:text-slate-300 mb-2 break-words whitespace-pre-line">
                                                {track.remarks}
                                              </p>
                                            )}
                                            {track.url && (
                                              <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/50">
                                                <FileText
                                                  className={`w-3.5 h-3.5 shrink-0 ${config.iconColor}`}
                                                />
                                                <span
                                                  className="text-slate-500 dark:text-slate-400 truncate flex-1 font-mono text-[9px]"
                                                  title={track.url}
                                                >
                                                  {track.fileName ||
                                                    getFileNameFromUrl(
                                                      track.url
                                                    )}
                                                </span>
                                                <button
                                                  type="button"
                                                  aria-label="Download this version"
                                                  onClick={() =>
                                                    handleDownloadFile(
                                                      track.url,
                                                      track.fileName ||
                                                        getFileNameFromUrl(
                                                          track.url
                                                        )
                                                    )
                                                  }
                                                  className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition"
                                                >
                                                  <Download className="w-3 h-3" />
                                                </button>
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

                        {showRevisionUI && (
                          <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  {isRevision
                                    ? "Revision Requested — Ready for Upload"
                                    : "Fully Approved — Ready for Revision Upload"}
                                </p>
                                <p className="text-[10px] text-blue-600 dark:text-blue-400">
                                  {isRevision
                                    ? "Pinabalik ng adviser — i-upload ang updated na revision."
                                    : "Both Adviser & Co-Adviser have approved."}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenRevisionModal(t)}
                              className="w-full px-3 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                            >
                              <Upload className="w-4 h-4" /> Upload Revision
                              Capstone
                            </button>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 flex flex-wrap justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800 gap-1">
                          <span>
                            Uploaded By:{" "}
                            <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                              {t.uploaderName || getUserNameById(t.uploadedBy)}
                            </strong>
                          </span>
                          <span className="text-[9px] font-mono">
                            ID: {t._id.substring(0, 12)}...
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ REVISION MODAL ============ */}
      {revisionModal.open && (
        <div
          className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center animate-fadeIn p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseRevisionModal();
          }}
        >
          <div
            ref={revisionFormRef}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Upload Revision Capstone
                </h3>
              </div>
              <button
                onClick={handleCloseRevisionModal}
                aria-label="Close"
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Title:</strong>{" "}
                {revisionModal.titleName || "Untitled"}
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                I-upload ang updated na revision ng iyong capstone.
              </p>
            </div>

            <form onSubmit={handleRevisionFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Revision File <span className="text-rose-500">*</span>
                </label>
                <label className="flex items-center gap-3 px-3 py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 bg-white dark:bg-slate-800 cursor-pointer transition">
                  <Upload className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate flex-1">
                    {revisionModal.file
                      ? revisionModal.file.name
                      : "Click to choose a PDF (max 50MB)"}
                  </span>
                  <input
                    type="file"
                    required
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={handleRevisionFileChange}
                  />
                </label>
                {revisionModal.file && (
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-blue-600 dark:text-blue-400 truncate">
                      ✓ {(revisionModal.file.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setRevisionModal((p) => ({ ...p, file: null }))
                      }
                      className="text-rose-500 hover:underline flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows="3"
                  value={revisionModal.remarks}
                  onChange={(e) =>
                    setRevisionModal((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  placeholder="Optional notes about this revision..."
                  className="w-full px-3 py-2.5 text-xs leading-relaxed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm resize-y min-h-[70px]"
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900/50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5"
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