import { useMemo, useState, useContext, useEffect } from "react";
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { ProposedTitleContext } from "../../contexts/ProposedTitleContext/ProposedTitleContext";
import { GroupContext } from "../../contexts/GroupNameContext/GroupNameContext";
import { AuthContext } from "../../contexts/AuthContext";
import ProposedTitleSection from "../UserDashboard/components/ProposedTitleSection";

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------
const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

// ------------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------------
export default function App() {
  const {
    proposedTitles = [],
    totalProposedTitles,
    isLoading,
    CreateProposedTitle,
    UpdateProposedTitle,
    DeleteProposedTitle,
    FetchProposedTitles,
    GetFileFromCloudinary,
  } = useContext(ProposedTitleContext);

  const { getGroupDetails, groupDetails } = useContext(GroupContext);
  const { referredBy } = useContext(AuthContext);

  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);

  console.log("proposedTitles", proposedTitles);
  const groupId = groupDetails?.group?._id || "";
  const isGroupLoading = !groupId;

  // ============================================================
  // 🔑 APPROVED TITLE
  // ============================================================
  const approvedTitle = useMemo(() => {
    return (
      proposedTitles.find(
        (t) =>
          (t.status || "").toLowerCase() === "approved" &&
          t.adviser === true &&
          t.coAdviser === true
      ) || null
    );
  }, [proposedTitles]);

  const isFullyApproved = useMemo(() => Boolean(approvedTitle), [approvedTitle]);

  // ============================================================
  // 🔑 MAY LAMAN BA ANG titleUrlTracking?
  // ============================================================
  const hasTracking = useMemo(() => {
    if (isLoading) return null;
    return proposedTitles.some(
      (t) => Array.isArray(t.titleUrlTracking) && t.titleUrlTracking.length > 0
    );
  }, [proposedTitles, isLoading]);

  // 🔄 Initial fetch
  useEffect(() => {
    FetchProposedTitles?.(1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Fetch group details
  useEffect(() => {
    if (referredBy) {
      getGroupDetails?.(referredBy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referredBy]);

  // ============================================================
  // 🔑 STATS
  // ============================================================
  const stats = useMemo(() => {
    const total = proposedTitles.length;
    const pending = proposedTitles.filter(
      (p) => p.status?.toLowerCase() === "pending"
    ).length;
    const approved = proposedTitles.filter(
      (p) => p.status?.toLowerCase() === "approved"
    ).length;
    const comments = proposedTitles.reduce(
      (sum, p) => sum + (p.commentCount || 0),
      0
    );
    return { total, pending, approved, comments };
  }, [proposedTitles]);

  const recentComments = useMemo(() => {
    return proposedTitles
      .flatMap((p) =>
        (p.comments || []).map((c) => ({
          ...c,
          titleRef: p.title,
          proposalId: p._id,
        }))
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [proposedTitles]);

  const recentAudit = useMemo(() => {
    return proposedTitles
      .flatMap((p) =>
        (p.titleUrlTracking || []).map((t) => ({
          ...t,
          titleRef: p.title,
        }))
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [proposedTitles]);

  // ------------------------------------------------------------------
  // TOAST
  // ------------------------------------------------------------------
  const triggerToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  const getFileNameFromUrl = (url) => {
    if (!url) return "document.pdf";
    try {
      const parts = url.split("/");
      const lastPart = parts[parts.length - 1];
      return lastPart.split("?")[0] || "document.pdf";
    } catch (e) {
      return "document.pdf";
    }
  };

  // ============================================================
  // 🎯 HANDLERS — ipapasa sa ProposedTitleSection
  // ============================================================

  // ============================================================
  // ✅ CREATE / REVISION — with NEW optional fields
  //    Existing flow intact, new fields appended safely.
  // ============================================================
  const handleCreateProposedTitle = async (payload) => {
    if (!groupId) {
      triggerToast("Group not loaded yet. Please wait.", "error");
      return { success: false, error: "No groupId" };
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("title", payload.title?.trim() || "");
      formData.append("description", payload.description?.trim() || "");
      formData.append(
        "remarks",
        payload.remarks?.trim() || "Awaiting review."
      );
      formData.append("groupId", groupId);
      formData.append("file", payload.file);
      formData.append("action", payload.action || "create");

      // ✅ Kung revision, ipasa ang titleId
      if (payload.titleId) {
        formData.append("titleId", payload.titleId);
      }

      // ============================================================
      // ⭐ NEW — Optional fields (safe, only if provided)
      // ============================================================
      if (payload.track) {
        formData.append("track", payload.track);
      }

      if (payload.scopeStatus) {
        formData.append("scopeStatus", payload.scopeStatus);
      }

      if (payload.reviewDeadline) {
        formData.append("reviewDeadline", payload.reviewDeadline);
      }

      // objectives — array of { text, isCompleted?, notes? }
      if (Array.isArray(payload.objectives) && payload.objectives.length > 0) {
        formData.append("objectives", JSON.stringify(payload.objectives));
      }

      // sdgGoals — array of strings
      if (Array.isArray(payload.sdgGoals) && payload.sdgGoals.length > 0) {
        formData.append("sdgGoals", JSON.stringify(payload.sdgGoals));
      }

      // assignedReviewers — array of ObjectId strings
      if (
        Array.isArray(payload.assignedReviewers) &&
        payload.assignedReviewers.length > 0
      ) {
        formData.append(
          "assignedReviewers",
          JSON.stringify(payload.assignedReviewers)
        );
      }

      // rubric — object { scientificSignificance, technicalNovelty, ... }
      if (payload.rubric && typeof payload.rubric === "object") {
        formData.append("rubric", JSON.stringify(payload.rubric));
      }

      // ============================================================
      // Debug — tingnan kung tama ang laman ng FormData
      // ============================================================
      console.log("=== CreateProposedTitle FormData ===");
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const result = await CreateProposedTitle(formData);

      if (result?.success) {
        triggerToast(
          payload.action === "revision"
            ? "Revision uploaded successfully!"
            : "Proposed title uploaded successfully!"
        );
        await FetchProposedTitles(1, 10);
        return { success: true };
      }

      triggerToast(result?.error || "Failed to upload title", "error");
      return { success: false, error: result?.error };
    } catch (err) {
      console.error("Upload error:", err);
      triggerToast("An error occurred during upload", "error");
      return { success: false, error: err.message };
    } finally {
      setUploading(false);
    }
  };

  // ✅ UPDATE STATUS
  const updateTitleStatus = async (titleId, newStatus) => {
    try {
      const updateData = { status: newStatus };
      const result = await UpdateProposedTitle(titleId, updateData);

      if (result?.success) {
        triggerToast(`Status updated to: ${newStatus}`);
        await FetchProposedTitles(1, 10);
        return { success: true };
      }

      triggerToast(result?.error || "Failed to update status", "error");
      return { success: false };
    } catch (err) {
      console.error("Status error:", err);
      triggerToast("An error occurred", "error");
      return { success: false };
    }
  };

  // ✅ DELETE
  const handleDelete = async (titleId) => {
    if (!window.confirm("Delete this proposed title?")) return;

    try {
      const result = await DeleteProposedTitle(titleId);
      if (result?.success) {
        triggerToast("Title deleted successfully");
        await FetchProposedTitles(1, 10);
      } else {
        triggerToast(result?.error || "Failed to delete", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      triggerToast("An error occurred", "error");
    }
  };

  // ✅ VIEW FILE
  const handleViewFile = (titleId) => {
    const title = proposedTitles.find((t) => t._id === titleId);
    if (!title?.fileUrl) {
      triggerToast("File not found", "error");
      return;
    }
    window.open(title.fileUrl, "_blank");
    triggerToast("Opening file...");
  };

  // ✅ DOWNLOAD FILE — accept URL or ID
  const handleDownloadFile = async (idOrUrl, fileNameOverride) => {
    try {
      if (typeof idOrUrl === "string" && idOrUrl.startsWith("http")) {
        let fileUrl = idOrUrl;
        if (fileUrl.includes("/image/upload/")) {
          fileUrl = fileUrl.replace("/image/upload/", "/raw/upload/");
        }
        if (fileUrl.includes("/upload/")) {
          fileUrl = fileUrl.replace("/upload/", "/upload/fl_attachment/");
        }

        const filename = fileNameOverride || getFileNameFromUrl(idOrUrl);
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerToast(`Downloading: ${filename}`);
        return;
      }

      const title = proposedTitles.find((t) => t._id === idOrUrl);
      if (!title) {
        triggerToast("Title not found", "error");
        return;
      }

      if (title.fileUrl) {
        let fileUrl = title.fileUrl;
        if (fileUrl.includes("/image/upload/")) {
          fileUrl = fileUrl.replace("/image/upload/", "/raw/upload/");
        }
        if (fileUrl.includes("/upload/")) {
          fileUrl = fileUrl.replace("/upload/", "/upload/fl_attachment/");
        }

        const filename =
          fileNameOverride || getFileNameFromUrl(title.fileUrl);
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerToast(`Downloading: ${filename}`);
        return;
      }

      const result = await GetFileFromCloudinary(idOrUrl);
      if (!result.success) {
        triggerToast(result.error || "Failed to download", "error");
      } else {
        triggerToast("File downloaded successfully!");
      }
    } catch (err) {
      console.error("Download error:", err);
      triggerToast("Failed to download file", "error");
    }
  };

  // ✅ Get user name by ID
  const getUserNameById = (userId) => {
    if (!userId) return "Unknown";
    const user = groupDetails?.referredUsers?.find(
      (u) => u.id === userId || u._id === userId
    );
    if (user) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim();
    }
    return `User (${userId.substring(0, 8)})`;
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="bg-slate-50 text-slate-800 text-sm antialiased min-h-screen">
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold shadow-2xl ${
            toast.type === "error"
              ? "bg-rose-600 text-white"
              : "bg-slate-900 text-white"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <main className="pt-4 w-full min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col w-full pb-16 space-y-6 pt-4">
          {/* Banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600 p-4 text-white shadow-sm">
            <div className="absolute -right-6 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 z-10">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/15 backdrop-blur-md">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                      Title Proposal Window
                    </span>
                    <p className="text-base font-semibold">
                      Submit your thesis title proposal for adviser review
                    </p>
                  </div>
                  <p className="text-xs text-white/80 mt-0.5">
                    Proposal window closes May 24, 2025 • 11:59 PM PST
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-lg bg-white text-blue-900 text-[13px] font-semibold hover:bg-slate-100 transition-colors shadow-sm"
                >
                  View Guidelines
                </button>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                  Academic Year 2024-2025
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="text-xs text-slate-500">CPST-8902-D</span>
              </div>
              <h1 className="text-3xl text-slate-900 tracking-tight font-bold">
                Thesis Title Proposals
              </h1>
              <p className="text-base text-slate-500 mt-1 max-w-3xl">
                Submit, track, and manage your proposed thesis titles. Your
                adviser and co-adviser will review and approve each proposal.
              </p>
            </div>
          </div>

          {/* Group loading banner */}
          {isGroupLoading && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>
                Loading your group details... Please wait before submitting.
              </span>
            </div>
          )}

          {/* ✅ Both mentors confirmed banner */}
          {isFullyApproved && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Both mentors have confirmed your proposal. You can now{" "}
                <b>schedule for interview</b>.
              </span>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ==========================================================
                LEFT COLUMN — ProposedTitleSection ONLY
               ========================================================== */}
            <div className="lg:col-span-8 flex flex-col space-y-6">
              <ProposedTitleSection
                proposedTitles={proposedTitles}
                totalProposedTitles={totalProposedTitles}
                isLoading={isLoading}
                approvedTitle={approvedTitle}
                isFullyApproved={isFullyApproved}
                uploading={uploading}
                hasTracking={hasTracking}
                onCreateSubmit={handleCreateProposedTitle}
                onRevisionSubmit={handleCreateProposedTitle}
                updateTitleStatus={updateTitleStatus}
                handleDelete={handleDelete}
                handleViewFile={handleViewFile}
                handleDownloadFile={handleDownloadFile}
                getUserNameById={getUserNameById}
                formatDate={formatDate}
                isGroupLoading={isGroupLoading}
              />
            </div>

            {/* ==========================================================
                RIGHT SIDEBAR
               ========================================================== */}
            <div className="lg:col-span-4 flex flex-col space-y-6">
              {/* Stats */}
              <div className="rounded-xl bg-white p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    Proposal Overview
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "Total",
                      value: stats.total,
                      color: "text-blue-600",
                      bg: "bg-blue-50",
                    },
                    {
                      label: "Pending",
                      value: stats.pending,
                      color: "text-amber-600",
                      bg: "bg-amber-50",
                    },
                    {
                      label: "Approved",
                      value: stats.approved,
                      color: "text-emerald-600",
                      bg: "bg-emerald-50",
                    },
                    {
                      label: "Comments",
                      value: stats.comments,
                      color: "text-slate-700",
                      bg: "bg-slate-50",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={`p-2 rounded-lg ${s.bg} flex flex-col`}
                    >
                      <span className="text-[11px] text-slate-500 font-medium">
                        {s.label}
                      </span>
                      <span className={`text-xl font-bold ${s.color}`}>
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Feedback */}
              <div className="rounded-xl bg-white p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">
                    Recent Feedback
                  </h3>
                  <span className="text-[11px] font-semibold text-blue-600">
                    {recentComments.length}
                  </span>
                </div>
                {recentComments.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No feedback yet. Your adviser will comment here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentComments.map((c) => (
                      <div key={c._id} className="p-2 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                            {initials(c.userName)}
                          </div>
                          <span className="text-[12px] font-semibold text-slate-900 truncate">
                            {c.userName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{c.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Trail */}
              <div className="rounded-xl bg-white p-4 shadow-sm space-y-4">
                <h3 className="text-base font-semibold text-slate-900">
                  Recent Activity
                </h3>
                {recentAudit.length === 0 ? (
                  <p className="text-xs text-slate-500">No activity yet.</p>
                ) : (
                  <div className="space-y-2">
                    {recentAudit.map((t) => (
                      <div
                        key={t._id}
                        className="p-2 rounded-lg bg-slate-50 flex items-start gap-2"
                      >
                        <CheckCircle2
                          className={`w-4 h-4 mt-0.5 ${
                            t.action === "approve"
                              ? "text-emerald-600"
                              : "text-blue-600"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-slate-900 capitalize">
                            {t.action}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatDate(t.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}