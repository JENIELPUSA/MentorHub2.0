// components/DepartmentManager.jsx
import React, { useContext, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  Layers,
  FileText,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { DepartmentContext } from "../../contexts/DepartmentContext/DepartmentContext";

const DepartmentManager = () => {
  const {
    departments,
    isLoading,
    createDepartment,
    updateDepartment,
  } = useContext(DepartmentContext);

  // ============================================================
  // FORM STATE
  // ============================================================
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    departmentName: "",
    departmentCode: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ============================================================
  // TABLE STATE
  // ============================================================
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("departmentName");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // ============================================================
  // CONFIRM MODAL STATE
  // ============================================================
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    color: "blue",
    onConfirm: null,
    onCancel: null,
    isLoading: false,
  });

  const openConfirm = (config) => {
    setConfirmModal({
      isOpen: true,
      title: config.title || "Confirm",
      message: config.message || "",
      confirmLabel: config.confirmLabel || "Confirm",
      cancelLabel: config.cancelLabel || "Cancel",
      color: config.color || "blue",
      onConfirm: config.onConfirm || null,
      onCancel: config.onCancel || null,
      isLoading: false,
    });
  };

  const closeConfirm = () => {
    setConfirmModal((prev) => {
      if (prev.isLoading) return prev;
      if (prev.onCancel) prev.onCancel();
      return {
        isOpen: false,
        title: "",
        message: "",
        confirmLabel: "Confirm",
        cancelLabel: "Cancel",
        color: "blue",
        onConfirm: null,
        onCancel: null,
        isLoading: false,
      };
    });
  };

  const acceptConfirm = async () => {
    if (!confirmModal.onConfirm) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await confirmModal.onConfirm();
    } finally {
      setConfirmModal({
        isOpen: false,
        title: "",
        message: "",
        confirmLabel: "Confirm",
        cancelLabel: "Cancel",
        color: "blue",
        onConfirm: null,
        onCancel: null,
        isLoading: false,
      });
    }
  };

  // ============================================================
  // FORM HANDLERS
  // ============================================================
  const resetForm = () => {
    setForm({ departmentName: "", departmentCode: "", description: "" });
    setErrors({});
    setEditing(null);
    setSubmitting(false);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setForm({
      departmentName: dept.departmentName || "",
      departmentCode: dept.departmentCode || "",
      description: dept.description || "",
    });
    setErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  // ============================================================
  // VALIDATION — departmentCode now REQUIRED
  // ============================================================
  const validate = () => {
    const errs = {};
    if (!form.departmentName.trim()) {
      errs.departmentName = "Department name is required";
    } else if (form.departmentName.trim().length < 2) {
      errs.departmentName = "Must be at least 2 characters";
    }

    if (!form.departmentCode.trim()) {
      errs.departmentCode = "Department code is required";
    } else if (!/^[A-Z0-9]{2,6}$/.test(form.departmentCode.trim().toUpperCase())) {
      errs.departmentCode = "Code must be 2–6 alphanumeric characters";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const payload = {
      departmentName: form.departmentName.trim(),
      departmentCode: form.departmentCode.trim().toUpperCase(),
      description: form.description.trim(),
    };

    const res = editing
      ? await updateDepartment(editing._id, payload)
      : await createDepartment(payload);

    setSubmitting(false);

    if (res?.success) {
      closeForm();
    } else {
      setErrors({ _global: res?.error || "Something went wrong. Try again." });
    }
  };

  // ============================================================
  // FILTER + SORT + PAGINATION
  // ============================================================
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = departments;

    if (q) {
      list = list.filter(
        (d) =>
          d.departmentName?.toLowerCase().includes(q) ||
          d.departmentCode?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      const av = (a[sortKey] || "").toString().toLowerCase();
      const bv = (b[sortKey] || "").toString().toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [departments, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ column }) => {
    if (sortKey !== column)
      return <span className="text-blue-300 ml-1 text-[10px]">↕</span>;
    return (
      <span className="text-yellow-500 ml-1 text-[10px]">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-sky-50 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-900 p-6 rounded-2xl shadow-md border-b-4 border-yellow-400">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-800 text-yellow-300 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Departments
              </h1>
              <p className="text-xs text-blue-200 mt-0.5">
                Manage academic and administrative departments
                {filtered.length > 0 && (
                  <span className="ml-2 text-yellow-300 font-medium">
                    ({filtered.length} total)
                  </span>
                )}
              </p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-blue-950 text-sm font-bold rounded-lg shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              Add Department
            </button>
          )}
        </header>

        {/* ADD / EDIT FORM */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 overflow-hidden">
            <div className="bg-blue-900 border-b-4 border-yellow-400 px-5 py-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-yellow-300" />
                {editing ? "Edit Department" : "Add New Department"}
              </h2>
              <button
                onClick={closeForm}
                disabled={submitting}
                className="p-1 rounded hover:bg-blue-800 text-blue-100 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errors._global && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errors._global}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-[11px] font-bold text-blue-950 mb-1 uppercase tracking-wider">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.departmentName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, departmentName: e.target.value }))
                    }
                    placeholder="e.g., College of Computer Studies"
                    className={`w-full px-3 py-2 text-sm bg-blue-50 border rounded-xl text-slate-800 placeholder:text-blue-400 outline-none focus:ring-2 transition ${
                      errors.departmentName
                        ? "border-rose-300 focus:ring-rose-300"
                        : "border-blue-200 focus:ring-yellow-400 focus:border-yellow-400"
                    }`}
                  />
                  {errors.departmentName && (
                    <p className="mt-1 text-[10px] text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.departmentName}
                    </p>
                  )}
                </div>

                {/* ⭐ Code — REQUIRED, walang "Optional" label */}
                <div>
                  <label className="block text-[11px] font-bold text-blue-950 mb-1 uppercase tracking-wider">
                    Department Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.departmentCode}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        departmentCode: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="e.g., CCS"
                    maxLength={6}
                    className={`w-full px-3 py-2 text-sm bg-blue-50 border rounded-xl text-slate-800 placeholder:text-blue-400 outline-none focus:ring-2 transition ${
                      errors.departmentCode
                        ? "border-rose-300 focus:ring-rose-300"
                        : "border-blue-200 focus:ring-yellow-400 focus:border-yellow-400"
                    }`}
                  />
                  {errors.departmentCode && (
                    <p className="mt-1 text-[10px] text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.departmentCode}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-blue-950 mb-1 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Brief description of the department..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-xl text-slate-800 placeholder:text-blue-400 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 resize-none transition"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-lg transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition disabled:opacity-50 shadow-sm"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {submitting
                    ? "Saving..."
                    : editing
                    ? "Update Department"
                    : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABLE */}
        <div className="bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-900/10 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-blue-50 border-b border-blue-100">
            <div>
              <h2 className="text-lg font-bold text-blue-950">All Departments</h2>
              <p className="text-xs text-blue-600">
                {filtered.length} department{filtered.length !== 1 ? "s" : ""} total
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search departments..."
                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 placeholder:text-blue-400 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-100 border-b-2 border-yellow-400 text-[11px] uppercase tracking-wider text-blue-950 font-bold">
                  <th className="py-3.5 px-4 w-12">#</th>
                  <th
                    className="py-3.5 px-4 cursor-pointer select-none min-w-[220px]"
                    onClick={() => toggleSort("departmentName")}
                  >
                    Department Name <SortIcon column="departmentName" />
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer select-none min-w-[110px]"
                    onClick={() => toggleSort("departmentCode")}
                  >
                    Code <SortIcon column="departmentCode" />
                  </th>
                  <th className="py-3.5 px-4 min-w-[280px]">Description</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Created</th>
                  <th className="py-3.5 px-4 min-w-[100px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100 text-xs">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4">
                        <div className="h-3 w-5 bg-blue-100 rounded" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-3 w-44 bg-blue-100 rounded" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-3 w-16 bg-blue-100 rounded" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-3 w-64 bg-blue-100 rounded" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-3 w-24 bg-blue-100 rounded" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-3 w-16 bg-blue-100 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Building2 className="w-12 h-12 text-blue-200 mx-auto mb-2" />
                      <p className="text-blue-500 font-medium text-sm">
                        {search
                          ? "No departments match your search."
                          : "No departments yet. Click “Add Department” to create one."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((d, idx) => (
                    <tr
                      key={d._id || idx}
                      className="odd:bg-white even:bg-blue-50/60 hover:bg-yellow-50 transition"
                    >
                      <td className="py-3.5 px-4 text-blue-500 text-xs font-medium">
                        {startIdx + idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center text-yellow-300 font-bold text-[11px] flex-shrink-0">
                            {(d.departmentName || "?")
                              .split(" ")
                              .slice(0, 2)
                              .map((w) => w.charAt(0))
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div className="font-bold text-blue-950 line-clamp-1">
                            {d.departmentName || "—"}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-900 text-yellow-300 text-[10px] font-bold rounded-lg uppercase tracking-wider shadow-sm">
                          {d.departmentCode || "—"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-1.5 text-blue-700">
                          <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-400" />
                          <p className="text-xs line-clamp-2">
                            {d.description || (
                              <span className="text-blue-300 italic">
                                No description
                              </span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-blue-700 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs">
                            {d.createdAt
                              ? new Date(d.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )
                              : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openEdit(d)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && filtered.length > 0 && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-blue-50 border-t border-blue-100 text-xs text-blue-700">
              <div>
                Showing{" "}
                <span className="font-bold text-blue-950">{startIdx + 1}</span>{" "}
                to{" "}
                <span className="font-bold text-blue-950">
                  {Math.min(startIdx + PAGE_SIZE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-blue-950">
                  {filtered.length}
                </span>{" "}
                departments
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-blue-300 text-blue-900 rounded-lg hover:bg-yellow-100 hover:border-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-blue-950 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white border border-blue-300 text-blue-900 rounded-lg hover:bg-yellow-100 hover:border-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOM CONFIRM MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-blue-950/60 backdrop-blur-sm"
            onClick={closeConfirm}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-blue-200 overflow-hidden">
            <div
              className={`px-5 py-3 border-b-4 flex items-center gap-2 ${
                confirmModal.color === "rose"
                  ? "bg-rose-600 border-rose-300"
                  : confirmModal.color === "amber"
                  ? "bg-amber-600 border-amber-300"
                  : "bg-blue-900 border-yellow-400"
              }`}
            >
              {confirmModal.color === "rose" ? (
                <Trash2 className="w-4 h-4 text-white" />
              ) : confirmModal.color === "amber" ? (
                <AlertCircle className="w-4 h-4 text-white" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-yellow-300" />
              )}
              <h3 className="text-sm font-bold text-white">{confirmModal.title}</h3>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="px-5 pb-4 flex items-center justify-end gap-2">
              <button
                onClick={closeConfirm}
                disabled={confirmModal.isLoading}
                className="px-3 py-1.5 text-xs font-medium text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-lg transition disabled:opacity-50"
              >
                {confirmModal.cancelLabel}
              </button>
              <button
                onClick={acceptConfirm}
                disabled={confirmModal.isLoading}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition disabled:opacity-50 ${
                  confirmModal.color === "rose"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : confirmModal.color === "amber"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-blue-900 hover:bg-blue-950"
                }`}
              >
                {confirmModal.isLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManager;